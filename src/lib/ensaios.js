// Camada de dados de ENSAIOS (Bloco 3A) — sessões ligadas a um cliente.
// Só a equipe (authenticated) acessa.
import { supabase } from './supabase'

export function mapEnsaio(row) {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    titulo: row.titulo || '',
    tipo: row.tipo_ensaio || '',
    pacote: row.pacote_slug || '',
    valor: row.valor != null ? Number(row.valor) : 0,
    data: row.data || '',
    hora: row.hora || '',
    local: row.local || '',
    status: row.status || 'agendado',
    observacoes: row.observacoes || '',
    fotoExtra: row.foto_extra != null ? Number(row.foto_extra) : null,
    origem: row.origem || 'manual', // 'site' = veio de uma reserva do site
  }
}

function paraColunas(campos) {
  const col = {}
  if ('clienteId' in campos) col.cliente_id = campos.clienteId
  if ('titulo' in campos) col.titulo = campos.titulo || null
  if ('tipo' in campos) col.tipo_ensaio = campos.tipo || null
  if ('pacote' in campos) col.pacote_slug = campos.pacote || null
  if ('valor' in campos) col.valor = campos.valor || 0
  if ('data' in campos) col.data = campos.data || null
  if ('hora' in campos) col.hora = campos.hora || null
  if ('local' in campos) col.local = campos.local || null
  if ('status' in campos) col.status = campos.status
  if ('observacoes' in campos) col.observacoes = campos.observacoes || null
  if ('fotoExtra' in campos) col.foto_extra = campos.fotoExtra || null
  return col
}

export async function fetchEnsaios() {
  const { data, error } = await supabase
    .from('ensaios')
    .select('*')
    .order('data', { ascending: false })
  if (error) {
    console.warn('[ensaios] fetch falhou:', error.message)
    return []
  }
  return (data || []).map(mapEnsaio)
}

export async function criarEnsaio(campos) {
  const { data, error } = await supabase
    .from('ensaios')
    .insert(paraColunas(campos))
    .select()
    .single()
  if (error) {
    console.warn('[ensaios] criar falhou:', error.message)
    return null
  }
  return mapEnsaio(data)
}

export async function atualizarEnsaio(id, campos) {
  const { data, error } = await supabase
    .from('ensaios')
    .update(paraColunas(campos))
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.warn('[ensaios] atualizar falhou:', error.message)
    return null
  }
  return mapEnsaio(data)
}

export async function removerEnsaio(id) {
  const { error } = await supabase.from('ensaios').delete().eq('id', id)
  if (error) {
    console.warn('[ensaios] remover falhou:', error.message)
    return false
  }
  return true
}
