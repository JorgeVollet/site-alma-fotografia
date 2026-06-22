import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { PatternBg } from './MarcaDagua'
import useIsMobile from '../hooks/useIsMobile'

// =====================================================================
//  SCROLLYTELLING "A ALMA" — Revelação por palavra.
//  A seção faz PIN (trava) e, conforme o scroll avança, revela:
//   1) selo "01 — A Alma"
//   2) título acendendo palavra por palavra
//   3) corpo (3 parágrafos) acendendo palavra por palavra — cada palavra
//      sobe levemente ao acender ("respiração")
//   4) assinatura de boas-vindas com fade + escala
//  Fundo branco/cream, cores cocoa fiéis ao site.
//  reduced-motion: mostra tudo aceso, sem pin.
// =====================================================================

const APAGADO = 'rgba(68,73,68,0.16)' // cocoa-900 a 16% — quase invisível no branco
const TITULO_ON = '#444944'           // cocoa-900
const CORPO_ON = '#686f67'            // cocoa-700

// Uma palavra que acende (cor + sobe) conforme o scroll cruza seu ponto.
function Palavra({ texto, progress, ini, fim, corOn }) {
  const cor = useTransform(progress, [ini, fim], [APAGADO, corOn])
  const y = useTransform(progress, [ini, fim], [8, 0])
  return (
    <motion.span style={{ color: cor, y, display: 'inline-block' }}>
      {texto}
      {' '}
    </motion.span>
  )
}

// Distribui as palavras de um conjunto de frases numa faixa [de, ate] do
// progresso, retornando os spans animados na ordem.
function montar(frases, progress, de, ate, corOn, keyBase) {
  const todas = []
  frases.forEach((fr, fi) => {
    fr.split(' ').forEach((p, pi) => todas.push({ texto: p, fi, pi }))
  })
  const n = todas.length
  const span = ate - de
  return todas.map((w, i) => {
    const ini = de + (i / n) * span
    const fim = de + ((i + 0.8) / n) * span
    return (
      <Palavra
        key={keyBase + '-' + i}
        texto={w.texto}
        progress={progress}
        ini={ini}
        fim={fim}
        corOn={corOn}
      />
    )
  })
}

export default function ScrollyEssencia({ selo, titulo, paragrafos = [], boasVindas = [] }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  // No mobile (ou reduced-motion), mostra tudo escrito de uma vez, sem pin.
  const estatico = reduce || isMobile
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // Fases do scroll (0..1):
  //  selo: 0.02   | título: 0.04–0.20 | corpo: 0.20–0.74 | assinatura: 0.76+
  const seloOpacity = useTransform(scrollYProgress, [0.0, 0.04], estatico ? [1, 1] : [0, 1])
  const assinOpacity = useTransform(scrollYProgress, [0.74, 0.84], estatico ? [1, 1] : [0, 1])
  const assinY = useTransform(scrollYProgress, [0.74, 0.84], estatico ? [0, 0] : [18, 0])
  const assinScale = useTransform(scrollYProgress, [0.74, 0.84], estatico ? [1, 1] : [0.95, 1])

  // Em reduced-motion, um progresso "fixo" em 1 deixa tudo aceso.
  const pFixo = useTransform(scrollYProgress, [0, 1], [1, 1])
  const p = estatico ? pFixo : scrollYProgress

  return (
    <section ref={ref} className="relative bg-cream-100" style={{ height: estatico ? 'auto' : '260vh' }}>
      <div className={'relative flex w-full items-center justify-center overflow-hidden ' + (estatico ? 'py-20 md:py-24' : 'sticky top-0 h-screen')}>
        <PatternBg variant="champagne" opacity="opacity-[0.16]" size="150px" />
        <div className="container-c relative">
          <div className="group relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-cream-50/60 bg-cream-50/55 px-8 py-14 text-center shadow-[0_20px_70px_rgba(104,111,103,0.16)] backdrop-blur-2xl transition-all duration-500 hover:border-terracotta-400/40 hover:shadow-[0_28px_90px_rgba(152,110,77,0.28)] md:px-16 md:py-20">
            {/* brilho que varre o card no hover (sweep diagonal) */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-cream-50/70 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-full group-hover:opacity-100" />
            {/* glow suave ao redor (acende no hover) */}
            <span aria-hidden="true" className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 ring-1 ring-inset ring-terracotta-400/30 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative">
            <motion.span
              style={{ opacity: seloOpacity }}
              className="font-sans text-xs uppercase tracking-widest2 text-clay-600"
            >
              {selo}
            </motion.span>

            <h2 className="display text-balance mt-6 text-4xl leading-[1.08] md:text-5xl lg:text-6xl">
              {montar([titulo], p, 0.04, 0.20, TITULO_ON, 'tit')}
            </h2>

            <p className="mx-auto mt-8 max-w-2xl font-sans text-lg font-light leading-relaxed md:text-xl">
              {montar(paragrafos, p, 0.20, 0.74, CORPO_ON, 'corpo')}
            </p>

            <motion.p
              style={{ opacity: assinOpacity, y: assinY, scale: assinScale }}
              className="mt-10 font-serif text-2xl italic text-clay-600 md:text-3xl"
            >
              {boasVindas[0]}<br />{boasVindas[1]}
            </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
