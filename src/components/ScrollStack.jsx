import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

// =====================================================================
//  SCROLL-TO-STACK — empilhamento (sticky + z-index). Cada slide gruda
//  no topo e o próximo sobe POR CIMA. O 1º slide entra abrindo em caixa.
//  Cada card é clicável -> leva ao Portfolio filtrado pela categoria,
//  e tem microinteração de flutuar no hover.
// =====================================================================

// conteúdo da legenda (vidro) reutilizado nos slides
function Legenda({ slide, n }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      className="group/card relative mx-6 max-w-2xl cursor-pointer rounded-xl border border-cream-50/15 bg-cocoa-950/45 px-8 py-10 text-center backdrop-blur-md transition-shadow duration-300 hover:border-cream-50/40 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:px-14 md:py-14"
    >
      <span className="font-sans text-xs uppercase tracking-widest2 text-terracotta-400">
        {String(n).padStart(2, '0')} — Galeria
      </span>
      <h3 className="display mt-4 text-4xl text-cream-50 md:text-6xl">{slide.titulo}</h3>
      {slide.legenda && (
        <p className="mx-auto mt-4 max-w-md font-sans text-sm font-light leading-relaxed text-cream-100/80 md:text-base">
          {slide.legenda}
        </p>
      )}
      <span className="mt-5 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest2 text-cream-50/0 transition-colors duration-300 group-hover/card:text-cream-50/90">
        Ver galeria <ArrowUpRight size={14} />
      </span>
    </motion.div>
  )
}

// Primeiro slide: abre em caixa (cresce do centro) ao entrar.
function SlideCapa({ slide, n }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.82, 1])
  const radius = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, 0])
  const imgScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.2, 1])

  return (
    <div ref={ref} className="sticky top-0 z-[1] flex h-screen w-full items-center justify-center overflow-hidden">
      <motion.div style={{ scale, borderRadius: radius }} className="relative h-full w-full overflow-hidden">
        <motion.img
          src={slide.src}
          alt={`${slide.titulo} — Alma Fotografia`}
          draggable={false}
          style={{ scale: imgScale, objectPosition: slide.pos || 'center' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/80 via-cocoa-950/25 to-cocoa-950/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Link to={`/portfolio?cat=${slide.cat || 'todos'}`}>
            <Legenda slide={slide} n={n} />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function ScrollStack({ slides = [] }) {
  return (
    <div className="relative bg-cream-100">
      {slides.map((slide, i) =>
        i === 0 ? (
          <SlideCapa key={i} slide={slide} n={i + 1} />
        ) : (
          <div
            key={i}
            className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden"
            style={{ zIndex: i + 1 }}
          >
            <img
              src={slide.src}
              alt={`${slide.titulo} — Alma Fotografia`}
              loading="lazy"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: slide.pos || 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/80 via-cocoa-950/25 to-cocoa-950/50" />
            <Link to={`/portfolio?cat=${slide.cat || 'todos'}`}>
              <Legenda slide={slide} n={i + 1} />
            </Link>
          </div>
        )
      )}
    </div>
  )
}
