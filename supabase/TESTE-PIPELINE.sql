-- ============================================================
--  TESTE DE PONTA A PONTA — pipeline do dinheiro
--
--  SEGURO: cria os dados de teste, confere tudo e APAGA no final, dentro de
--  uma única transação. Se qualquer coisa falhar no meio, a transação aborta
--  e nada persiste. Pode rodar quantas vezes quiser.
--
--  O resultado sai como TABELA na tela (o SQL Editor do Supabase não mostra
--  mensagens de RAISE NOTICE — por isso os resultados vão para uma tabela).
--
--  COMO USAR: cole tudo no SQL Editor e clique em RUN.
--  Vai aparecer uma tabela com uma linha por teste e o placar no fim.
-- ============================================================

begin;

create temp table _res (n int, ok boolean, descricao text) on commit drop;

do $$
declare
  v_cli    uuid;
  v_ensaio uuid;
  v_gal    uuid;
  v_token  uuid;
  v_r      jsonb;
  v_n      int;
  v_i      int;
  v_val    numeric(10,2);
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
  insert into _res values (1, (v_n = 1 and v_val = 1200),
    'Ensaio fechado gera 1 conta de R$ 1200 — veio ' || v_n || ' conta(s) somando ' || v_val);

  -- 2) a conta nasce classificada (coluna da migration 20)
  select count(*) into v_n from public.contas_receber
   where ensaio_id = v_ensaio and origem = 'saldo';
  insert into _res values (2, (v_n = 1),
    'Conta classificada como origem=saldo (migration 20) — encontrou ' || v_n);

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
  insert into _res values (3, coalesce((v_r->>'ok')::boolean, false),
    'Cliente entra na galeria com codigo+senha — ' || coalesce(v_r->>'erro', 'entrou'));

  -- 3b) senha errada tem que ser recusada
  select public.entrar_galeria('__TESTE__', 'errada') into v_r;
  insert into _res values (4, (coalesce((v_r->>'ok')::boolean, false) = false),
    'Senha errada e recusada');

  -- cliente finaliza pedindo PAGAR AGORA (a galeria nao libera pagamento online)
  select public.finalizar_selecao(v_token, true) into v_r;

  -- 5) duas cobrancas: saldo 1100 + extras 60
  select count(*), coalesce(sum(valor), 0) into v_n, v_val
    from public.contas_receber where ensaio_id = v_ensaio and status = 'pendente';
  insert into _res values (5, (v_n = 2 and v_val = 1160),
    'Selecao gera saldo 1100 + extras 60 = 1160 — veio ' || v_n || ' conta(s) somando ' || v_val);

  -- 6) "pagar agora" NAO pode quitar sem cobranca real (Stone nao integrada)
  select count(*) into v_n from public.contas_receber
   where ensaio_id = v_ensaio and status = 'pago';
  insert into _res values (6, (v_n = 0),
    'Pagar agora NAO quita sem cobranca real — contas pagas: ' || v_n);

  -- estudio recebe o SALDO (maquininha/PIX) e marca no painel
  update public.contas_receber
     set status = 'pago', pago_em = now()
   where ensaio_id = v_ensaio and origem = 'saldo' and status = 'pendente';

  -- 7) recebimento vira lancamento de entrada
  select count(*), coalesce(sum(l.valor), 0) into v_n, v_val
    from public.lancamentos l
    join public.contas_receber c on c.id = l.conta_receber_id
   where c.ensaio_id = v_ensaio and l.tipo = 'entrada';
  insert into _res values (7, (v_n = 1 and v_val = 1100),
    'Recebimento vira lancamento de 1100 no caixa — veio ' || v_n || ' somando ' || v_val);

  -- ══ A REGRESSAO: cliente escolhe MAIS UMA foto e reenvia ══
  insert into public.fotos (galeria_id, ordem, tipo, selecionada, nome_arquivo,
                            preview_path, thumb_path)
  values (v_gal, 13, 'selecao', true, 'foto13.jpg', 'x/p.jpg', 'x/t.jpg');

  perform public.reenviar_selecao(v_token);

  -- 8) o saldo JA PAGO nao pode ressuscitar  ← era a regressao da migration 19
  select count(*) into v_n from public.contas_receber
   where ensaio_id = v_ensaio and origem = 'saldo' and status = 'pendente';
  insert into _res values (8, (v_n = 0),
    '*** Reenvio NAO ressuscita o saldo ja pago — saldos fantasma: ' || v_n);

  -- 9) extras recalculados para 3 fotos = R$ 90, numa conta so
  select count(*), coalesce(sum(valor), 0) into v_n, v_val
    from public.contas_receber
   where galeria_id = v_gal and origem = 'extras' and status = 'pendente';
  insert into _res values (9, (v_n = 1 and v_val = 90),
    'Extras recalculados para 90 (3 fotos) em 1 conta — veio ' || v_n || ' somando ' || v_val);

  -- 10) total do ensaio: 1100 pago + 90 a receber
  select coalesce(sum(valor), 0) into v_val from public.contas_receber
   where ensaio_id = v_ensaio and status <> 'cancelado';
  insert into _res values (10, (v_val = 1190),
    'Total do ensaio = 1190 (1100 pago + 90 a receber) — deu ' || v_val);

  -- 11) rodar de novo SEM mudar nada nao pode alterar valor (idempotencia)
  perform public.reenviar_selecao(v_token);
  select coalesce(sum(valor), 0) into v_val from public.contas_receber
   where ensaio_id = v_ensaio and status <> 'cancelado';
  insert into _res values (11, (v_val = 1190),
    'Reenviar de novo nao muda nada (idempotente) — deu ' || v_val);

  -- ══ cliente DESMARCA as extras (volta para 10 fotos) ══
  update public.fotos set selecionada = false where galeria_id = v_gal and ordem > 10;
  perform public.reenviar_selecao(v_token);

  -- 12) a cobranca de extras some
  select count(*) into v_n from public.contas_receber
   where galeria_id = v_gal and origem = 'extras' and status = 'pendente';
  insert into _res values (12, (v_n = 0),
    'Desmarcar fotos remove a cobranca de extras — sobrou ' || v_n);

  -- 13) o saldo pago continua intacto
  select coalesce(sum(valor), 0) into v_val from public.contas_receber
   where ensaio_id = v_ensaio and status = 'pago';
  insert into _res values (13, (v_val = 1100),
    'O saldo pago (1100) continua intacto — deu ' || v_val);

  -- ══ excluir o ensaio nao pode deixar recebivel fantasma ══
  update public.fotos set selecionada = true where galeria_id = v_gal and ordem = 11;
  perform public.reenviar_selecao(v_token);
  select count(*) into v_i from public.contas_receber
   where ensaio_id = v_ensaio and status = 'pendente';   -- deve ser 1 (extras)

  delete from public.ensaios where id = v_ensaio;

  select count(*) into v_n from public.contas_receber
   where cliente_id = v_cli and status = 'pendente';
  insert into _res values (14, (v_n = 0 and v_i > 0),
    'Excluir o ensaio nao deixa recebivel fantasma — havia ' || v_i || ' pendente(s), sobrou ' || v_n);

  -- ══ LIMPEZA: apaga tudo que este teste criou ══
  delete from public.lancamentos
   where conta_receber_id in (select id from public.contas_receber where cliente_id = v_cli);
  delete from public.contas_receber where cliente_id = v_cli;
  delete from public.fotos where galeria_id = v_gal;
  delete from public.galerias where id = v_gal;
  delete from public.cliente_atualizacoes where cliente_id = v_cli;
  delete from public.ensaios where cliente_id = v_cli;
  delete from public.clientes where id = v_cli;
end $$;

-- ── RESULTADO NA TELA ────────────────────────────────────────
select
  n as "#",
  case when ok then 'OK' else 'FALHOU' end as resultado,
  descricao
from _res
union all
select
  99,
  case when (select count(*) from _res where not ok) = 0 then 'TUDO OK' else 'TEM FALHA' end,
  'PLACAR: ' || (select count(*) from _res where ok) || ' OK / '
             || (select count(*) from _res where not ok) || ' FALHOU'
order by 1;

commit;

-- Se algo tiver ficado para tras (so acontece se voce interromper no meio),
-- rode esta limpeza de seguranca:
--   delete from public.lancamentos where conta_receber_id in
--     (select id from public.contas_receber c join public.clientes cl on cl.id = c.cliente_id
--       where cl.origem = '__TESTE__');
--   delete from public.contas_receber where cliente_id in
--     (select id from public.clientes where origem = '__TESTE__');
--   delete from public.fotos where galeria_id in
--     (select id from public.galerias where codigo = '__TESTE__');
--   delete from public.galerias where codigo = '__TESTE__';
--   delete from public.ensaios where origem = '__TESTE__';
--   delete from public.clientes where origem = '__TESTE__';
