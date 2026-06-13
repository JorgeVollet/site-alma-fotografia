import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Workflow as WfIcon, Check, Clock, AlertTriangle, User, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { WORKFLOW_ETAPAS, PROJETOS_DEMO, EQUIPE_CRM } from '../../data/crm'
import { useApp } from '../../context/AppContext'

const HOJE = '2026-06-10'

export default function Workflow() {
  const { workflowOverride, avancarEtapa, voltarEtapa, delegarProjeto } = useApp()
  const [aberto, setAberto] = useState(null)

  const projetos = PROJETOS_DEMO.map((p) => ({ ...p, ...(workflowOverride[p.id] || {}) }))
  const membro = (id) => EQUIPE_CRM.find((m) => m.id === id)
  const etapaInfo = (id) => WORKFLOW_ETAPAS.find((e) => e.id === id)

  return (
    <div>
      <h1 className="font-serif text-3xl">Fluxo de trabalho</h1>
      <p className="mt-1 text-sm text-cream-100/60">Acompanhe cada projeto por etapa, com prazos e responsáveis. Clique para gerenciar.</p>

      <div className="mt-6 space-y-3">
        {projetos.map((p) => {
          const idx = WORKFLOW_ETAPAS.findIndex((e) => e.id === p.etapa)
          const total = WORKFLOW_ETAPAS.length
          const pct = Math.round(((idx + 1) / total) * 100)
          const resp = membro(p.responsavel)
          const atrasado = p.prazo < HOJE
          return (
            <button key={p.id} onClick={() => setAberto(p)} className="block w-full rounded-2xl bg-cocoa-900 p-5 text-left ring-1 ring-cream-100/10 transition hover:ring-terracotta-400/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{p.clienteNome}</p>
                  <p className="flex items-center gap-2 text-xs text-cream-100/50">
                    Etapa: <span className="text-terracotta-400">{etapaInfo(p.etapa).nome}</span>
                    {resp && <span className="flex items-center gap-1"><User size={11} /> {resp.nome.split(' ')[0] || resp.nome}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {atrasado ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-500/15 px-2.5 py-1 text-xs text-terracotta-400"><AlertTriangle size={11} /> atrasado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream-100/10 px-2.5 py-1 text-xs text-cream-100/60"><Clock size={11} /> {new Date(p.prazo + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  )}
                  <ChevronRight size={16} className="text-cream-100/30" />
                </div>
              </div>
              {/* Barra de etapas */}
              <div className="mt-4 flex items-center gap-1">
                {WORKFLOW_ETAPAS.map((e, i) => (
                  <div key={e.id} className={'h-1.5 flex-1 rounded-full ' + (i <= idx ? 'bg-terracotta-500' : 'bg-cocoa-950')} />
                ))}
              </div>
              <p className="mt-1.5 text-right text-xs text-cream-100/40">{pct}% · etapa {idx + 1} de {total}</p>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {aberto && (
          <ModalProjeto
            projeto={projetos.find((p) => p.id === aberto.id)}
            onClose={() => setAberto(null)}
            onAvancar={(etapaAtual) => avancarEtapa(aberto.id, etapaAtual, aberto.cliente)}
            onVoltar={(etapaAtual) => voltarEtapa(aberto.id, etapaAtual, aberto.cliente)}
            onDelegar={(uid) => delegarProjeto(aberto.id, uid)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ModalProjeto({ projeto, onClose, onAvancar, onVoltar, onDelegar }) {
  const idx = WORKFLOW_ETAPAS.findIndex((e) => e.id === projeto.etapa)
  const ultima = idx >= WORKFLOW_ETAPAS.length - 1
  const primeira = idx <= 0
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-2xl"><WfIcon size={22} className="text-terracotta-400" /> {projeto.clienteNome}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        {/* Timeline de etapas */}
        <div className="mt-6 space-y-1">
          {WORKFLOW_ETAPAS.map((e, i) => {
            const feita = i < idx
            const atual = i === idx
            return (
              <div key={e.id} className="flex items-center gap-3">
                <div className={'grid h-8 w-8 shrink-0 place-items-center rounded-full ' + (feita ? 'bg-clay-400 text-cream-50' : atual ? 'bg-terracotta-500 text-cream-50 ring-4 ring-terracotta-500/20' : 'bg-cocoa-950 text-cream-100/30')}>
                  {feita ? <Check size={15} /> : i + 1}
                </div>
                <div className="flex-1 border-b border-cream-100/5 py-2.5">
                  <p className={'text-sm ' + (atual ? 'font-medium text-cream-100' : feita ? 'text-cream-100/60' : 'text-cream-100/40')}>{e.nome}</p>
                </div>
                {atual && <span className="text-xs text-terracotta-400">atual</span>}
              </div>
            )
          })}
        </div>

        {/* Delegar */}
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-cream-100/40">Responsável pela etapa</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EQUIPE_CRM.filter((m) => m.ativo).map((m) => (
              <button key={m.id} onClick={() => onDelegar(m.id)} className={'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition ' + (projeto.responsavel === m.id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-800 text-cream-100/70 hover:bg-cocoa-700')}>
                <div className={m.avatarGrad + ' grid h-5 w-5 place-items-center rounded-full text-[9px] text-cream-50'}>{m.nome.charAt(0)}</div>
                {m.nome.split(' ')[0] || m.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 space-y-2.5">
          {!primeira && (
            <button onClick={() => onVoltar(projeto.etapa)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa-800 py-2.5 text-sm text-cream-100/70 transition hover:bg-cocoa-700">
              <ChevronLeft size={15} /> Voltar para "{WORKFLOW_ETAPAS[idx - 1].nome}"
            </button>
          )}
          {!ultima ? (
            <button onClick={() => onAvancar(projeto.etapa)} className="btn-light w-full"><ChevronRight size={16} /> Avançar para "{WORKFLOW_ETAPAS[idx + 1].nome}"</button>
          ) : (
            <p className="rounded-xl bg-clay-400/10 p-4 text-center text-sm text-clay-300">✓ Etapa final — cliente movido para "entregue" no funil!</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
