-- ============================================================
-- BLOCO 2 — Clientes (genérico / revendível)
-- clientes (com data_nascimento, feature do Maurício).
-- O FUNIL fica como config no código por enquanto (5 etapas fixas);
-- a etapa do cliente é guardada como texto em funil_etapa. Quando o
-- Kanban customizável entrar (Bloco 6), promovemos para tabela própria.
--
-- 1 estúdio = 1 Supabase. SEM studio_id.
-- Depende de 01_core.sql (is_admin / set_updated_at).
-- ============================================================

create table if not exists public.clientes (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  contato         text,                 -- pessoa de contato (ex: a mãe)
  email           text,
  telefone        text,
  data_nascimento date,                 -- aniversariantes (feature Maurício)
  interesse       text,                 -- p/ leads: "Ensaio gestante"
  origem          text,                 -- p/ leads: "Instagram", "Indicação"
  notas           text,
  funil_etapa     text not null default 'lead',  -- lead|orcamento|agendado|producao|entregue
  avatar_grad     text,                 -- gradiente do avatar (visual)
  desde           date not null default current_date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.clientes is 'Clientes/leads do estúdio. Dados privados — só a equipe (authenticated) acessa.';

drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- índice p/ futuro relatório de aniversariantes (busca por mês/dia)
create index if not exists idx_clientes_data_nascimento on public.clientes (data_nascimento);

-- ── GRANTs (camada 1) ───────────────────────────────────────
-- Clientes são dados PRIVADOS da equipe: nada de anon aqui.
grant select, insert, update, delete on public.clientes to authenticated;

-- ── RLS (camada 2) ──────────────────────────────────────────
alter table public.clientes enable row level security;

-- Toda a equipe autenticada enxerga e gerencia os clientes (CRM interno).
-- Refinamento por papel (atendimento x editor) fica na UI por enquanto.
drop policy if exists clientes_all_authenticated on public.clientes;
create policy clientes_all_authenticated
  on public.clientes for all
  to authenticated
  using (true)
  with check (true);
