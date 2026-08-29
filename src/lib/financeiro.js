// Camada de dados do FINANCEIRO (lançamentos + contas a pagar).
// Contas a receber ficam em galerias.js (fetchContasReceber/marcarContaRecebida/reabrirConta).
import { supabase } from './supabase'

export function mapLancamento(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    descricao: row.descricao,
    valor: Number(row.valor),
    categoria: row.categoria || '',
    data: row.data,
    clienteId: row.cliente_id,
    contaReceberId: row.conta_receber_id,
    auto: !!row.conta_receber_id, // veio de costura (não editável à mão)
  }
}

export async function fetchLancamentos() {
  const { data, error } = await supabase.from('lancamentos').select('*').order('data', { ascending: false })
  if (error) { console.warn('[financeiro] lançamentos:', error.message); return [] }
  return (data || []).map(mapLancamento)
}

export async function criarLancamento(c) {
  const { data, error } = await supabase.from('lancamentos').insert({
    tipo: c.tipo, descricao: c.descricao, valor: c.valor || 0,
    categoria: c.categoria || null, data: c.data || null, cliente_id: c.clienteId || null,
  }).select().single()
  if (error) { console.warn('[financeiro] criar:', error.message); return null }
  return mapLancamento(data)
}

export async function atualizarLancamento(id, c) {
  const col = {}
  if ('tipo' in c) col.tipo = c.tipo
  if ('descricao' in c) col.descricao = c.descricao
  if ('valor' in c) col.valor = c.valor || 0
  if ('categoria' in c) col.categoria = c.categoria || null
  if ('data' in c) col.data = c.data || null
  if ('clienteId' in c) col.cliente_id = c.clienteId || null
  const { data, error } = await supabase.from('lancamentos').update(col).eq('id', id).select().single()
  if (error) { console.warn('[financeiro] atualizar:', error.message); return null }
  return mapLancamento(data)
}

export async function excluirLancamento(id) {
  const { error } = await supabase.from('lancamentos').delete().eq('id', id)
  if (error) { console.warn('[financeiro] excluir:', error.message); return false }
  return true
}

// ── Contas a pagar ─────────────────────────────────────────
export function mapContaPagar(row) {
  return {
    id: row.id, descricao: row.descricao, valor: Number(row.valor),
    vencimento: row.vencimento, categoria: row.categoria || '', status: row.status, pagoEm: row.pago_em,
  }
}

export async function fetchContasPagar() {
  const { data, error } = await supabase.from('contas_pagar').select('*').order('vencimento', { ascending: true })
  if (error) { console.warn('[financeiro] contas pagar:', error.message); return [] }
  return (data || []).map(mapContaPagar)
}

export async function criarContaPagar(c) {
  const { data, error } = await supabase.from('contas_pagar').insert({
    descricao: c.descricao, valor: c.valor || 0, vencimento: c.vencimento || null, categoria: c.categoria || null,
  }).select().single()
  if (error) { console.warn('[financeiro] criar conta pagar:', error.message); return null }
  return mapContaPagar(data)
}

export async function pagarContaPagar(id, pago) {
  const col = pago
    ? { status: 'pago', pago_em: new Date().toISOString() }
    : { status: 'pendente', pago_em: null }
  const { error } = await supabase.from('contas_pagar').update(col).eq('id', id)
  if (error) { console.warn('[financeiro] pagar conta:', error.message); return false }
  return true
}

export async function excluirContaPagar(id) {
  const { error } = await supabase.from('contas_pagar').delete().eq('id', id)
  if (error) { console.warn('[financeiro] excluir conta pagar:', error.message); return false }
  return true
}
