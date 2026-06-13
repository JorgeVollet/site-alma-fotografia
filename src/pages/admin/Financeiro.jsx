import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Wallet, Clock, ArrowUpRight, ArrowDownRight,
  Plus, Pencil, Trash2, X, Check, Filter,
} from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { FINANCEIRO_DEMO, CATEGORIAS_FIN, CLIENTES } from '../../data/crm'
import { useApp } from '../../context/AppContext'

const HOJE = '2026-06-10'

export default function Financeiro() {
  const { agendamentos, financeiroCustom, financeiroEdit, financeiroExcluido, adicionarLancamento, editarLancamento, excluirLancamento } = useApp()
  const [editando, setEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos') // todos | entrada | saida | pendente

  // Reservas do site viram entradas pagas
  const reservasSite = agendamentos.map((a, i) => ({
    id: 'ag-' + (a.id || i), tipo: 'entrada',
    descricao: 'Reserva (site) — ' + (a.nome || 'Cliente'),
    valor: a.valorReserva || 0, data: (a.criadoEm || '').slice(0, 10), dataPagamento: (a.criadoEm || '').slice(0, 10),
    categoria: 'Reserva', status: 'pago', cliente: '', readonly: true,
  }))

  // Base demo (com edições, sem excluídos) + custom + reservas do site
  const base = FINANCEIRO_DEMO.filter((l) => !financeiroExcluido[l.id]).map((l) => ({ ...l, ...(financeiroEdit[l.id] || {}), custom: false }))
  let lancamentos = [...financeiroCustom.map((l) => ({ ...l, custom: true })), ...reservasSite, ...base]
  lancamentos = lancamentos.sort((a, b) => (b.data || '').localeCompare(a.data || ''))

  // Filtro
  const filtrados = lancamentos.filter((l) => {
    if (filtro === 'todos') return true
    if (filtro === 'pendente') return l.status === 'pendente'
    return l.tipo === filtro
  })

  const entradas = lancamentos.filter((l) => l.tipo === 'entrada' && l.status === 'pago').reduce((s, l) => s + l.valor, 0)
  const saidas = lancamentos.filter((l) => l.tipo === 'saida' && l.status === 'pago').reduce((s, l) => s + l.valor, 0)
  const aReceber = lancamentos.filter((l) => l.tipo === 'entrada' && l.status === 'pendente').reduce((s, l) => s + l.valor, 0)
  const saldo = entradas - saidas

  const cards = [
    { label: 'Entradas (pagas)', valor: formatBRL(entradas), icon: TrendingUp, cor: 'text-clay-300', ring: 'ring-clay-400/20 bg-clay-400/5' },
    { label: 'Saídas (pagas)', valor: formatBRL(saidas), icon: TrendingDown, cor: 'text-cream-100/70', ring: 'ring-cream-100/10 bg-cocoa-900' },
    { label: 'Saldo', valor: formatBRL(saldo), icon: Wallet, cor: 'text-terracotta-400', ring: 'ring-terracotta-400/30 bg-terracotta-500/15' },
    { label: 'A receber', valor: formatBRL(aReceber), icon: Clock, cor: 'text-amber-300', ring: 'ring-amber-400/20 bg-amber-400/5' },
  ]

  const togglePago = (l) => {
    const novoStatus = l.status === 'pago' ? 'pendente' : 'pago'
    editarLancamento(l.id, { status: novoStatus, dataPagamento: novoStatus === 'pago' ? HOJE : '' }, l.custom)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Financeiro</h1>
          <p className="mt-1 text-sm text-cream-100/60">Entradas, saídas e resultado. Reservas do site entram automático. Clique num lançamento para editar.</p>
        </div>
        <button onClick={() => setEditando({ novo: true, tipo: 'entrada', descricao: '', valor: '', categoria: 'Pacote', data: HOJE, dataPagamento: HOJE, status: 'pago', cliente: '' })} className="btn-light !py-2.5 text-xs">
          <Plus size={15} /> Novo lançamento
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className={'rounded-2xl p-5 ring-1 ' + c.ring}>
              <p className="flex items-center gap-2 text-xs text-cream-100/50"><Icon size={14} className={c.cor} /> {c.label}</p>
              <p className={'mt-2 font-serif text-2xl ' + c.cor}>{c.valor}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="mt-6 flex items-center gap-2">
        <Filter size={14} className="text-cream-100/40" />
        {[['todos', 'Todos'], ['entrada', 'Entradas'], ['saida', 'Saídas'], ['pendente', 'Pendentes']].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)} className={'rounded-full px-3 py-1.5 text-xs transition ' + (filtro === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-900 text-cream-100/60 hover:text-cream-100')}>{label}</button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
        <table className="w-full text-sm">
          <thead className="bg-cocoa-900 text-left text-xs uppercase tracking-wide text-cream-100/40">
            <tr>
              <th className="px-5 py-3">Descrição</th>
              <th className="hidden px-5 py-3 sm:table-cell">Categoria</th>
              <th className="hidden px-5 py-3 md:table-cell">Data</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Valor</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100/5">
            <AnimatePresence>
              {filtrados.map((l) => (
                <motion.tr key={l.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group bg-cocoa-900/40 hover:bg-cocoa-900">
                  <td className="px-5 py-4">
                    <button onClick={() => !l.readonly && setEditando(l)} disabled={l.readonly} className={'flex items-center gap-3 text-left ' + (l.readonly ? '' : 'hover:text-cream-100')}>
                      <div className={'grid h-8 w-8 shrink-0 place-items-center rounded-full ' + (l.tipo === 'entrada' ? 'bg-clay-400/15 text-clay-300' : 'bg-cream-100/10 text-cream-100/50')}>
                        {l.tipo === 'entrada' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                      </div>
                      <span>{l.descricao}{l.readonly && <span className="ml-2 text-xs text-cream-100/30">(site)</span>}</span>
                    </button>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell"><span className="rounded-full bg-cream-100/10 px-2.5 py-1 text-xs text-cream-100/60">{l.categoria}</span></td>
                  <td className="hidden px-5 py-4 text-cream-100/50 md:table-cell">{l.data ? new Date(l.data + 'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => !l.readonly && togglePago(l)} disabled={l.readonly} className={'rounded-full px-2.5 py-1 text-xs transition ' + (l.status === 'pago' ? 'bg-clay-400/15 text-clay-300' : 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25') + (l.readonly ? ' cursor-default' : '')}>
                      {l.status === 'pago' ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className={'px-5 py-4 text-right font-medium ' + (l.tipo === 'entrada' ? 'text-clay-300' : 'text-cream-100/60')}>{l.tipo === 'entrada' ? '+ ' : '− '}{formatBRL(l.valor)}</td>
                  <td className="px-5 py-4">
                    {!l.readonly && (
                      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => setEditando(l)} className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/40 hover:bg-cocoa-800 hover:text-cream-100"><Pencil size={13} /></button>
                        <button onClick={() => excluirLancamento(l.id, l.custom)} className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/40 hover:bg-terracotta-500/20 hover:text-terracotta-400"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editando && (
          <EditorLancamento
            lanc={editando}
            onClose={() => setEditando(null)}
            onSalvar={(campos) => {
              if (editando.novo) adicionarLancamento(campos)
              else editarLancamento(editando.id, campos, editando.custom)
              setEditando(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EditorLancamento({ lanc, onClose, onSalvar }) {
  const [tipo, setTipo] = useState(lanc.tipo || 'entrada')
  const [descricao, setDescricao] = useState(lanc.descricao || '')
  const [valor, setValor] = useState(lanc.valor || '')
  const [categoria, setCategoria] = useState(lanc.categoria || 'Pacote')
  const [data, setData] = useState(lanc.data || HOJE)
  const [status, setStatus] = useState(lanc.status || 'pago')
  const [dataPagamento, setDataPagamento] = useState(lanc.dataPagamento || HOJE)
  const [cliente, setCliente] = useState(lanc.cliente || '')

  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  const salvar = () => {
    if (!descricao.trim() || !valor) return
    onSalvar({ tipo, descricao: descricao.trim(), valor: +valor, categoria, data, status, dataPagamento: status === 'pago' ? dataPagamento : '', cliente })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{lanc.novo ? 'Novo lançamento' : 'Editar lançamento'}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        {/* Tipo */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => setTipo('entrada')} className={'rounded-xl py-3 text-sm font-medium transition ' + (tipo === 'entrada' ? 'bg-clay-400 text-cream-50' : 'bg-cocoa-950 text-cream-100/60')}>↑ Entrada</button>
          <button onClick={() => setTipo('saida')} className={'rounded-xl py-3 text-sm font-medium transition ' + (tipo === 'saida' ? 'bg-cocoa-700 text-cream-100' : 'bg-cocoa-950 text-cream-100/60')}>↓ Saída</button>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">Descrição</span><input className={inp} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Pacote casamento João" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Valor (R$)</span><input type="number" className={inp} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Categoria</span><select className={inp} value={categoria} onChange={(e) => setCategoria(e.target.value)}>{CATEGORIAS_FIN.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Data</span><input type="date" className={inp} value={data} onChange={(e) => setData(e.target.value)} /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Cliente (opcional)</span><select className={inp} value={cliente} onChange={(e) => setCliente(e.target.value)}><option value="">—</option>{CLIENTES.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          </div>

          {/* Status pagamento */}
          <div>
            <span className="text-sm text-cream-100/80">Situação do pagamento</span>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <button onClick={() => setStatus('pago')} className={'rounded-xl py-2.5 text-sm transition ' + (status === 'pago' ? 'bg-clay-400 text-cream-50' : 'bg-cocoa-950 text-cream-100/60')}>Pago</button>
              <button onClick={() => setStatus('pendente')} className={'rounded-xl py-2.5 text-sm transition ' + (status === 'pendente' ? 'bg-amber-400 text-cocoa-900' : 'bg-cocoa-950 text-cream-100/60')}>Pendente</button>
            </div>
          </div>
          {status === 'pago' && (
            <label className="block"><span className="text-sm text-cream-100/80">Data do pagamento</span><input type="date" className={inp} value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} /></label>
          )}
        </div>

        <button onClick={salvar} disabled={!descricao.trim() || !valor} className="btn-light mt-7 w-full disabled:opacity-40">
          <Check size={16} /> {lanc.novo ? 'Adicionar lançamento' : 'Salvar alterações'}
        </button>
      </motion.div>
    </motion.div>
  )
}
