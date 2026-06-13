import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, AlertCircle, Plus, Pencil, Trash2, X } from 'lucide-react'
import { TAREFAS_DEMO, CLIENTES } from '../../data/crm'
import { useApp } from '../../context/AppContext'

const PRIORIDADE = {
  alta: { label: 'Alta', cls: 'bg-terracotta-500/15 text-terracotta-400' },
  media: { label: 'Média', cls: 'bg-amber-400/15 text-amber-300' },
  baixa: { label: 'Baixa', cls: 'bg-cream-100/10 text-cream-100/50' },
}
const HOJE = '2026-06-10'

export default function Tarefas() {
  const { tarefasFeitas, tarefasCustom, tarefasEdit, tarefasExcluidas, toggleTarefa, adicionarTarefa, editarTarefa, excluirTarefa } = useApp()
  const [editando, setEditando] = useState(null) // tarefa em edição/criação

  // Monta a lista final: base (com edições aplicadas, sem excluídas) + custom
  const base = TAREFAS_DEMO
    .filter((t) => !tarefasExcluidas[t.id])
    .map((t) => ({ ...t, ...(tarefasEdit[t.id] || {}), custom: false }))
  const todas = [...tarefasCustom.map((t) => ({ ...t, custom: true })), ...base]

  const estaFeita = (t) => (tarefasFeitas[t.id] !== undefined ? tarefasFeitas[t.id] : t.feita)
  const nomeCliente = (id) => {
    const c = CLIENTES.find((x) => x.id === id)
    return c ? c.nome : 'Geral'
  }

  const pendentes = todas.filter((t) => !estaFeita(t))
  const feitas = todas.filter((t) => estaFeita(t))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Tarefas & lembretes</h1>
          <p className="mt-1 text-sm text-cream-100/60">{pendentes.length} pendente(s). Clique numa tarefa para editar.</p>
        </div>
        <button onClick={() => setEditando({ novo: true, texto: '', clienteId: '', prazo: HOJE, prioridade: 'media' })} className="btn-light !py-2.5 text-xs">
          <Plus size={15} /> Nova tarefa
        </button>
      </div>

      <div className="mt-6 space-y-2.5">
        <AnimatePresence>
          {pendentes.map((t) => (
            <Linha key={t.id} t={t} feita={false} cliente={nomeCliente(t.clienteId)} onToggle={() => toggleTarefa(t.id)} onEditar={() => setEditando(t)} onExcluir={() => excluirTarefa(t.id, t.custom)} />
          ))}
        </AnimatePresence>
        {pendentes.length === 0 && <p className="rounded-2xl bg-cocoa-900 p-6 text-center text-sm text-cream-100/40 ring-1 ring-cream-100/10">Tudo em dia! 🎉</p>}
      </div>

      {feitas.length > 0 && (
        <>
          <h3 className="mt-8 text-sm font-medium uppercase tracking-wide text-cream-100/40">Concluídas</h3>
          <div className="mt-3 space-y-2.5">
            {feitas.map((t) => (
              <Linha key={t.id} t={t} feita cliente={nomeCliente(t.clienteId)} onToggle={() => toggleTarefa(t.id)} onEditar={() => setEditando(t)} onExcluir={() => excluirTarefa(t.id, t.custom)} />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {editando && (
          <EditorTarefa
            tarefa={editando}
            onClose={() => setEditando(null)}
            onSalvar={(campos) => {
              if (editando.novo) adicionarTarefa(campos)
              else editarTarefa(editando.id, campos, editando.custom)
              setEditando(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Linha({ t, feita, cliente, onToggle, onEditar, onExcluir }) {
  const pr = PRIORIDADE[t.prioridade] || PRIORIDADE.baixa
  const atrasada = !feita && t.prazo && new Date(t.prazo) < new Date(HOJE)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={'group flex items-center gap-3 rounded-2xl p-4 ring-1 transition ' + (feita ? 'bg-cocoa-900/30 ring-cream-100/5' : 'bg-cocoa-900 ring-cream-100/10 hover:ring-cream-100/20')}
    >
      <button onClick={onToggle} className={'grid h-6 w-6 shrink-0 place-items-center rounded-full transition ' + (feita ? 'bg-clay-400 text-cream-50' : 'ring-1 ring-cream-100/30 hover:ring-terracotta-400')}>
        {feita && <Check size={14} />}
      </button>
      <button onClick={onEditar} className="min-w-0 flex-1 text-left">
        <p className={'text-sm ' + (feita ? 'text-cream-100/40 line-through' : 'text-cream-100')}>{t.texto}</p>
        <p className="text-xs text-cream-100/40">{cliente}{t.custom && ' · manual'}</p>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        {atrasada && <span className="flex items-center gap-1 text-xs text-terracotta-400"><AlertCircle size={12} /> atrasada</span>}
        {t.prazo && <span className="hidden items-center gap-1 text-xs text-cream-100/40 sm:flex"><Clock size={12} /> {new Date(t.prazo + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
        <span className={'rounded-full px-2.5 py-1 text-xs ' + pr.cls}>{pr.label}</span>
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={onEditar} className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/40 hover:bg-cocoa-800 hover:text-cream-100"><Pencil size={13} /></button>
          <button onClick={onExcluir} className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/40 hover:bg-terracotta-500/20 hover:text-terracotta-400"><Trash2 size={13} /></button>
        </div>
      </div>
    </motion.div>
  )
}

function EditorTarefa({ tarefa, onClose, onSalvar }) {
  const [texto, setTexto] = useState(tarefa.texto || '')
  const [clienteId, setClienteId] = useState(tarefa.clienteId || '')
  const [prazo, setPrazo] = useState(tarefa.prazo || HOJE)
  const [prioridade, setPrioridade] = useState(tarefa.prioridade || 'media')

  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{tarefa.novo ? 'Nova tarefa' : 'Editar tarefa'}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm text-cream-100/80">O que precisa ser feito?</span>
            <textarea rows={2} className={inp + ' resize-none'} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex: Ligar para confirmar o ensaio" />
          </label>
          <label className="block">
            <span className="text-sm text-cream-100/80">Relacionado a</span>
            <select className={inp} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Geral (sem cliente)</option>
              {CLIENTES.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-cream-100/80">Prazo</span>
              <input type="date" className={inp} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-cream-100/80">Prioridade</span>
              <select className={inp} value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </label>
          </div>
        </div>

        <button onClick={() => texto.trim() && onSalvar({ texto: texto.trim(), clienteId, prazo, prioridade })} disabled={!texto.trim()} className="btn-light mt-7 w-full disabled:opacity-40">
          <Check size={16} /> {tarefa.novo ? 'Criar tarefa' : 'Salvar alterações'}
        </button>
      </motion.div>
    </motion.div>
  )
}
