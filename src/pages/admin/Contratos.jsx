import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Check, Plus, X, Send, MessageCircle, Pencil,
  ChevronRight, User, Calendar, DollarSign, Trash2, FileUp,
  Download, Search,
} from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { MODELOS_CONTRATO, montarContrato } from '../../data/crm'
import { useApp } from '../../context/AppContext'
import { urlContratoAssinada } from '../../lib/contratos'
import NovoContrato, { ModalEnviar } from '../../components/contratos/NovoContrato'

const STATUS = {
  assinado: { label: 'Assinado', cls: 'bg-clay-400/15 text-clay-300', icon: Check },
  enviado: { label: 'Aguardando assinatura', cls: 'bg-amber-400/15 text-amber-300', icon: Send },
  rascunho: { label: 'Rascunho', cls: 'bg-cream-100/10 text-cream-100/50', icon: FileText },
}

export default function Contratos() {
  const { contratos, enviarContrato, atualizarContrato, criarContrato, excluirContrato, assinarContrato, recarregarCRM } = useApp()
  // Reflete no admin o que foi assinado pela página pública (status + funil + conta),
  // já que não há realtime: ao abrir Contratos, refaz a busca do banco.
  useEffect(() => { recarregarCRM() }, [recarregarCRM])
  const [aberto, setAberto] = useState(null)
  const [editando, setEditando] = useState(null)
  const [enviar, setEnviar] = useState(null)
  const [novo, setNovo] = useState(false)
  const [busca, setBusca] = useState('')

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

      <AnimatePresence mode="wait">
        {aberto && (
          <DetalheContrato
            key="detalhe"
            contrato={contratos.find((c) => c.id === aberto.id)}
            onClose={() => setAberto(null)}
            onEditar={() => { setEditando(aberto); setAberto(null) }}
            onEnviar={() => { setEnviar(aberto); setAberto(null) }}
            onAssinar={() => { assinarContrato(aberto.id); setAberto(null) }}
            onExcluir={() => {
              // assinado apaga assinatura + recebível pendente: pede confirmação
              const aviso = aberto.status === 'assinado'
                ? 'Este contrato está ASSINADO. Excluir apaga a assinatura registrada e a cobrança pendente que ele gerou. Tem certeza?'
                : 'Excluir este contrato?'
              if (!window.confirm(aviso)) return
              excluirContrato(aberto.id)
              setAberto(null)
            }}
          />
        )}
        {enviar && (
          <ModalEnviar key="enviar" contrato={enviar} onClose={() => setEnviar(null)}
            onConfirmar={(notif) => { enviarContrato(enviar.id, notif); setEnviar(null) }}
            onAssinarAgora={() => { setEnviar(null); setAberto(contratos.find((c) => c.id === enviar.id)) }} />
        )}
        {editando && (
          <EditorContrato key="editor" contrato={editando} onClose={() => setEditando(null)}
            onSalvar={(campos) => { atualizarContrato(editando.id, campos); setEditando(null) }} />
        )}
        {novo && <NovoContrato key="novo" onClose={() => setNovo(false)} onCriar={criarContrato} onCriado={() => setNovo(false)} />}
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

function DetalheContrato({ contrato, onClose, onEditar, onEnviar, onAssinar, onExcluir }) {
  const st = STATUS[contrato.status] || STATUS.rascunho
  const clausulas = clausulasDe(contrato)
  const baixarPdf = async () => {
    const url = await urlContratoAssinada(contrato.pdfPath)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4">
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
              <button onClick={baixarPdf} className="btn-outline mt-4 !py-2.5 text-xs"><Download size={14} /> Baixar PDF</button>
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
                <button onClick={onAssinar} className="inline-flex items-center justify-center gap-2 rounded-full bg-clay-400/15 px-4 py-2.5 text-xs text-clay-300 transition hover:bg-clay-400/25"><Check size={14} /> Marcar assinado</button>
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

// ModalEnviar foi extraído para src/components/contratos/NovoContrato.jsx (reutilizável).

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4">
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

// NovoContrato foi extraído para src/components/contratos/NovoContrato.jsx (reutilizável
// também pelo EnsaioModal/ClienteModal, com cliente+ensaio pré-preenchidos).
