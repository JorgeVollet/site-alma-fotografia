import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, BarChart3, X, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { FINANCEIRO_DEMO } from '../../data/crm'
import { useApp } from '../../context/AppContext'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function FluxoCaixa() {
  const { financeiroCustom, financeiroEdit, financeiroExcluido, agendamentos } = useApp()
  const [drill, setDrill] = useState(null) // { titulo, lancamentos }

  const reservas = agendamentos.map((a, i) => ({ id: 'ag' + i, tipo: 'entrada', valor: a.valorReserva || 0, data: (a.criadoEm || '').slice(0, 10), categoria: 'Reserva', descricao: 'Reserva (site) — ' + (a.nome || 'Cliente') }))
  const base = FINANCEIRO_DEMO.filter((l) => !financeiroExcluido[l.id]).map((l) => ({ ...l, ...(financeiroEdit[l.id] || {}) }))
  const todos = [...financeiroCustom, ...reservas, ...base].filter((l) => l.data)

  const porMes = {}
  for (let m = 0; m < 12; m++) porMes[m] = { entrada: 0, saida: 0, itens: [] }
  todos.forEach((l) => {
    const mes = new Date(l.data + 'T12:00').getMonth()
    if (!isNaN(mes)) { porMes[mes][l.tipo] += l.valor; porMes[mes].itens.push(l) }
  })
  const mesesComDados = Object.keys(porMes).map(Number).filter((m) => porMes[m].entrada > 0 || porMes[m].saida > 0)
  const maxVal = Math.max(1, ...mesesComDados.flatMap((m) => [porMes[m].entrada, porMes[m].saida]))

  const receitaTotal = todos.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const cats = {}
  todos.filter((l) => l.tipo === 'saida').forEach((l) => { cats[l.categoria] = (cats[l.categoria] || { total: 0, itens: [] }); cats[l.categoria].total += l.valor; cats[l.categoria].itens.push(l) })
  const despesaTotal = Object.values(cats).reduce((s, v) => s + v.total, 0)
  const lucro = receitaTotal - despesaTotal
  const margem = receitaTotal > 0 ? Math.round((lucro / receitaTotal) * 100) : 0

  const abrirMes = (m) => setDrill({ titulo: 'Movimento de ' + MESES_FULL[m], lancamentos: porMes[m].itens })
  const abrirCat = (cat) => setDrill({ titulo: 'Despesas: ' + cat, lancamentos: cats[cat].itens })
  const abrirReceita = () => setDrill({ titulo: 'Todas as entradas', lancamentos: todos.filter((l) => l.tipo === 'entrada') })

  return (
    <div>
      <h1 className="font-serif text-3xl">Fluxo de caixa & DRE</h1>
      <p className="mt-1 text-sm text-cream-100/60">Saúde financeira do estúdio. Clique nos meses ou categorias para ver os detalhes.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <button onClick={abrirReceita} className="rounded-2xl bg-clay-400/5 p-5 text-left ring-1 ring-clay-400/20 transition hover:ring-clay-400/40">
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><TrendingUp size={14} className="text-clay-300" /> Receita total</p>
          <p className="mt-2 font-serif text-2xl text-clay-300">{formatBRL(receitaTotal)}</p>
          <p className="mt-1 text-xs text-cream-100/40">clique para detalhar</p>
        </button>
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><TrendingDown size={14} className="text-cream-100/50" /> Despesas</p>
          <p className="mt-2 font-serif text-2xl text-cream-100/80">{formatBRL(despesaTotal)}</p>
        </div>
        <div className={'rounded-2xl p-5 ring-1 ' + (lucro >= 0 ? 'bg-terracotta-500/15 ring-terracotta-400/30' : 'bg-cocoa-900 ring-red-400/30')}>
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><Wallet size={14} className="text-terracotta-400" /> Lucro líquido</p>
          <p className={'mt-2 font-serif text-2xl ' + (lucro >= 0 ? 'text-terracotta-400' : 'text-red-300')}>{formatBRL(lucro)}</p>
          <p className="text-xs text-cream-100/50">margem {margem}%</p>
        </div>
      </div>

      <h3 className="mt-8 flex items-center gap-2 font-serif text-xl"><BarChart3 size={18} className="text-terracotta-400" /> Movimento por mês</h3>
      <div className="mt-4 rounded-2xl bg-cocoa-900 p-6 ring-1 ring-cream-100/10">
        <div className="flex items-end justify-around gap-3" style={{ height: '180px' }}>
          {mesesComDados.map((m) => (
            <button key={m} onClick={() => abrirMes(m)} className="flex flex-1 flex-col items-center justify-end gap-1 rounded-lg transition hover:bg-cocoa-800/50" style={{ height: '100%' }}>
              <div className="flex w-full items-end justify-center gap-1" style={{ height: '100%' }}>
                <div className="w-1/2 rounded-t bg-clay-400 transition-all" style={{ height: (porMes[m].entrada / maxVal * 100) + '%' }} />
                <div className="w-1/2 rounded-t bg-cocoa-700 transition-all" style={{ height: (porMes[m].saida / maxVal * 100) + '%' }} />
              </div>
              <span className="text-xs text-cream-100/40">{MESES[m]}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-6 border-t border-cream-100/10 pt-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-clay-400" /> Entradas</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-cocoa-700" /> Saídas</span>
          <span className="text-cream-100/30">· clique numa barra</span>
        </div>
      </div>

      <h3 className="mt-8 font-serif text-xl">Demonstrativo de resultado (DRE)</h3>
      <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-cream-100/5">
            <tr onClick={abrirReceita} className="cursor-pointer bg-cocoa-900/40 hover:bg-cocoa-900"><td className="px-5 py-3 font-medium">(+) Receita bruta</td><td className="px-5 py-3 text-right font-medium text-clay-300">{formatBRL(receitaTotal)}</td></tr>
            {Object.entries(cats).map(([cat, v]) => (
              <tr key={cat} onClick={() => abrirCat(cat)} className="cursor-pointer bg-cocoa-900/20 hover:bg-cocoa-900"><td className="px-5 py-3 pl-8 text-cream-100/60">(−) {cat}</td><td className="px-5 py-3 text-right text-cream-100/60">{formatBRL(v.total)}</td></tr>
            ))}
            <tr className="bg-cocoa-900/40"><td className="px-5 py-3 font-medium">(=) Total de despesas</td><td className="px-5 py-3 text-right font-medium text-cream-100/80">{formatBRL(despesaTotal)}</td></tr>
            <tr className="bg-terracotta-500/10"><td className="px-5 py-4 font-serif text-lg">(=) Resultado líquido</td><td className={'px-5 py-4 text-right font-serif text-xl ' + (lucro >= 0 ? 'text-terracotta-400' : 'text-red-300')}>{formatBRL(lucro)}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-cream-100/40">💡 Tudo reflete os lançamentos do financeiro + reservas do site, em tempo real.</p>

      <AnimatePresence>
        {drill && <DrillModal titulo={drill.titulo} lancamentos={drill.lancamentos} onClose={() => setDrill(null)} />}
      </AnimatePresence>
    </div>
  )
}

function DrillModal({ titulo, lancamentos, onClose }) {
  const entradas = lancamentos.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const saidas = lancamentos.filter((l) => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{titulo}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-3 flex gap-3 text-sm">
          {entradas > 0 && <span className="text-clay-300">+ {formatBRL(entradas)}</span>}
          {saidas > 0 && <span className="text-cream-100/60">− {formatBRL(saidas)}</span>}
          <span className="text-cream-100/40">· {lancamentos.length} lançamento(s)</span>
        </div>
        <div className="mt-4 space-y-2">
          {lancamentos.map((l, i) => (
            <div key={l.id || i} className="flex items-center justify-between gap-3 rounded-xl bg-cocoa-950 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={'grid h-8 w-8 shrink-0 place-items-center rounded-full ' + (l.tipo === 'entrada' ? 'bg-clay-400/15 text-clay-300' : 'bg-cream-100/10 text-cream-100/50')}>
                  {l.tipo === 'entrada' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream-100/90">{l.descricao}</p>
                  <p className="text-xs text-cream-100/40">{l.data ? new Date(l.data + 'T12:00').toLocaleDateString('pt-BR') : ''} · {l.categoria}</p>
                </div>
              </div>
              <span className={'shrink-0 text-sm font-medium ' + (l.tipo === 'entrada' ? 'text-clay-300' : 'text-cream-100/60')}>{l.tipo === 'entrada' ? '+' : '−'} {formatBRL(l.valor)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
