-- ============================================================
-- BLOCO 0 — Núcleo de acesso (genérico / revendível)
-- Alma Fotografia · Backend Supabase
--
-- REGRA DE OURO: 1 estúdio = 1 Supabase isolado.
-- SEM studio_id, SEM multi-tenant, SEM coluna de tenant em nada.
-- O banco inteiro já é de UM estúdio só.
--
-- Este arquivo é GENÉRICO (serve para qualquer estúdio) — futuramente
-- promovido para a PASTA FONTE. Nada específico da Alma aqui.
--
-- Como aplicar: Supabase > SQL Editor > cole este arquivo > Run.
-- Idempotente o suficiente para rodar uma vez num banco vazio.
-- ============================================================

-- ── Papéis da equipe ────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'fotografo', 'editor', 'atendimento');
  end if;
end $$;

-- ── Perfis da equipe (espelham auth.users) ──────────────────
-- O cliente FINAL não tem conta Auth (entra na galeria por código+senha,
-- validado no servidor). Só a EQUIPE tem profile aqui.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text,
  role        public.user_role not null default 'atendimento',
  ativo       boolean not null default true,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Equipe do estúdio (espelha auth.users). Cliente final NÃO tem conta aqui.';

-- ── Helper: timestamp de atualização ────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Helper: o usuário atual é admin? ────────────────────────
-- SECURITY DEFINER evita recursão de RLS ao ler profiles dentro
-- das próprias policies de profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and ativo
  );
$$;

-- ── Criação automática do profile no signup ─────────────────
-- O PRIMEIRO usuário do estúdio vira admin (bootstrap do Maurício).
-- Os demais entram como 'atendimento' (ou o role vindo do metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  public.user_role;
  v_total int;
begin
  select count(*) into v_total from public.profiles;

  if v_total = 0 then
    v_role := 'admin';
  else
    v_role := coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'atendimento'
    );
  end if;

  insert into public.profiles (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    v_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Trava anti-escalada de privilégio ───────────────────────
-- Só admin pode alterar role/ativo. Um usuário comum até edita o
-- próprio nome/avatar, mas role e ativo ficam congelados.
create or replace function public.guard_profile_privilege()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role  := old.role;
    new.ativo := old.ativo;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_privilege();

-- ── GRANTs (camada 1: permissão de tabela) ─────────────────
-- Perfis são internos da equipe: nada de anon aqui. A RLS abaixo
-- refina o que cada membro autenticado pode ver/editar.
grant select, insert, update, delete on public.profiles to authenticated;

-- ── RLS (camada 2: filtro de linhas) ───────────────────────
alter table public.profiles enable row level security;

-- Qualquer membro autenticado da equipe vê todos os perfis (equipe interna).
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

-- Cada um edita o próprio perfil (role/ativo protegidos pela trava acima).
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin gerencia todos os perfis (inserir, editar role/ativo, remover).
drop policy if exists profiles_all_admin on public.profiles;
create policy profiles_all_admin
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Nota: o INSERT do fluxo normal é feito pelo trigger handle_new_user
-- (SECURITY DEFINER), que ignora RLS. As policies acima cobrem o resto.
