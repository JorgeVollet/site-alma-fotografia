-- ============================================================
--  VERIFICAÇÃO — o que já foi rodado no Supabase?
--  Seguro: NÃO cria, NÃO altera, NÃO apaga nada. Só LÊ e reporta.
--  Como usar: cole tudo no SQL Editor do Supabase e clique em RUN.
--  Leia a coluna "status": ✅ = já rodou | ❌ = ainda falta rodar.
-- ============================================================

-- 1) STATUS DE CADA MIGRATION (por uma "assinatura" de objeto que ela cria)
SELECT ordem, migration, objeto_chave,
       CASE WHEN ok THEN '✅ JÁ RODOU' ELSE '❌ FALTA' END AS status
FROM (
  SELECT 1 AS ordem, '01_core' AS migration, 'profiles + is_admin()' AS objeto_chave,
    (to_regclass('public.profiles') IS NOT NULL
     AND EXISTS(SELECT 1 FROM pg_proc WHERE proname='is_admin')) AS ok
  UNION ALL SELECT 2, '02_catalogo', 'pacotes + produtos',
    (to_regclass('public.pacotes') IS NOT NULL AND to_regclass('public.produtos') IS NOT NULL)
  UNION ALL SELECT 3, '03_clientes', 'clientes.data_nascimento',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='data_nascimento')
  UNION ALL SELECT 4, '04_ensaios', 'ensaios + agendamentos + ensaios.foto_extra',
    (to_regclass('public.ensaios') IS NOT NULL AND to_regclass('public.agendamentos') IS NOT NULL
     AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='ensaios' AND column_name='foto_extra'))
  UNION ALL SELECT 5, '05_costura_agendamento', 'ensaios.origem + agendamentos.cliente_id',
    (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='ensaios' AND column_name='origem')
     AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='agendamentos' AND column_name='cliente_id'))
  UNION ALL SELECT 6, '06_galerias', 'galerias + fotos + bucket "galerias"',
    (to_regclass('public.galerias') IS NOT NULL AND to_regclass('public.fotos') IS NOT NULL
     AND EXISTS(SELECT 1 FROM storage.buckets WHERE id='galerias'))
  UNION ALL SELECT 7, '07_cliente_galeria', 'RPC entrar_galeria + bucket "previews"',
    (EXISTS(SELECT 1 FROM pg_proc WHERE proname='entrar_galeria')
     AND EXISTS(SELECT 1 FROM storage.buckets WHERE id='previews'))
  UNION ALL SELECT 8, '08_pagamento_selecao', 'contas_receber + RPC finalizar_selecao',
    (to_regclass('public.contas_receber') IS NOT NULL
     AND EXISTS(SELECT 1 FROM pg_proc WHERE proname='finalizar_selecao'))
  UNION ALL SELECT 9, '09_financeiro', 'lancamentos + contas_pagar + handle_new_ensaio()',
    (to_regclass('public.lancamentos') IS NOT NULL AND to_regclass('public.contas_pagar') IS NOT NULL
     AND EXISTS(SELECT 1 FROM pg_proc WHERE proname='handle_new_ensaio'))
  UNION ALL SELECT 10, '10_producao', 'etapas_producao + agendamentos.duracao_min',
    (to_regclass('public.etapas_producao') IS NOT NULL
     AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='agendamentos' AND column_name='duracao_min'))
  UNION ALL SELECT 11, '11_contratos', 'contratos + bucket "contratos" + RPC assinar_contrato',
    (to_regclass('public.contratos') IS NOT NULL
     AND EXISTS(SELECT 1 FROM storage.buckets WHERE id='contratos')
     AND EXISTS(SELECT 1 FROM pg_proc WHERE proname='assinar_contrato'))
  UNION ALL SELECT 12, '12_notas', 'notas_fiscais',
    (to_regclass('public.notas_fiscais') IS NOT NULL)
  UNION ALL SELECT 13, '13_selecao_plus', 'fotos.nome_arquivo + galerias.mensagem_fotografo',
    (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='fotos' AND column_name='nome_arquivo')
     AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='galerias' AND column_name='mensagem_fotografo'))
  UNION ALL SELECT 14, '14_notas_faturaveis', 'notas_fiscais.lancamento_id',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='notas_fiscais' AND column_name='lancamento_id')
  UNION ALL SELECT 15, '15_galerias_v2', 'fotos.tipo + bucket "entregas" + RPC reenviar_selecao',
    (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='fotos' AND column_name='tipo')
     AND EXISTS(SELECT 1 FROM storage.buckets WHERE id='entregas')
     AND EXISTS(SELECT 1 FROM pg_proc WHERE proname='reenviar_selecao'))
  UNION ALL SELECT 16, '16_crm_lead', 'clientes.orcamento + cliente_atualizacoes',
    (EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='orcamento')
     AND to_regclass('public.cliente_atualizacoes') IS NOT NULL)
  UNION ALL SELECT 17, '17_situacao_sinal', 'config_estudio + on_ensaio_status_change()',
    (to_regclass('public.config_estudio') IS NOT NULL
     AND EXISTS(SELECT 1 FROM pg_proc WHERE proname='on_ensaio_status_change'))
) t
ORDER BY ordem;

-- 2) BUCKETS DE STORAGE existentes (esperado: galerias, previews, contratos, entregas)
SELECT '📦 bucket: ' || id AS storage_buckets, CASE WHEN public THEN 'público' ELSE 'privado' END AS tipo
FROM storage.buckets ORDER BY id;

-- 3) CONTAGEM DE DADOS (pra saber se está vazio ou se já tem coisa criada)
SELECT 'clientes'        AS tabela, count(*) FROM clientes
UNION ALL SELECT 'ensaios',        count(*) FROM ensaios
UNION ALL SELECT 'agendamentos',   count(*) FROM agendamentos
UNION ALL SELECT 'galerias',       count(*) FROM galerias
UNION ALL SELECT 'fotos',          count(*) FROM fotos
UNION ALL SELECT 'contratos',      count(*) FROM contratos
UNION ALL SELECT 'contas_receber', count(*) FROM contas_receber
UNION ALL SELECT 'lancamentos',    count(*) FROM lancamentos
ORDER BY tabela;
