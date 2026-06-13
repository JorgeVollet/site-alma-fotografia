import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // Sem âncora: vai pro topo a cada troca de rota.
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    // Com âncora (#id): tenta encontrar o alvo várias vezes,
    // porque a página de destino monta com animação/fotos e o
    // elemento só fica na posição final depois de alguns frames.
    let tentativas = 0
    let raf = 0
    const cancelados = []

    const tentarRolar = () => {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // confirma a posição após a animação de entrada assentar
        const t = setTimeout(() => {
          const alvo = document.querySelector(hash)
          if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 450)
        cancelados.push(() => clearTimeout(t))
        return
      }
      if (tentativas < 30) {
        tentativas += 1
        raf = requestAnimationFrame(tentarRolar)
      }
    }

    raf = requestAnimationFrame(tentarRolar)
    return () => {
      cancelAnimationFrame(raf)
      cancelados.forEach((fn) => fn())
    }
  }, [pathname, hash])

  return null
}
