-- ============================================================
-- BLOCO 22 — Agenda de verdade (estilo Google Calendar)
--
-- O que faltava:
--   • o ensaio tinha data e hora, mas não DURAÇÃO — sem isso não dá para
--     desenhar o bloco do evento na visão de semana/dia;
--   • não havia onde guardar um compromisso que não seja ensaio (reunião,
--     viagem, bloqueio pessoal, entrega de álbum...). O estúdio precisa de UMA
--     agenda, não de uma agenda só de ensaios;
--   • não havia cor por tipo de compromisso.
--
-- Depende de 04 (ensaios) e 03 (clientes). Idempotente.
-- ============================================================

-- duração do ensaio (a de agendamentos, do bloco 10, era de outra tabela)
alter table public.ensaios add column if not exists duracao_min integer;

-- cor livre por ensaio (o padrão vem do tipo; isto é o override)
alter table public.ensaios add column if not exists cor text;

-- ── Compromissos livres da agenda ───────────────────────────
create table if not exists public.eventos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text,
  inicio      timestamptz not null,
  fim         timestamptz,
  dia_inteiro boolean not null default false,
  cor         text,                    -- hex ou nome do preset
  tipo        text not null default 'evento',  -- evento|reuniao|bloqueio|entrega|pessoal
  cliente_id  uuid references public.clientes(id) on delete set null,
  ensaio_id   uuid references public.ensaios(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_eventos_inicio on public.eventos (inicio);
create index if not exists idx_eventos_cliente on public.eventos (cliente_id);

grant select, insert, update, delete on public.eventos to authenticated;
alter table public.eventos enable row level security;

-- agenda é interna: nada de anon aqui
drop policy if exists eventos_all_authenticated on public.eventos;
create policy eventos_all_authenticated on public.eventos
  for all to authenticated using (true) with check (true);

-- mantém updated_at honesto
create or replace function public.touch_evento()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists on_evento_touch on public.eventos;
create trigger on_evento_touch
  before update on public.eventos
  for each row execute function public.touch_evento();
