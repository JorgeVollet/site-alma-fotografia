-- ============================================================
-- BLOCO 21 — Portfólio no banco + "Fechar negócio"
--
-- 1) PORTFÓLIO: hoje ele vive no localStorage do navegador do admin. As fotos
--    que aparecem no site vêm da pasta /fotos do projeto, então o visitante vê
--    sempre a seleção original — curar o portfólio pelo painel NÃO tem efeito
--    nenhum no site, e trocar de computador zera as edições. Passa a viver no
--    banco, com bucket público próprio (como as galerias).
--
-- 2) FECHAR NEGÓCIO: o orçamento era um beco sem saída (ficava num jsonb do
--    cliente e não virava nada). Em vez de um montador de orçamento — que o
--    estúdio já faz melhor no WhatsApp — o valor combinado é digitado UMA vez
--    e o sistema gera o resto: valor do ensaio, conta do SINAL, conta do SALDO
--    e os parâmetros que a galeria vai herdar.
--
-- Depende de 19 e 20 (usa contas_receber.origem). Idempotente.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1) PORTFÓLIO
-- ════════════════════════════════════════════════════════════
create table if not exists public.portfolio_ensaios (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  subtitulo   text,
  categoria   text not null,
  capa_path   text,                       -- caminho no bucket 'portfolio'
  ordem       int  not null default 0,
  publicado   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.portfolio_fotos (
  id         uuid primary key default gen_random_uuid(),
  ensaio_id  uuid not null references public.portfolio_ensaios(id) on delete cascade,
  path       text not null,               -- caminho no bucket 'portfolio'
  ordem      int  not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_pf_fotos_ensaio on public.portfolio_fotos (ensaio_id, ordem);
create index if not exists idx_pf_ensaios_ordem on public.portfolio_ensaios (ordem);

-- bucket público do portfólio (fotos de vitrine, SEM marca d'água)
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists portfolio_write_team on storage.objects;
create policy portfolio_write_team
  on storage.objects for all
  to authenticated
  using (bucket_id = 'portfolio')
  with check (bucket_id = 'portfolio');

-- GRANTs (RLS sozinha não basta — dá 42501)
grant select on public.portfolio_ensaios, public.portfolio_fotos to anon, authenticated;
grant insert, update, delete on public.portfolio_ensaios, public.portfolio_fotos to authenticated;

alter table public.portfolio_ensaios enable row level security;
alter table public.portfolio_fotos    enable row level security;

-- o site (anon) lê só o que está publicado; a equipe faz tudo
drop policy if exists pf_ensaios_read on public.portfolio_ensaios;
create policy pf_ensaios_read on public.portfolio_ensaios
  for select to anon, authenticated using (publicado or auth.role() = 'authenticated');

drop policy if exists pf_ensaios_write on public.portfolio_ensaios;
create policy pf_ensaios_write on public.portfolio_ensaios
  for all to authenticated using (true) with check (true);

drop policy if exists pf_fotos_read on public.portfolio_fotos;
create policy pf_fotos_read on public.portfolio_fotos
  for select to anon, authenticated using (true);

drop policy if exists pf_fotos_write on public.portfolio_fotos;
create policy pf_fotos_write on public.portfolio_fotos
  for all to authenticated using (true) with check (true);

-- ════════════════════════════════════════════════════════════
-- 2) FECHAR NEGÓCIO
-- ════════════════════════════════════════════════════════════
-- Guarda o que foi combinado no próprio ensaio, para a galeria herdar depois
-- sem ninguém redigitar (era a origem das divergências de valor entre telas).
alter table public.ensaios add column if not exists sinal          numeric(10,2);
alter table public.ensaios add column if not exists fotos_inclusas int;

-- fechar_negocio(ensaio, valor, sinal, fotos_inclusas, foto_extra)
--
-- Digita-se o valor UMA vez e sai tudo:
--   • o ensaio recebe valor/sinal/inclusas/foto extra e vira 'agendado'
--   • nasce a conta do SINAL (origem 'sinal') — o cliente pode pagar online
--     quando a Stone entrar, ou o estúdio marca "recebido" ao receber na mão
--   • nasce a conta do SALDO (origem 'saldo') com o que sobra
--   • o cliente avança no funil
-- Reexecutável: chamar de novo com outros valores ATUALIZA as contas pendentes
-- em vez de duplicar (e nunca mexe no que já foi pago).
create or replace function public.fechar_negocio(
  p_ensaio_id      uuid,
  p_valor          numeric,
  p_sinal          numeric default 0,
  p_fotos_inclusas int     default null,
  p_foto_extra     numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ens        public.ensaios;
  v_conta      public.contas_receber;
  v_sinal      numeric(10,2) := greatest(0, coalesce(p_sinal, 0));
  v_valor      numeric(10,2) := greatest(0, coalesce(p_valor, 0));
  v_saldo      numeric(10,2);
  v_pago_sinal numeric(10,2);
  v_pago_saldo numeric(10,2);
  v_falta_s    numeric(10,2);
  v_falta_sal  numeric(10,2);
begin
  select * into v_ens from public.ensaios where id = p_ensaio_id;
  if v_ens.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Ensaio não encontrado.');
  end if;
  if v_valor <= 0 then
    return jsonb_build_object('ok', false, 'erro', 'Informe o valor combinado.');
  end if;
  if v_sinal > v_valor then
    return jsonb_build_object('ok', false, 'erro', 'O sinal não pode ser maior que o valor do ensaio.');
  end if;

  v_saldo := v_valor - v_sinal;

  -- o ensaio passa a ser a fonte da verdade do que foi combinado
  update public.ensaios
     set valor          = v_valor,
         sinal          = v_sinal,
         fotos_inclusas = coalesce(p_fotos_inclusas, fotos_inclusas),
         foto_extra     = coalesce(p_foto_extra, foto_extra),
         status         = case when status in ('solicitado', 'orcamento') then 'agendado' else status end,
         updated_at     = now()
   where id = p_ensaio_id;

  -- ── conta do SINAL ──
  select coalesce(sum(valor), 0) into v_pago_sinal
    from public.contas_receber
   where ensaio_id = p_ensaio_id and origem = 'sinal' and status = 'pago';
  v_falta_s := greatest(0, v_sinal - v_pago_sinal);

  select * into v_conta from public.contas_receber
   where ensaio_id = p_ensaio_id and origem = 'sinal' and status = 'pendente'
   order by created_at asc, id asc limit 1;

  if v_falta_s > 0 then
    if v_conta.id is not null then
      update public.contas_receber
         set valor = v_falta_s,
             descricao = 'Sinal — ' || coalesce(v_ens.titulo, 'ensaio')
       where id = v_conta.id;
    else
      insert into public.contas_receber
        (cliente_id, ensaio_id, descricao, valor, vencimento, status, origem)
      values (v_ens.cliente_id, p_ensaio_id,
              'Sinal — ' || coalesce(v_ens.titulo, 'ensaio'),
              v_falta_s, current_date, 'pendente', 'sinal');
    end if;
  elsif v_conta.id is not null then
    delete from public.contas_receber where id = v_conta.id;
  end if;

  -- ── conta do SALDO ──
  select coalesce(sum(valor), 0) into v_pago_saldo
    from public.contas_receber
   where ensaio_id = p_ensaio_id and origem = 'saldo' and status = 'pago';
  v_falta_sal := greatest(0, v_saldo - v_pago_saldo);

  select * into v_conta from public.contas_receber
   where ensaio_id = p_ensaio_id and origem = 'saldo' and status = 'pendente'
   order by created_at asc, id asc limit 1;

  if v_falta_sal > 0 then
    if v_conta.id is not null then
      update public.contas_receber
         set valor = v_falta_sal,
             descricao = 'Saldo do ensaio — ' || coalesce(v_ens.titulo, 'ensaio')
       where id = v_conta.id;
    else
      insert into public.contas_receber
        (cliente_id, ensaio_id, descricao, valor, status, origem)
      values (v_ens.cliente_id, p_ensaio_id,
              'Saldo do ensaio — ' || coalesce(v_ens.titulo, 'ensaio'),
              v_falta_sal, 'pendente', 'saldo');
    end if;
  elsif v_conta.id is not null then
    delete from public.contas_receber where id = v_conta.id;
  end if;

  -- funil avança (forward-only)
  if v_ens.cliente_id is not null then
    update public.clientes set funil_etapa = 'agendado'
     where id = v_ens.cliente_id and coalesce(funil_etapa, 'lead') in ('lead', 'orcamento');
  end if;

  return jsonb_build_object('ok', true, 'valor', v_valor, 'sinal', v_sinal,
                            'saldo', v_saldo, 'sinal_a_receber', v_falta_s,
                            'saldo_a_receber', v_falta_sal);
end;
$$;

grant execute on function public.fechar_negocio(uuid, numeric, numeric, int, numeric) to authenticated;

-- handle_ensaio_valor_change não pode brigar com o fechar_negocio: ele já
-- ajustou as contas com o sinal correto. O trigger continua valendo para quem
-- edita o valor direto na ficha, mas agora respeita o sinal do ensaio.
create or replace function public.handle_ensaio_valor_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
  v_pago    numeric(10,2);
  v_falta   numeric(10,2);
  v_conta   public.contas_receber;
begin
  if new.valor is distinct from old.valor
     and coalesce(new.status, 'agendado') not in ('solicitado', 'orcamento')
     and coalesce(new.valor, 0) > 0 then

    -- o sinal combinado no ensaio manda; só cai no pacote se não houver
    if new.sinal is not null then
      v_reserva := greatest(0, new.sinal);
    else
      select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
    end if;
    v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));

    select coalesce(sum(valor), 0) into v_pago
      from public.contas_receber
     where ensaio_id = new.id and origem = 'saldo' and status = 'pago';
    v_falta := greatest(0, v_saldo - v_pago);

    select * into v_conta from public.contas_receber
     where ensaio_id = new.id and origem = 'saldo' and status = 'pendente'
     order by created_at asc, id asc limit 1;

    if v_falta > 0 then
      if v_conta.id is not null then
        update public.contas_receber
           set valor = v_falta,
               descricao = 'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio')
         where id = v_conta.id;
      else
        insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status, origem)
        values (new.cliente_id, new.id,
                'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'), v_falta, 'pendente', 'saldo');
      end if;
    elsif v_conta.id is not null then
      delete from public.contas_receber where id = v_conta.id;
    end if;
  end if;
  return new;
end;
$$;
