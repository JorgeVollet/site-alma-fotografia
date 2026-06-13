import { useState } from 'react'
import { TrendingUp, Calculator, Sparkles, Check } from 'lucide-react'
import { formatBRL } from '../../components/Money'

export default function ROI() {
  const [alboom, setAlboom] = useState(287)
  const [supabase, setSupabase] = useState(125)
  const [investimento, setInvestimento] = useState(6000)

  const economiaMensal = Math.max(0, alboom - supabase)
  const economiaAno = economiaMensal * 12
  const payback = economiaMensal > 0 ? investimento / economiaMensal : 0

  const horizontes = [1, 2, 3, 5, 10].map((anos) => {
    const m = anos * 12
    return {
      anos,
      alboom: alboom * m,
      jv: investimento + supabase * m,
      economiaMensalidade: economiaMensal * m,
      liquida: alboom * m - (investimento + supabase * m),
    }
  })

  const inp = 'w-28 rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-right text-sm text-cream-100 outline-none focus:border-terracotta-400'

  return (
    <div>
      <h1 className="font-serif text-3xl">Calculadora de economia</h1>
      <p className="mt-1 text-sm text-cream-100/60">Ferramenta interna para apresentar a economia ao cliente. Ajuste os valores ao vivo.</p>

      {/* Entradas */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Entrada label="Custo atual (Alboom)" sub="por mês" valor={alboom} set={setAlboom} inp={inp} />
        <Entrada label="Custo da solução" sub="Supabase/mês" valor={supabase} set={setSupabase} inp={inp} />
        <Entrada label="Investimento único" sub="projeto" valor={investimento} set={setInvestimento} inp={inp} />
      </div>

      {/* Destaques */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-terracotta-500/15 p-5 ring-1 ring-terracotta-400/30">
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><TrendingUp size={14} className="text-terracotta-400" /> Economia mensal</p>
          <p className="mt-2 font-serif text-3xl text-terracotta-400">{formatBRL(economiaMensal)}</p>
          <p className="text-xs text-cream-100/50">{formatBRL(economiaAno)} por ano</p>
        </div>
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><Calculator size={14} className="text-clay-300" /> Retorno do investimento</p>
          <p className="mt-2 font-serif text-3xl">{payback.toFixed(0)} <span className="text-lg text-cream-100/50">meses</span></p>
          <p className="text-xs text-cream-100/50">~{(payback / 12).toFixed(1)} anos</p>
        </div>
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="flex items-center gap-2 text-xs text-cream-100/60"><Sparkles size={14} className="text-sand-200" /> Economia real em 10 anos</p>
          <p className="mt-2 font-serif text-3xl text-clay-300">{formatBRL(alboom * 120 - (investimento + supabase * 120))}</p>
          <p className="text-xs text-cream-100/50">já descontando o investimento</p>
        </div>
      </div>

      {/* Tabela */}
      <h3 className="mt-8 font-serif text-xl">Custo acumulado: Alboom vs solução própria</h3>
      <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
        <table className="w-full text-sm">
          <thead className="bg-cocoa-900 text-left text-xs uppercase tracking-wide text-cream-100/40">
            <tr><th className="px-5 py-3">Período</th><th className="px-5 py-3 text-right">Alboom</th><th className="px-5 py-3 text-right">Solução própria</th><th className="px-5 py-3 text-right">Quanto sobra no bolso</th></tr>
          </thead>
          <tbody className="divide-y divide-cream-100/5">
            {horizontes.map((h) => (
              <tr key={h.anos} className="bg-cocoa-900/40">
                <td className="px-5 py-4">{h.anos} ano{h.anos > 1 ? 's' : ''}</td>
                <td className="px-5 py-4 text-right text-cream-100/70">{formatBRL(h.alboom)}</td>
                <td className="px-5 py-4 text-right text-cream-100/70">{formatBRL(h.jv)}</td>
                <td className={'px-5 py-4 text-right font-medium ' + (h.liquida >= 0 ? 'text-clay-300' : 'text-cream-100/40')}>{h.liquida >= 0 ? '+ ' + formatBRL(h.liquida) : 'investindo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-cocoa-900 to-cocoa-950 p-6 ring-1 ring-terracotta-400/20">
        <p className="flex items-center gap-2 font-serif text-lg text-cream-100"><Check size={18} className="text-terracotta-400" /> Argumento de venda</p>
        <p className="mt-2 text-sm leading-relaxed text-cream-100/70">
          Desde o 1º mês a conta cai de <strong className="text-cream-100">{formatBRL(alboom)}</strong> para <strong className="text-cream-100">{formatBRL(supabase)}</strong> —
          economia imediata de <strong className="text-terracotta-400">{formatBRL(economiaMensal)}/mês</strong>. Mas o maior valor é deixar de
          alugar 4 ferramentas e passar a ser <strong className="text-cream-100">dono</strong> de um sistema exclusivo, sem anúncios e sem comissão.
        </p>
      </div>
    </div>
  )
}

function Entrada({ label, sub, valor, set, inp }) {
  return (
    <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
      <p className="text-xs text-cream-100/50">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-cream-100/40">R$</span>
        <input type="number" className={inp} value={valor} onChange={(e) => set(+e.target.value || 0)} />
      </div>
      <p className="mt-1 text-xs text-cream-100/40">{sub}</p>
    </div>
  )
}
