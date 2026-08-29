-- ============================================================
-- BLOCO 4A — Galerias + Fotos (storage) (genérico / revendível)
--   • bucket privado 'galerias' (originais nunca públicos)
--   • galerias (ligada a um ensaio/cliente, com código de acesso)
--   • fotos (3 versões: original / preview com marca d'água / thumb)
--
-- 1 estúdio = 1 Supabase. SEM studio_id.
-- Depende de 03_clientes.sql e 04_ensaios.sql.
-- ============================================================

-- ── Storage: bucket privado ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('galerias', 'galerias', false)
on conflict (id) do nothing;

-- A equipe autenticada gerencia os arquivos do bucket. O cliente final
-- NÃO acessa o storage direto — recebe URLs assinadas (Bloco 5, via Edge
-- Function com service_role). Por isso aqui só liberamos 'authenticated'.
drop policy if exists galerias_storage_team on storage.objects;
create policy galerias_storage_team
  on storage.objects for all
  to authenticated
  using (bucket_id = 'galerias')
  with check (bucket_id = 'galerias');

-- ── Tabela: galerias ────────────────────────────────────────
create table if not exists public.galerias (
  id             uuid primary key default gen_random_uuid(),
  ensaio_id      uuid references public.ensaios(id)  on delete set null,
  cliente_id     uuid references public.clientes(id) on delete set null,
  nome           text not null,
  codigo         text unique,           -- código de acesso do cliente (Bloco 5)
  senha          text,                  -- senha do cliente (Bloco 5: hash/validação no servidor)
  status         text not null default 'selecionando', -- selecionando|enviado|editando|pronto
  fotos_inclusas integer not null default 0,
  foto_extra     numeric(10,2),
  capa_foto_id   uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_galerias_ensaio on public.galerias (ensaio_id);

drop trigger if exists trg_galerias_updated_at on public.galerias;
create trigger trg_galerias_updated_at
  before update on public.galerias
  for each row execute function public.set_updated_at();

-- ── Tabela: fotos ───────────────────────────────────────────
create table if not exists public.fotos (
  id            uuid primary key default gen_random_uuid(),
  galeria_id    uuid not null references public.galerias(id) on delete cascade,
  ordem         integer not null default 0,
  original_path text,                   -- caminho no storage (alta, privada)
  preview_path  text,                   -- versão com marca d'água (seleção)
  thumb_path    text,                   -- miniatura (grid)
  selecionada   boolean not null default false,  -- Bloco 5 faz a seleção rica
  created_at    timestamptz not null default now()
);
create index if not exists idx_fotos_galeria on public.fotos (galeria_id);

-- ── GRANTs (camada 1) ───────────────────────────────────────
-- Galerias/fotos são privadas da equipe. O cliente verá previews via URL
-- assinada (Bloco 5), não por acesso direto à tabela.
grant select, insert, update, delete on public.galerias to authenticated;
grant select, insert, update, delete on public.fotos    to authenticated;

-- ── RLS (camada 2) ──────────────────────────────────────────
alter table public.galerias enable row level security;
alter table public.fotos    enable row level security;

drop policy if exists galerias_all_authenticated on public.galerias;
create policy galerias_all_authenticated
  on public.galerias for all
  to authenticated
  using (true) with check (true);

drop policy if exists fotos_all_authenticated on public.fotos;
create policy fotos_all_authenticated
  on public.fotos for all
  to authenticated
  using (true) with check (true);
