// Portfólio do site — agora no banco (Bloco 21).
//
// ANTES: os ensaios do portfólio viviam no localStorage do navegador do admin.
// As fotos que o visitante via vinham da pasta /fotos do projeto, então CURAR o
// portfólio pelo painel não tinha efeito nenhum no site — e trocar de
// computador zerava as edições. Agora vive em portfolio_ensaios/portfolio_fotos
// com bucket público próprio, como as galerias.
import { supabase } from './supabase'

const BUCKET = 'portfolio'

export function urlPortfolio(path) {
  if (!path) return null
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path  // legado: /fotos da pasta
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

function mapEnsaio(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    subtitulo: row.subtitulo || '',
    categoria: row.categoria,
    capa: urlPortfolio(row.capa_path),
    capaPath: row.capa_path || '',
    ordem: row.ordem ?? 0,
    publicado: row.publicado !== false,
    criadoEm: row.created_at,
    fotos: (row.fotos || [])
      .slice()
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((f) => ({ id: f.id, path: f.path, src: urlPortfolio(f.path) })),
  }
}

export async function fetchPortfolio() {
  const { data, error } = await supabase
    .from('portfolio_ensaios')
    .select('*, fotos:portfolio_fotos(*)')
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) { console.warn('[portfolio] fetch falhou:', error.message); return [] }
  return (data || []).map(mapEnsaio)
}

export async function criarEnsaioPortfolio({ titulo, subtitulo = '', categoria, capaPath = null, ordem = 0 }) {
  const { data, error } = await supabase
    .from('portfolio_ensaios')
    .insert({ titulo, subtitulo, categoria, capa_path: capaPath, ordem })
    .select('*, fotos:portfolio_fotos(*)')
    .single()
  if (error) { console.warn('[portfolio] criar falhou:', error.message); return null }
  return mapEnsaio(data)
}

export async function atualizarEnsaioPortfolio(id, campos) {
  const col = {}
  if ('titulo' in campos) col.titulo = campos.titulo
  if ('subtitulo' in campos) col.subtitulo = campos.subtitulo
  if ('categoria' in campos) col.categoria = campos.categoria
  if ('capaPath' in campos) col.capa_path = campos.capaPath
  if ('ordem' in campos) col.ordem = campos.ordem
  if ('publicado' in campos) col.publicado = !!campos.publicado
  const { data, error } = await supabase
    .from('portfolio_ensaios').update(col).eq('id', id)
    .select('*, fotos:portfolio_fotos(*)').single()
  if (error) { console.warn('[portfolio] atualizar falhou:', error.message); return null }
  return mapEnsaio(data)
}

export async function excluirEnsaioPortfolio(id) {
  // apaga os arquivos do bucket antes das linhas (o cascade leva as fotos)
  const { data: fotos } = await supabase.from('portfolio_fotos').select('path').eq('ensaio_id', id)
  const paths = (fotos || []).map((f) => f.path).filter(Boolean)
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
  const { error } = await supabase.from('portfolio_ensaios').delete().eq('id', id)
  if (error) { console.warn('[portfolio] excluir falhou:', error.message); return false }
  return true
}

// Sobe arquivos escolhidos no computador. Redimensiona para 2000px (vitrine
// não precisa de arquivo cru) e devolve as fotos criadas.
export async function subirFotosPortfolio(ensaioId, files, onProgress) {
  const lista = Array.from(files)
  const criadas = []
  const falhas = []
  const { data: existentes } = await supabase
    .from('portfolio_fotos').select('ordem').eq('ensaio_id', ensaioId)
  let ordem = (existentes || []).reduce((m, f) => Math.max(m, f.ordem ?? 0), -1) + 1

  for (let i = 0; i < lista.length; i++) {
    const file = lista[i]
    try {
      const blob = await reduzir(file, 2000)
      const path = `${ensaioId}/${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage
        .from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (upErr) throw new Error(upErr.message)
      const { data, error } = await supabase
        .from('portfolio_fotos').insert({ ensaio_id: ensaioId, path, ordem: ordem++ })
        .select().single()
      if (error) throw new Error(error.message)
      criadas.push({ id: data.id, path: data.path, src: urlPortfolio(data.path) })
    } catch (e) {
      falhas.push({ nome: file.name || 'foto', motivo: e.message || 'falhou' })
    }
    if (onProgress) onProgress(i + 1, lista.length)
  }
  return { criadas, falhas }
}

export async function removerFotoPortfolio(fotoId) {
  const { data: foto } = await supabase.from('portfolio_fotos').select('path').eq('id', fotoId).maybeSingle()
  const { error } = await supabase.from('portfolio_fotos').delete().eq('id', fotoId)
  if (error) { console.warn('[portfolio] remover foto falhou:', error.message); return false }
  if (foto?.path) await supabase.storage.from(BUCKET).remove([foto.path])
  return true
}

// Redimensiona no navegador antes de subir (vitrine, não arquivo).
async function reduzir(file, maxLado) {
  const bmp = await (typeof createImageBitmap === 'function'
    ? createImageBitmap(file).catch(() => carregarImg(file))
    : carregarImg(file))
  const escala = Math.min(1, maxLado / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bmp.width * escala))
  canvas.height = Math.max(1, Math.round(bmp.height * escala))
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
  if (bmp.close) bmp.close()
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.86))
  if (!blob) throw new Error('não foi possível preparar a imagem')
  return blob
}

function carregarImg(file) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = URL.createObjectURL(file)
  })
}

// Leva fotos que já existem em outro bucket (as favoritas de uma galeria) para
// o portfólio. Precisa COPIAR de verdade: se apenas guardássemos a URL da
// galeria, apagar a galeria depois deixaria o portfólio do site com foto
// quebrada — e a foto de seleção tem marca d'água.
export async function copiarFotosParaPortfolio(ensaioId, urls, onProgress) {
  const lista = (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
  const criadas = []
  const falhas = []
  const { data: existentes } = await supabase
    .from('portfolio_fotos').select('ordem').eq('ensaio_id', ensaioId)
  let ordem = (existentes || []).reduce((m, f) => Math.max(m, f.ordem ?? 0), -1) + 1

  for (let i = 0; i < lista.length; i++) {
    try {
      const res = await fetch(lista[i])
      if (!res.ok) throw new Error('não foi possível baixar a imagem')
      const original = await res.blob()
      const blob = await reduzir(original, 2000)
      const path = `${ensaioId}/${crypto.randomUUID()}.jpg`
      const { error: upErr } = await supabase.storage
        .from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (upErr) throw new Error(upErr.message)
      const { data, error } = await supabase
        .from('portfolio_fotos').insert({ ensaio_id: ensaioId, path, ordem: ordem++ })
        .select().single()
      if (error) throw new Error(error.message)
      criadas.push({ id: data.id, path: data.path, src: urlPortfolio(data.path) })
    } catch (e) {
      falhas.push({ nome: 'foto ' + (i + 1), motivo: e.message || 'falhou' })
    }
    if (onProgress) onProgress(i + 1, lista.length)
  }
  return { criadas, falhas }
}
