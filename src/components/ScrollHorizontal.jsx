import { useRef, useState, useLayoutEffect } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import useIsMobile from '../hooks/useIsMobile'

// =====================================================================
//  SCROLL HORIZONTAL — técnica sticky-pin (estilo AETHER design system).
//  A seção "gruda" na tela e o track desliza no eixo X conforme rola.
//
//  Pontos-chave desta versão:
//   - A altura da seção é CALCULADA a partir da largura real do track,
//     então o pin dura só o necessário (sem vazio enorme no fim).
//   - O movimento horizontal termina em ~88% do progresso; os últimos
//     12% servem de "respiro" curto pra soltar rápido pra próxima
//     seção, com os cards ainda visíveis (não jogados pra fora).
// =====================================================================
export default function ScrollHorizontal({ painel, children, bg = '' }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const estatico = reduce || isMobile
  const [distancia, setDistancia] = useState(0)   // px que o track precisa andar
  const [alturaPx, setAlturaPx] = useState(0)     // altura da seção em px

  // mede o quanto o track excede a largura da tela e dimensiona a seção
  useLayoutEffect(() => {
    if (estatico) return
    const calc = () => {
      const track = trackRef.current
      if (!track) return
      const overflow = track.scrollWidth - window.innerWidth
      const dist = Math.max(overflow + window.innerWidth * 0.06, 0) // folga pequena no fim
      setDistancia(dist)
      // altura = uma tela (o pin) + a distância horizontal a percorrer.
      // multiplicador 0.9 deixa a rolagem um pouco mais rápida que 1:1.
      setAlturaPx(window.innerHeight + dist * 0.9)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [estatico, children])

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // movimento horizontal completa aos 88% do progresso; depois fica
  // parado (respiro curto) até soltar. Cards permanecem visíveis.
  const x = useTransform(scrollYProgress, [0, 0.88, 1], [0, -distancia, -distancia])

  if (estatico) {
    return (
      <section className={'relative ' + bg}>
        <div className="container-c py-[10vh]">
          {painel && <div className="mb-12">{painel}</div>}
          <div className="grid gap-8 md:grid-cols-3">{children}</div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      className={'relative ' + bg}
      style={{ height: alturaPx ? alturaPx + 'px' : '300vh' }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex items-stretch gap-8 pl-6 pr-[6vw] will-change-transform md:gap-12 md:pl-10"
        >
          {painel && (
            <div className="flex w-[78vw] shrink-0 flex-col justify-center md:w-[34vw] md:max-w-xl">
              {painel}
            </div>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  )
}

// Wrapper de largura fixa pra cada card dentro do track horizontal.
export function ItemHorizontal({ children, className = '' }) {
  return (
    <div className={'w-[78vw] shrink-0 sm:w-[60vw] md:w-[30vw] md:max-w-[400px] ' + className}>
      {children}
    </div>
  )
}
