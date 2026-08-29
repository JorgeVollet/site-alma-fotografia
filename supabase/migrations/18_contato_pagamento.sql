-- ============================================================
-- BLOCO 18 — Solicitação de contato (sem agendamento) + Pagamento online opcional
--
-- Decisões do Maurício (áudios ago/2026):
--   • TIRAR a marcação de data/hora do site ("vai dar muito B.O.": cada ensaio
--     tem duração própria). O site passa a CAPTAR O LEAD e mandar pro WhatsApp.
--     -> RPC solicitar_contato(): casa/cria o cliente como LEAD e abre um ensaio
--        com status 'solicitado' (que, pelo 17, NÃO cria conta nem promove funil).
--   • Pagamento online (Stone) fica OPCIONAL, com liga/desliga por galeria:
--     o estúdio decide, na hora de entregar as fotos, se aquele cliente pode
--     pagar no cartão/PIX online ou se recebe presencial (lançamento manual).
--     -> galerias.pagamento_online + guarda no servidor em finalizar_selecao.
--
-- Depende de 03_clientes, 04_ensaios, 05_costura, 08_pagamento, 09_financeiro,
--            15_galerias_v2, 16_crm_lead, 17_situacao_sinal.
-- Idempotente (pode rodar de novo sem duplicar nada).
-- ============================================================

-- ── 1) Liga/desliga do pagamento online ─────────────────────
alter table public.galerias
  add column if not exists pagamento_online boolean not null default false;

-- padrão do estúdio (aplicado a galerias novas; editável por galeria)
alter table public.config_estudio
  add column if not exists pagamento_online_padrao boolean not null default false;

-- ── 2) entrar_galeria v3: devolve o flag de pagamento online ─
-- (mantém TUDO do 15: duas listas selecao/entrega, valor_total/reserva do 08,
--  favorita_fotografo/mensagem_fotografo do 13. Só ACRESCENTA pagamento_online.)
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

  select coalesce(jsonb_agg(jsonb_build_object(
            'id', f.id, 'preview_path', f.preview_path, 'thumb_path', f.thumb_path,
            'selecionada', f.selecionada, 'observacao', f.observacao,
            'favorita_fotografo', f.favorita_fotografo
         ) order by f.ordem), '[]'::jsonb)
    into v_fotos
    from public.fotos f
   where f.galeria_id = v_gal.id and coalesce(f.tipo, 'selecao') = 'selecao';

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
      'mensagem_fotografo', v_gal.mensagem_fotografo,
      'pagamento_online', coalesce(v_gal.pagamento_online, false)
    ),
    'fotos', v_fotos,
    'entregas', v_entregas
  );
end;
$$;

-- ── 3) finalizar_selecao v3: guarda do pagamento online ─────
-- Igual ao 09, MAS: se a galeria está com pagamento_online = false, ignora o
-- "pagar agora" vindo do navegador (o cliente combina/paga com o estúdio).
-- Guarda no SERVIDOR — não dá pra burlar mexendo no front.
create or replace function public.finalizar_selecao(p_token uuid, p_pagar_agora boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gal      public.galerias;
  v_conta    public.contas_receber;
  v_qtd_sel  int;
  v_extras   int;
  v_valor_ex numeric(10,2);
  v_saldo    numeric(10,2);
  v_total    numeric(10,2);
  v_venc     date;
  v_status   text;
  v_pagar    boolean;
begin
  select * into v_gal from public.galerias where sessao_token = p_token;
  if v_gal.id is null then
    return jsonb_build_object('ok', false, 'erro', 'Sessão inválida.');
  end if;

  -- só permite pagar online se o estúdio liberou ESTA galeria
  v_pagar := coalesce(p_pagar_agora, false) and coalesce(v_gal.pagamento_online, false);

  select count(*) into v_qtd_sel from public.fotos
   where galeria_id = v_gal.id and selecionada and coalesce(tipo, 'selecao') = 'selecao';
  v_extras   := greatest(0, v_qtd_sel - coalesce(v_gal.fotos_inclusas, 0));
  v_valor_ex := v_extras * coalesce(v_gal.foto_extra, 0);
  v_saldo    := greatest(0, coalesce(v_gal.valor_total, 0) - coalesce(v_gal.reserva, 0));
  v_total    := v_saldo + v_valor_ex;

  if v_pagar then v_venc := current_date; v_status := 'pago';
  else v_venc := public.mais_dias_uteis(current_date, 3); v_status := 'pendente';
  end if;

  update public.galerias set status = 'enviado' where id = v_gal.id;

  select * into v_conta from public.contas_receber
   where ensaio_id = v_gal.ensaio_id and status <> 'cancelado'
   order by created_at asc limit 1;

  if v_conta.id is not null then
    update public.contas_receber
       set valor = v_total,
           descricao = 'Saldo + ' || v_extras || ' foto(s) extra — ' || coalesce(v_gal.nome, 'galeria'),
           vencimento = v_venc, status = v_status,
           pago_em = case when v_pagar then now() else null end
     where id = v_conta.id;
  else
    insert into public.contas_receber (cliente_id, ensaio_id, galeria_id, descricao, valor, vencimento, status, pago_em)
    values (v_gal.cliente_id, v_gal.ensaio_id, v_gal.id,
            'Saldo + ' || v_extras || ' foto(s) extra — ' || coalesce(v_gal.nome, 'galeria'),
            v_total, v_venc, v_status, case when v_pagar then now() else null end);
  end if;

  return jsonb_build_object('ok', true, 'selecionadas', v_qtd_sel, 'extras', v_extras,
    'valor_extra', v_valor_ex, 'saldo', v_saldo, 'total', v_total,
    'vencimento', v_venc, 'status', v_status,
    'pagamento_online', coalesce(v_gal.pagamento_online, false));
end;
$$;

-- ── 4) solicitar_contato: o site capta o LEAD (sem data/hora) ─
-- Mesma regra de casamento do 05 (e-mail OU telefone; nome sozinho NÃO casa,
-- p/ não fundir homônimos). Cria o cliente como LEAD e o ensaio 'solicitado'
-- — que pelo 17 não gera conta a receber nem promove o funil sozinho.
create or replace function public.solicitar_contato(
  p_nome     text,
  p_email    text,
  p_telefone text,
  p_servico  text default null,
  p_mensagem text default null
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
  v_nome       text := nullif(trim(coalesce(p_nome, '')), '');
  v_email      text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_tel        text := nullif(regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g'), '');
begin
  if v_nome is null then
    return jsonb_build_object('ok', false, 'erro', 'Informe o seu nome.');
  end if;
  if v_email is null and v_tel is null then
    return jsonb_build_object('ok', false, 'erro', 'Informe e-mail ou telefone.');
  end if;

  -- 1) casa cliente por e-mail OU telefone
  select id into v_cliente_id
    from public.clientes
   where (v_email is not null and lower(trim(email)) = v_email)
      or (v_tel   is not null and nullif(regexp_replace(coalesce(telefone, ''), '[^0-9]', '', 'g'), '') = v_tel)
   order by created_at asc
   limit 1;

  -- 2) não achou -> cria como LEAD (funil não avança sozinho)
  if v_cliente_id is null then
    insert into public.clientes (nome, email, telefone, funil_etapa, origem, interesse, primeiro_contato, notas)
    values (v_nome, p_email, p_telefone, 'lead', 'site', p_servico, current_date, nullif(trim(coalesce(p_mensagem, '')), ''))
    returning id into v_cliente_id;
    v_novo := true;
  end if;

  -- 3) ensaio 'solicitado' (só uma solicitação: sem conta, sem promover funil)
  insert into public.ensaios (cliente_id, titulo, tipo_ensaio, valor, status, origem, observacoes)
  values (v_cliente_id,
          coalesce(nullif(trim(coalesce(p_servico, '')), ''), 'Ensaio') || ' · solicitação pelo site',
          p_servico, 0, 'solicitado', 'site',
          nullif(trim(coalesce(p_mensagem, '')), ''))
  returning id into v_ensaio_id;

  -- 4) histórico (timeline do cliente no CRM)
  insert into public.cliente_atualizacoes (cliente_id, texto)
  values (v_cliente_id,
          'Pediu contato pelo site'
          || case when coalesce(p_servico, '') <> '' then ' · ' || p_servico else '' end
          || case when coalesce(p_mensagem, '') <> '' then ' — "' || left(p_mensagem, 300) || '"' else '' end);

  return jsonb_build_object('ok', true, 'cliente_id', v_cliente_id,
                            'ensaio_id', v_ensaio_id, 'novo_cliente', v_novo);
end;
$$;

grant execute on function public.entrar_galeria(text, text)                    to anon, authenticated;
grant execute on function public.finalizar_selecao(uuid, boolean)              to anon, authenticated;
grant execute on function public.solicitar_contato(text, text, text, text, text) to anon, authenticated;
