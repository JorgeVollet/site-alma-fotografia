import { motion } from 'framer-motion'
import Reveal from './Reveal'
import { SeloCircular } from './MarcaDagua'

// Hero editorial das páginas internas — full-bleed, título grande alinhado embaixo
export default function PageHero({ eyebrow, titulo, destaque, sub, gradient = 'ph-gradient-4', n = '' }) {
  return (
    <section className="relative flex h-[68vh] min-h-[460px] items-end overflow-hidden bg-cocoa-950">
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <div className={`${gradient} absolute inset-0`} />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/85 via-cocoa-950/30 to-cocoa-950/50" />
        <div className="grain absolute inset-0 opacity-[0.05]" />
      </motion.div>

      {/* selo circular da marca, girando */}
      <SeloCircular className="absolute right-6 top-24 z-10 opacity-80 md:right-12 md:top-28" size="h-20 w-20 md:h-28 md:w-28" />

      <div className="container-c relative z-10 pb-[7vh] text-cream-100">
        {eyebrow && (
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest2 text-cream-100/80">
              {n && <span className="text-clay-300">{n}</span>}
              <span className="h-px w-8 bg-clay-400" /> {eyebrow}
            </span>
          </Reveal>
        )}
        <Reveal delay={0.1}>
          <h1 className="display mt-4 text-[clamp(2.6rem,8vw,7rem)] leading-[0.9]">
            {titulo} {destaque && <span className="italic text-clay-300">{destaque}</span>}
          </h1>
        </Reveal>
        {sub && (
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-xl border-t border-cream-100/15 pt-6 font-sans text-sm font-light leading-relaxed text-cream-100/75">
              {sub}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  )
}
