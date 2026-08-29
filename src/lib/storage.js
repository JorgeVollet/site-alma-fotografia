// Storage de fotos (Bloco 4A).
// Gera 3 versões no navegador (canvas) e sobe ao bucket privado 'galerias':
//   • original  = arquivo enviado (alta, privado)
//   • preview   = redimensionado + MARCA D'ÁGUA (o que o cliente vê na seleção)
//   • thumb     = miniatura (marca d'água leve) para o grid
// O cliente nunca recebe o original; o acesso é por URL assinada (temporária).
import { supabase } from './supabase'

const BUCKET_ORIGINAIS = 'galerias'   // privado — originais em alta (legado)
const BUCKET_PREVIEWS = 'previews'    // público — versões com marca d'água (seleção)
const BUCKET_ENTREGAS = 'entregas'    // público — finais SEM marca (entrega/download)
const MARCA = 'ALMA FOTOGRAFIA'

async function carregarBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file) } catch { /* fallback abaixo */ }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function redimensionar(bitmap, maxLado) {
  const w = bitmap.width, h = bitmap.height
  const escala = Math.min(1, maxLado / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * escala))
  const ch = Math.max(1, Math.round(h * escala))
  const canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, cw, ch)
  return { canvas, ctx, cw, ch }
}

// Marca d'água: texto diagonal repetido, semitransparente.
function aplicarMarca(ctx, cw, ch) {
  ctx.save()
  ctx.globalAlpha = 0.2
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 2
  const fonte = Math.max(13, Math.round(cw / 24))
  ctx.font = `600 ${fonte}px Inter, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(cw / 2, ch / 2)
  ctx.rotate(-Math.atan2(ch, cw))
  const larguraTexto = ctx.measureText(MARCA).width
  const passoY = fonte * 5
  const passoX = larguraTexto + fonte * 3
  const lim = Math.max(cw, ch)
  for (let y = -lim; y < lim; y += passoY) {
    for (let x = -lim; x < lim; x += passoX) {
      ctx.fillText(MARCA, x, y)
    }
  }
  ctx.restore()
}

function paraBlob(canvas, q = 0.82) {
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', q))
}

// SELEÇÃO: prova leve com marca d'água. Maior aresta 1024px, JPG ~70% — não
// guarda o original (economia de espaço; o estúdio mantém os RAW no Lightroom).
export async function gerarVersoes(file) {
  const bmp = await carregarBitmap(file)
  const pv = redimensionar(bmp, 1024)
  aplicarMarca(pv.ctx, pv.cw, pv.ch)
  const preview = await paraBlob(pv.canvas, 0.72)
  const th = redimensionar(bmp, 400)
  aplicarMarca(th.ctx, th.cw, th.ch)
  const thumb = await paraBlob(th.canvas, 0.65)
  if (bmp.close) bmp.close()
  return { preview, thumb }
}

export async function uploadFotoVersoes(galeriaId, fotoId, versoes) {
  const base = `${galeriaId}/${fotoId}`
  // preview/thumb (marca d'água) -> bucket PÚBLICO 'previews'
  const r2 = await supabase.storage.from(BUCKET_PREVIEWS)
    .upload(`${base}/preview.jpg`, versoes.preview, { contentType: 'image/jpeg', upsert: true })
  const r3 = await supabase.storage.from(BUCKET_PREVIEWS)
    .upload(`${base}/thumb.jpg`, versoes.thumb, { contentType: 'image/jpeg', upsert: true })
  const err = r2.error || r3.error
  if (err) { console.warn('[storage] upload falhou:', err.message); return null }
  return {
    original_path: null,
    preview_path: `${base}/preview.jpg`,
    thumb_path: `${base}/thumb.jpg`,
  }
}

// ENTREGA: final SEM marca d'água, no tamanho real enviado (o cliente baixa).
// Sobe o arquivo como veio (preserva qualidade) + uma thumb leve p/ o grid.
export async function gerarEntrega(file) {
  const bmp = await carregarBitmap(file)
  const th = redimensionar(bmp, 400)            // thumb SEM marca
  const thumb = await paraBlob(th.canvas, 0.7)
  if (bmp.close) bmp.close()
  return { full: file, thumb }
}

export async function uploadEntrega(galeriaId, fotoId, versoes) {
  const base = `${galeriaId}/${fotoId}`
  const ext = (versoes.full.name && versoes.full.name.split('.').pop()) || 'jpg'
  const r1 = await supabase.storage.from(BUCKET_ENTREGAS)
    .upload(`${base}/full.${ext}`, versoes.full, { contentType: versoes.full.type || 'image/jpeg', upsert: true })
  const r2 = await supabase.storage.from(BUCKET_ENTREGAS)
    .upload(`${base}/thumb.jpg`, versoes.thumb, { contentType: 'image/jpeg', upsert: true })
  const err = r1.error || r2.error
  if (err) { console.warn('[storage] upload entrega falhou:', err.message); return null }
  return {
    original_path: null,
    preview_path: `${base}/full.${ext}`,   // o "preview" da entrega é a própria foto final
    thumb_path: `${base}/thumb.jpg`,
  }
}

// URL pública do bucket de PREVIEWS (seleção, com marca d'água).
export function urlPublica(path) {
  if (!path) return null
  return supabase.storage.from(BUCKET_PREVIEWS).getPublicUrl(path).data.publicUrl
}

// URL pública do bucket de ENTREGAS (finais sem marca).
export function urlEntrega(path) {
  if (!path) return null
  return supabase.storage.from(BUCKET_ENTREGAS).getPublicUrl(path).data.publicUrl
}

// URL certa conforme o tipo da foto (selecao -> previews; entrega -> entregas).
export function urlGaleria(tipo, path) {
  return tipo === 'entrega' ? urlEntrega(path) : urlPublica(path)
}

// URL assinada do ORIGINAL (privado, legado) — galerias antigas que ainda têm.
export async function urlAssinadaOriginal(path, segundos = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(BUCKET_ORIGINAIS).createSignedUrl(path, segundos)
  if (error) { console.warn('[storage] signed url falhou:', error.message); return null }
  return data.signedUrl
}
