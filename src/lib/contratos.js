// Camada de dados de CONTRATOS (Bloco 8a). Só a equipe (authenticated) lê/grava.
// A página pública /assinar usa as RPCs anônimas (carregar/assinar pelo token).
import { supabase } from './supabase'

const SEL = '*, cliente:clientes(nome, telefone)'

export function mapContrato(row) {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    cliente: row.cliente_id,                 // compat: telas usam c.cliente como id do cliente
    clienteNome: row.cliente?.nome || '',
    telefone: row.cliente?.telefone || '',
    ensaioId: row.ensaio_id || null,
    titulo: row.titulo || 'Contrato',
    modelo: row.modelo || row.titulo || '',
    valor: Number(row.valor) || 0,
    ensaio: row.ensaio_desc || '',
    clausulas: Array.isArray(row.clausulas) ? row.clausulas : [],
    pdfPath: row.pdf_path || null,
    pdfNome: row.pdf_nome || '',
    pdf: !!row.pdf_path,                      // flag: é PDF anexado (download via signed URL)
    status: row.status || 'rascunho',
    assinatura: row.assinatura || null,
    token: row.token,
    criado: row.created_at ? row.created_at.slice(0, 10) : null,
    enviadoEm: row.enviado_em ? row.enviado_em.slice(0, 10) : null,
    assinadoEm: row.assinado_em ? row.assinado_em.slice(0, 10) : null,
  }
}

// Campos do app -> colunas do banco (só os presentes).
function paraColunas(campos) {
  const col = {}
  if ('clienteId' in campos) col.cliente_id = campos.clienteId || null
  else if ('cliente' in campos) col.cliente_id = campos.cliente || null
  if ('ensaioId' in campos) col.ensaio_id = campos.ensaioId || null
  if ('titulo' in campos) col.titulo = campos.titulo || 'Contrato'
  if ('modelo' in campos) col.modelo = campos.modelo || null
  if ('ensaio' in campos) col.ensaio_desc = campos.ensaio || null
  if ('valor' in campos) col.valor = campos.valor || 0
  if ('clausulas' in campos) col.clausulas = campos.clausulas || []
  if ('pdfPath' in campos) col.pdf_path = campos.pdfPath || null
  if ('pdfNome' in campos) col.pdf_nome = campos.pdfNome || null
  if ('status' in campos) col.status = campos.status
  return col
}

export async function fetchContratos() {
  const { data, error } = await supabase
    .from('contratos')
    .select(SEL)
    .order('created_at', { ascending: false })
  if (error) { console.warn('[contratos] fetch falhou:', error.message); return [] }
  return (data || []).map(mapContrato)
}

// Cria o contrato. Se vier um File em campos.pdfFile, sobe ao bucket privado.
export async function criarContrato(campos) {
  let pdfPath = null
  let pdfNome = campos.pdfNome || null
  if (campos.pdfFile) {
    const seguro = (campos.pdfFile.name || 'contrato.pdf').replace(/[^\w.\-]+/g, '_')
    const path = crypto.randomUUID() + '-' + seguro
    const { error: upErr } = await supabase.storage
      .from('contratos')
      .upload(path, campos.pdfFile, { contentType: 'application/pdf', upsert: false })
    if (upErr) {
      // ANTES isto era só um console.warn: o contrato nascia SEM o PDF e o
      // estúdio seguia achando que o anexo estava lá.
      console.warn('[contratos] upload pdf:', upErr.message)
      return { erro: 'O PDF não pôde ser enviado (' + upErr.message + '). O contrato NÃO foi criado — tente de novo.' }
    }
    pdfPath = path
    pdfNome = campos.pdfFile.name
  }
  const payload = paraColunas({ ...campos, pdfPath, pdfNome })
  const { data, error } = await supabase.from('contratos').insert(payload).select(SEL).single()
  if (error) { console.warn('[contratos] criar falhou:', error.message); return { erro: error.message } }
  return mapContrato(data)
}

export async function atualizarContrato(id, campos) {
  const { data, error } = await supabase.from('contratos').update(paraColunas(campos)).eq('id', id).select(SEL).single()
  if (error) { console.warn('[contratos] atualizar falhou:', error.message); return null }
  return mapContrato(data)
}

// Admin marca como ASSINADO (dispara a costura: conta a receber + funil).
export async function assinarContrato(id) {
  const { data, error } = await supabase.from('contratos')
    .update({ status: 'assinado', assinado_em: new Date().toISOString() })
    .eq('id', id).select(SEL).single()
  if (error) { console.warn('[contratos] assinar falhou:', error.message); return null }
  return mapContrato(data)
}

// Marca como ENVIADO p/ assinatura (registra a data).
export async function enviarContrato(id) {
  const { data, error } = await supabase.from('contratos')
    .update({ status: 'enviado', enviado_em: new Date().toISOString() })
    .eq('id', id).select(SEL).single()
  if (error) { console.warn('[contratos] enviar falhou:', error.message); return null }
  return mapContrato(data)
}

export async function excluirContrato(id) {
  const { error } = await supabase.from('contratos').delete().eq('id', id)
  if (error) { console.warn('[contratos] excluir falhou:', error.message); return false }
  return true
}

// URL assinada (temporária) para baixar o PDF do bucket privado.
export async function urlContratoAssinada(path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('contratos').createSignedUrl(path, 600)
  if (error) { console.warn('[contratos] signed url falhou:', error.message); return null }
  return data?.signedUrl || null
}

// ── Página pública /assinar (cliente anônimo, via RPC SECURITY DEFINER) ──
export async function carregarContratoPublico(token) {
  const { data, error } = await supabase.rpc('carregar_contrato', { p_token: token })
  if (error) { console.warn('[contratos] carregar público falhou:', error.message); return { ok: false, erro: 'Não foi possível carregar o contrato.' } }
  return data
}

export async function assinarContratoPublico(token, assinatura) {
  const { data, error } = await supabase.rpc('assinar_contrato', { p_token: token, p_assinatura: assinatura })
  if (error) { console.warn('[contratos] assinar público falhou:', error.message); return { ok: false, erro: 'Não foi possível registrar a assinatura.' } }
  return data
}
