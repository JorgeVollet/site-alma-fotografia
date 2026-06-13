import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X, Mail, Phone, MapPin, Users, Clock, Calendar, Sparkles, FileText,
  Plus, Minus, Check, Trash2, Send, Camera, Wand2, MessageCircle, Target, DollarSign,
} from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { FUNIL_ETAPAS } from '../../data/crm'
import { useApp } from '../../context/AppContext'

// Modal contextual do cliente — muda conforme a etapa do funil
export default function ClienteModal({ cliente, etapaAtual, onClose, onMover }) {
  const etapa = etapaAtual || cliente.funil
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 ring-1 ring-cream-100/10"
      >
        {/* Cabeçalho */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-cocoa-900/95 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className={cliente.avatarGrad + ' grid h-14 w-14 place-items-center rounded-2xl font-serif text-xl text-cream-50'}>{cliente.nome.charAt(0)}</div>
            <div>
              <h2 className="font-serif text-2xl text-cream-100">{cliente.nome}</h2>
              <p className="text-sm text-cream-100/50">{cliente.interesse || (cliente.ensaios[0] && cliente.ensaios[0].titulo)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={22} /></button>
        </div>

        <div className="px-6 pb-6">
          {/* Contato sempre presente */}
          <div className="grid grid-cols-2 gap-2.5">
            <Pill icon={Phone} texto={cliente.telefone} />
            <Pill icon={Mail} texto={cliente.email} />
          </div>

          {/* Conteúdo por etapa */}
          {etapa === 'lead' && <BlocoLead cliente={cliente} />}
          {etapa === 'orcamento' && <BlocoOrcamento cliente={cliente} />}
          {etapa === 'agendado' && <BlocoAgendado cliente={cliente} />}
          {etapa === 'producao' && <BlocoProducao cliente={cliente} />}
          {etapa === 'entregue' && <BlocoEntregue cliente={cliente} />}

          {/* Mover etapa */}
          <div className="mt-6 border-t border-cream-100/10 pt-5">
            <p className="text-xs uppercase tracking-wide text-cream-100/40">Mover para etapa</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {FUNIL_ETAPAS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onMover(cliente.id, e.id)}
                  className={'rounded-full px-3 py-1.5 text-xs transition ' + (e.id === etapa ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-800 text-cream-100/70 hover:bg-cocoa-700')}
                >
                  {e.nome}
                </button>
              ))}
            </div>
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

function Secao({ icon: Icon, titulo, children }) {
  return (
    <div className="mt-5">
      <p className="flex items-center gap-2 text-sm font-medium text-cream-100"><Icon size={15} className="text-terracotta-400" /> {titulo}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div className="flex justify-between gap-3 border-b border-cream-100/5 py-2 text-sm last:border-0">
      <span className="text-cream-100/50">{label}</span>
      <span className="text-right text-cream-100/90">{valor}</span>
    </div>
  )
}

/* ---- LEAD ---- */
function BlocoLead({ cliente }) {
  const l = cliente.lead || {}
  return (
    <>
      <Secao icon={Target} titulo="Informações do lead">
        <div className="rounded-2xl bg-cocoa-950 p-4">
          <Campo label="Origem" valor={l.origem} />
          <Campo label="Primeiro contato" valor={l.primeiroContato ? new Date(l.primeiroContato + 'T12:00').toLocaleDateString('pt-BR') : '—'} />
          <Campo label="Interesse" valor={l.interesse} />
          <Campo label="Urgência" valor={l.urgencia} />
        </div>
      </Secao>
      {l.notas && (
        <Secao icon={FileText} titulo="Notas">
          <p className="rounded-2xl bg-cocoa-950 p-4 text-sm leading-relaxed text-cream-100/70">{l.notas}</p>
        </Secao>
      )}
      <div className="mt-5 flex gap-2.5">
        <a href={'https://wa.me/55' + (cliente.telefone || '').replace(/\D/g, '')} target="_blank" rel="noreferrer" className="btn-light flex-1 !py-2.5 text-xs"><MessageCircle size={14} /> Chamar no WhatsApp</a>
      </div>
    </>
  )
}

/* ---- ORÇAMENTO ---- */
function BlocoOrcamento({ cliente }) {
  const base = cliente.orcamento || { itens: [], desconto: 0 }
  const [itens, setItens] = useState(base.itens)
  const [desconto, setDesconto] = useState(base.desconto || 0)
  const [enviado, setEnviado] = useState(false)
  const [novoDesc, setNovoDesc] = useState('')
  const [novoVal, setNovoVal] = useState('')

  const subtotal = itens.reduce((s, i) => s + (i.valor || 0), 0)
  const total = Math.max(0, subtotal - desconto)

  const addItem = () => {
    if (!novoDesc.trim() || !novoVal) return
    setItens((arr) => [...arr, { desc: novoDesc.trim(), valor: +novoVal }])
    setNovoDesc(''); setNovoVal('')
  }
  const rmItem = (idx) => setItens((arr) => arr.filter((_, i) => i !== idx))

  const inp = 'rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  return (
    <Secao icon={FileText} titulo="Montar orçamento">
      <p className="mb-3 text-xs text-cream-100/50">{cliente.lead && cliente.lead.interesse}</p>
      <div className="rounded-2xl bg-cocoa-950 p-4">
        <div className="space-y-2">
          {itens.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-cream-100/80">{it.desc}</span>
              <div className="flex items-center gap-2">
                <span className="text-cream-100/90">{formatBRL(it.valor)}</span>
                <button onClick={() => rmItem(idx)} className="text-cream-100/30 hover:text-terracotta-400"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {itens.length === 0 && <p className="text-sm text-cream-100/40">Nenhum item ainda.</p>}
        </div>

        {/* Adicionar item */}
        <div className="mt-3 flex gap-2">
          <input className={inp + ' flex-1'} placeholder="Item (ex: Hora extra)" value={novoDesc} onChange={(e) => setNovoDesc(e.target.value)} />
          <input className={inp + ' w-24'} type="number" placeholder="R$" value={novoVal} onChange={(e) => setNovoVal(e.target.value)} />
          <button onClick={addItem} className="grid w-10 shrink-0 place-items-center rounded-lg bg-terracotta-500 text-cream-50 hover:bg-terracotta-600"><Plus size={16} /></button>
        </div>

        <div className="mt-4 space-y-1.5 border-t border-cream-100/10 pt-3 text-sm">
          <div className="flex justify-between text-cream-100/60"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
          <div className="flex items-center justify-between text-cream-100/60">
            <span>Desconto</span>
            <div className="flex items-center gap-1"><span>R$</span><input type="number" className={inp + ' w-20 py-1'} value={desconto} onChange={(e) => setDesconto(+e.target.value || 0)} /></div>
          </div>
          <div className="flex justify-between border-t border-cream-100/10 pt-2 text-base"><span className="font-medium text-cream-100">Total</span><span className="font-serif text-xl text-terracotta-400">{formatBRL(total)}</span></div>
        </div>
      </div>

      <button onClick={() => setEnviado(true)} className="btn-light mt-4 w-full !py-2.5 text-xs">
        <Send size={14} /> {enviado ? 'Orçamento enviado ✓' : 'Enviar orçamento ao cliente'}
      </button>
      {enviado && <p className="mt-2 text-center text-xs text-clay-300">Demo: na versão final, enviado por WhatsApp/e-mail.</p>}
    </Secao>
  )
}

/* ---- AGENDADO ---- */
function BlocoAgendado({ cliente }) {
  const a = cliente.agendamento || {}
  const e = cliente.ensaios[0] || {}
  return (
    <>
      <Secao icon={Calendar} titulo="Detalhes do agendamento">
        <div className="rounded-2xl bg-cocoa-950 p-4">
          <Campo label="Ensaio" valor={e.titulo} />
          <Campo label="Data" valor={a.data ? new Date(a.data + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '—'} />
          <Campo label="Horário" valor={a.hora} />
          <Campo label="Local" valor={a.local} />
          <Campo label="Nº de pessoas" valor={a.pessoas} />
          <Campo label="Valor" valor={formatBRL(e.valor || 0)} />
        </div>
      </Secao>
      {a.obs && (
        <Secao icon={FileText} titulo="Observações">
          <p className="rounded-2xl bg-cocoa-950 p-4 text-sm leading-relaxed text-cream-100/70">{a.obs}</p>
        </Secao>
      )}
    </>
  )
}

/* ---- PRODUÇÃO ---- */
function BlocoProducao({ cliente }) {
  const { producaoOverride, setEditadas } = useApp()
  const p = cliente.producao || {}
  const e = cliente.ensaios[0] || {}
  const selecionadas = p.selecionadas || 0
  // editadas vem do override (se o usuário ajustou) ou do valor base
  const override = producaoOverride[cliente.id]
  const editadas = override ? override.editadas : (p.editadas || 0)
  const editPct = selecionadas ? Math.round((editadas / selecionadas) * 100) : 0
  const concluido = selecionadas > 0 && editadas >= selecionadas

  const ajustar = (delta) => {
    const novo = Math.max(0, Math.min(selecionadas, editadas + delta))
    setEditadas(cliente.id, novo)
  }

  return (
    <>
      <Secao icon={Camera} titulo="Status da produção">
        <div className="rounded-2xl bg-cocoa-950 p-4">
          <Campo label="Ensaio" valor={e.titulo} />
          <Campo label="Fotos brutas" valor={p.fotosBrutas} />
          <Campo label="Selecionadas pelo cliente" valor={p.selecionadas != null ? p.selecionadas : 'aguardando'} />
          <Campo label="Prazo de entrega" valor={p.prazo ? new Date(p.prazo + 'T12:00').toLocaleDateString('pt-BR') : '—'} />
          <Campo label="Situação" valor={concluido ? 'Edição concluída ✓' : p.etapaProd} />
        </div>
      </Secao>

      {selecionadas > 0 && (
        <Secao icon={Wand2} titulo="Progresso da edição">
          <div className="rounded-2xl bg-cocoa-950 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-cream-100/70">Fotos editadas</p>
              <div className="flex items-center gap-3">
                <button onClick={() => ajustar(-1)} disabled={editadas <= 0} className="grid h-8 w-8 place-items-center rounded-lg bg-cocoa-800 text-cream-100 transition hover:bg-cocoa-700 disabled:opacity-30"><Minus size={15} /></button>
                <span className="w-16 text-center font-serif text-xl text-cream-100">{editadas}<span className="text-sm text-cream-100/40">/{selecionadas}</span></span>
                <button onClick={() => ajustar(1)} disabled={editadas >= selecionadas} className="grid h-8 w-8 place-items-center rounded-lg bg-terracotta-500 text-cream-50 transition hover:bg-terracotta-600 disabled:opacity-30"><Plus size={15} /></button>
              </div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cocoa-900">
              <motion.div animate={{ width: editPct + '%' }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={'h-full rounded-full ' + (concluido ? 'bg-clay-400' : 'bg-terracotta-500')} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-cream-100/50">{editPct}% concluído</p>
              <div className="flex gap-2">
                <button onClick={() => setEditadas(cliente.id, 0)} className="text-xs text-cream-100/40 hover:text-cream-100">Zerar</button>
                <button onClick={() => setEditadas(cliente.id, selecionadas)} className="text-xs text-terracotta-400 hover:underline">Marcar todas</button>
              </div>
            </div>
          </div>
          {concluido && <p className="mt-2 flex items-center gap-1.5 text-xs text-clay-300"><Check size={13} /> Tudo editado! Pronto para liberar o download na aba Seleções.</p>}
        </Secao>
      )}
    </>
  )
}

/* ---- ENTREGUE ---- */
function BlocoEntregue({ cliente }) {
  const e = cliente.ensaios[0] || {}
  return (
    <Secao icon={Sparkles} titulo="Ensaio entregue">
      <div className="rounded-2xl bg-clay-400/10 p-4 ring-1 ring-clay-400/20">
        <Campo label="Ensaio" valor={e.titulo} />
        <Campo label="Valor total" valor={formatBRL(e.valor || 0)} />
        <p className="mt-3 text-sm text-clay-300">✓ Fotos entregues. Que tal pedir uma avaliação ou oferecer um próximo ensaio?</p>
      </div>
    </Secao>
  )
}
