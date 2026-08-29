-- ============================================================
-- BLOCO 17 — Situação do ensaio (Solicitado/Orçamento) + Sinal fixo
--   • config_estudio: sinal_reserva (sinal fixo único, "preço sob consulta")
--     + mostrar_precos (flag genérica p/ a PASTA FONTE: outro estúdio pode
--     querer mostrar preço; na Alma = false).
--   • handle_new_ensaio CONDICIONAL ao status: só cria conta a receber e só
--     promove o funil quando o ensaio entra FECHADO (status NÃO é
--     'solicitado'/'orcamento'). Assim criar um ensaio "a orçar" NÃO suja o
--     funil/financeiro antes do orçamento ser fechado.
--       - status 'orcamento'  -> promove o funil só até 'orcamento'
--       - status 'solicitado' -> não promove
--   • handle_ensaio_status_change: quando o ensaio CRUZA de solicitado/orcamento
--     para um status fechado, AÍ cria a conta do saldo + promove p/ 'agendado'.
--
-- Depende de 09_financeiro + 16_crm_lead. Idempotente (pode rodar de novo).
-- ============================================================

-- ── Config do estúdio (1 linha singleton) ───────────────────
create table if not exists public.config_estudio (
  id             int primary key default 1,
  sinal_reserva  numeric(10,2) not null default 100,   -- placeholder; Maurício confirma
  mostrar_precos boolean       not null default false,  -- Alma = false (preço sob consulta)
  atualizado_em  timestamptz   not null default now(),
  constraint config_estudio_singleton check (id = 1)
);
insert into public.config_estudio (id) values (1) on conflict (id) do nothing;

grant select on public.config_estudio to anon, authenticated;
grant update on public.config_estudio to authenticated;
alter table public.config_estudio enable row level security;
drop policy if exists config_estudio_read on public.config_estudio;
create policy config_estudio_read on public.config_estudio
  for select to anon, authenticated using (true);
drop policy if exists config_estudio_update on public.config_estudio;
create policy config_estudio_update on public.config_estudio
  for update to authenticated using (true) with check (true);

-- ── handle_new_ensaio CONDICIONAL ao status ─────────────────
-- (substitui a versão do 16; o trigger on_ensaio_created do 09 continua válido)
create or replace function public.handle_new_ensaio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
  v_aberto  boolean := coalesce(new.status, 'agendado') in ('solicitado', 'orcamento');
begin
  -- conta a receber do saldo: SÓ quando o ensaio entra FECHADO (não em solicitação/orçamento)
  if not v_aberto then
    select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
    v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));
    if v_saldo > 0 then
      insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status)
      values (new.cliente_id, new.id, 'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'), v_saldo, 'pendente');
    end if;
  end if;

  -- avanço do funil ESPELHA a situação do ensaio (forward-only; nunca rebaixa)
  if new.cliente_id is not null then
    if coalesce(new.status, 'agendado') = 'solicitado' then
      null; -- ainda é só uma solicitação: não promove o funil
    elsif new.status = 'orcamento' then
      update public.clientes set funil_etapa = 'orcamento'
       where id = new.cliente_id and coalesce(funil_etapa, 'lead') in ('lead');
    else
      update public.clientes set funil_etapa = 'agendado'
       where id = new.cliente_id and coalesce(funil_etapa, 'lead') in ('lead', 'orcamento');
    end if;
  end if;

  return new;
end;
$$;

-- ── handle_ensaio_status_change: fechar o ensaio (orçamento -> agendado) ──
-- Quando o status CRUZA de aberto (solicitado/orcamento) p/ fechado, cria a
-- conta do saldo (idempotente) e promove o funil — replicando o que antes o
-- INSERT fazia cedo demais.
create or replace function public.handle_ensaio_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserva numeric(10,2) := 0;
  v_saldo   numeric(10,2);
begin
  if coalesce(old.status, '') in ('solicitado', 'orcamento')
     and coalesce(new.status, '') not in ('solicitado', 'orcamento') then

    if not exists (select 1 from public.contas_receber where ensaio_id = new.id) then
      select coalesce(reserva, 0) into v_reserva from public.pacotes where slug = new.pacote_slug;
      v_saldo := greatest(0, coalesce(new.valor, 0) - coalesce(v_reserva, 0));
      if v_saldo > 0 then
        insert into public.contas_receber (cliente_id, ensaio_id, descricao, valor, status)
        values (new.cliente_id, new.id, 'Saldo do ensaio — ' || coalesce(new.titulo, 'ensaio'), v_saldo, 'pendente');
      end if;
    end if;

    if new.cliente_id is not null then
      update public.clientes set funil_etapa = 'agendado'
       where id = new.cliente_id and coalesce(funil_etapa, 'lead') in ('lead', 'orcamento');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_ensaio_status_change on public.ensaios;
create trigger on_ensaio_status_change
  after update of status on public.ensaios
  for each row execute function public.handle_ensaio_status_change();
