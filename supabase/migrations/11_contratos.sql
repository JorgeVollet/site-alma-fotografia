-- ============================================================
-- BLOCO 8a — CONTRATOS (genérico / revendível)
--   • contratos no banco (modelo/zero/PDF), com cláusulas e assinatura
--   • página pública /assinar/:token assina SEM login (RPC anon)
--   • COSTURA (do plano Cowork): contrato ASSINADO ->
--       1) move o cliente no funil para "agendado" (forward-only)
--       2) gera uma conta a receber do valor do contrato — SÓ quando o
--          contrato NÃO está ligado a um ensaio que já gera conta
--          (anti-duplicação: o dinheiro do ensaio já é cobrado em 09)
--   • reversível: desfazer a assinatura remove a conta (se ainda pendente)
--
-- Depende de 03_clientes, 04_ensaios, 08_pagamento (mais_dias_uteis,
-- contas_receber), 09_financeiro.
-- ============================================================

-- ── Bucket privado para PDFs de contrato anexados ──────────
insert into storage.buckets (id, name, public)
values ('contratos', 'contratos', false)
on conflict (id) do nothing;

-- só a equipe (authenticated) lê/grava arquivos de contrato
drop policy if exists contratos_rw_auth on storage.objects;
create policy contratos_rw_auth on storage.objects
  for all to authenticated
  using (bucket_id = 'contratos')
  with check (bucket_id = 'contratos');

-- ── Tabela de contratos ────────────────────────────────────
create table if not exists public.contratos (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid references public.clientes(id) on delete set null,
  ensaio_id    uuid references public.ensaios(id)  on delete set null,
  titulo       text not null default 'Contrato',
  modelo       text,                                  -- nome do modelo usado
  ensaio_desc  text,                                  -- "ensaio / objeto" (texto livre)
  valor        numeric(10,2) not null default 0,
  clausulas    jsonb not null default '[]'::jsonb,    -- array de strings (com {{vars}})
  pdf_path     text,                                  -- bucket privado 'contratos' (se upload de PDF)
  pdf_nome     text,
  status       text not null default 'rascunho',      -- rascunho | enviado | assinado | cancelado
  assinatura   text,                                  -- dataURL PNG da assinatura (canvas) — pequeno
  token        uuid not null default gen_random_uuid(),-- link público de assinatura
  enviado_em   timestamptz,
  assinado_em  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_contratos_cliente on public.contratos (cliente_id);
create unique index if not exists idx_contratos_token on public.contratos (token);

grant select, insert, update, delete on public.contratos to authenticated;
alter table public.contratos enable row level security;
drop policy if exists contratos_all_auth on public.contratos;
create policy contratos_all_auth on public.contratos
  for all to authenticated using (true) with check (true);

-- dedup da costura: a conta a receber sabe de qual contrato veio
alter table public.contas_receber
  add column if not exists contrato_id uuid references public.contratos(id) on delete set null;

-- ── COSTURA: contrato assinado -> conta a receber + move funil ──
create or replace function public.handle_contrato_assinado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_etapa_atual      text;
  v_tem_conta_ensaio boolean := false;
begin
  if new.status = 'assinado' then
    -- 1) avança o cliente no funil para "agendado" (só de lead/orcamento; nunca regride)
    if new.cliente_id is not null then
      select funil_etapa into v_etapa_atual from public.clientes where id = new.cliente_id;
      if v_etapa_atual is null or v_etapa_atual in ('lead', 'orcamento') then
        update public.clientes set funil_etapa = 'agendado' where id = new.cliente_id;
      end if;
    end if;

    -- 2) conta a receber do contrato — evita cobrar 2x o mesmo dinheiro:
    --    se o contrato está ligado a um ensaio que JÁ tem conta (gerada em 09),
    --    não cria outra; a conta do ensaio é a fonte da verdade.
    if new.ensaio_id is not null then
      select exists(
        select 1 from public.contas_receber
        where ensaio_id = new.ensaio_id and status <> 'cancelado'
      ) into v_tem_conta_ensaio;
    end if;

    if coalesce(new.valor, 0) > 0
       and not v_tem_conta_ensaio
       and not exists (select 1 from public.contas_receber where contrato_id = new.id) then
      insert into public.contas_receber
        (cliente_id, ensaio_id, contrato_id, descricao, valor, vencimento, status)
      values
        (new.cliente_id, new.ensaio_id, new.id,
         'Contrato — ' || coalesce(new.titulo, 'serviço'),
         new.valor, current_date + 30, 'pendente');
    end if;
  else
    -- desfez a assinatura (voltou a rascunho/enviado/cancelado):
    -- remove a conta gerada pelo contrato se ainda não foi recebida.
    delete from public.contas_receber where contrato_id = new.id and status = 'pendente';
  end if;
  return new;
end;
$$;

drop trigger if exists on_contrato_assinado on public.contratos;
create trigger on_contrato_assinado
  after insert or update on public.contratos
  for each row execute function public.handle_contrato_assinado();

-- ── Excluir contrato: remove a conta a receber PENDENTE que ele gerou ──
-- (mantém contas já pagas). Evita recebíveis órfãos quando o `on delete set
-- null` da FK desligaria o vínculo e o dedup/reversão não a alcançaria mais.
create or replace function public.handle_contrato_excluido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.contas_receber where contrato_id = old.id and status = 'pendente';
  return old;
end;
$$;

drop trigger if exists on_contrato_excluido on public.contratos;
create trigger on_contrato_excluido
  before delete on public.contratos
  for each row execute function public.handle_contrato_excluido();

-- ── RPC PÚBLICA: carregar o contrato pelo token (página /assinar) ──
-- Cliente é anônimo; só expõe o necessário para ler e assinar.
create or replace function public.carregar_contrato(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c    public.contratos;
  v_nome text;
begin
  select * into v_c from public.contratos where token = p_token;
  -- não expõe contratos inexistentes nem cancelados
  if v_c.id is null or v_c.status = 'cancelado' then
    return jsonb_build_object('ok', false, 'erro', 'Contrato não encontrado.');
  end if;
  select nome into v_nome from public.clientes where id = v_c.cliente_id;
  return jsonb_build_object(
    'ok', true,
    'contrato', jsonb_build_object(
      'id', v_c.id,
      'titulo', v_c.titulo,
      'modelo', v_c.modelo,
      'valor', v_c.valor,
      'clausulas', v_c.clausulas,
      'ensaio', v_c.ensaio_desc,
      'status', v_c.status,
      'clienteNome', coalesce(v_nome, ''),
      'criado', v_c.created_at,
      'pdfNome', v_c.pdf_nome
    )
  );
end;
$$;

-- ── RPC PÚBLICA: assinar (cliente sem login) ──
-- Marca o contrato como assinado e guarda a imagem da assinatura.
-- O trigger acima dispara a costura (conta a receber + funil).
create or replace function public.assinar_contrato(p_token uuid, p_assinatura text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.contratos;
begin
  select * into v_c from public.contratos where token = p_token;
  if v_c.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Contrato não encontrado.');
  end if;
  if v_c.status = 'assinado' then
    return jsonb_build_object('ok', true, 'jaAssinado', true);
  end if;
  -- só assina o que foi ENVIADO para assinatura (bloqueia rascunho/cancelado);
  -- impede ressuscitar um contrato cancelado e refazer a costura.
  if v_c.status <> 'enviado' then
    return jsonb_build_object('ok', false, 'erro', 'Este contrato não está disponível para assinatura.');
  end if;
  -- guarda contra payload abusivo (assinatura é um PNG pequeno do canvas)
  if p_assinatura is null or length(p_assinatura) > 300000 then
    return jsonb_build_object('ok', false, 'erro', 'Assinatura inválida.');
  end if;
  update public.contratos
     set status = 'assinado', assinatura = p_assinatura, assinado_em = now()
   where id = v_c.id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.carregar_contrato(uuid)        to anon, authenticated;
grant execute on function public.assinar_contrato(uuid, text)   to anon, authenticated;
