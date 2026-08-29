// Etapas de produção (sub-etapas do ensaio: edição → cor → retoque).
import { supabase } from './supabase'

export const STATUS_ETAPA = [
  { id: 'pendente', nome: 'Pendente' },
  { id: 'em_andamento', nome: 'Em andamento' },
  { id: 'concluida', nome: 'Concluída' },
]

export function mapEtapa(row) {
  return {
    id: row.id,
    galeriaId: row.galeria_id,
    tipo: row.tipo,
    nome: row.nome,
    ordem: row.ordem,
    status: row.status,
    responsavelId: row.responsavel_id,
    prazo: row.prazo,
    concluidaEm: row.concluida_em,
  }
}

export async function fetchEtapas(galeriaId) {
  const { data, error } = await supabase
    .from('etapas_producao')
    .select('*')
    .eq('galeria_id', galeriaId)
    .order('ordem', { ascending: true })
  if (error) { console.warn('[producao] fetch:', error.message); return [] }
  return (data || []).map(mapEtapa)
}

// Cria as 3 etapas padrão (edição → cor → retoque) se ainda não existirem.
// Idempotente — rede de segurança caso o trigger não tenha rodado.
export async function criarEtapasPadrao(galeriaId) {
  const existentes = await fetchEtapas(galeriaId)
  if (existentes.length) return existentes
  const base = [
    { tipo: 'edicao', nome: 'Edição', ordem: 1 },
    { tipo: 'cor', nome: 'Tratamento de cor', ordem: 2 },
    { tipo: 'retoque', nome: 'Retoque de pele', ordem: 3 },
  ]
  const { data, error } = await supabase
    .from('etapas_producao')
    .insert(base.map((e) => ({ ...e, galeria_id: galeriaId })))
    .select()
  if (error) { console.warn('[producao] criar etapas:', error.message); return [] }
  return (data || []).map(mapEtapa).sort((a, b) => a.ordem - b.ordem)
}

export async function atualizarEtapa(id, campos) {
  const col = {}
  if ('status' in campos) {
    col.status = campos.status
    col.concluida_em = campos.status === 'concluida' ? new Date().toISOString() : null
  }
  if ('responsavelId' in campos) col.responsavel_id = campos.responsavelId || null
  if ('prazo' in campos) col.prazo = campos.prazo || null
  const { data, error } = await supabase.from('etapas_producao').update(col).eq('id', id).select().single()
  if (error) { console.warn('[producao] atualizar:', error.message); return null }
  return mapEtapa(data)
}
