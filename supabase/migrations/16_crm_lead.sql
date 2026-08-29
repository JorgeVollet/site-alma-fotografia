-- ============================================================
-- BLOCO CRM+ — Lead editável, Orçamento, Histórico, costuras do funil
--   • clientes ganham: urgencia, primeiro_contato, orcamento (jsonb)
--   • cliente_atualizacoes: histórico de "o que foi conversado" (timeline)
--   • COSTURA: criar ENSAIO move o cliente p/ 'agendado' (forward-only)
--   • assinar_contrato: relaxa o guard (bloqueia só 'cancelado'), p/ não
--     travar a assinatura de um contrato em rascunho.
--
-- Depende de 03_clientes, 09_financeiro (handle_new_ensaio), 11_contratos.
-- Idempotente (pode rodar de novo).
-- ============================================================

-- ── Colunas novas em clientes ───────────────────────────────
alter table public.clientes add column if not exists urgencia        text;
alter table public.clientes add column if not exists primeiro_contato date;
alter table public.clientes add column if not exists orcamento        jsonb;

-- ── Histórico de atualizações do cliente (timeline) ─────────
create table if not exists public.cliente_atualizacoes (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  texto      text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_cliente_atualizacoes_cliente
  on public.cliente_atualizacoes (cliente_id, created_at desc);

grant select, insert, update, delete on public.cliente_atualizacoes to authenticated;
alter table public.cliente_atualizacoes enable row level security;
drop policy if exists cliente_atualizacoes_all_auth on public.cliente_atualizacoes;
create policy cliente_atualizacoes_all_auth on public.cliente_atualizacoes
  for all to authenticated using (true) with check (true);

-- ── COSTURA: criar ensaio -> move o cliente p/ 'agendado' ───
-- Redefine o handle_new_ensaio do 09 somando o avanço do funil (forward-only:
-- só promove lead/orcamento; nunca rebaixa producao/entregue). NÃO editar o 09.
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

  -- avança o cliente no funil para 'agendado' (forward-only; idempotente)
  if new.cliente_id is not null then
    update public.clientes set funil_etapa = 'agendado'
     where id = new.cliente_id
       and coalesce(funil_etapa, 'lead') in ('lead', 'orcamento');
  end if;

  return new;
end;
$$;

-- ── assinar_contrato: relaxa o guard (bloqueia só 'cancelado') ──
-- Antes exigia status='enviado', o que travava assinar um rascunho. Agora só
-- impede assinar um contrato CANCELADO (e re-assinar um já assinado).
create or replace function public.assinar_contrato(p_token uuid, p_assinatura text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_c public.contratos;
begin
  select * into v_c from public.contratos where token = p_token;
  if v_c.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Contrato não encontrado.');
  end if;
  if v_c.status = 'assinado' then
    return jsonb_build_object('ok', true, 'jaAssinado', true);
  end if;
  if v_c.status = 'cancelado' then
    return jsonb_build_object('ok', false, 'erro', 'Este contrato foi cancelado.');
  end if;
  if p_assinatura is null or length(p_assinatura) > 300000 then
    return jsonb_build_object('ok', false, 'erro', 'Assinatura inválida.');
  end if;
  update public.contratos
     set status = 'assinado', assinatura = p_assinatura, assinado_em = now()
   where id = v_c.id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.assinar_contrato(uuid, text) to anon, authenticated;
