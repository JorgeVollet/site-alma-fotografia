import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Sparkles, ImagePlus } from 'lucide-react'
import Photo from './Photo'
import { useApp } from '../context/AppContext'
import { CATEGORIAS_PORTFOLIO } from '../data/studio'

// Categorias selecionáveis (sem "todos")
const CATS = CATEGORIAS_PORTFOLIO.filter((c) => c.id !== 'todos')
const field = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

// =====================================================================
//  Modal de revisão: favoritas (FINAIS) -> portfólio.
//  O fotógrafo revê, desmarca o que não quer, escolhe categoria e título,
//  e confirma. Cria um ensaio no portfólio (criarEnsaio + adicionarFotoEnsaio).
// =====================================================================
export default function LevarFavoritasPortfolio({ fotos = [], clienteNome = '', ensaioNome = '', onClose, onConcluido }) {
  const { criarEnsaio, adicionarFotoEnsaio } = useApp()
  const [selecionadas, setSelecionadas] = useState(() => fotos.map((f) => f.id))
  const [titulo, setTitulo] = useState(ensaioNome || (clienteNome ? 'Ensaio ' + clienteNome : ''))
  const [subtitulo, setSubtitulo] = useState('')
  const [categoria, setCategoria] = useState(CATS[0].id)

  const toggle = (id) => setSelecionadas((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const fotosFinais = fotos.filter((f) => selecionadas.includes(f.id))
  const valido = titulo.trim() && fotosFinais.length > 0

  const confirmar = () => {
    if (!valido) return
    const capa = fotosFinais[0]?.src
    const id = criarEnsaio({ titulo: titulo.trim(), subtitulo: subtitulo.trim(), categoria, capa })
    adicionarFotoEnsaio(id, fotosFinais.map((f) => f.src))
    onConcluido && onConcluido(id, fotosFinais.length)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] grid place-items-center bg-cocoa-950/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-cocoa-900 ring-1 ring-cream-100/10"
      >
        <div className="flex items-start justify-between gap-4 border-b border-cream-100/10 p-6">
          <div>
            <h3 className="flex items-center gap-2 font-serif text-2xl text-cream-100"><Sparkles size={20} className="text-terracotta-400" /> Levar favoritas pro portfólio</h3>
            <p className="mt-1 text-sm text-cream-100/60">As fotos que {clienteNome || 'o cliente'} mais amou, já editadas. Revise o que vai pro seu portfólio.</p>
          </div>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* grade de favoritas (clica p/ incluir/excluir) */}
          <p className="mb-3 text-xs uppercase tracking-wide text-cream-100/40">{selecionadas.length} de {fotos.length} selecionadas</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {fotos.map((f) => {
              const on = selecionadas.includes(f.id)
              return (
                <button key={f.id} onClick={() => toggle(f.id)} className={'group relative overflow-hidden rounded-lg ring-2 transition ' + (on ? 'ring-terracotta-400' : 'ring-transparent opacity-50 hover:opacity-80')}>
                  <Photo src={f.src} alt="Favorita" className="aspect-square" />
                  {on && <span className="absolute right-1 top-1 rounded-full bg-terracotta-500 p-1 text-cream-50"><Check size={11} /></span>}
                </button>
              )
            })}
          </div>

          {/* dados do ensaio */}
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm text-cream-100/80">Título do ensaio no portfólio</span>
              <input className={field} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Ensaio Newborn · Antônio" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-cream-100/80">Subtítulo <span className="text-cream-100/40">(opcional)</span></span>
                <input className={field} value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Ex: luz natural" />
              </label>
              <label className="block">
                <span className="text-sm text-cream-100/80">Categoria</span>
                <select className={field} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {CATS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t border-cream-100/10 p-6">
          <button onClick={confirmar} disabled={!valido} className="btn-light w-full disabled:opacity-40">
            <ImagePlus size={16} /> Adicionar {fotosFinais.length} {fotosFinais.length === 1 ? 'foto' : 'fotos'} ao portfólio
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
