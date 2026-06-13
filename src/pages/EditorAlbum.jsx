import { useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Trash2, ArrowLeft, ChevronLeft, ChevronRight, Eye, Check, FileDown,
  Type, Heading, Square, Circle, Minus, Images, Palette, LayoutGrid,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { CLIENTES, getGaleriaData } from '../data/crm'
import { GALERIA_CLIENTE_DEMO } from '../data/galleries'
import {
  FUNDOS_ALBUM, TEMPLATES_COMPLETOS, aplicarTemplate, novoSpread,
  elFoto, elTexto, elTitulo, elForma, fonteCss,
} from '../data/album'
import CanvasElement from './admin/diagramador/CanvasElement'
import PainelPropriedadesEl from './admin/diagramador/PainelPropriedadesEl'
import Logo from '../components/Logo'

function fotosDoCliente(clienteId) {
  const c = CLIENTES.find((x) => x.id === clienteId)
  if (!c || !c.galeriaId) return []
  if (c.galeriaId === 'demo') return GALERIA_CLIENTE_DEMO.fotos
  const g = getGaleriaData(c.galeriaId)
  return g ? g.fotos : []
}

// Página full-screen do editor de álbum (rota /diagramador/:id)
export default function EditorAlbum() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { albuns, salvarAlbum } = useApp()
  const album = albuns.find((a) => a.id === id)

  const [idx, setIdx] = useState(0)
  const [selId, setSelId] = useState(null)
  const [preview, setPreview] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [galeriaAberta, setGaleriaAberta] = useState(false)
  const [editandoTexto, setEditandoTexto] = useState(null)
  const [painelFotos, setPainelFotos] = useState(true)
  const canvasRef = useRef(null)

  const fotos = useMemo(() => fotosDoCliente(album ? album.clienteId : ''), [album])

  if (!album) {
    return (
      <div className="grid min-h-screen place-items-center bg-cocoa-950 text-center text-cream-100">
        <div>
          <p className="font-serif text-2xl">Álbum não encontrado</p>
          <button onClick={() => window.close()} className="btn-light mt-5">Fechar</button>
        </div>
      </div>
    )
  }

  const spreads = album.spreads || []
  const spread = spreads[idx] || spreads[0]
  const els = spread.elementos || []
  const sel = els.find((e) => e.id === selId)
  const fundoCor = (FUNDOS_ALBUM.find((f) => f.id === spread.fundo) || FUNDOS_ALBUM[0]).cor

  const update = (campos) => salvarAlbum(id, campos)
  const updateSpread = (novoSp) => update({ spreads: spreads.map((s, i) => (i === idx ? novoSp : s)) })
  const setEls = (novosEls) => updateSpread({ ...spread, elementos: novosEls })
  const addEl = (el) => { setEls([...els, el]); setSelId(el.id) }
  const changeEl = (eid, campos) => setEls(els.map((e) => (e.id === eid ? { ...e, ...campos } : e)))
  const delEl = (eid) => { setEls(els.filter((e) => e.id !== eid)); setSelId(null) }
  const dupEl = (eid) => { const e = els.find((x) => x.id === eid); if (!e) return; const novo = { ...e, id: 'el-' + Date.now(), x: Math.min(90, e.x + 4), y: Math.min(90, e.y + 4) }; setEls([...els, novo]); setSelId(novo.id) }
  const camadaEl = (eid, dir) => { const e = els.find((x) => x.id === eid); if (!e) return; changeEl(eid, { z: Math.max(0, (e.z || 0) + dir) }) }
  const addSpread = () => { const ns = novoSpread('branco'); update({ spreads: [...spreads, ns] }); setIdx(spreads.length); setSelId(null) }
  const removerSpread = () => { if (spreads.length <= 1) return; const novos = spreads.filter((_, i) => i !== idx); update({ spreads: novos }); setIdx(Math.max(0, idx - 1)); setSelId(null) }
  const moverSpread = (dir) => { const j = idx + dir; if (j < 0 || j >= spreads.length) return; const novos = [...spreads]; const [m] = novos.splice(idx, 1); novos.splice(j, 0, m); update({ spreads: novos }); setIdx(j) }
  const trocarFundo = (fid) => updateSpread({ ...spread, fundo: fid })
  const aplicarTpl = (tid) => { updateSpread({ ...spread, elementos: aplicarTemplate(tid, fotos) }); setSelId(null) }

  if (preview) return <Preview album={album} onFechar={() => setPreview(false)} />

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-cocoa-950 text-cream-100">
      {/* TOPO */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-cream-100/10 bg-cocoa-900 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button onClick={() => { window.opener ? window.close() : navigate('/admin') }} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100"><ArrowLeft size={16} /> Sair</button>
          <div className="h-6 w-px bg-cream-100/10" />
          <Logo dark={false} className="text-base" />
          <span className="hidden text-sm text-cream-100/50 sm:inline">· {album.nome}</span>
        </div>
        {/* barra inserir no topo */}
        <div className="flex items-center gap-1.5">
          <BtnInserir icon={Images} label="Foto" onClick={() => setGaleriaAberta(true)} />
          <BtnInserir icon={Heading} label="Título" onClick={() => addEl(elTitulo())} />
          <BtnInserir icon={Type} label="Texto" onClick={() => addEl(elTexto())} />
          <BtnInserir icon={Square} onClick={() => addEl(elForma('retangulo'))} />
          <BtnInserir icon={Circle} onClick={() => addEl(elForma('circulo', 35, 20, 30, 50))} />
          <BtnInserir icon={Minus} onClick={() => addEl(elForma('linha', 20, 50, 60, 2))} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(true)} className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2 text-xs text-cream-100/80 hover:bg-cocoa-700"><Eye size={14} /> Pré-visualizar</button>
          <button onClick={() => { setExportando(true); setTimeout(() => setExportando(false), 1600) }} className="btn-light !py-2 text-xs"><FileDown size={14} /> {exportando ? 'Gerando…' : 'Exportar'}</button>
        </div>
      </header>

      {/* CORPO: 3 colunas */}
      <div className="flex min-h-0 flex-1">
        {/* Esquerda: fotos */}
        <aside className={'shrink-0 border-r border-cream-100/10 bg-cocoa-900 transition-all ' + (painelFotos ? 'w-44' : 'w-0 overflow-hidden')}>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream-100/40"><Images size={13} /> Fotos</span>
          </div>
          <div className="grid max-h-[calc(100vh-130px)] grid-cols-2 gap-2 overflow-y-auto px-3 pb-3">
            {fotos.map((f) => (
              <div key={f.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/src', f.src)} onClick={() => addEl(elFoto(f.src))} className="aspect-square cursor-pointer overflow-hidden rounded-lg ring-1 ring-cream-100/10 transition hover:ring-terracotta-400">
                <img src={f.src} className="h-full w-full object-cover no-select" draggable={false} />
              </div>
            ))}
          </div>
        </aside>

        {/* Centro: canvas grande */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 items-center justify-center overflow-auto p-6">
            <div className="w-full" style={{ maxWidth: 1100 }}>
              <div
                ref={canvasRef}
                onMouseDown={() => setSelId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const src = e.dataTransfer.getData('text/src'); if (src) { const r = canvasRef.current.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * 100; const y = ((e.clientY - r.top) / r.height) * 100; addEl(elFoto(src, Math.max(0, x - 15), Math.max(0, y - 20), 30, 40)) } }}
                className="relative mx-auto shadow-2xl"
                style={{ aspectRatio: String(album.ratio || 2), background: fundoCor, maxHeight: 'calc(100vh - 220px)' }}
              >
                <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[999] w-px -translate-x-1/2 bg-black/10" />
                {[...els].sort((a, b) => (a.z || 0) - (b.z || 0)).map((el) => (
                  <CanvasElement key={el.id} el={el} selecionado={el.id === selId} canvasRef={canvasRef} escala={0.7}
                    onSelect={setSelId} onChange={changeEl} onEditText={(e) => setEditandoTexto(e)} />
                ))}
              </div>
            </div>
          </div>

          {/* Tira de páginas embaixo */}
          <div className="shrink-0 border-t border-cream-100/10 bg-cocoa-900 p-2.5">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-2 overflow-x-auto">
                {spreads.map((sp, i) => {
                  const f = (FUNDOS_ALBUM.find((x) => x.id === sp.fundo) || FUNDOS_ALBUM[0]).cor
                  return (
                    <button key={sp.id} onClick={() => { setIdx(i); setSelId(null) }} className={'relative shrink-0 overflow-hidden rounded-md ring-2 transition ' + (i === idx ? 'ring-terracotta-400' : 'ring-cream-100/10 hover:ring-cream-100/30')} style={{ width: 76, aspectRatio: String(album.ratio || 2), background: f }}>
                      <MiniSpread spread={sp} />
                      <span className="absolute bottom-0 right-0 rounded-tl bg-cocoa-950/70 px-1 text-[9px] text-cream-100/70">{i === 0 ? 'capa' : i}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex shrink-0 gap-1.5 border-l border-cream-100/10 pl-3">
                <button onClick={() => moverSpread(-1)} disabled={idx === 0} className="grid h-8 w-8 place-items-center rounded-lg bg-cocoa-950 text-cream-100/60 hover:text-cream-100 disabled:opacity-30"><ChevronLeft size={15} /></button>
                <button onClick={() => moverSpread(1)} disabled={idx === spreads.length - 1} className="grid h-8 w-8 place-items-center rounded-lg bg-cocoa-950 text-cream-100/60 hover:text-cream-100 disabled:opacity-30"><ChevronRight size={15} /></button>
                <button onClick={removerSpread} disabled={spreads.length <= 1} className="grid h-8 w-8 place-items-center rounded-lg bg-cocoa-950 text-cream-100/60 hover:text-terracotta-400 disabled:opacity-30"><Trash2 size={14} /></button>
                <button onClick={addSpread} className="grid h-8 w-8 place-items-center rounded-lg bg-terracotta-500 text-cream-50 hover:bg-terracotta-600"><Plus size={15} /></button>
              </div>
            </div>
          </div>
        </main>

        {/* Direita: propriedades + layouts + fundos */}
        <aside className="w-72 shrink-0 space-y-4 overflow-y-auto border-l border-cream-100/10 bg-cocoa-950 p-4">
          <PainelPropriedadesEl el={sel} onChange={changeEl} onDelete={delEl} onDuplicar={dupEl} onCamada={camadaEl} />
          <div className="rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-cream-100/40"><LayoutGrid size={13} /> Layout completo</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {TEMPLATES_COMPLETOS.map((t) => (
                <button key={t.id} onClick={() => aplicarTpl(t.id)} className="rounded-lg bg-cocoa-950 px-2 py-2 text-left text-xs text-cream-100/70 transition hover:bg-cocoa-800 hover:text-cream-100">{t.nome}</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-cream-100/40"><Palette size={13} /> Fundo (papel)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FUNDOS_ALBUM.map((f) => (
                <button key={f.id} onClick={() => trocarFundo(f.id)} title={f.nome} className={'h-8 w-8 rounded-full ring-2 transition ' + (spread.fundo === f.id ? 'ring-terracotta-400' : 'ring-cream-100/15 hover:ring-cream-100/40')} style={{ background: f.cor }} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {galeriaAberta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGaleriaAberta(false)} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-cocoa-900 p-6 ring-1 ring-cream-100/10">
              <div className="flex items-center justify-between"><h3 className="font-serif text-2xl">Inserir foto</h3><button onClick={() => setGaleriaAberta(false)} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button></div>
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {fotos.map((f) => (
                  <button key={f.id} onClick={() => { addEl(elFoto(f.src)); setGaleriaAberta(false) }} className="aspect-square overflow-hidden rounded-lg ring-1 ring-cream-100/10 transition hover:ring-terracotta-400">
                    <img src={f.src} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
        {editandoTexto && <ModalTexto el={editandoTexto} onClose={() => setEditandoTexto(null)} onSalvar={(t) => { changeEl(editandoTexto.id, { texto: t }); setEditandoTexto(null) }} />}
      </AnimatePresence>
    </div>
  )
}

function BtnInserir({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} title={label} className="inline-flex items-center gap-1.5 rounded-lg bg-cocoa-950 px-2.5 py-2 text-xs text-cream-100/80 transition hover:bg-terracotta-500 hover:text-cream-50">
      <Icon size={14} /> {label && <span className="hidden md:inline">{label}</span>}
    </button>
  )
}

function MiniSpread({ spread }) {
  return (
    <div className="relative h-full w-full">
      {[...(spread.elementos || [])].sort((a, b) => (a.z || 0) - (b.z || 0)).map((el) => {
        const st = { position: 'absolute', left: el.x + '%', top: el.y + '%', width: el.w + '%', height: el.h + '%', opacity: el.opacidade != null ? el.opacidade : 1 }
        if (el.tipo === 'foto') return <img key={el.id} src={el.src} style={st} className="object-cover" />
        if (el.tipo === 'forma') return <div key={el.id} style={{ ...st, background: el.forma === 'linha' ? el.bordaCor : el.cor, borderRadius: el.forma === 'circulo' ? '50%' : 0 }} />
        return <div key={el.id} style={{ ...st, fontSize: 5, color: el.cor, fontFamily: fonteCss(el.fonte), overflow: 'hidden' }}>{el.texto}</div>
      })}
    </div>
  )
}

function ModalTexto({ el, onClose, onSalvar }) {
  const [t, setT] = useState(el.texto)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[75] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <h3 className="font-serif text-2xl">Editar texto</h3>
        <textarea autoFocus rows={3} value={t} onChange={(e) => setT(e.target.value)} className="mt-4 w-full resize-none rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400" />
        <button onClick={() => onSalvar(t)} className="btn-light mt-5 w-full"><Check size={16} /> Salvar</button>
      </motion.div>
    </motion.div>
  )
}

function Preview({ album, onFechar }) {
  const [p, setP] = useState(0)
  const spreads = album.spreads || []
  const sp = spreads[p]
  const fundoCor = (FUNDOS_ALBUM.find((f) => f.id === sp.fundo) || FUNDOS_ALBUM[0]).cor
  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-cocoa-950 p-6">
      <button onClick={onFechar} className="absolute right-6 top-6 text-cream-100/60 hover:text-cream-100"><X size={28} /></button>
      <p className="mb-4 font-serif text-xl text-cream-100">{album.nome}</p>
      <AnimatePresence mode="wait">
        <motion.div key={sp.id} initial={{ opacity: 0, rotateY: 18 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -18 }} transition={{ duration: 0.4 }} className="relative w-full shadow-2xl" style={{ maxWidth: 1100, aspectRatio: String(album.ratio || 2), background: fundoCor, maxHeight: '78vh' }}>
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/10" />
          {[...(sp.elementos || [])].sort((a, b) => (a.z || 0) - (b.z || 0)).map((el) => {
            const st = { position: 'absolute', left: el.x + '%', top: el.y + '%', width: el.w + '%', height: el.h + '%', transform: 'rotate(' + (el.rot || 0) + 'deg)', opacity: el.opacidade != null ? el.opacidade : 1 }
            if (el.tipo === 'foto') return <img key={el.id} src={el.src} style={{ ...st, borderRadius: (el.raio || 0) + 'px' }} className="object-cover" />
            if (el.tipo === 'forma') { const s2 = { ...st, background: el.forma === 'linha' ? el.bordaCor : el.cor, borderRadius: el.forma === 'circulo' ? '50%' : (el.raio || 0) + 'px', border: el.borda ? el.borda + 'px solid ' + el.bordaCor : 'none' }; return <div key={el.id} style={s2} /> }
            return <div key={el.id} style={{ ...st, display: 'flex', alignItems: 'center', justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center', fontFamily: fonteCss(el.fonte), fontSize: (el.tamanho * 0.8) + 'px', color: el.cor, fontWeight: el.peso, fontStyle: el.italico ? 'italic' : 'normal', textAlign: el.align, lineHeight: 1.15 }}>{el.texto}</div>
          })}
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex items-center gap-4">
        <button onClick={() => setP((v) => Math.max(0, v - 1))} disabled={p === 0} className="grid h-11 w-11 place-items-center rounded-full bg-cream-100/10 text-cream-100 hover:bg-cream-100/20 disabled:opacity-30"><ChevronLeft size={22} /></button>
        <span className="text-sm text-cream-100/70">{p === 0 ? 'Capa' : 'Página ' + p} de {spreads.length - 1}</span>
        <button onClick={() => setP((v) => Math.min(spreads.length - 1, v + 1))} disabled={p === spreads.length - 1} className="grid h-11 w-11 place-items-center rounded-full bg-cream-100/10 text-cream-100 hover:bg-cream-100/20 disabled:opacity-30"><ChevronRight size={22} /></button>
      </div>
    </div>
  )
}
