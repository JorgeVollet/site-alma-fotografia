import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Trash2, BookOpen, LayoutGrid, Check, Sparkles, ExternalLink } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { CLIENTES, getGaleriaData } from '../../data/crm'
import { GALERIA_CLIENTE_DEMO } from '../../data/galleries'
import { FORMATOS_ALBUM, aplicarTemplate, novoSpread } from '../../data/album'

function fotosDoCliente(clienteId) {
  const c = CLIENTES.find((x) => x.id === clienteId)
  if (!c || !c.galeriaId) return []
  if (c.galeriaId === 'demo') return GALERIA_CLIENTE_DEMO.fotos
  const g = getGaleriaData(c.galeriaId)
  return g ? g.fotos : []
}

// Abre o editor em NOVA ABA, tela cheia
function abrirEditor(id) {
  window.open(window.location.origin + '/diagramador/' + id, '_blank')
}

export default function Diagramador() {
  const { albuns, criarAlbum, excluirAlbum } = useApp()
  const [novo, setNovo] = useState(false)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Diagramador de álbuns</h1>
          <p className="mt-1 text-sm text-cream-100/60">Editor livre estilo canvas. O álbum abre em tela cheia, numa nova aba, para você ter o máximo de espaço.</p>
        </div>
        <button onClick={() => setNovo(true)} className="btn-light !py-2.5 text-xs"><Plus size={15} /> Novo álbum</button>
      </div>

      {albuns.length === 0 ? (
        <div className="mt-6 rounded-3xl border-2 border-dashed border-cream-100/15 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-cream-100/30" />
          <p className="mt-4 font-serif text-xl text-cream-100/80">Nenhum álbum ainda</p>
          <p className="mt-1 text-sm text-cream-100/50">Crie o primeiro álbum a partir das fotos de um ensaio.</p>
          <button onClick={() => setNovo(true)} className="btn-light mx-auto mt-6"><Plus size={16} /> Criar álbum</button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albuns.map((a) => {
            const capaEl = a.spreads && a.spreads[0] && (a.spreads[0].elementos || []).find((e) => e.tipo === 'foto' && e.src)
            return (
              <div key={a.id} className="group overflow-hidden rounded-2xl bg-cocoa-900 ring-1 ring-cream-100/10">
                <button onClick={() => abrirEditor(a.id)} className="relative block h-36 w-full bg-cocoa-950">
                  {capaEl ? <img src={capaEl.src} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-cream-100/20"><BookOpen size={32} /></div>}
                  <div className="absolute inset-0 flex items-center justify-center bg-cocoa-950/0 opacity-0 transition group-hover:bg-cocoa-950/40 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 text-xs font-medium text-cocoa-800"><ExternalLink size={13} /> Abrir editor</span>
                  </div>
                </button>
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.nome}</p>
                    <p className="text-xs text-cream-100/50">{(a.spreads || []).length} páginas · {a.formatoNome}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditor(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-cream-100/50 hover:bg-cocoa-800 hover:text-cream-100"><LayoutGrid size={15} /></button>
                    <button onClick={() => excluirAlbum(a.id)} className="grid h-8 w-8 place-items-center rounded-lg text-cream-100/50 hover:bg-terracotta-500/20 hover:text-terracotta-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {novo && <NovoAlbum onClose={() => setNovo(false)} onCriar={(a) => { const id = criarAlbum(a); setNovo(false); abrirEditor(id) }} />}
      </AnimatePresence>
    </div>
  )
}

function NovoAlbum({ onClose, onCriar }) {
  const [nome, setNome] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [formato, setFormato] = useState('quadrado')
  const comGaleria = CLIENTES.filter((c) => c.galeriaId)
  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'
  const valido = nome.trim() && clienteId

  const criar = () => {
    const fmt = FORMATOS_ALBUM.find((f) => f.id === formato)
    const fotos = fotosDoCliente(clienteId)
    const capa = novoSpread('carvao'); capa.elementos = aplicarTemplate('capa-elegante', fotos)
    const sp1 = novoSpread('branco'); sp1.elementos = aplicarTemplate('duo-titulo', fotos.slice(1))
    const sp2 = novoSpread('cream'); sp2.elementos = aplicarTemplate('destaque-texto', fotos.slice(3))
    const c = CLIENTES.find((x) => x.id === clienteId)
    onCriar({ nome: nome.trim(), clienteId, clienteNome: c ? c.nome : '', formato, formatoNome: fmt.nome, ratio: fmt.ratio, spreads: [capa, sp1, sp2] })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-2xl"><Sparkles size={20} className="text-terracotta-400" /> Novo álbum</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">Nome do álbum</span><input className={inp} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Casamento Eduardo & Camila" /></label>
          <label className="block"><span className="text-sm text-cream-100/80">Cliente / ensaio</span><select className={inp} value={clienteId} onChange={(e) => setClienteId(e.target.value)}><option value="">Selecione...</option>{comGaleria.map((c) => <option key={c.id} value={c.id}>{c.nome} — {c.ensaios[0].titulo}</option>)}</select></label>
          <div>
            <span className="text-sm text-cream-100/80">Formato</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {FORMATOS_ALBUM.map((f) => (
                <button key={f.id} onClick={() => setFormato(f.id)} className={'rounded-xl border p-3 text-center transition ' + (formato === f.id ? 'border-terracotta-400 bg-terracotta-500/10' : 'border-cream-100/10 hover:border-cream-100/30')}>
                  <div className="mx-auto mb-2 bg-cream-100/20" style={{ width: f.id === 'paisagem' ? 36 : f.id === 'retrato' ? 18 : 28, height: f.id === 'paisagem' ? 14 : f.id === 'retrato' ? 24 : 22 }} />
                  <p className="text-[10px] text-cream-100/70">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => valido && criar()} disabled={!valido} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> Criar e abrir em tela cheia</button>
        <p className="mt-2 text-center text-xs text-cream-100/40">O editor abre numa nova aba, em tela cheia.</p>
      </motion.div>
    </motion.div>
  )
}
