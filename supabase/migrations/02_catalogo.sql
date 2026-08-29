-- ============================================================
-- BLOCO 1 — Catálogo (genérico / revendível)
-- pacotes + produtos. Serviços (tipos de ensaio) seguem como
-- conteúdo de marketing no código por enquanto.
--
-- 1 estúdio = 1 Supabase. SEM studio_id.
-- Depende de 01_core.sql (usa public.is_admin() e set_updated_at()).
-- ============================================================

-- ── Pacotes ─────────────────────────────────────────────────
create table if not exists public.pacotes (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,          -- usado em URLs (?pacote=memorias)
  nome           text not null,
  ideal          text,                          -- "Newborn, smash & acompanhamento"
  preco          numeric(10,2) not null default 0,
  reserva        numeric(10,2) not null default 0,
  destaque       boolean not null default false,
  selo           text,                          -- "Vagas limitadas"
  inclui         text[] not null default '{}',  -- itens do pacote
  fotos_inclusas integer not null default 0,
  foto_extra     numeric(10,2),                 -- valor padrão da foto extra do pacote
  tipo_fiscal    text not null default 'servico',
  ativo          boolean not null default true,
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.pacotes.foto_extra is 'Valor PADRÃO da foto extra. Por ensaio pode ser sobrescrito (feature do Maurício).';

drop trigger if exists trg_pacotes_updated_at on public.pacotes;
create trigger trg_pacotes_updated_at
  before update on public.pacotes
  for each row execute function public.set_updated_at();

-- ── Produtos (álbuns, quadros, impressos — venda extra) ─────
create table if not exists public.produtos (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  nome           text not null,
  descricao      text,
  preco          numeric(10,2) not null default 0,
  tipo_fiscal    text not null default 'produto',
  personalizado  boolean not null default true,  -- cancelável só até produção começar
  ativo          boolean not null default true,
  ordem          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_produtos_updated_at on public.produtos;
create trigger trg_produtos_updated_at
  before update on public.produtos
  for each row execute function public.set_updated_at();

-- ── GRANTs (camada 1: permissão de tabela) ─────────────────
-- Sem isto o anon recebe "42501 permission denied" e a RLS nem é
-- avaliada. anon só lê; authenticated lê e escreve (a RLS abaixo é
-- quem decide QUAIS linhas / que só admin escreve).
grant select                         on public.pacotes  to anon;
grant select, insert, update, delete on public.pacotes  to authenticated;
grant select                         on public.produtos to anon;
grant select, insert, update, delete on public.produtos to authenticated;

-- ── RLS (camada 2: filtro de linhas) ───────────────────────
-- O catálogo é público: o site (anon, sem login) lê os itens ATIVOS.
-- Só admin cria/edita/remove.
alter table public.pacotes  enable row level security;
alter table public.produtos enable row level security;

-- pacotes: leitura pública dos ativos
drop policy if exists pacotes_select_public on public.pacotes;
create policy pacotes_select_public
  on public.pacotes for select
  to anon, authenticated
  using (ativo);

-- pacotes: admin gerencia tudo (inclusive inativos)
drop policy if exists pacotes_all_admin on public.pacotes;
create policy pacotes_all_admin
  on public.pacotes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- produtos: leitura pública dos ativos
drop policy if exists produtos_select_public on public.produtos;
create policy produtos_select_public
  on public.produtos for select
  to anon, authenticated
  using (ativo);

-- produtos: admin gerencia tudo
drop policy if exists produtos_all_admin on public.produtos;
create policy produtos_all_admin
  on public.produtos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
