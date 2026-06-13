import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Check, Plus, X, Send, MessageCircle, Pencil, Eye, Copy,
  ChevronRight, User, Calendar, DollarSign, Trash2, FileUp, FilePlus,
  LayoutTemplate, Download, Search,
} from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { CONTRATOS_DEMO, MODELOS_CONTRATO, CLIENTES, montarContrato } from '../../data/crm'
import { useApp } from '../../context/AppContext'

const STATUS = {
  assinado: { label: 'Assinado', cls: 'bg-clay-400/15 text-clay-300', icon: Check },
  enviado: { label: 'Aguardando assinatura', cls: 'bg-amber-400/15 text-amber-300', icon: Send },
  rascunho: { label: 'Rascunho', cls: 'bg-cream-100/10 text-cream-100/50', icon: FileText },
}
const LINK_BASE = 'almafotografia.com.br/assinar/'

export default function Contratos() {
  const { contratosEdit, contratosCustom, contratosExcluido, enviarContrato, atualizarContrato, criarContrato, excluirContrato } = useApp()
  const [aberto, setAberto] = useState(null)
  const [editando, setEditando] = useState(null)
  const [enviar, setEnviar] = useState(null)
  const [novo, setNovo] = useState(false)
  const [busca, setBusca] = useState('')

  // Lista mesclada: custom (criados) + demo (com edições, sem excluídos)
  const contratos = [
    ...contratosCustom.map((c) => ({ ...c, custom: true })),
    ...CONTRATOS_DEMO.filter((c) => !contratosExcluido[c.id]).map((c) => ({ ...c, ...(contratosEdit[c.id] || {}), custom: false })),
  ]
  const filtrados = busca.trim()
    ? contratos.filter((c) => ((c.modelo || c.titulo || '') + ' ' + (c.clienteNome || '')).toLowerCase().includes(busca.toLowerCase()))
    : contratos
  const assinados = contratos.filter((c) => c.status === 'assinado').length
  const aguardando = contratos.filter((c) => c.status === 'enviado').length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Contratos</h1>
          <p className="mt-1 text-sm text-cream-100/60">{assinados} assinado(s) · {aguardando} aguardando. Crie de modelo, do zero ou via PDF.</p>
        </div>
        <button onClick={() => setNovo(true)} className="btn-light !py-2.5 text-xs"><Plus size={15} /> Novo contrato</button>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-cocoa-900 px-4 py-2.5 ring-1 ring-cream-100/10">
        <Search size={16} className="text-cream-100/40" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por cliente ou tipo de contrato..." className="flex-1 bg-transparent text-sm text-cream-100 outline-none placeholder:text-cream-100/30" />
        {busca && <button onClick={() => setBusca('')} className="text-cream-100/40 hover:text-cream-100"><X size={15} /></button>}
      </div>

      <div className="mt-4 space-y-3">
        {filtrados.map((c) => {
          const st = STATUS[c.status] || STATUS.rascunho
          const Icon = st.icon
          return (
            <button key={c.id} onClick={() => setAberto(c)} className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl bg-cocoa-900 p-5 text-left ring-1 ring-cream-100/10 transition hover:-translate-y-0.5 hover:ring-terracotta-400/40">
              <div className="flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-cocoa-950 text-terracotta-400">{c.pdf ? <FileUp size={20} /> : <FileText size={20} />}</div>
                <div>
                  <p className="font-medium">{c.modelo || c.titulo}{c.pdf && <span className="ml-2 text-xs text-cream-100/30">(PDF)</span>}</p>
                  <p className="text-xs text-cream-100/50">{c.clienteNome} · {c.valor ? formatBRL(c.valor) : 'sem valor'}{c.assinadoEm && ' · assinado ' + new Date(c.assinadoEm + 'T12:00').toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ' + st.cls}><Icon size={12} /> {st.label}</span>
                <ChevronRight size={16} className="text-cream-100/30" />
              </div>
            </button>
          )
        })}
        {filtrados.length === 0 && <p className="rounded-2xl bg-cocoa-900 p-6 text-center text-sm text-cream-100/40 ring-1 ring-cream-100/10">Nenhum contrato encontrado.</p>}
      </div>

      <AnimatePresence>
        {aberto && (
          <DetalheContrato
            contrato={contratos.find((c) => c.id === aberto.id)}
            onClose={() => setAberto(null)}
            onEditar={() => { setEditando(aberto); setAberto(null) }}
            onEnviar={() => { setEnviar(aberto); setAberto(null) }}
            onExcluir={() => { excluirContrato(aberto.id, aberto.custom); setAberto(null) }}
          />
        )}
        {enviar && (
          <ModalEnviar contrato={enviar} onClose={() => setEnviar(null)}
            onConfirmar={(notif) => { enviarContrato(enviar.id, notif, enviar.custom); setEnviar(null) }}
            onAssinarAgora={() => { setEnviar(null); setAberto(contratos.find((c) => c.id === enviar.id)) }} />
        )}
        {editando && (
          <EditorContrato contrato={editando} onClose={() => setEditando(null)}
            onSalvar={(campos) => { atualizarContrato(editando.id, campos, editando.custom); setEditando(null) }} />
        )}
        {novo && <NovoContrato onClose={() => setNovo(false)} onCriar={(c) => { criarContrato(c); setNovo(false) }} />}
      </AnimatePresence>
    </div>
  )
}

// Retorna as cláusulas a exibir: custom usa as próprias; demo monta do template
function clausulasDe(contrato) {
  if (contrato.clausulas && contrato.clausulas.length) {
    return contrato.clausulas.map((cl) => cl
      .replace(/\{\{cliente\}\}/g, contrato.clienteNome || '—')
      .replace(/\{\{valor\}\}/g, contrato.valor ? formatBRL(contrato.valor) : '—')
      .replace(/\{\{data\}\}/g, contrato.criado ? new Date(contrato.criado + 'T12:00').toLocaleDateString('pt-BR') : '—')
      .replace(/\{\{ensaio\}\}/g, contrato.ensaio || 'o ensaio contratado'))
  }
  return montarContrato(contrato.modelo, {
    cliente: contrato.clienteNome, valor: formatBRL(contrato.valor),
    data: contrato.criado ? new Date(contrato.criado + 'T12:00').toLocaleDateString('pt-BR') : '—',
    ensaio: contrato.ensaio || 'o ensaio contratado',
  })
}

function DetalheContrato({ contrato, onClose, onEditar, onEnviar, onExcluir }) {
  const st = STATUS[contrato.status] || STATUS.rascunho
  const clausulas = clausulasDe(contrato)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-cocoa-900 ring-1 ring-cream-100/10">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-cocoa-900/95 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cocoa-950 text-terracotta-400">{contrato.pdf ? <FileUp size={22} /> : <FileText size={22} />}</div>
            <div>
              <h3 className="font-serif text-2xl">{contrato.modelo || contrato.titulo}</h3>
              <span className={'mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ' + st.cls}><st.icon size={11} /> {st.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-2.5">
            <Pill icon={User} texto={contrato.clienteNome} />
            <Pill icon={DollarSign} texto={contrato.valor ? formatBRL(contrato.valor) : '—'} />
            <Pill icon={Calendar} texto={'Criado ' + (contrato.criado ? new Date(contrato.criado + 'T12:00').toLocaleDateString('pt-BR') : '—')} />
            <Pill icon={MessageCircle} texto={contrato.telefone || '—'} />
          </div>

          {/* PDF anexado OU corpo de cláusulas */}
          {contrato.pdf ? (
            <div className="mt-5 rounded-2xl bg-cream-50 p-6 text-center text-cocoa-800">
              <FileUp size={36} className="mx-auto text-clay-500" />
              <p className="mt-3 font-medium">{contrato.pdfNome || 'contrato.pdf'}</p>
              <p className="text-sm text-cocoa-500">Contrato em PDF anexado</p>
              <a href={contrato.pdf} download={contrato.pdfNome || 'contrato.pdf'} className="btn-outline mt-4 !py-2.5 text-xs"><Download size={14} /> Baixar PDF</a>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-cream-50 p-6 text-cocoa-800">
              <p className="text-center font-serif text-lg">{contrato.titulo || 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS'}</p>
              <p className="mt-1 text-center text-xs text-cocoa-500">Alma Fotografia · Boa Vista do Buricá/RS</p>
              <div className="mt-4 space-y-3">
                {clausulas.map((cl, i) => (
                  <p key={i} className="text-sm leading-relaxed"><strong>Cláusula {i + 1}ª.</strong> {cl}</p>
                ))}
              </div>
              <div className="mt-6 border-t border-cocoa-800/10 pt-4 text-center">
                {contrato.assinatura ? (
                  <div>
                    <img src={contrato.assinatura} alt="Assinatura" className="mx-auto h-20" />
                    <p className="mt-1 border-t border-cocoa-800/20 pt-1 text-xs text-cocoa-500">{contrato.clienteNome} · assinado em {contrato.assinadoEm && new Date(contrato.assinadoEm + 'T12:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                ) : contrato.status === 'assinado' ? (
                  <p className="font-serif text-lg italic text-clay-500">✓ Assinado eletronicamente</p>
                ) : (
                  <p className="text-sm text-cocoa-400">Aguardando assinatura do cliente</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            {contrato.status !== 'assinado' && (
              <>
                <button onClick={onEnviar} className="btn-light flex-1 !py-2.5 text-xs"><MessageCircle size={14} /> Enviar por WhatsApp</button>
                {!contrato.pdf && <button onClick={onEditar} className="inline-flex items-center justify-center gap-2 rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100/70 transition hover:bg-cocoa-700"><Pencil size={14} /> Editar</button>}
              </>
            )}
            {contrato.status === 'assinado' && (
              <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-clay-400/15 px-4 py-2.5 text-xs text-clay-300"><Check size={14} /> Contrato assinado e válido</span>
            )}
            <button onClick={onExcluir} className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta-500/10 px-4 py-2.5 text-xs text-terracotta-400 transition hover:bg-terracotta-500/20"><Trash2 size={14} /> Excluir</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Pill({ icon: Icon, texto }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-cocoa-950 px-3 py-2.5 text-xs text-cream-100/70">
      <Icon size={13} className="shrink-0 text-terracotta-400" /> <span className="truncate">{texto}</span>
    </div>
  )
}

function ModalEnviar({ contrato, onClose, onConfirmar, onAssinarAgora }) {
  const link = LINK_BASE + contrato.id
  const primeiroNome = (contrato.clienteNome || '').split(' ')[0] || contrato.clienteNome
  const msg = 'Olá, ' + primeiroNome + '! 💛 Aqui é da Alma Fotografia. Preparamos o seu contrato (' + (contrato.modelo || contrato.titulo) + '). É rapidinho: abra o link, leia e assine pelo celular: ' + link + ' — qualquer dúvida estamos à disposição!'
  const wa = 'https://wa.me/55' + (contrato.telefone || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg)
  const [copiado, setCopiado] = useState(false)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-2xl"><MessageCircle size={22} className="text-[#25D366]" /> Enviar p/ assinatura</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/50">Para {contrato.clienteNome} · {contrato.telefone || 'sem telefone'}</p>
        <div className="mt-4 rounded-2xl rounded-bl-sm bg-[#25D366]/10 p-4 ring-1 ring-[#25D366]/20"><p className="text-sm leading-relaxed text-cream-100/90">{msg}</p></div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-cocoa-950 p-3">
          <span className="flex-1 truncate font-mono text-xs text-cream-100/60">{link}</span>
          <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }} className="inline-flex items-center gap-1 rounded-lg bg-cocoa-800 px-2.5 py-1.5 text-xs text-cream-100/70 hover:text-cream-100"><Copy size={12} /> {copiado ? 'Copiado!' : 'Copiar'}</button>
        </div>
        <div className="mt-5 space-y-2.5">
          <a href={wa} target="_blank" rel="noreferrer" onClick={() => onConfirmar({ tipo: 'contrato', cliente: contrato.clienteNome, texto: msg })} className="btn-light flex w-full items-center justify-center gap-2"><MessageCircle size={16} /> Abrir WhatsApp e enviar</a>
          <button onClick={onAssinarAgora} className="flex w-full items-center justify-center gap-2 rounded-full bg-cocoa-800 py-2.5 text-xs text-cream-100/60 transition hover:bg-cocoa-700"><Eye size={14} /> Simular: abrir a página de assinatura</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Editor: edita modelo/valor/ensaio E as cláusulas (add/remover)
function EditorContrato({ contrato, onClose, onSalvar }) {
  const [titulo, setTitulo] = useState(contrato.titulo || contrato.modelo || '')
  const [valor, setValor] = useState(contrato.valor || '')
  const [ensaio, setEnsaio] = useState(contrato.ensaio || '')
  const [clausulas, setClausulas] = useState(() => {
    if (contrato.clausulas && contrato.clausulas.length) return [...contrato.clausulas]
    const m = MODELOS_CONTRATO.find((x) => x.nome === contrato.modelo)
    return m ? [...m.clausulas] : ['']
  })
  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  const setCl = (i, v) => setClausulas((a) => a.map((c, idx) => (idx === i ? v : c)))
  const addCl = () => setClausulas((a) => [...a, ''])
  const rmCl = (i) => setClausulas((a) => a.filter((_, idx) => idx !== i))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Editar contrato</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/50">{contrato.clienteNome}</p>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">Título do contrato</span><input className={inp} value={titulo} onChange={(e) => setTitulo(e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Valor (R$)</span><input type="number" className={inp} value={valor} onChange={(e) => setValor(+e.target.value)} /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Ensaio / objeto</span><input className={inp} value={ensaio} onChange={(e) => setEnsaio(e.target.value)} /></label>
          </div>
          <div>
            <div className="flex items-center justify-between"><span className="text-sm text-cream-100/80">Cláusulas</span><button onClick={addCl} className="inline-flex items-center gap-1 text-xs text-terracotta-400 hover:underline"><Plus size={12} /> Adicionar</button></div>
            <div className="mt-2 space-y-2">
              {clausulas.map((cl, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-3 text-xs text-cream-100/40">{i + 1}ª</span>
                  <textarea rows={2} className="flex-1 resize-none rounded-xl border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400" value={cl} onChange={(e) => setCl(i, e.target.value)} placeholder="Texto da cláusula... (use {{cliente}}, {{valor}}, {{data}}, {{ensaio}})" />
                  <button onClick={() => rmCl(i)} className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-cream-100/40 hover:bg-terracotta-500/20 hover:text-terracotta-400"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => onSalvar({ titulo, modelo: titulo, valor, ensaio, clausulas: clausulas.filter((c) => c.trim()) })} className="btn-light mt-7 w-full"><Check size={16} /> Salvar contrato</button>
        <p className="mt-2 text-center text-xs text-cream-100/40">Dica: variáveis {'{'}{'{'}{'cliente'}{'}'}{'}'}, {'{'}{'{'}{'valor'}{'}'}{'}'}, {'{'}{'{'}{'data'}{'}'}{'}'} são preenchidas automaticamente.</p>
      </motion.div>
    </motion.div>
  )
}

// NOVO contrato: 3 modos
function NovoContrato({ onClose, onCriar }) {
  const [modo, setModo] = useState('template') // template | zero | pdf
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')
  const [ensaio, setEnsaio] = useState('')
  // template
  const [modeloId, setModeloId] = useState('')
  // zero
  const [titulo, setTitulo] = useState('')
  const [clausulas, setClausulas] = useState([''])
  // pdf
  const [pdf, setPdf] = useState(null)
  const [pdfNome, setPdfNome] = useState('')
  const fileRef = useRef(null)

  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'
  const clienteObj = CLIENTES.find((c) => c.id === cliente)

  const onPdf = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setPdfNome(f.name)
    const reader = new FileReader()
    reader.onload = () => setPdf(reader.result)
    reader.readAsDataURL(f)
  }

  const setCl = (i, v) => setClausulas((a) => a.map((c, idx) => (idx === i ? v : c)))
  const podeColar = cliente && (
    (modo === 'template' && modeloId) ||
    (modo === 'zero' && titulo.trim() && clausulas.some((c) => c.trim())) ||
    (modo === 'pdf' && pdf)
  )

  const criar = () => {
    const base = {
      cliente, clienteNome: clienteObj ? clienteObj.nome : '', telefone: clienteObj ? clienteObj.telefone : '',
      valor: +valor || 0, ensaio,
    }
    if (modo === 'template') {
      const m = MODELOS_CONTRATO.find((x) => x.id === modeloId)
      onCriar({ ...base, modelo: m.nome, titulo: m.nome, clausulas: [...m.clausulas] })
    } else if (modo === 'zero') {
      onCriar({ ...base, modelo: titulo, titulo, clausulas: clausulas.filter((c) => c.trim()) })
    } else {
      onCriar({ ...base, modelo: pdfNome.replace('.pdf', ''), titulo: pdfNome, pdf, pdfNome })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Novo contrato</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        {/* Seletor de modo */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[['template', 'De modelo', LayoutTemplate], ['zero', 'Do zero', FilePlus], ['pdf', 'Upload PDF', FileUp]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setModo(id)} className={'flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs transition ' + (modo === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-950 text-cream-100/60 hover:text-cream-100')}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        {/* Cliente (comum) */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block"><span className="text-sm text-cream-100/80">Cliente</span><select className={inp} value={cliente} onChange={(e) => setCliente(e.target.value)}><option value="">Selecione...</option>{CLIENTES.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          <label className="block"><span className="text-sm text-cream-100/80">Valor (R$)</span><input type="number" className={inp} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
        </div>

        {/* Conteúdo por modo */}
        {modo === 'template' && (
          <div className="mt-4 space-y-4">
            <label className="block"><span className="text-sm text-cream-100/80">Modelo</span><select className={inp} value={modeloId} onChange={(e) => setModeloId(e.target.value)}><option value="">Selecione...</option>{MODELOS_CONTRATO.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
            <label className="block"><span className="text-sm text-cream-100/80">Ensaio / objeto</span><input className={inp} value={ensaio} onChange={(e) => setEnsaio(e.target.value)} placeholder="Ex: Casamento" /></label>
            {modeloId && <p className="rounded-xl bg-cocoa-950 p-3 text-xs text-cream-100/50">As cláusulas do modelo serão preenchidas com os dados do cliente. Você pode editá-las depois.</p>}
          </div>
        )}

        {modo === 'zero' && (
          <div className="mt-4 space-y-4">
            <label className="block"><span className="text-sm text-cream-100/80">Título do contrato</span><input className={inp} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato de Ensaio Personalizado" /></label>
            <div>
              <div className="flex items-center justify-between"><span className="text-sm text-cream-100/80">Cláusulas</span><button onClick={() => setClausulas((a) => [...a, ''])} className="inline-flex items-center gap-1 text-xs text-terracotta-400 hover:underline"><Plus size={12} /> Adicionar cláusula</button></div>
              <div className="mt-2 space-y-2">
                {clausulas.map((cl, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-3 text-xs text-cream-100/40">{i + 1}ª</span>
                    <textarea rows={2} className="flex-1 resize-none rounded-xl border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400" value={cl} onChange={(e) => setCl(i, e.target.value)} placeholder="Texto da cláusula..." />
                    {clausulas.length > 1 && <button onClick={() => setClausulas((a) => a.filter((_, idx) => idx !== i))} className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-cream-100/40 hover:bg-terracotta-500/20 hover:text-terracotta-400"><Trash2 size={13} /></button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {modo === 'pdf' && (
          <div className="mt-4">
            <input ref={fileRef} type="file" accept="application/pdf" onChange={onPdf} className="hidden" />
            <button onClick={() => fileRef.current && fileRef.current.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-cream-100/15 p-8 text-center transition hover:border-terracotta-400/50">
              <FileUp size={28} className="text-terracotta-400" />
              <span className="text-sm text-cream-100/70">{pdfNome || 'Clique para selecionar um PDF'}</span>
              {pdf && <span className="text-xs text-clay-300">✓ PDF carregado</span>}
            </button>
          </div>
        )}

        <button onClick={criar} disabled={!podeColar} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> Criar contrato</button>
      </motion.div>
    </motion.div>
  )
}
