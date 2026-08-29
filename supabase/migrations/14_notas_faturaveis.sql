-- ============================================================
-- BLOCO 8c — Notas faturáveis a partir de PAGAMENTOS (genérico / revendível)
--   A fila "Pronto para emitir" passa a listar TODO pagamento recebido
--   (lançamento de ENTRADA) que ainda não virou nota — inclusive a RESERVA
--   paga no agendamento do site (que vira lançamento, não conta a receber).
--   A nota referencia o lançamento de origem (dedup por lancamento_id).
--   A derivação fica em src/lib/notas.js (fetchFaturaveis) — sem trigger.
--
-- Depende de 09_financeiro (lancamentos) e 12_notas (notas_fiscais).
-- ============================================================

alter table public.notas_fiscais
  add column if not exists lancamento_id uuid references public.lancamentos(id) on delete set null;

create index if not exists idx_notas_lancamento on public.notas_fiscais (lancamento_id);

-- no máximo UMA nota ativa por pagamento (canceladas liberam reemissão)
create unique index if not exists idx_notas_lancamento_unica
  on public.notas_fiscais (lancamento_id)
  where lancamento_id is not null and status <> 'cancelada';
