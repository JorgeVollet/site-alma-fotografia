-- ============================================================
--  AUDITORIA DOS DADOS REAIS
--  Seguro: NÃO altera nada. Só LÊ e mostra o que está inconsistente.
--  Cole tudo no SQL Editor do Supabase e clique em RUN.
--
--  Por que isto existe: a migration 19 impede que o estrago volte a
--  acontecer, mas NÃO conserta o que já foi gravado errado enquanto os
--  bugs estavam ativos. Estas consultas mostram o que sobrou para limpar.
--
--  COMO LER: cada bloco devolve linhas SÓ quando há problema.
--  Resultado vazio = está tudo certo naquele ponto.
-- ============================================================

-- ── A) Ensaio com MAIS DE UMA conta a receber ativa ──────────
-- Não-vazio = recebível duplicado: o cliente aparece devendo duas vezes
-- e o card "A receber" está inflado.
select 'A) ensaio com contas duplicadas' as checagem,
       e.id as ensaio_id, e.titulo, c.nome as cliente,
       count(cr.id) as qtd_contas,
       sum(cr.valor) as soma,
       string_agg(cr.descricao || ' [' || cr.status || ' R$' || cr.valor || ']', ' | ') as detalhe
  from public.ensaios e
  join public.contas_receber cr on cr.ensaio_id = e.id and cr.status <> 'cancelado'
  left join public.clientes c on c.id = e.cliente_id
 group by e.id, e.titulo, c.nome
having count(cr.id) > 1;

-- ── B) Conta PAGA sem lançamento no caixa ────────────────────
-- Não-vazio = dinheiro recebido que NÃO aparece no Financeiro/DRE.
-- Provável vítima do bug antigo: finalizar_selecao rebaixava a conta e o
-- trigger apagava o lançamento.
select 'B) conta paga sem lancamento' as checagem,
       cr.id as conta_id, cr.descricao, cr.valor, cr.pago_em
  from public.contas_receber cr
 where cr.status = 'pago'
   and not exists (select 1 from public.lancamentos l where l.conta_receber_id = cr.id);

-- ── C) Lançamento de entrada sem origem ──────────────────────
-- Não-vazio = entrada solta (não veio de conta nem de reserva). Pode ser
-- lançamento manual legítimo — confira se reconhece cada um.
select 'C) lancamento sem origem' as checagem,
       l.id, l.data, l.descricao, l.valor, l.tipo
  from public.lancamentos l
 where l.conta_receber_id is null
   and l.conta_pagar_id is null
   and l.agendamento_id is null;

-- ── D) Conta a receber ÓRFÃ (ensaio apagado) ─────────────────
-- Não-vazio = recebível fantasma inflando "A receber" para sempre.
select 'D) conta orfa (ensaio sumiu)' as checagem,
       cr.id, cr.descricao, cr.valor, cr.status, cr.vencimento
  from public.contas_receber cr
 where cr.ensaio_id is not null
   and not exists (select 1 from public.ensaios e where e.id = cr.ensaio_id)
   and cr.status <> 'cancelado';

-- ── E) Galeria sem ensaio ou sem cliente ─────────────────────
-- Não-vazio = galeria solta: a cobrança da seleção não acha onde lançar.
select 'E) galeria sem vinculo' as checagem,
       g.id, g.nome, g.codigo,
       (g.ensaio_id is null)  as sem_ensaio,
       (g.cliente_id is null) as sem_cliente
  from public.galerias g
 where g.ensaio_id is null or g.cliente_id is null;

-- ── F) Galeria SEM SENHA ─────────────────────────────────────
-- Depois da migration 19 estas galerias NÃO abrem mais (antes abriam com
-- senha vazia). Defina uma senha para o cliente conseguir entrar.
select 'F) galeria sem senha (cliente nao entra)' as checagem,
       g.id, g.nome, g.codigo, g.status
  from public.galerias g
 where coalesce(trim(g.senha), '') = '';

-- ── G) Fotos órfãs (galeria apagada) ─────────────────────────
select 'G) foto orfa' as checagem, count(*) as qtd
  from public.fotos f
 where not exists (select 1 from public.galerias g where g.id = f.galeria_id)
having count(*) > 0;

-- ── H) Clientes duplicados por e-mail ou telefone ────────────
-- Não-vazio = o mesmo cliente cadastrado duas vezes (o histórico e os
-- aniversários ficam divididos entre as duas fichas).
select 'H) cliente duplicado' as checagem,
       coalesce(nullif(lower(trim(email)), ''),
                nullif(regexp_replace(coalesce(telefone,''), '[^0-9]', '', 'g'), '')) as chave,
       count(*) as qtd,
       string_agg(nome, ' | ') as nomes
  from public.clientes
 where coalesce(nullif(lower(trim(email)), ''),
                nullif(regexp_replace(coalesce(telefone,''), '[^0-9]', '', 'g'), '')) is not null
 group by 1, 2
having count(*) > 1;

-- ── I) Solicitações do site paradas há mais de 15 dias ───────
-- Não é erro: é oportunidade de venda esfriando.
select 'I) pedido de contato parado' as checagem,
       c.nome, c.telefone, e.titulo, e.created_at::date as pediu_em,
       (current_date - e.created_at::date) as dias_parado
  from public.ensaios e
  join public.clientes c on c.id = e.cliente_id
 where e.status = 'solicitado' and e.origem = 'site'
   and e.created_at < now() - interval '15 days'
 order by e.created_at;

-- ── J) Ensaio FECHADO sem cobrança nenhuma ───────────────────
-- Não-vazio = ensaio confirmado que ninguém vai cobrar.
select 'J) ensaio fechado sem conta' as checagem,
       e.id, e.titulo, c.nome as cliente, e.valor, e.status
  from public.ensaios e
  left join public.clientes c on c.id = e.cliente_id
 where e.status not in ('solicitado', 'orcamento')
   and not exists (select 1 from public.contas_receber cr
                    where cr.ensaio_id = e.id and cr.status <> 'cancelado');

-- ── K) RESUMO do caixa (confira contra o painel) ─────────────
select 'K) resumo' as checagem,
       (select count(*) from public.contas_receber where status = 'pendente')                as receber_pendentes,
       (select coalesce(sum(valor),0) from public.contas_receber where status = 'pendente')  as receber_total,
       (select count(*) from public.contas_receber where status = 'pago')                    as receber_pagas,
       (select coalesce(sum(valor),0) from public.lancamentos where tipo = 'entrada')        as entradas,
       (select coalesce(sum(valor),0) from public.lancamentos where tipo = 'saida')          as saidas;
