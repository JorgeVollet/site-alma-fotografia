-- ============================================================
-- BLOCO 5++ — GALERIA com SELEÇÃO + ENTREGA (genérico / revendível)
--   • fotos.tipo: 'selecao' (prova com marca d'água, 1024px) | 'entrega'
--     (final SEM marca, tamanho real — o cliente baixa).
--   • bucket público 'entregas' (UUID não-listável), como o 'previews'.
--   • MESMO login (código+senha) dá acesso às DUAS abas na área do cliente.
--   • entrar_galeria devolve as duas listas (fotos de seleção + entregas).
--   • reenviar_selecao: cliente pode escolher MAIS fotos depois e reenviar
--     (recorrência/venda avulsa) → status volta a 'enviado', estúdio reedita.
--
-- Depende de 06_galerias, 07_cliente_galeria, 08_pagamento, 13_selecao_plus.
-- ============================================================

alter table public.fotos add column if not exists tipo text not null default 'selecao';
create index if not exists idx_fotos_tipo on public.fotos (galeria_id, tipo);

-- bucket público das ENTREGAS (finais sem marca, tamanho real)
insert into storage.buckets (id, name, public)
values ('entregas', 'entregas', true)
on conflict (id) do nothing;

-- leitura pública (bucket public=true); escrita (upload) só da equipe
drop policy if exists entregas_write_team on storage.objects;
create policy entregas_write_team
  on storage.objects for all
  to authenticated
  using (bucket_id = 'entregas')
  with check (bucket_id = 'entregas');

-- ── entrar_galeria v2: devolve fotos de SELEÇÃO e de ENTREGA ──
-- (mantém valor_total/reserva do 08, favorita/mensagem do 13)
create or replace function public.entrar_galeria(p_codigo text, p_senha text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal      public.galerias;
  v_token    uuid;
  v_fotos    jsonb;
  v_entregas jsonb;
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

  -- fotos para SELEÇÃO (prova com marca d'água)
  select coalesce(jsonb_agg(jsonb_build_object(
            'id', f.id, 'preview_path', f.preview_path, 'thumb_path', f.thumb_path,
            'selecionada', f.selecionada, 'observacao', f.observacao,
            'favorita_fotografo', f.favorita_fotografo
         ) order by f.ordem), '[]'::jsonb)
    into v_fotos
    from public.fotos f
   where f.galeria_id = v_gal.id and coalesce(f.tipo, 'selecao') = 'selecao';

  -- fotos de ENTREGA (finais sem marca, p/ baixar)
  select coalesce(jsonb_agg(jsonb_build_object(
            'id', f.id, 'preview_path', f.preview_path, 'thumb_path', f.thumb_path,
            'nome_arquivo', f.nome_arquivo
         ) order by f.ordem), '[]'::jsonb)
    into v_entregas
    from public.fotos f
   where f.galeria_id = v_gal.id and f.tipo = 'entrega';

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'galeria', jsonb_build_object(
      'id', v_gal.id, 'nome', v_gal.nome, 'status', v_gal.status,
      'fotos_inclusas', v_gal.fotos_inclusas, 'foto_extra', v_gal.foto_extra,
      'valor_total', v_gal.valor_total, 'reserva', v_gal.reserva,
      'mensagem_fotografo', v_gal.mensagem_fotografo
    ),
    'fotos', v_fotos,
    'entregas', v_entregas
  );
end;
$$;

-- ── reenviar_selecao: recorrência (cliente escolhe mais e reenvia) ──
-- O cliente pode marcar mais fotos a qualquer momento (salvar_selecao_foto já
-- funciona); este RPC só volta o status p/ 'enviado' pra reaparecer no painel
-- do estúdio (que reedita / cobra as avulsas). Não mexe no pagamento.
create or replace function public.reenviar_selecao(p_token uuid)
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

grant execute on function public.entrar_galeria(text, text) to anon, authenticated;
grant execute on function public.reenviar_selecao(uuid)     to anon, authenticated;
