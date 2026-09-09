-- ============================================================
-- BLOCO 24 — O limite de envios não pode punir quem errou de boa-fé
--
-- ERRO MEU NA 23: coloquei a checagem de limite ANTES da validação. Resultado:
-- tentativa inválida (nome em branco, telefone incompleto) consumia a cota.
-- Uma pessoa que erra o formulário 5 vezes — o que acontece o tempo todo no
-- celular — ficava 10 minutos sem conseguir falar com o estúdio. O limite
-- existe para conter robô, não para castigar quem digitou errado.
--
-- Agora a ordem é: honeypot -> validação -> limite -> grava.
-- Só uma submissão VÁLIDA (que de fato criaria dado) consome a cota.
--
-- Idempotente. Substitui a versão da 23.
-- ============================================================

create or replace function public.solicitar_contato(
  p_nome         text,
  p_email        text,
  p_telefone     text,
  p_servico      text default null,
  p_servico_nome text default null,
  p_mensagem     text default null,
  p_website      text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_ensaio_id  uuid;
  v_novo       boolean := false;
  v_repetido   boolean := false;
  v_nome       text := nullif(trim(coalesce(p_nome, '')), '');
  v_email      text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_tel        text := nullif(regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g'), '');
  v_label      text := coalesce(nullif(trim(coalesce(p_servico_nome, '')), ''),
                                nullif(trim(coalesce(p_servico, '')), ''), 'Ensaio');
  v_msg        text := nullif(trim(coalesce(p_mensagem, '')), '');
begin
  -- 1) ISCA: campo escondido preenchido = robô. Finge que deu certo e sai
  -- (avisar que barrou só ensina o robô a contornar). Não consome cota.
  if coalesce(trim(p_website), '') <> '' then
    return jsonb_build_object('ok', true, 'ignorado', true);
  end if;

  -- 2) VALIDAÇÃO primeiro — erro de digitação não gasta a cota de ninguém
  if v_nome is null then
    return jsonb_build_object('ok', false, 'erro', 'Informe o seu nome.');
  end if;
  if v_email is null and v_tel is null then
    return jsonb_build_object('ok', false, 'erro', 'Informe e-mail ou telefone.');
  end if;
  if length(v_nome) > 150 or length(coalesce(v_msg, '')) > 2000 then
    return jsonb_build_object('ok', false, 'erro', 'Texto longo demais.');
  end if;

  -- 3) LIMITE: só agora, quando o envio é de verdade e vai gravar algo.
  -- 5 envios válidos a cada 10 minutos por origem.
  if not public.checar_limite('contato:' || public.origem_chamada(coalesce(v_tel, v_email, 'x')), 5, 10) then
    return jsonb_build_object('ok', false, 'limitado', true,
      'erro', 'Recebemos vários envios agora há pouco. Aguarde alguns minutos ou fale direto no WhatsApp.');
  end if;

  -- 4) grava
  select id into v_cliente_id
    from public.clientes
   where (v_email is not null and lower(trim(email)) = v_email)
      or (v_tel is not null and nullif(regexp_replace(coalesce(telefone, ''), '[^0-9]', '', 'g'), '') = v_tel)
   order by created_at asc limit 1;

  if v_cliente_id is null then
    insert into public.clientes (nome, email, telefone, funil_etapa, origem, interesse, primeiro_contato, notas)
    values (v_nome, p_email, p_telefone, 'lead', 'site', v_label, current_date, v_msg)
    returning id into v_cliente_id;
    v_novo := true;
  end if;

  select id into v_ensaio_id
    from public.ensaios
   where cliente_id = v_cliente_id and status = 'solicitado' and origem = 'site'
     and coalesce(tipo_ensaio, '') = coalesce(p_servico, '')
   order by created_at desc limit 1;

  if v_ensaio_id is null then
    insert into public.ensaios (cliente_id, titulo, tipo_ensaio, valor, status, origem, observacoes)
    values (v_cliente_id, v_label || ' · solicitação pelo site', p_servico, 0, 'solicitado', 'site', v_msg)
    returning id into v_ensaio_id;
  else
    v_repetido := true;
    update public.ensaios
       set observacoes = trim(both e'\n' from coalesce(observacoes || e'\n', '') || coalesce(v_msg, '')),
           updated_at = now()
     where id = v_ensaio_id and v_msg is not null;
  end if;

  insert into public.cliente_atualizacoes (cliente_id, texto)
  values (v_cliente_id,
          case when v_repetido then 'Pediu contato pelo site de novo' else 'Pediu contato pelo site' end
          || ' · ' || v_label
          || case when v_msg is not null then ' — "' || left(v_msg, 300) || '"' else '' end);

  return jsonb_build_object('ok', true, 'cliente_id', v_cliente_id,
                            'ensaio_id', v_ensaio_id, 'novo_cliente', v_novo, 'repetido', v_repetido);
end;
$$;

grant execute on function public.solicitar_contato(text, text, text, text, text, text, text) to anon, authenticated;

-- Libera a cota que os testes consumiram enquanto a ordem estava errada.
delete from public.limite_uso where chave like 'contato:%';
