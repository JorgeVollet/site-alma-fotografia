// Camada de dados de NOTAS FISCAIS (Bloco 8b). Só a equipe (authenticated).
// A fila "Pronto para emitir" é DERIVADA: contas a receber PAGAS que ainda
// não têm nota. A nota só nasce quando o estúdio clica "Gerar nota".
// A emissão fiscal real (Focus NFe) entra depois — aqui é só a base.
import { supabase } from './supabase'

export function mapNota(row) {
  return {
    id: row.id,
    contaReceberId: row.conta_receber_id,
    clienteId: row.cliente_id,
    cliente: row.cliente?.nome || '—',
    numero: row.numero || '—',
    tipo: row.tipo || 'nfse',
    descricao: row.descricao || '',
    valor: Number(row.valor) || 0,
    cpfCnpj: row.cpf_cnpj || '—',
    status: row.status || 'pendente',
    emitidaEm: row.emitida_em,
    pdf: row.pdf_url || null,
    xml: row.xml_url || null,
    motivoErro: row.motivo_erro || '',
  }
}

export async function fetchNotas() {
  const { data, error } = await supabase
    .from('notas_fiscais')
    .select('*, cliente:clientes(nome)')
    .order('created_at', { ascending: false })
  if (error) { console.warn('[notas] fetch falhou:', error.message); return [] }
  return (data || []).map(mapNota)
}

// Fila "Pronto para emitir": TODO pagamento recebido (lançamento de entrada)
// que ainda não virou nota — inclui a reserva paga no agendamento do site.
// Exclui o que já tem nota ativa (por lançamento OU pela conta de origem, p/
// compatibilidade com notas antigas ligadas só à conta).
export async function fetchFaturaveis() {
  const [lancRes, notasRes] = await Promise.all([
    supabase.from('lancamentos')
      .select('id, descricao, valor, data, categoria, cliente_id, conta_receber_id, cliente:clientes(nome)')
      .eq('tipo', 'entrada')
      .order('data', { ascending: false }),
    supabase.from('notas_fiscais').select('lancamento_id, conta_receber_id, status'),
  ])
  if (lancRes.error) { console.warn('[notas] faturáveis falhou:', lancRes.error.message); return [] }
  const usados = new Set()
  ;(notasRes.data || []).forEach((n) => {
    if (n.status === 'cancelada') return            // nota cancelada libera reemissão
    if (n.lancamento_id) usados.add('L:' + n.lancamento_id)
    if (n.conta_receber_id) usados.add('C:' + n.conta_receber_id)
  })
  return (lancRes.data || [])
    .filter((l) => !usados.has('L:' + l.id) && !(l.conta_receber_id && usados.has('C:' + l.conta_receber_id)))
    .map((l) => ({
      lancamentoId: l.id,
      contaReceberId: l.conta_receber_id || null,
      clienteId: l.cliente_id,
      cliente: l.cliente?.nome || '—',
      descricao: l.descricao,
      categoria: l.categoria || '',
      valor: Number(l.valor) || 0,
      pagoEm: l.data,
    }))
}

// Gera a nota a partir de um faturável (vínculo ao pagamento, sem redigitar).
// No fluxo novo a dedup é por lancamento_id; NÃO gravamos conta_receber_id
// quando há lançamento, senão o índice único legado (idx_notas_conta_unica do
// 12) impediria reemitir após cancelar uma nota de conta paga.
export async function gerarNota(faturavel, tipo = 'nfse') {
  const { data, error } = await supabase.from('notas_fiscais').insert({
    lancamento_id: faturavel.lancamentoId || null,
    conta_receber_id: faturavel.lancamentoId ? null : (faturavel.contaReceberId || null),
    cliente_id: faturavel.clienteId || null,
    tipo,
    descricao: faturavel.descricao || '',
    valor: faturavel.valor || 0,
    status: 'pendente',
  }).select('*, cliente:clientes(nome)').single()
  if (error) { console.warn('[notas] gerar falhou:', error.message); return null }
  return mapNota(data)
}

// Marca a nota como emitida MANUALMENTE (rastreio até a Focus NFe entrar).
export async function marcarNotaEmitida(id, numero) {
  const { data, error } = await supabase.from('notas_fiscais')
    .update({ status: 'autorizada', numero: numero || null, emitida_em: new Date().toISOString(), motivo_erro: null })
    .eq('id', id).select('*, cliente:clientes(nome)').single()
  if (error) { console.warn('[notas] marcar emitida falhou:', error.message); return null }
  return mapNota(data)
}

// Desfaz a emissão (volta p/ pendente) — correção de erro antes de cancelar.
export async function reverterEmissao(id) {
  const { data, error } = await supabase.from('notas_fiscais')
    .update({ status: 'pendente', numero: null, emitida_em: null, motivo_erro: null })
    .eq('id', id).select('*, cliente:clientes(nome)').single()
  if (error) { console.warn('[notas] reverter emissão falhou:', error.message); return null }
  return mapNota(data)
}

// Cancela a nota (estorno/devolução). A origem volta a ficar faturável.
export async function cancelarNota(id) {
  const { data, error } = await supabase.from('notas_fiscais')
    .update({ status: 'cancelada' }).eq('id', id).select('*, cliente:clientes(nome)').single()
  if (error) { console.warn('[notas] cancelar falhou:', error.message); return null }
  return mapNota(data)
}

export async function excluirNota(id) {
  const { error } = await supabase.from('notas_fiscais').delete().eq('id', id)
  if (error) { console.warn('[notas] excluir falhou:', error.message); return false }
  return true
}
