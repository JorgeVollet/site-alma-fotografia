-- ============================================================
-- J-FINANCEIRO — o caixa interligado (genérico / revendível)
--   Fecha as costuras do dinheiro do plano Cowork:
--   • todo ENSAIO gera uma conta a receber do SALDO (total − sinal)
--     -> "A receber" mostra o ensaio desde a criação (não só após seleção)
--   • a RESERVA paga vira um lançamento de ENTRADA no financeiro
--     -> os R$ da reserva aparecem em "Recebido"
--   • marcar uma conta como recebida cria o lançamento (reversível)
--   • lançamentos alimentam o Financeiro / Fluxo de Caixa / DRE
--
-- Depende de 03_clientes, 04_ensaios, 05_costura, 08_pagamento.
-- ============================================================

-- ── Lançamentos (entradas e saídas do caixa) ────────────────
create table if not exists public.lancamentos (
  id               uuid primary key default gen_random_uuid(),
  tipo             text not null,                 -- entrada | saida
  descricao        text not null,
  valor            numeric(10,2) not null default 0,
  categoria        text,
  data             date not null default current_date,
  cliente_id       uuid references public.clientes(id) on delete set null,
  conta_receber_id uuid references public.contas_receber(id) on delete set null, -- anti-duplicação
  agendamento_id   uuid,                          -- anti-duplicação da reserva
  created_at       timestamptz not null default now()
);
alter table public.lancamentos add column if not exists agendamento_id uuid;
create index if not exists idx_lancamentos_data on public.lancamentos (data);

-- ── Contas a pagar ──────────────────────────────────────────
create table if not exists public.contas_pagar (
  id          uuid primary key default gen_random_uuid(),
  descricao   text not null,
  valor       numeric(10,2) not null default 0,
  vencimento  date,
  categoria   text,
  status      text not null default 'pendente',  -- pendente | pago
  pago_em     timestamptz,
  created_at  timestamptz not null default now()
);

grant select, insert, update, delete on public.lancamentos  to authenticated;
grant select, insert, update, delete on public.contas_pagar to authenticated;
alter table public.lancamentos  enable row level security;
alter table public.contas_pagar enable row level security;
drop policy if exists lancamentos_all_auth on public.lancamentos;
create policy lancamentos_all_auth on public.lancamentos for all to authenticated using (true) with check (true);
drop policy if exists contas_pagar_all_auth on public.contas_pagar;
create policy contas_pagar_all_auth on public.contas_pagar for all to authenticated using (true) with check (true);

-- ── COSTURA 1: todo ensaio gera conta a receber do saldo ────
create or replace function public.handle_new_ensaio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
begin
  select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
  v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));
  if v_saldo > 0 then
    insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status)
    values (new.cliente_id, new.id, 'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'), v_saldo, 'pendente');
  end if;
  return new;
end;
$$;

drop trigger if exists on_ensaio_created on public.ensaios;
create trigger on_ensaio_created
  after insert on public.ensaios
  for each row execute function public.handle_new_ensaio();

-- ── COSTURA 2: conta paga -> lançamento (reversível) ───────
-- Dispara no INSERT e no UPDATE: uma conta criada já 'pago' (caminho do
-- INSERT em finalizar_selecao) também gera o lançamento. Idempotente.
create or replace function public.sync_lancamento_conta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pago' then
    insert into public.lancamentos (tipo, descricao, valor, categoria, cliente_id, conta_receber_id, data)
    select 'entrada', new.descricao, new.valor, 'Pacote', new.cliente_id, new.id, coalesce(new.pago_em::date, current_date)
    where not exists (select 1 from public.lancamentos where conta_receber_id = new.id);
  else
    delete from public.lancamentos where conta_receber_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_conta_receber_status on public.contas_receber;
create trigger on_conta_receber_status
  after insert or update on public.contas_receber
  for each row execute function public.sync_lancamento_conta();

-- ── COSTURA 3: reserva do site -> lançamento de entrada ─────
-- Redefine handle_new_agendamento (de 05) somando o lançamento da reserva.
create or replace function public.handle_new_agendamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_ensaio_id  uuid;
  v_email      text := nullif(lower(trim(coalesce(new.email, ''))), '');
  v_tel        text := nullif(regexp_replace(coalesce(new.telefone, ''), '[^0-9]', '', 'g'), '');
  v_titulo     text;
begin
  select id into v_cliente_id
  from public.clientes
  where (v_email is not null and lower(trim(email)) = v_email)
     or (v_tel   is not null and nullif(regexp_replace(coalesce(telefone, ''), '[^0-9]', '', 'g'), '') = v_tel)
  order by created_at asc
  limit 1;

  if v_cliente_id is null then
    insert into public.clientes (nome, email, telefone, funil_etapa, origem)
    values (new.nome, new.email, new.telefone, 'agendado', 'site')
    returning id into v_cliente_id;
  end if;

  v_titulo := coalesce(nullif(new.pacote_nome, ''), 'Ensaio')
              || case when coalesce(new.servico, '') <> '' then ' · ' || new.servico else '' end;

  insert into public.ensaios
    (cliente_id, titulo, tipo_ensaio, pacote_slug, valor, data, hora, status, origem, observacoes)
  values
    (v_cliente_id, v_titulo, new.servico, new.pacote_slug, coalesce(new.valor_total, 0),
     new.dia, new.hora, 'agendado', 'site',
     'Reserva feita pelo site em ' || to_char(new.created_at, 'DD/MM/YYYY HH24:MI'))
  returning id into v_ensaio_id;

  -- a reserva (sinal) já foi paga -> entra no caixa (com vínculo p/ dedup)
  if coalesce(new.valor_reserva, 0) > 0 then
    insert into public.lancamentos (tipo, descricao, valor, categoria, cliente_id, agendamento_id, data)
    values ('entrada', 'Reserva — ' || coalesce(new.nome, 'cliente'), new.valor_reserva, 'Reserva', v_cliente_id, new.id, current_date);
  end if;

  new.cliente_id := v_cliente_id;
  new.ensaio_id  := v_ensaio_id;
  return new;
end;
$$;

-- ── finalizar_selecao: idempotente, ATUALIZA a conta do ensaio ──
-- Em vez de criar nova conta, soma as fotos extras na conta a receber que
-- o ensaio já gerou, e define o pagamento (agora / 3 dias úteis).
create or replace function public.finalizar_selecao(p_token uuid, p_pagar_agora boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal      public.galerias;
  v_conta    public.contas_receber;
  v_qtd_sel  int;
  v_extras   int;
  v_valor_ex numeric(10,2);
  v_saldo    numeric(10,2);
  v_total    numeric(10,2);
  v_venc     date;
  v_status   text;
begin
  select * into v_gal from public.galerias where sessao_token = p_token;
  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;

  select count(*) into v_qtd_sel from public.fotos where galeria_id = v_gal.id and selecionada;
  v_extras   := greatest(0, v_qtd_sel - coalesce(v_gal.fotos_inclusas, 0));
  v_valor_ex := v_extras * coalesce(v_gal.foto_extra, 0);
  v_saldo    := greatest(0, coalesce(v_gal.valor_total, 0) - coalesce(v_gal.reserva, 0));
  v_total    := v_saldo + v_valor_ex;

  if p_pagar_agora then v_venc := current_date; v_status := 'pago';
  else v_venc := public.mais_dias_uteis(current_date, 3); v_status := 'pendente';
  end if;

  update public.galerias set status = 'enviado' where id = v_gal.id;

  -- conta a receber do ensaio (criada pelo trigger on_ensaio_created)
  select * into v_conta from public.contas_receber
   where ensaio_id = v_gal.ensaio_id and status <> 'cancelado'
   order by created_at asc limit 1;

  if v_conta.id is not null then
    update public.contas_receber
       set valor = v_total,
           descricao = 'Saldo + ' || v_extras || ' foto(s) extra — ' || coalesce(v_gal.nome, 'galeria'),
           vencimento = v_venc, status = v_status,
           pago_em = case when p_pagar_agora then now() else null end
     where id = v_conta.id;
  else
    insert into public.contas_receber (cliente_id, ensaio_id, galeria_id, descricao, valor, vencimento, status, pago_em)
    values (v_gal.cliente_id, v_gal.ensaio_id, v_gal.id,
            'Saldo + ' || v_extras || ' foto(s) extra — ' || coalesce(v_gal.nome, 'galeria'),
            v_total, v_venc, v_status, case when p_pagar_agora then now() else null end);
  end if;

  return jsonb_build_object('ok', true, 'selecionadas', v_qtd_sel, 'extras', v_extras,
    'valor_extra', v_valor_ex, 'saldo', v_saldo, 'total', v_total, 'vencimento', v_venc, 'status', v_status);
end;
$$;

-- ── BACKFILL (uma vez) — ensaios e reservas que já existiam ──
-- Conta a receber do saldo para ensaios que ainda não têm conta.
insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status)
select e.cliente_id, e.id,
       'Saldo do ensaio — ' || coalesce(e.titulo, 'ensaio'),
       greatest(0, coalesce(e.valor, 0) - coalesce((select reserva from public.pacotes where slug = e.pacote_slug), 0)),
       'pendente'
from public.ensaios e
where not exists (select 1 from public.contas_receber c where c.ensaio_id = e.id)
  and greatest(0, coalesce(e.valor, 0) - coalesce((select reserva from public.pacotes where slug = e.pacote_slug), 0)) > 0;

-- Vincula lançamentos de reserva antigos ao agendamento (dedup robusto).
update public.lancamentos l set agendamento_id = a.id
from public.agendamentos a
where l.agendamento_id is null and l.categoria = 'Reserva'
  and l.cliente_id is not distinct from a.cliente_id
  and l.valor = a.valor_reserva;

-- Lançamento de entrada para reservas (sinal) que ainda não têm lançamento.
insert into public.lancamentos (tipo, descricao, valor, categoria, cliente_id, agendamento_id, data)
select 'entrada', 'Reserva — ' || coalesce(a.nome, 'cliente'), a.valor_reserva, 'Reserva', a.cliente_id, a.id, a.created_at::date
from public.agendamentos a
where coalesce(a.valor_reserva, 0) > 0
  and not exists (select 1 from public.lancamentos l where l.agendamento_id = a.id);
