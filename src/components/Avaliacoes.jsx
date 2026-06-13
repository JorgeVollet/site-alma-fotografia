import { Star } from 'lucide-react'
import Reveal from './Reveal'
import { STUDIO, DEPOIMENTOS } from '../data/studio'

// =====================================================================
//  CARROSSEL DE AVALIAÇÕES — editorial. Desliza sozinho (marquee
//  infinito) e PAUSA no hover. Avaliações reais do Google.
// =====================================================================

function GoogleG({ className = '' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

function CardAvaliacao({ d }) {
  return (
    <figure className="flex w-[340px] shrink-0 flex-col justify-between border-l border-cocoa-800/15 pl-6 md:w-[420px]">
      <div className="flex gap-0.5">
        {Array.from({ length: d.nota }).map((_, i) => (
          <Star key={i} size={14} className="fill-terracotta-500 text-terracotta-500" />
        ))}
      </div>
      <blockquote className="mt-4 font-serif text-xl font-light italic leading-snug text-cocoa-700 md:text-2xl">
        “{d.texto}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <p className="font-sans text-sm font-semibold text-cocoa-800">{d.nome}</p>
        <span className="h-1 w-1 rounded-full bg-clay-400" />
        <p className="font-sans text-xs text-clay-600">{d.servico}</p>
        <GoogleG className="ml-auto h-4 w-4 opacity-70" />
      </figcaption>
    </figure>
  )
}

export default function Avaliacoes() {
  const lista = [...DEPOIMENTOS, ...DEPOIMENTOS]

  return (
    <section className="overflow-hidden bg-cream-100 py-[14vh]">
      <div className="container-c">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-widest2 text-clay-600">05 — Avaliações</span>
            <h2 className="display mt-4 text-5xl text-cocoa-800 md:text-7xl">
              Quem viveu, <span className="italic text-clay-500">recomenda.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <a
              href={STUDIO.googleLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-3 border border-cocoa-800/15 px-5 py-3 transition hover:border-cocoa-800/40"
            >
              <GoogleG className="h-5 w-5" />
              <span className="font-serif text-xl text-cocoa-800">{STUDIO.googleNota}</span>
              <span className="text-clay-500">★★★★★</span>
              <span className="font-sans text-xs text-cocoa-500">{STUDIO.googleQtd} avaliações</span>
            </a>
          </Reveal>
        </div>
      </div>

      <div className="marquee-pause fade-x-mask mt-14 flex w-full overflow-hidden" style={{ '--marquee-duration': '50s' }}>
        <div className="marquee-track flex shrink-0 gap-12 pr-12">
          {lista.map((d, i) => (
            <CardAvaliacao key={i} d={d} />
          ))}
        </div>
      </div>

      <p className="container-c mt-10 font-sans text-xs uppercase tracking-widest2 text-clay-500">
        Passe o mouse para pausar →
      </p>
    </section>
  )
}
