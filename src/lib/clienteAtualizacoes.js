// Histórico de atualizações do cliente ("o que foi conversado"). Timeline
// append-only por cliente. Só a equipe (authenticated) acessa.
import { supabase } from './supabase'

export async function listarAtualizacoes(clienteId) {
  if (!clienteId) return []
  const { data, error } = await supabase
    .from('cliente_atualizacoes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) { console.warn('[atualizacoes] listar:', error.message); return [] }
  return (data || []).map((r) => ({ id: r.id, texto: r.texto, criadoEm: r.created_at }))
}

export async function criarAtualizacao(clienteId, texto) {
  const t = (texto || '').trim()
  if (!clienteId || !t) return null
  const { data, error } = await supabase
    .from('cliente_atualizacoes')
    .insert({ cliente_id: clienteId, texto: t })
    .select()
    .single()
  if (error) { console.warn('[atualizacoes] criar:', error.message); return null }
  return { id: data.id, texto: data.texto, criadoEm: data.created_at }
}
