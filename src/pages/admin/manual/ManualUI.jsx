import { ArrowRight, ArrowDown } from 'lucide-react'

export function Secao({ id, titulo, sub, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="font-serif text-3xl text-cream-100">{titulo}</h2>
      {sub && <p className="mt-1.5 text-sm text-cream-100/60">{sub}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  )
}

export function P({ children }) {
  return <p className="text-sm leading-relaxed text-cream-100/75">{children}</p>
}

export function Caixa({ tipo = 'dica', titulo, children }) {
  const estilos = {
    dica: 'bg-clay-400/10 ring-clay-400/25 text-clay-200',
    costura: 'bg-terracotta-500/10 ring-terracotta-400/30 text-terracotta-200',
    whatsapp: 'bg-[#25D366]/10 ring-[#25D366]/25 text-[#25D366]',
    atencao: 'bg-amber-400/10 ring-amber-400/25 text-amber-200',
  }
  const icones = { dica: '💡', costura: '🔗', whatsapp: '📲', atencao: '⚠️' }
  return (
    <div className={'rounded-2xl p-4 ring-1 ' + (estilos[tipo] || estilos.dica)}>
      {titulo && <p className="mb-1 font-medium">{icones[tipo]} {titulo}</p>}
      <div className="text-sm leading-relaxed opacity-90">{children}</div>
    </div>
  )
}

export function Passos({ itens }) {
  return (
    <ol className="space-y-2.5">
      {itens.map((t, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-terracotta-500 text-xs font-medium text-cream-50">{i + 1}</span>
          <span className="text-sm leading-relaxed text-cream-100/80">{t}</span>
        </li>
      ))}
    </ol>
  )
}

export function Print({ titulo, children, legenda }) {
  return (
    <figure>
      <div className="overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
        <div className="flex items-center gap-1.5 bg-cocoa-900 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-terracotta-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-clay-400/60" />
          <span className="ml-2 text-xs text-cream-100/40">{titulo}</span>
        </div>
        <div className="bg-cocoa-950 p-4">{children}</div>
      </div>
      {legenda && <figcaption className="mt-2 text-center text-xs italic text-cream-100/40">{legenda}</figcaption>}
    </figure>
  )
}

export function Fluxo({ etapas, vertical = false }) {
  return (
    <div className={'flex gap-2 ' + (vertical ? 'flex-col' : 'flex-wrap items-stretch')}>
      {etapas.map((e, i) => (
        <div key={i} className={'flex ' + (vertical ? 'flex-col items-center' : 'items-center')}>
          <div className={'rounded-xl px-3 py-2.5 text-center text-xs ring-1 ' + (e.destaque ? 'bg-terracotta-500/15 text-terracotta-300 ring-terracotta-400/30' : 'bg-cocoa-900 text-cream-100/80 ring-cream-100/10')}>
            {e.icone && <span className="mr-1">{e.icone}</span>}{e.label}
          </div>
          {i < etapas.length - 1 && (vertical ? <ArrowDown size={15} className="my-1 text-cream-100/30" /> : <ArrowRight size={15} className="mx-1 text-cream-100/30" />)}
        </div>
      ))}
    </div>
  )
}

export function MiniCliente({ inicial, nome, sub, grad = 'ph-gradient-2', tag }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-cocoa-900 p-3 ring-1 ring-cream-100/10">
      <div className="flex items-center gap-2.5">
        <div className={grad + ' grid h-8 w-8 place-items-center rounded-full font-serif text-xs text-cream-50'}>{inicial}</div>
        <div><p className="text-sm text-cream-100">{nome}</p><p className="text-[11px] text-cream-100/50">{sub}</p></div>
      </div>
      {tag && <span className="rounded-full bg-cream-100/10 px-2 py-0.5 text-[10px] text-cream-100/60">{tag}</span>}
    </div>
  )
}
