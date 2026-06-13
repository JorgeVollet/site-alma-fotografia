// =====================================================================
//  GALERIAS DE EXEMPLO — ALMA FOTOGRAFIA
//  Fotos reais (Unsplash, nicho materno-infantil) + placeholders de
//  degradê para completar. As fotos reais são ilustrativas (demo) —
//  trocar pelas do estúdio na versão final.
// =====================================================================
import { fotosReais } from './unsplash'
import { fakePhoto, buildPhotos } from './placeholders'

export { fakePhoto, buildPhotos }

// Mistura fotos reais + alguns placeholders de degradê.
function mix(categoria, prefix, extras = 2) {
  const reais = fotosReais(categoria)
  const fake = buildPhotos(extras, prefix, categoria).map((f, i) => ({
    ...f,
    id: prefix + '-fake-' + (i + 1),
  }))
  const out = []
  reais.forEach((r, i) => {
    out.push(r)
    if (i === 1 && fake[0]) out.push(fake[0])
  })
  if (fake[1]) out.push(fake[1])
  return out
}

export const PORTFOLIO = [
  ...mix('gestante', 'ges', 2),
  ...mix('newborn', 'nb', 2),
  ...mix('acompanhamento', 'aco', 1),
  ...mix('smash', 'sm', 1),
  ...mix('familia', 'fam', 2),
  ...mix('casal', 'cas', 1),
]

export const DESTAQUES = [
  ...fotosReais('newborn').slice(0, 2),
  ...fotosReais('gestante').slice(0, 2),
  ...fotosReais('familia').slice(0, 2),
  ...fotosReais('smash').slice(0, 1),
  ...fotosReais('acompanhamento').slice(0, 1),
]

export const GALERIA_CLIENTE_DEMO = {
  clienteNome: 'Família Sphor',
  ensaio: 'Ensaio Newborn · Antônio',
  data: '2026-05-28',
  pacote: 'memorias',
  fotosInclusas: 15,
  fotoExtra: 30,
  fotos: [
    ...fotosReais('newborn'),
    ...fotosReais('familia'),
    ...buildPhotos(16, 'sel', 'newborn'),
  ].map((f, i) => ({ ...f, id: 'sel-' + (i + 1) })),
}

export const GALERIA_PRONTA_DEMO = {
  fotos: [
    ...fotosReais('newborn'),
    ...fotosReais('familia').slice(0, 3),
    ...buildPhotos(6, 'final', 'newborn'),
  ].map((f, i) => ({ ...f, id: 'final-' + (i + 1), edited: true })),
}

// --- Outros ensaios em andamento (demo multi-cliente) ----------------
function ensaio(id, categoria, qtdFotos, qtdSel) {
  const fotos = [
    ...fotosReais(categoria),
    ...buildPhotos(qtdFotos, id, categoria),
  ].map((f, i) => ({ ...f, id: id + '-' + (i + 1) }))
  const selecionadas = fotos.slice(0, qtdSel).map((f) => f.id)
  return { fotos, selecionadas }
}

export const OUTROS_ENSAIOS = [
  {
    id: 'patricia',
    clienteNome: 'Patrícia Krever',
    ensaio: 'Ensaio Gestante',
    codigo: 'PATRI2026',
    pacote: 'pocket',
    fotosInclusas: 8,
    fotoExtra: 35,
    status: 'enviado',
    ...ensaio('patricia', 'gestante', 24, 30),
  },
  {
    id: 'daniela',
    clienteNome: 'Daniela Schroter',
    ensaio: 'Ensaio de Família',
    codigo: 'DANI2026',
    pacote: 'memorias',
    fotosInclusas: 15,
    fotoExtra: 30,
    status: 'editando',
    ...ensaio('daniela', 'familia', 18, 22),
  },
  {
    id: 'majoire',
    clienteNome: 'Majoire Sphor',
    ensaio: 'Smash the Cake · 1 aninho',
    codigo: 'MAJO2026',
    pacote: 'memorias',
    fotosInclusas: 15,
    fotoExtra: 35,
    status: 'selecionando',
    ...ensaio('majoire', 'smash', 14, 6),
  },
]

// ---------------------------------------------------------------------
//  Ensaios-DEMO derivados do PORTFOLIO (1 por categoria). Usados como
//  fallback quando o admin ainda não cadastrou ensaios reais — assim o
//  portfólio público e a página /ensaio/demo-* nunca ficam vazios.
// ---------------------------------------------------------------------
import { CATEGORIAS_PORTFOLIO } from './studio'

const _nomeCat = (id) => CATEGORIAS_PORTFOLIO.find((c) => c.id === id)?.nome || id

// Capa local (pasta /fotos) usada por categoria nos ensaios-demo.
const CAPAS_LOCAIS = {
  gestante: '/fotos/gestanteok.png',
  newborn: '/fotos/newborn.jpg',
  acompanhamento: '/fotos/acompanhamento.jpg',
  smash: '/fotos/smash.jpg',
  familia: '/fotos/familia.jpg',
  casal: '/fotos/gestante.jpeg',
}

export function ensaiosDemo() {
  const porCat = {}
  PORTFOLIO.forEach((f) => {
    if (!porCat[f.categoria]) porCat[f.categoria] = []
    porCat[f.categoria].push(f)
  })
  return Object.entries(porCat).map(([categoria, fotos]) => {
    const capa = CAPAS_LOCAIS[categoria] || fotos[0]?.src
    // garante a capa como 1a foto da galeria interna (sem duplicar)
    const internas = fotos.map((f) => ({ id: f.id, src: f.src }))
    if (capa && !internas.some((f) => f.src === capa)) {
      internas.unshift({ id: 'capa-' + categoria, src: capa })
    }
    return {
      id: 'demo-' + categoria,
      titulo: 'Ensaio ' + _nomeCat(categoria),
      subtitulo: internas.length + ' fotos \u00b7 ensaio ilustrativo',
      categoria,
      capa,
      fotos: internas,
      demo: true,
    }
  })
}
