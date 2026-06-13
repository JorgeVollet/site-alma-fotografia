// =====================================================================
//  DIAGRAMADOR DE ÁLBUNS — editor canvas livre
//  Cada spread (página dupla) = lista de ELEMENTOS posicionados livres.
//  Elemento: { id, tipo, x, y, w, h, rot, z, ...props }
//    tipo 'foto'   -> { src }
//    tipo 'texto'  -> { texto, fonte, tamanho, cor, peso, italico, align }
//    tipo 'titulo' -> idem texto (fonte serif maior)
//    tipo 'forma'  -> { forma:'retangulo'|'circulo'|'linha', cor, borda, bordaCor, raio }
//  Coordenadas em % do spread (0–100), pra ser responsivo.
// =====================================================================

export const FORMATOS_ALBUM = [
  { id: 'quadrado', nome: 'Quadrado 20×20', ratio: 2 / 1, desc: '20×20 cm' },
  { id: 'retrato', nome: 'Retrato 20×30', ratio: 4 / 3, desc: '20×30 cm' },
  { id: 'paisagem', nome: 'Paisagem 30×20', ratio: 3 / 1, desc: '30×20 cm' },
]

export const FUNDOS_ALBUM = [
  { id: 'branco', nome: 'Branco', cor: '#ffffff' },
  { id: 'cream', nome: 'Marfim', cor: '#faf6ef' },
  { id: 'kraft', nome: 'Kraft', cor: '#e3d4bd' },
  { id: 'carvao', nome: 'Carvão', cor: '#2b211b' },
  { id: 'rose', nome: 'Rosé', cor: '#f3e4dd' },
  { id: 'verde', nome: 'Sálvia', cor: '#d7ddcf' },
]

// Fontes disponíveis no editor
export const FONTES = [
  { id: 'serif', nome: 'Serifada (Cormorant)', css: '"Cormorant Garamond", Georgia, serif' },
  { id: 'sans', nome: 'Moderna (Jost)', css: 'Jost, system-ui, sans-serif' },
  { id: 'script', nome: 'Manuscrita', css: '"Brush Script MT", "Segoe Script", cursive' },
  { id: 'mono', nome: 'Mono', css: '"Courier New", monospace' },
]

export const CORES_PALETA = ['#3a2e26', '#8a6342', '#b9714f', '#c98a6b', '#d8c3a5', '#faf6ef', '#ffffff', '#2b211b', '#a05d3e', '#5b4636']

let _eid = 0
function eid() { _eid++; return 'el-' + Date.now().toString(36) + '-' + _eid }

// Construtores de elementos
export function elFoto(src, x = 10, y = 15, w = 35, h = 70) {
  return { id: eid(), tipo: 'foto', src, x, y, w, h, rot: 0, z: 1, opacidade: 1, raio: 0 }
}
export function elTexto(texto = 'Toque para editar', x = 30, y = 45, w = 40, h = 10) {
  return { id: eid(), tipo: 'texto', texto, x, y, w, h, rot: 0, z: 2, fonte: 'sans', tamanho: 18, cor: '#3a2e26', peso: 400, italico: false, align: 'center', opacidade: 1 }
}
export function elTitulo(texto = 'Título', x = 25, y = 40, w = 50, h = 16) {
  return { id: eid(), tipo: 'titulo', texto, x, y, w, h, rot: 0, z: 2, fonte: 'serif', tamanho: 44, cor: '#3a2e26', peso: 500, italico: true, align: 'center', opacidade: 1 }
}
export function elForma(forma = 'retangulo', x = 30, y = 35, w = 40, h = 30) {
  return { id: eid(), tipo: 'forma', forma, x, y, w, h, rot: 0, z: 0, cor: '#c98a6b', borda: 0, bordaCor: '#3a2e26', raio: 0, opacidade: 1 }
}

export function novoSpread(fundo = 'branco') {
  return { id: eid().replace('el-', 'sp-'), fundo, elementos: [] }
}

// =====================================================================
//  TEMPLATES COMPLETOS — layouts prontos com fotos + título + formas
//  Recebem a lista de fotos disponíveis; preenchem o que der.
// =====================================================================
export const TEMPLATES_COMPLETOS = [
  {
    id: 'capa-elegante', nome: 'Capa elegante',
    build: (fotos) => {
      const els = []
      if (fotos[0]) els.push({ ...elFoto(fotos[0], 0, 0, 100, 100), z: 0 })
      els.push({ ...elForma('retangulo', 0, 0, 100, 100), cor: '#000000', opacidade: 0.28, z: 1 })
      els.push({ ...elTitulo('Nossa História', 15, 38, 70, 18), cor: '#ffffff', z: 2 })
      els.push({ ...elTexto('2026', 40, 58, 20, 8), cor: '#ffffff', fonte: 'sans', tamanho: 16, z: 2 })
      return els
    },
  },
  {
    id: 'duo-titulo', nome: 'Duo com título',
    build: (fotos) => {
      const els = []
      if (fotos[0]) els.push(elFoto(fotos[0], 3, 18, 44, 64))
      if (fotos[1]) els.push(elFoto(fotos[1], 53, 18, 44, 64))
      els.push({ ...elTitulo('Momentos', 25, 3, 50, 12), tamanho: 32 })
      return els
    },
  },
  {
    id: 'destaque-texto', nome: 'Destaque + texto',
    build: (fotos) => {
      const els = []
      if (fotos[0]) els.push(elFoto(fotos[0], 3, 4, 56, 92))
      els.push({ ...elTitulo('Para sempre', 63, 22, 33, 14), align: 'left', tamanho: 30 })
      els.push({ ...elTexto('Cada detalhe deste dia ficará guardado para a vida toda.', 63, 40, 33, 20), align: 'left', tamanho: 14 })
      if (fotos[1]) els.push(elFoto(fotos[1], 63, 62, 33, 34))
      return els
    },
  },
  {
    id: 'mosaico-faixa', nome: 'Mosaico + faixa',
    build: (fotos) => {
      const els = []
      els.push({ ...elForma('retangulo', 0, 42, 100, 16), cor: '#3a2e26', z: 0 })
      els.push({ ...elTitulo('A celebração', 25, 45, 50, 10), cor: '#faf6ef', tamanho: 26, z: 1 })
      if (fotos[0]) els.push(elFoto(fotos[0], 4, 4, 44, 34))
      if (fotos[1]) els.push(elFoto(fotos[1], 52, 4, 44, 34))
      if (fotos[2]) els.push(elFoto(fotos[2], 4, 62, 44, 34))
      if (fotos[3]) els.push(elFoto(fotos[3], 52, 62, 44, 34))
      return els
    },
  },
  {
    id: 'pano-cita', nome: 'Panorâmica + citação',
    build: (fotos) => {
      const els = []
      if (fotos[0]) els.push(elFoto(fotos[0], 6, 8, 88, 56))
      els.push({ ...elTexto('"O amor está nos detalhes."', 20, 70, 60, 14), fonte: 'script', tamanho: 30, italico: false, cor: '#8a6342' })
      return els
    },
  },
  {
    id: 'em-branco', nome: 'Em branco',
    build: () => [],
  },
]

export function aplicarTemplate(templateId, fotos) {
  const t = TEMPLATES_COMPLETOS.find((x) => x.id === templateId)
  return t ? t.build(fotos.map((f) => (typeof f === 'string' ? f : f.src))) : []
}

export function fonteCss(id) {
  return (FONTES.find((f) => f.id === id) || FONTES[1]).css
}
