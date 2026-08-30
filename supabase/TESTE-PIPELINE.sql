-- ============================================================
--  TESTE DE PONTA A PONTA — pipeline do dinheiro
--
--  NÃO cria tabela nenhuma (nem temporária): os resultados são guardados numa
--  variável de sessão e devolvidos como TABELA pelo SELECT final. Assim o
--  Supabase não reclama de RLS e não há objeto para dar conflito.
--
--  Os dados de teste são criados, conferidos e APAGADOS no próprio script —
--  a limpeza roda inclusive se algum teste falhar no meio (bloco de exceção).
--  Tudo é marcado com '__TESTE__', então a limpeza não alcança dado seu.
--
--  COMO USAR: cole tudo no SQL Editor e clique em RUN.
--  (Se aparecer o aviso de "destructive operations", pode seguir: os DELETE
--   só atingem linhas marcadas como '__TESTE__'.)
-- ============================================================

do $$
declare
  v_cli    uuid;
  v_ensaio uuid;
  v_gal    uuid;
  v_token  uuid;
  v_r      jsonb;
  v_n      int;
  v_i      int;
  v_pend   int := 0;
  v_val    numeric(10,2);
  v_res    jsonb := '[]'::jsonb;
  v_erro   text;
begin
  begin
    -- CENARIO: ensaio de R$ 1.200, sinal de R$ 100 ja pago.
    -- Pacote com 10 fotos inclusas, foto extra a R$ 30.

    insert into public.clientes (nome, email, telefone, funil_etapa, origem)
    values ('__TESTE__ Maria', 'teste@exemplo.invalido', '55999990000', 'lead', '__TESTE__')
    returning id into v_cli;

    insert into public.ensaios (cliente_id, titulo, valor, status, origem)
    values (v_cli, '__TESTE__ Ensaio Gestante', 1200, 'agendado', '__TESTE__')
    returning id into v_ensaio;

    -- 1) ensaio fechado gera a conta do saldo
    select count(*), coalesce(sum(valor), 0) into v_n, v_val
      from public.contas_receber where ensaio_id = v_ensaio and status <> 'cancelado';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 1, 'ok', (v_n = 1 and v_val = 1200),
      'descricao', 'Ensaio fechado gera 1 conta de R$ 1200 — veio ' || v_n || ' conta(s) somando ' || v_val));

    -- 2) a conta nasce classificada (coluna da migration 20)
    select count(*) into v_n from public.contas_receber
     where ensaio_id = v_ensaio and origem = 'saldo';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 2, 'ok', (v_n = 1),
      'descricao', 'Conta classificada como origem=saldo (migration 20) — encontrou ' || v_n));

    insert into public.galerias (ensaio_id, cliente_id, nome, codigo, senha,
                                 fotos_inclusas, foto_extra, valor_total, reserva)
    values (v_ensaio, v_cli, '__TESTE__ Galeria', '__TESTE__', '1234', 10, 30, 1200, 100)
    returning id into v_gal;

    for v_i in 1..12 loop
      insert into public.fotos (galeria_id, ordem, tipo, selecionada, nome_arquivo,
                                preview_path, thumb_path)
      values (v_gal, v_i, 'selecao', true, 'foto' || v_i || '.jpg', 'x/p.jpg', 'x/t.jpg');
    end loop;

    -- 3) cliente entra com codigo + senha
    select public.entrar_galeria('__TESTE__', '1234') into v_r;
    v_token := nullif(v_r->>'token', '')::uuid;
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 3,
      'ok', coalesce((v_r->>'ok')::boolean, false),
      'descricao', 'Cliente entra na galeria com codigo+senha — ' || coalesce(v_r->>'erro', 'entrou')));

    -- 4) senha errada e recusada
    select public.entrar_galeria('__TESTE__', 'errada') into v_r;
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 4,
      'ok', (coalesce((v_r->>'ok')::boolean, false) = false),
      'descricao', 'Senha errada e recusada'));

    -- cliente finaliza pedindo PAGAR AGORA (a galeria nao libera pagamento online)
    select public.finalizar_selecao(v_token, true) into v_r;

    -- 5) duas cobrancas: saldo 1100 + extras 60
    select count(*), coalesce(sum(valor), 0) into v_n, v_val
      from public.contas_receber where ensaio_id = v_ensaio and status = 'pendente';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 5, 'ok', (v_n = 2 and v_val = 1160),
      'descricao', 'Selecao gera saldo 1100 + extras 60 = 1160 — veio ' || v_n || ' conta(s) somando ' || v_val));

    -- 6) "pagar agora" NAO pode quitar sem cobranca real (Stone nao integrada)
    select count(*) into v_n from public.contas_receber
     where ensaio_id = v_ensaio and status = 'pago';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 6, 'ok', (v_n = 0),
      'descricao', 'Pagar agora NAO quita sem cobranca real — contas pagas: ' || v_n));

    -- estudio recebe o SALDO (maquininha/PIX) e marca no painel
    update public.contas_receber
       set status = 'pago', pago_em = now()
     where ensaio_id = v_ensaio and origem = 'saldo' and status = 'pendente';

    -- 7) recebimento vira lancamento de entrada
    select count(*), coalesce(sum(l.valor), 0) into v_n, v_val
      from public.lancamentos l
      join public.contas_receber c on c.id = l.conta_receber_id
     where c.ensaio_id = v_ensaio and l.tipo = 'entrada';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 7, 'ok', (v_n = 1 and v_val = 1100),
      'descricao', 'Recebimento vira lancamento de 1100 no caixa — veio ' || v_n || ' somando ' || v_val));

    -- ══ A REGRESSAO: cliente escolhe MAIS UMA foto e reenvia ══
    insert into public.fotos (galeria_id, ordem, tipo, selecionada, nome_arquivo,
                              preview_path, thumb_path)
    values (v_gal, 13, 'selecao', true, 'foto13.jpg', 'x/p.jpg', 'x/t.jpg');

    perform public.reenviar_selecao(v_token);

    -- 8) o saldo JA PAGO nao pode ressuscitar  <-- era a regressao da migration 19
    select count(*) into v_n from public.contas_receber
     where ensaio_id = v_ensaio and origem = 'saldo' and status = 'pendente';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 8, 'ok', (v_n = 0),
      'descricao', '*** Reenvio NAO ressuscita o saldo ja pago — saldos fantasma: ' || v_n));

    -- 9) extras recalculados para 3 fotos = R$ 90, numa conta so
    select count(*), coalesce(sum(valor), 0) into v_n, v_val
      from public.contas_receber
     where galeria_id = v_gal and origem = 'extras' and status = 'pendente';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 9, 'ok', (v_n = 1 and v_val = 90),
      'descricao', 'Extras recalculados para 90 (3 fotos) em 1 conta — veio ' || v_n || ' somando ' || v_val));

    -- 10) total do ensaio: 1100 pago + 90 a receber
    select coalesce(sum(valor), 0) into v_val from public.contas_receber
     where ensaio_id = v_ensaio and status <> 'cancelado';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 10, 'ok', (v_val = 1190),
      'descricao', 'Total do ensaio = 1190 (1100 pago + 90 a receber) — deu ' || v_val));

    -- 11) rodar de novo SEM mudar nada nao pode alterar valor (idempotencia)
    perform public.reenviar_selecao(v_token);
    select coalesce(sum(valor), 0) into v_val from public.contas_receber
     where ensaio_id = v_ensaio and status <> 'cancelado';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 11, 'ok', (v_val = 1190),
      'descricao', 'Reenviar de novo nao muda nada (idempotente) — deu ' || v_val));

    -- ══ cliente DESMARCA as extras (volta para 10 fotos) ══
    update public.fotos set selecionada = false where galeria_id = v_gal and ordem > 10;
    perform public.reenviar_selecao(v_token);

    -- 12) a cobranca de extras some
    select count(*) into v_n from public.contas_receber
     where galeria_id = v_gal and origem = 'extras' and status = 'pendente';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 12, 'ok', (v_n = 0),
      'descricao', 'Desmarcar fotos remove a cobranca de extras — sobrou ' || v_n));

    -- 13) o saldo pago continua intacto
    select coalesce(sum(valor), 0) into v_val from public.contas_receber
     where ensaio_id = v_ensaio and status = 'pago';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 13, 'ok', (v_val = 1100),
      'descricao', 'O saldo pago (1100) continua intacto — deu ' || v_val));

    -- ══ excluir o ensaio nao pode deixar recebivel fantasma ══
    update public.fotos set selecionada = true where galeria_id = v_gal and ordem = 11;
    perform public.reenviar_selecao(v_token);
    select count(*) into v_pend from public.contas_receber
     where ensaio_id = v_ensaio and status = 'pendente';

    delete from public.ensaios where id = v_ensaio;

    select count(*) into v_n from public.contas_receber
     where cliente_id = v_cli and status = 'pendente';
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 14, 'ok', (v_n = 0 and v_pend > 0),
      'descricao', 'Excluir o ensaio nao deixa recebivel fantasma — havia ' || v_pend || ' pendente(s), sobrou ' || v_n));

  exception when others then
    v_erro := SQLERRM;
  end;

  -- ══ LIMPEZA (roda mesmo se algum teste falhou) ══
  -- Só alcança linhas marcadas com '__TESTE__'.
  delete from public.lancamentos
   where conta_receber_id in (
     select c.id from public.contas_receber c
      join public.clientes cl on cl.id = c.cliente_id
     where cl.origem = '__TESTE__');
  delete from public.contas_receber
   where cliente_id in (select id from public.clientes where origem = '__TESTE__');
  delete from public.fotos
   where galeria_id in (select id from public.galerias where codigo = '__TESTE__');
  delete from public.galerias where codigo = '__TESTE__';
  delete from public.cliente_atualizacoes
   where cliente_id in (select id from public.clientes where origem = '__TESTE__');
  delete from public.ensaios where origem = '__TESTE__';
  delete from public.clientes where origem = '__TESTE__';

  if v_erro is not null then
    v_res := v_res || jsonb_build_array(jsonb_build_object('n', 0, 'ok', false,
      'descricao', 'ERRO NO TESTE: ' || v_erro));
  end if;

  perform set_config('alma.teste_resultado', v_res::text, false);
end $$;

-- ── RESULTADO NA TELA ────────────────────────────────────────
with r as (
  select t.n, t.ok, t.descricao
    from jsonb_to_recordset(
           coalesce(nullif(current_setting('alma.teste_resultado', true), ''), '[]')::jsonb
         ) as t(n int, ok boolean, descricao text)
)
select n as "#",
       case when ok then 'OK' else 'FALHOU' end as resultado,
       descricao
  from r
union all
select 99,
       case when (select count(*) from r where not ok) = 0 then 'TUDO OK' else 'TEM FALHA' end,
       'PLACAR: ' || (select count(*) from r where ok) || ' OK / '
                  || (select count(*) from r where not ok) || ' FALHOU'
order by 1;
