import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

// =====================================================================
//  SCROLLFX — kit de efeitos de scrollytelling (parallax, reveal
//  cinemático, títulos animados, imagem que cresce). Tudo em
//  transform/opacity (60fps) e respeitando prefers-reduced-motion.
// =====================================================================

const EASE = [0.22, 1, 0.36, 1]

// --- Parallax: move o conteúdo em velocidade diferente do scroll ------
// speed: quanto desloca (px). negativo sobe, positivo desce.
export function Parallax({ children, speed = -80, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-speed, speed])
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}

// --- ParallaxImg: imagem full-bleed com zoom + deslocamento ----------
// A imagem nasce maior que o frame e desliza dentro do overflow-hidden.
export function ParallaxImg({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  speed = 90,
  objectPosition = 'center',
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%'])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [1, 1, 1] : [1.15, 1.08, 1.15])
  return (
    <div ref={ref} className={'relative overflow-hidden ' + className}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        style={{ y, scale, objectPosition }}
        className={'h-[116%] w-full -translate-y-[8%] object-cover ' + imgClassName}
      />
    </div>
  )
}

// --- RevealCinematic: surge com blur + slide + fade encadeados --------
export function RevealCinematic({
  children,
  delay = 0,
  y = 60,
  blur = 14,
  className = '',
  once = true,
}) {
  const reduce = useReducedMotion()
  if (reduce) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, margin: '-60px' }}
        transition={{ duration: 0.4, delay }}
      >
        {children}
      </motion.div>
    )
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: `blur(${blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-70px' }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

// --- TituloScroll: headline que escala + desliza conforme rola --------
// O título cresce levemente e sobe enquanto a seção cruza a viewport.
export function TituloScroll({ children, className = '', from = 60 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [from, 0])
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], reduce ? [1, 1, 1] : [0, 0.6, 1])
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.94, 1])
  return (
    <motion.div ref={ref} style={{ y, opacity, scale }} className={className}>
      {children}
    </motion.div>
  )
}

// --- ImagemCresce: foto que expande do centro pra full ao rolar -------
// Nasce com cantos arredondados + menor e cresce até preencher.
export function ImagemCresce({ src, alt = '', className = '', objectPosition = 'center' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.82, 1])
  const radius = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [48, 0])
  const imgScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.3, 1])
  return (
    <div ref={ref} className={className}>
      <motion.div
        style={{ scale, borderRadius: radius }}
        className="relative h-full w-full overflow-hidden"
      >
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          style={{ scale: imgScale, objectPosition }}
          className="h-full w-full object-cover"
        />
      </motion.div>
    </div>
  )
}

// --- ColunaParallax: uma coluna de fotos que sobe (ou desce) ao rolar -
// speed positivo = sobe mais (anda contra o scroll), criando o efeito
// "puxando de baixo pra cima". Cada coluna recebe um speed diferente.
export function ColunaParallax({ fotos = [], speed = 120, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [speed, -speed])
  return (
    <motion.div ref={ref} style={{ y }} className={'flex flex-col gap-4 md:gap-6 ' + className}>
      {fotos.map((f, i) => (
        <div key={i} className="overflow-hidden rounded-sm">
          <img
            src={f.src}
            alt={f.alt || 'Ensaio Alma Fotografia'}
            loading="lazy"
            draggable={false}
            className="w-full rounded-sm object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.04]"
            style={{ aspectRatio: f.ratio || '3 / 4' }}
          />
        </div>
      ))}
    </motion.div>
  )
}
