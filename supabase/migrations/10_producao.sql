-- ============================================================
-- WAVE 2 — Produção por etapas + Agenda com duração (genérico)
--   • etapas_producao: sub-etapas do ensaio (edição → cor → retoque)
--     com responsável e prazo (feature do Maurício)
--   • agendamentos.duracao_min: tempo REAL do ensaio (preenchido ao
--     confirmar a reserva) — a agenda bloqueia os horários do dia
--
-- Depende de 06_galerias e 01_core (profiles).
-- ============================================================

alter table public.agendamentos add column if not exists duracao_min integer;

-- ── Etapas de produção (por galeria) ───────────────────────
create table if not exists public.etapas_producao (
  id             uuid primary key default gen_random_uuid(),
  galeria_id     uuid not null references public.galerias(id) on delete cascade,
  tipo           text not null,                 -- edicao | cor | retoque | custom
  nome           text not null,
  ordem          integer not null default 0,
  status         text not null default 'pendente', -- pendente | em_andamento | concluida
  responsavel_id uuid references public.profiles(id) on delete set null,
  prazo          date,
  concluida_em   timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_etapas_galeria on public.etapas_producao (galeria_id);

grant select, insert, update, delete on public.etapas_producao to authenticated;
alter table public.etapas_producao enable row level security;
drop policy if exists etapas_all_auth on public.etapas_producao;
create policy etapas_all_auth on public.etapas_producao for all to authenticated using (true) with check (true);

-- ── COSTURA: galeria entra em "editando" -> cria as 3 etapas ──
create or replace function public.handle_galeria_producao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'editando' and (old.status is distinct from 'editando') then
    if not exists (select 1 from public.etapas_producao where galeria_id = new.id) then
      insert into public.etapas_producao (galeria_id, tipo, nome, ordem) values
        (new.id, 'edicao',  'Edição',             1),
        (new.id, 'cor',     'Tratamento de cor',  2),
        (new.id, 'retoque', 'Retoque de pele',    3);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_galeria_producao on public.galerias;
create trigger on_galeria_producao
  after update on public.galerias
  for each row execute function public.handle_galeria_producao();

-- ── BACKFILL: galerias que JÁ estão em "editando" sem etapas ──
insert into public.etapas_producao (galeria_id, tipo, nome, ordem)
select g.id, x.tipo, x.nome, x.ordem
from public.galerias g
cross join (values ('edicao','Edição',1), ('cor','Tratamento de cor',2), ('retoque','Retoque de pele',3)) as x(tipo, nome, ordem)
where g.status = 'editando'
  and not exists (select 1 from public.etapas_producao e where e.galeria_id = g.id);
