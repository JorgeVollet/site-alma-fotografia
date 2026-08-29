import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, Check, Plus, X, Calendar, Trash2, RotateCcw, User, Tag, Clock, Loader2 } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { useApp } from '../../context/AppContext'
import { fetchContasReceber, marcarContaRecebida, reabrirConta } from '../../lib/galerias'
import { fetchContasPagar, criarContaPagar, pagarContaPagar, excluirContaPagar } from '../../lib/financeiro'

const hoje = () => new Date().toISOString().slice(0, 10)

export default function Contas() {
  const { clientes } = useApp()
  const [receber, setReceber] = useState([])
  const [pagar, setPagar] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState('receber')
  const [detalhe, setDetalhe] = useState(null)
  const [novaPagar, setNovaPagar] = useState(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    const [r, p] = await Promise.all([fetchContasReceber(), fetchContasPagar()])
    setReceber(r); setPagar(p); setCarregando(false)
  }, [])
  useEffect(() => { recarregar() }, [recarregar])

  const h = hoje()
  const comStatus = (c, tipo) => {
    if (c.status === 'pago') return { ...c, tipo, _st: 'pago' }
    if (c.vencimento && c.vencimento < h) return { ...c, tipo, _st: 'vencido' }
    return { ...c, tipo, _st: 'pendente' }
  }
  const listaReceber = receber.map((c) => comStatus(c, 'receber'))
  const listaPagar = pagar.map((c) => comStatus(c, 'pagar'))
  const lista = aba === 'receber' ? listaReceber : listaPagar

  const totalReceber = listaReceber.filter((c) => c._st !== 'pago').reduce((s, c) => s + c.valor, 0)
  const totalPagar = listaPagar.filter((c) => c._st !== 'pago').reduce((s, c) => s + c.valor, 0)
  const vencidos = [...listaReceber, ...listaPagar].filter((c) => c._st === 'vencido').length

  const nomeCliente = (id) => { const c = clientes.find((x) => x.id === id); return c ? c.nome : '' }

  const quitar = async (c) => {
    if (c.tipo === 'receber') await marcarContaRecebida(c.id)
    else await pagarContaPagar(c.id, true)
    await recarregar()
  }
  const reverter = async (c) => {
    if (!confirm('Desfazer? A conta volta para pendente.')) return
    if (c.tipo === 'receber') await reabrirConta(c.id)
    else await pagarContaPagar(c.id, false)
    await recarregar()
  }
  const remover = async (c) => {
    if (c.tipo !== 'pagar') return
    if (!confirm('Excluir esta conta a pagar?')) return
    await excluirContaPagar(c.id)
    await recarregar()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Contas a pagar e receber</h1>
          <p className="mt-1 text-sm text-cream-100/60">As "a receber" nascem dos ensaios automaticamente. {vencidos > 0 && <span className="text-terracotta-400">{vencidos} vencida(s)!</span>}</p>
        </div>
        <button onClick={() => setNovaPagar(true)} className="btn-light !py-2.5 text-xs"><Plus size={15} /> Nova conta a pagar</button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-clay-400/5 p-5 ring-1 ring-clay-400/20">
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><ArrowDownCircle size={14} className="text-clay-300" /> A receber</p>
          <p className="mt-2 font-serif text-2xl text-clay-300">{formatBRL(totalReceber)}</p>
        </div>
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><ArrowUpCircle size={14} className="text-cream-100/50" /> A pagar</p>
          <p className="mt-2 font-serif text-2xl text-cream-100/80">{formatBRL(totalPagar)}</p>
        </div>
        <div className={'rounded-2xl p-5 ring-1 ' + (vencidos > 0 ? 'bg-terracotta-500/15 ring-terracotta-400/30' : 'bg-cocoa-900 ring-cream-100/10')}>
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><AlertTriangle size={14} className="text-terracotta-400" /> Vencidas</p>
          <p className={'mt-2 font-serif text-2xl ' + (vencidos > 0 ? 'text-terracotta-400' : 'text-cream-100/80')}>{vencidos}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {[['receber', 'A receber (' + listaReceber.length + ')'], ['pagar', 'A pagar (' + listaPagar.length + ')']].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)} className={'rounded-full px-4 py-2 text-sm transition ' + (aba === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-900 text-cream-100/60 hover:text-cream-100')}>{label}</button>
        ))}
      </div>

      {carregando ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-cream-100/40"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : (
        <div className="mt-4 space-y-2.5">
          <AnimatePresence>
            {lista.map((c) => {
              const pago = c._st === 'pago'
              const venc = c._st === 'vencido'
              return (
                <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={'group flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ring-1 transition ' + (venc ? 'bg-terracotta-500/5 ring-terracotta-400/20' : 'bg-cocoa-900 ring-cream-100/10 hover:ring-cream-100/25')}>
                  <button onClick={() => setDetalhe(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <div className={'grid h-9 w-9 shrink-0 place-items-center rounded-full ' + (c.tipo === 'receber' ? 'bg-clay-400/15 text-clay-300' : 'bg-cream-100/10 text-cream-100/50')}>
                      {c.tipo === 'receber' ? <ArrowDownCircle size={17} /> : <ArrowUpCircle size={17} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.descricao}</p>
                      <p className="flex items-center gap-1.5 text-xs text-cream-100/40"><Calendar size={11} /> {c.vencimento ? 'vence ' + new Date(c.vencimento + 'T12:00').toLocaleDateString('pt-BR') : 'sem prazo'}{c.clienteId && ' · ' + nomeCliente(c.clienteId)}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={'font-serif text-lg ' + (c.tipo === 'receber' ? 'text-clay-300' : 'text-cream-100/70')}>{formatBRL(c.valor)}</span>
                    {pago ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-clay-400/15 px-3 py-1.5 text-xs text-clay-300"><Check size={12} /> {c.tipo === 'receber' ? 'Recebido' : 'Pago'}</span>
                    ) : (
                      <button onClick={() => quitar(c)} className={'rounded-full px-3 py-1.5 text-xs transition ' + (venc ? 'bg-terracotta-500/20 text-terracotta-400 hover:bg-terracotta-500/30' : 'bg-cocoa-800 text-cream-100/70 hover:bg-cocoa-700')}>
                        {venc ? 'Vencida — quitar' : 'Marcar ' + (c.tipo === 'receber' ? 'recebido' : 'pago')}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {lista.length === 0 && <p className="rounded-2xl bg-cocoa-900 p-6 text-center text-sm text-cream-100/40 ring-1 ring-cream-100/10">Nenhuma conta nesta aba.</p>}
        </div>
      )}

      <AnimatePresence>
        {detalhe && (
          <DetalheConta
            conta={detalhe}
            nomeCliente={nomeCliente}
            onClose={() => setDetalhe(null)}
            onQuitar={() => { quitar(detalhe); setDetalhe(null) }}
            onReverter={() => { reverter(detalhe); setDetalhe(null) }}
            onExcluir={detalhe.tipo === 'pagar' ? () => { remover(detalhe); setDetalhe(null) } : null}
          />
        )}
        {novaPagar && <EditorContaPagar onClose={() => setNovaPagar(false)} onSalvar={async (campos) => { await criarContaPagar(campos); setNovaPagar(false); await recarregar() }} />}
      </AnimatePresence>
    </div>
  )
}

function DetalheConta({ conta, nomeCliente, onClose, onQuitar, onReverter, onExcluir }) {
  const pago = conta._st === 'pago'
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={'grid h-12 w-12 place-items-center rounded-2xl ' + (conta.tipo === 'receber' ? 'bg-clay-400/15 text-clay-300' : 'bg-cream-100/10 text-cream-100/50')}>
              {conta.tipo === 'receber' ? <ArrowDownCircle size={22} /> : <ArrowUpCircle size={22} />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-100/40">{conta.tipo === 'receber' ? 'A receber' : 'A pagar'}</p>
              <h3 className="font-serif text-2xl">{formatBRL(conta.valor)}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-5 rounded-2xl bg-cocoa-950 p-4">
          <Campo icon={Tag} label="Descrição" valor={conta.descricao} />
          <Campo icon={Calendar} label="Vencimento" valor={conta.vencimento ? new Date(conta.vencimento + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : 'Sem prazo definido'} />
          {conta.clienteId && <Campo icon={User} label="Cliente" valor={nomeCliente(conta.clienteId)} />}
          <Campo icon={Clock} label="Situação" valor={pago ? (conta.tipo === 'receber' ? 'Recebido' : 'Pago') : conta._st === 'vencido' ? 'Vencida' : 'Pendente'} />
        </div>
        <div className="mt-5 space-y-2.5">
          {pago ? (
            <button onClick={onReverter} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa-800 py-3 text-sm text-cream-100/80 transition hover:bg-cocoa-700"><RotateCcw size={15} /> Desfazer — voltar para pendente</button>
          ) : (
            <button onClick={onQuitar} className="btn-light w-full"><Check size={16} /> Marcar como {conta.tipo === 'receber' ? 'recebido' : 'pago'}</button>
          )}
          {onExcluir && <button onClick={onExcluir} className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-500/10 py-2.5 text-sm text-terracotta-400 transition hover:bg-terracotta-500/20"><Trash2 size={14} /> Excluir</button>}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Campo({ icon: Icon, label, valor }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-cream-100/5 py-2.5 text-sm last:border-0">
      <span className="flex items-center gap-2 text-cream-100/50"><Icon size={13} /> {label}</span>
      <span className="text-right capitalize text-cream-100/90">{valor}</span>
    </div>
  )
}

function EditorContaPagar({ onClose, onSalvar }) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(hoje())
  const [categoria, setCategoria] = useState('')
  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  const salvar = () => {
    if (!descricao.trim() || !valor) return
    onSalvar({ descricao: descricao.trim(), valor: +valor, vencimento, categoria })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Nova conta a pagar</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">Descrição</span><input className={inp} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Aluguel do estúdio" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Valor (R$)</span><input type="number" className={inp} value={valor} onChange={(e) => setValor(e.target.value)} /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Vencimento</span><input type="date" className={inp} value={vencimento} onChange={(e) => setVencimento(e.target.value)} /></label>
          </div>
          <label className="block"><span className="text-sm text-cream-100/80">Categoria</span><input className={inp} value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Fixo, Material..." /></label>
        </div>
        <button onClick={salvar} disabled={!descricao.trim() || !valor} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> Adicionar conta</button>
      </motion.div>
    </motion.div>
  )
}
