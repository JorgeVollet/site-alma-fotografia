-- ============================================================
-- BLOCO 5+ — SELEÇÃO TURBINADA (genérico / revendível)
--   • fotos.nome_arquivo: nome original do arquivo (ex: _DSC1234.jpg) p/ o
--     export "Smart Collection do Lightroom" (o LR seleciona sozinho).
--   • fotos.favorita_fotografo: o estúdio INDICA fotos ao cliente (ajuda a
--     vender extras) → aparecem em destaque na área do cliente.
--   • galerias.mensagem_fotografo: recado do estúdio sobre as indicadas.
--   • entrar_galeria redefinido p/ devolver favorita_fotografo + a mensagem
--     (mantendo valor_total/reserva que o 08 já adicionou).
--
-- Depende de 06_galerias, 07_cliente_galeria, 08_pagamento_selecao.
-- ============================================================

alter table public.fotos    add column if not exists nome_arquivo       text;
alter table public.fotos    add column if not exists favorita_fotografo boolean not null default false;
alter table public.galerias add column if not exists mensagem_fotografo text;

-- ── entrar_galeria: agora devolve favorita_fotografo + mensagem_fotografo ──
-- (mantém valor_total/reserva do 08 — não regredir!)
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
            'selecionada', f.selecionada, 'observacao', f.observacao,
            'favorita_fotografo', f.favorita_fotografo
         ) order by f.ordem), '[]'::jsonb)
    into v_fotos
    from public.fotos f where f.galeria_id = v_gal.id;

  return jsonb_build_object(
    'ok', true,
    'token', v_token,
    'galeria', jsonb_build_object(
      'id', v_gal.id, 'nome', v_gal.nome, 'status', v_gal.status,
      'fotos_inclusas', v_gal.fotos_inclusas, 'foto_extra', v_gal.foto_extra,
      'valor_total', v_gal.valor_total, 'reserva', v_gal.reserva,
      'mensagem_fotografo', v_gal.mensagem_fotografo
    ),
    'fotos', v_fotos
  );
end;
$$;

grant execute on function public.entrar_galeria(text, text) to anon, authenticated;
