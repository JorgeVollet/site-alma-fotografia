-- ============================================================
--  TESTE DE PONTA A PONTA — pipeline do dinheiro
--
--  SEGURO: roda inteiro dentro de uma transação e dá ROLLBACK no fim.
--  NADA fica gravado. Pode rodar quantas vezes quiser.
--
--  O que ele prova (ou desmente):
--    • ensaio fechado gera a conta do saldo com o valor certo
--    • a seleção cobra as fotos extras SEM duplicar o saldo
--    • "pagar agora" não marca como pago sem cobrança real
--    • marcar recebido vira lançamento no caixa
--    • REENVIAR a seleção cobra só a diferença e NÃO ressuscita o
--      saldo já pago   ← esta era a regressão da migration 19
--    • desmarcar fotos remove a cobrança de extras
--    • excluir o ensaio não deixa recebível fantasma
--
--  COMO USAR: cole tudo no SQL Editor e clique em RUN.
--  Leia a aba "Messages" (ou "Notices") — cada linha é um teste.
--  No fim aparece o placar. Qualquer "FALHOU" é problema real.
-- ============================================================

begin;

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
  v_ok     int := 0;
  v_falhou int := 0;
begin
  raise notice '===============================================';
  raise notice ' TESTE DO PIPELINE DO DINHEIRO (nada e gravado)';
  raise notice '===============================================';

  -- CENARIO: ensaio de R$ 1.200, sinal de R$ 100 ja pago.
  -- Pacote com 10 fotos inclusas, foto extra a R$ 30.

  insert into public.clientes (nome, email, telefone, funil_etapa, origem)
  values ('__TESTE__ Maria', 'teste@exemplo.invalido', '55999990000', 'lead', 'teste')
  returning id into v_cli;

  insert into public.ensaios (cliente_id, titulo, valor, status, origem)
  values (v_cli, '__TESTE__ Ensaio Gestante', 1200, 'agendado', 'teste')
  returning id into v_ensaio;

  -- 1) ensaio fechado gera a conta do saldo
  select count(*), coalesce(sum(valor), 0) into v_n, v_val
    from public.contas_receber where ensaio_id = v_ensaio and status <> 'cancelado';
  if v_n = 1 and v_val = 1200 then
    raise notice 'OK      1. ensaio fechado gerou 1 conta de R$ %', v_val;
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  1. esperava 1 conta de 1200; veio % conta(s) somando %', v_n, v_val;
    v_falhou := v_falhou + 1;
  end if;

  -- 2) a conta nasce classificada (coluna da migration 20)
  select count(*) into v_n from public.contas_receber
   where ensaio_id = v_ensaio and origem = 'saldo';
  if v_n = 1 then
    raise notice 'OK      2. conta classificada como origem=saldo';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  2. conta sem origem=saldo (a migration 20 rodou?)';
    v_falhou := v_falhou + 1;
  end if;

  insert into public.galerias (ensaio_id, cliente_id, nome, codigo, senha,
                               fotos_inclusas, foto_extra, valor_total, reserva)
  values (v_ensaio, v_cli, '__TESTE__ Galeria', '__TESTE__', '1234', 10, 30, 1200, 100)
  returning id into v_gal;

  -- 12 fotos, todas escolhidas -> 2 extras -> R$ 60
  for v_i in 1..12 loop
    insert into public.fotos (galeria_id, ordem, tipo, selecionada, nome_arquivo,
                              preview_path, thumb_path)
    values (v_gal, v_i, 'selecao', true, 'foto' || v_i || '.jpg', 'x/p.jpg', 'x/t.jpg');
  end loop;

  -- 3) cliente entra com codigo + senha
  select public.entrar_galeria('__TESTE__', '1234') into v_r;
  if coalesce((v_r->>'ok')::boolean, false) then
    v_token := (v_r->>'token')::uuid;
    raise notice 'OK      3. cliente entrou na galeria com codigo+senha';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  3. entrar_galeria recusou: %', coalesce(v_r->>'erro', '(sem erro)');
    v_falhou := v_falhou + 1;
  end if;

  -- cliente finaliza pedindo para PAGAR AGORA (a galeria nao libera pagamento online)
  select public.finalizar_selecao(v_token, true) into v_r;

  -- 4) duas cobrancas: saldo 1100 + extras 60
  select count(*), coalesce(sum(valor), 0) into v_n, v_val
    from public.contas_receber where ensaio_id = v_ensaio and status = 'pendente';
  if v_n = 2 and v_val = 1160 then
    raise notice 'OK      4. selecao gerou saldo 1100 + extras 60 (total %)', v_val;
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  4. esperava 2 contas somando 1160; veio % somando %', v_n, v_val;
    v_falhou := v_falhou + 1;
  end if;

  -- 5) "pagar agora" NAO pode quitar sem cobranca real (Stone nao integrada)
  select count(*) into v_n from public.contas_receber
   where ensaio_id = v_ensaio and status = 'pago';
  if v_n = 0 then
    raise notice 'OK      5. "pagar agora" nao quitou nada sem cobranca real';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  5. % conta(s) marcada(s) como paga sem cobranca!', v_n;
    v_falhou := v_falhou + 1;
  end if;

  -- estudio recebe o SALDO (maquininha/PIX) e marca no painel
  update public.contas_receber
     set status = 'pago', pago_em = now()
   where ensaio_id = v_ensaio and origem = 'saldo' and status = 'pendente';

  -- 6) recebimento vira lancamento de entrada
  select count(*), coalesce(sum(l.valor), 0) into v_n, v_val
    from public.lancamentos l
    join public.contas_receber c on c.id = l.conta_receber_id
   where c.ensaio_id = v_ensaio and l.tipo = 'entrada';
  if v_n = 1 and v_val = 1100 then
    raise notice 'OK      6. recebimento virou lancamento de R$ % no caixa', v_val;
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  6. esperava 1 lancamento de 1100; veio % somando %', v_n, v_val;
    v_falhou := v_falhou + 1;
  end if;

  -- ══ A REGRESSAO: cliente escolhe MAIS UMA foto e reenvia ══
  insert into public.fotos (galeria_id, ordem, tipo, selecionada, nome_arquivo,
                            preview_path, thumb_path)
  values (v_gal, 13, 'selecao', true, 'foto13.jpg', 'x/p.jpg', 'x/t.jpg');

  perform public.reenviar_selecao(v_token);

  -- 7) o saldo JA PAGO nao pode ressuscitar
  select count(*) into v_n from public.contas_receber
   where ensaio_id = v_ensaio and origem = 'saldo' and status = 'pendente';
  if v_n = 0 then
    raise notice 'OK      7. reenvio NAO ressuscitou o saldo ja pago';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  7. REGRESSAO VIVA: % saldo(s) fantasma apos o reenvio', v_n;
    v_falhou := v_falhou + 1;
  end if;

  -- 8) extras recalculados para 3 fotos = R$ 90, numa conta so
  select count(*), coalesce(sum(valor), 0) into v_n, v_val
    from public.contas_receber
   where galeria_id = v_gal and origem = 'extras' and status = 'pendente';
  if v_n = 1 and v_val = 90 then
    raise notice 'OK      8. extras recalculados para R$ 90 (3 fotos), 1 conta so';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  8. esperava 1 conta de extras de 90; veio % somando %', v_n, v_val;
    v_falhou := v_falhou + 1;
  end if;

  -- 9) total do ensaio: 1100 pago + 90 a receber
  select coalesce(sum(valor), 0) into v_val from public.contas_receber
   where ensaio_id = v_ensaio and status <> 'cancelado';
  if v_val = 1190 then
    raise notice 'OK      9. total do ensaio = R$ 1190 (1100 pago + 90 a receber)';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU  9. total do ensaio deu % (esperado 1190)', v_val;
    v_falhou := v_falhou + 1;
  end if;

  -- 10) rodar de novo SEM mudar nada nao pode alterar valor (idempotencia)
  perform public.reenviar_selecao(v_token);
  select coalesce(sum(valor), 0) into v_val from public.contas_receber
   where ensaio_id = v_ensaio and status <> 'cancelado';
  if v_val = 1190 then
    raise notice 'OK     10. reenviar de novo nao mudou nada (idempotente)';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU 10. segundo reenvio mudou o total para % (esperado 1190)', v_val;
    v_falhou := v_falhou + 1;
  end if;

  -- ══ cliente DESMARCA as extras (volta para 10 fotos) ══
  update public.fotos set selecionada = false where galeria_id = v_gal and ordem > 10;
  perform public.reenviar_selecao(v_token);

  -- 11) a cobranca de extras some
  select count(*) into v_n from public.contas_receber
   where galeria_id = v_gal and origem = 'extras' and status = 'pendente';
  if v_n = 0 then
    raise notice 'OK     11. desmarcar fotos removeu a cobranca de extras';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU 11. sobrou % cobranca(s) de extras apos desmarcar', v_n;
    v_falhou := v_falhou + 1;
  end if;

  -- 12) o saldo pago continua intacto
  select coalesce(sum(valor), 0) into v_val from public.contas_receber
   where ensaio_id = v_ensaio and status = 'pago';
  if v_val = 1100 then
    raise notice 'OK     12. o saldo pago (1100) continua intacto';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU 12. saldo pago virou % (esperado 1100)', v_val;
    v_falhou := v_falhou + 1;
  end if;

  -- ══ excluir o ensaio nao pode deixar recebivel fantasma ══
  -- cria uma pendencia de proposito para o teste valer alguma coisa
  update public.fotos set selecionada = true where galeria_id = v_gal and ordem = 11;
  perform public.reenviar_selecao(v_token);

  select count(*) into v_n from public.contas_receber
   where ensaio_id = v_ensaio and status = 'pendente';
  if v_n = 0 then
    raise notice 'AVISO  13. nao havia pendencia para testar a exclusao';
  end if;

  delete from public.ensaios where id = v_ensaio;

  -- 13) as pendencias viraram canceladas (a FK e "set null": sem o gatilho
  --     a conta ficaria viva, sem vinculo e sem como ser apagada pelo painel)
  select count(*) into v_n from public.contas_receber
   where cliente_id = v_cli and status = 'pendente';
  if v_n = 0 then
    raise notice 'OK     13. excluir o ensaio nao deixou recebivel fantasma';
    v_ok := v_ok + 1;
  else
    raise notice 'FALHOU 13. sobrou % conta pendente orfa apos excluir o ensaio', v_n;
    v_falhou := v_falhou + 1;
  end if;

  raise notice '===============================================';
  raise notice ' PLACAR:  % OK   |   % FALHOU', v_ok, v_falhou;
  if v_falhou = 0 then
    raise notice ' Pipeline do dinheiro esta correto.';
  else
    raise notice ' ATENCAO: ha % problema(s) reais acima.', v_falhou;
  end if;
  raise notice '===============================================';
end $$;

-- desfaz TUDO: o banco fica exatamente como estava
rollback;
