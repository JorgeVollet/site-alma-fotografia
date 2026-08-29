-- ============================================================
-- BLOCO 4B/5 — Acesso do cliente à galeria (genérico / revendível)
--   • bucket PÚBLICO 'previews' (só as versões com marca d'água)
--   • o cliente final NÃO tem conta: entra por código + senha, validado
--     no servidor por funções SQL (SECURITY DEFINER), modelo Alboom.
--   • originais em alta seguem no bucket privado 'galerias' (nunca públicos).
--
-- Depende de 06_galerias.sql.
-- ============================================================

-- ── Bucket público das previews (marca d'água) ─────────────
insert into storage.buckets (id, name, public)
values ('previews', 'previews', true)
on conflict (id) do nothing;

-- Leitura é pública (bucket public=true). A escrita (upload) é só da equipe.
drop policy if exists previews_write_team on storage.objects;
create policy previews_write_team
  on storage.objects for all
  to authenticated
  using (bucket_id = 'previews')
  with check (bucket_id = 'previews');

-- ── Colunas novas ───────────────────────────────────────────
alter table public.fotos    add column if not exists observacao   text;   -- nota do cliente por foto
alter table public.galerias add column if not exists sessao_token uuid;    -- "sessão" do cliente após login

-- ── RPC: login do cliente na galeria ────────────────────────
-- Valida código + senha; gera um token de sessão; devolve a galeria + fotos.
create or replace function public.entrar_galeria(p_codigo text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal   public.galerias;
  v_token uuid;
  v_fotos jsonb;
begin
  select * into v_gal from public.galerias
   where lower(codigo) = lower(trim(coalesce(p_codigo, ''))) limit 1;

  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Código não encontrado.');
  end if;
  if coalesce(v_gal.senha, '') <> coalesce(p_senha, '') then
    return jsonb_build_object('ok', false, 'erro', 'Senha incorreta.');
  end if;

  v_token := gen_random_uuid();
  update public.galerias set sessao_token = v_token where id = v_gal.id;

  select coalesce(jsonb_agg(jsonb_build_object(
            'id', f.id, 'preview_path', f.preview_path, 'thumb_path', f.thumb_path,
            'selecionada', f.selecionada, 'observacao', f.observacao
         ) order by f.ordem), '[]'::jsonb)
    into v_fotos
    from public.fotos f where f.galeria_id = v_gal.id;

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'galeria', jsonb_build_object(
      'id', v_gal.id, 'nome', v_gal.nome, 'status', v_gal.status,
      'fotos_inclusas', v_gal.fotos_inclusas, 'foto_extra', v_gal.foto_extra
    ),
    'fotos', v_fotos
  );
end;
$$;

-- ── RPC: salvar seleção/observação de UMA foto ──────────────
create or replace function public.salvar_selecao_foto(
  p_token uuid, p_foto_id uuid, p_selecionada boolean, p_observacao text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_gal_id uuid;
begin
  select g.id into v_gal_id
    from public.fotos f
    join public.galerias g on g.id = f.galeria_id
   where f.id = p_foto_id and g.sessao_token = p_token;

  if v_gal_id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;

  update public.fotos
     set selecionada = coalesce(p_selecionada, selecionada),
         observacao  = p_observacao
   where id = p_foto_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ── RPC: cliente finaliza e envia a seleção ─────────────────
create or replace function public.enviar_selecao(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_gal_id uuid;
begin
  select id into v_gal_id from public.galerias where sessao_token = p_token;
  if v_gal_id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;
  update public.galerias set status = 'enviado' where id = v_gal_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- O cliente é ANÔNIMO: precisa poder executar as funções.
grant execute on function public.entrar_galeria(text, text)                       to anon, authenticated;
grant execute on function public.salvar_selecao_foto(uuid, uuid, boolean, text)    to anon, authenticated;
grant execute on function public.enviar_selecao(uuid)                              to anon, authenticated;
