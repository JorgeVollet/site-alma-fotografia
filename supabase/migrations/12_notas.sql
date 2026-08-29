-- ============================================================
-- BLOCO 8b — NOTAS FISCAIS (base / genérico / revendível)
--   Fase 3 do plano Cowork: "Notas Fiscais ↔ Financeiro".
--   • A fila "Pronto para emitir" é DERIVADA, não há trigger:
--       contas_receber PAGAS que ainda não têm nota (ver src/lib/notas.js).
--   • Um clique em "Gerar nota" cria a linha aqui, já vinculada à conta
--     (sem redigitar) — o estúdio decide o que vira nota.
--   • A emissão fiscal REAL (XML/PDF na prefeitura) entra depois, com a
--     Focus NFe; aqui guardamos só a base (número, status, arquivos).
--
-- Depende de 03_clientes, 08_pagamento (contas_receber).
-- ============================================================

create table if not exists public.notas_fiscais (
  id               uuid primary key default gen_random_uuid(),
  conta_receber_id uuid references public.contas_receber(id) on delete set null, -- origem + dedup
  cliente_id       uuid references public.clientes(id)       on delete set null,
  numero           text,                                    -- nulo até emitir de verdade
  tipo             text not null default 'nfse',            -- nfse (serviço) | nfe (produto)
  descricao        text not null default '',
  valor            numeric(10,2) not null default 0,
  cpf_cnpj         text,                                    -- preenchido na emissão (dados fiscais)
  status           text not null default 'pendente',        -- pendente | processando | autorizada | rejeitada | cancelada
  emitida_em       timestamptz,
  pdf_url          text,
  xml_url          text,
  motivo_erro      text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_notas_status on public.notas_fiscais (status);
create index if not exists idx_notas_conta  on public.notas_fiscais (conta_receber_id);
-- dedup autoritativo: no máximo UMA nota ativa por conta a receber
-- (canceladas não contam — permite reemitir depois de cancelar).
create unique index if not exists idx_notas_conta_unica
  on public.notas_fiscais (conta_receber_id)
  where conta_receber_id is not null and status <> 'cancelada';

grant select, insert, update, delete on public.notas_fiscais to authenticated;
alter table public.notas_fiscais enable row level security;
drop policy if exists notas_all_auth on public.notas_fiscais;
create policy notas_all_auth on public.notas_fiscais
  for all to authenticated using (true) with check (true);
