import { TrendingUp, Users, Target, Award, DollarSign, Repeat } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { FUNIL_ETAPAS } from '../../data/crm'
import { useApp } from '../../context/AppContext'

export default function Relatorios() {
  const { clientes } = useApp()

  const etapaDe = (c) => c.etapa || c.funil // já derivado no memo (inclui galerias)
  const comEnsaio = clientes.filter((c) => c.ensaios.length > 0)

  // Receita por serviço — soma TODOS os ensaios de cada cliente
  const porServico = {}
  let receitaTotal = 0
  let totalEnsaios = 0
  comEnsaio.forEach((c) => {
    c.ensaios.forEach((e) => {
      const tipo = ((e.titulo || 'Ensaio').split('·')[0] || e.titulo || 'Ensaio').trim()
      porServico[tipo] = (porServico[tipo] || 0) + (e.valor || 0)
      receitaTotal += e.valor || 0
      totalEnsaios += 1
    })
  })
  const servicos = Object.entries(porServico).sort((a, b) => b[1] - a[1])
  const maxServico = Math.max(1, ...servicos.map(([, v]) => v))

  // Funil: conversão
  const leads = clientes.length
  const fechados = clientes.filter((c) => ['producao', 'entregue'].includes(etapaDe(c))).length
  const conversao = leads ? Math.round((fechados / leads) * 100) : 0

  // Ticket médio (por ensaio)
  const ticketMedio = totalEnsaios ? receitaTotal / totalEnsaios : 0

  // Funil por etapa
  const porEtapa = FUNIL_ETAPAS.map((e) => ({ ...e, n: clientes.filter((c) => etapaDe(c) === e.id).length }))

  const cards = [
    { label: 'Receita no período', valor: formatBRL(receitaTotal), icon: DollarSign, cor: 'text-clay-300' },
    { label: 'Taxa de conversão', valor: conversao + '%', icon: Target, cor: 'text-terracotta-400' },
    { label: 'Ticket médio', valor: formatBRL(ticketMedio), icon: Award, cor: 'text-sand-200' },
    { label: 'Clientes ativos', valor: comEnsaio.length, icon: Users, cor: 'text-cream-100/80' },
  ]

  return (
    <div>
      <h1 className="font-serif text-3xl">Relatórios avançados</h1>
      <p className="mt-1 text-sm text-cream-100/60">Insights para tomar melhores decisões e crescer o estúdio.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
              <Icon size={18} className={c.cor} />
              <p className={'mt-3 font-serif text-2xl ' + c.cor}>{c.valor}</p>
              <p className="text-xs text-cream-100/50">{c.label}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Receita por serviço */}
        <div className="rounded-2xl bg-cocoa-900 p-6 ring-1 ring-cream-100/10">
          <h3 className="flex items-center gap-2 font-serif text-xl"><TrendingUp size={18} className="text-terracotta-400" /> Receita por serviço</h3>
          <div className="mt-4 space-y-3">
            {servicos.map(([nome, val]) => (
              <div key={nome}>
                <div className="flex justify-between text-sm">
                  <span className="text-cream-100/80">{nome}</span>
                  <span className="text-cream-100/60">{formatBRL(val)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-cocoa-950">
                  <div className="h-full rounded-full bg-terracotta-500" style={{ width: (val / maxServico * 100) + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funil de conversão */}
        <div className="rounded-2xl bg-cocoa-900 p-6 ring-1 ring-cream-100/10">
          <h3 className="flex items-center gap-2 font-serif text-xl"><Target size={18} className="text-terracotta-400" /> Funil de vendas</h3>
          <div className="mt-4 space-y-2">
            {porEtapa.map((e, i) => {
              const pct = leads ? (e.n / leads) * 100 : 0
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-cream-100/60">{e.nome}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-cocoa-950">
                    <div className={'flex h-full items-center justify-end rounded-lg px-2 ' + e.cor} style={{ width: Math.max(pct, 12) + '%' }}>
                      <span className="text-xs font-medium text-cocoa-900">{e.n}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-cream-100/10 pt-3 text-sm">
            <Repeat size={14} className="text-clay-300" />
            <span className="text-cream-100/60">Conversão lead → cliente: <strong className="text-clay-300">{conversao}%</strong></span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-cream-100/40">💡 Relatórios atualizam em tempo real conforme você gerencia clientes, funil e financeiro.</p>
    </div>
  )
}
