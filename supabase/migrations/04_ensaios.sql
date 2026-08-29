-- ============================================================
-- BLOCO 3A — Ensaios + Agendamentos (genérico / revendível)
--   • ensaios       = sessões de fotografia ligadas a um cliente
--   • agendamentos  = reservas feitas pelo SITE (provisórias, "a confirmar")
--
-- 1 estúdio = 1 Supabase. SEM studio_id.
-- Depende de 01_core.sql (is_admin/set_updated_at) e 03_clientes.sql.
-- ============================================================

-- ── Ensaios (sessões) ───────────────────────────────────────
create table if not exists public.ensaios (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clientes(id) on delete cascade,
  titulo       text,
  tipo_ensaio  text,                 -- gestante|newborn|smash|familia|... (slug livre)
  pacote_slug  text,                 -- referencia pacotes.slug (sem FK rígida)
  valor        numeric(10,2) not null default 0,
  data         date,
  hora         text,
  local        text,
  status       text not null default 'agendado', -- agendado|selecionando|enviado|editando|pronto|entregue
  observacoes  text,
  foto_extra   numeric(10,2),        -- override do valor da foto extra DESTE ensaio (feature Maurício)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.ensaios.foto_extra is 'Se preenchido, sobrescreve o foto_extra padrão do pacote (negociado caso a caso).';
create index if not exists idx_ensaios_cliente on public.ensaios (cliente_id);

drop trigger if exists trg_ensaios_updated_at on public.ensaios;
create trigger trg_ensaios_updated_at
  before update on public.ensaios
  for each row execute function public.set_updated_at();

-- ── Agendamentos (reservas do site) ─────────────────────────
create table if not exists public.agendamentos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  email          text,
  telefone       text,
  servico        text,               -- tipo de ensaio escolhido no site
  pacote_slug    text,
  pacote_nome    text,
  dia            date,
  hora           text,
  valor_reserva  numeric(10,2),
  valor_total    numeric(10,2),
  status         text not null default 'a-confirmar', -- a-confirmar|confirmado|cancelado
  observacoes    text,
  created_at     timestamptz not null default now()
);

comment on table public.agendamentos is 'Reservas vindas do site (provisórias). A equipe confirma e gera o ensaio (Bloco 3B).';
create index if not exists idx_agendamentos_dia on public.agendamentos (dia);

-- ── GRANTs (camada 1) ───────────────────────────────────────
-- ensaios: privados da equipe.
grant select, insert, update, delete on public.ensaios to authenticated;
-- agendamentos: o site (anon) só PODE INSERIR uma reserva. Não lê nem edita.
grant insert                          on public.agendamentos to anon;
grant select, insert, update, delete  on public.agendamentos to authenticated;

-- ── RLS (camada 2) ──────────────────────────────────────────
alter table public.ensaios       enable row level security;
alter table public.agendamentos  enable row level security;

-- ensaios: só a equipe autenticada.
drop policy if exists ensaios_all_authenticated on public.ensaios;
create policy ensaios_all_authenticated
  on public.ensaios for all
  to authenticated
  using (true) with check (true);

-- agendamentos: anon só INSERE, e só pode criar como "a-confirmar"
-- (não consegue forjar uma reserva já "confirmado").
drop policy if exists agendamentos_insert_anon on public.agendamentos;
create policy agendamentos_insert_anon
  on public.agendamentos for insert
  to anon
  with check (status = 'a-confirmar');

-- equipe autenticada: acesso total.
drop policy if exists agendamentos_all_authenticated on public.agendamentos;
create policy agendamentos_all_authenticated
  on public.agendamentos for all
  to authenticated
  using (true) with check (true);
