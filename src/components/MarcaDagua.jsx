// =====================================================================
//  ELEMENTOS DE MARCA — selo circular giratório + ícone "a" coração
//  Usam os assets oficiais do guia de marca da Alma.
// =====================================================================

// Selo circular (logo redonda) girando devagar — marca d'água decorativa.
export function SeloCircular({ className = '', size = 'h-28 w-28', spin = true, opacity = 'opacity-100' }) {
  return (
    <img
      src="/marca/circular-champagne.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none select-none ${size} ${opacity} ${spin ? 'animate-spin-slow' : ''} ${className}`}
    />
  )
}

// Ícone "a" coração — detalhe decorativo da marca.
// variant: 'claro' | 'champagne' | 'salvia'
export function IconeA({ className = '', size = 'h-10 w-10', variant = 'champagne' }) {
  const src = {
    claro: '/marca/icone-claro.png',
    champagne: '/marca/icone-champagne.png',
    salvia: '/marca/icone-salvia.png',
  }[variant] || '/marca/icone-champagne.png'
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none select-none ${size} ${className}`}
    />
  )
}

// Faixa de pattern sutil (textura de fundo com o ícone "a" coração repetido).
// variant: 'champagne' (preenchido) | 'outline' (contorno)
export function PatternBg({ className = '', opacity = 'opacity-[0.07]', variant = 'champagne', size = '300px' }) {
  const url = variant === 'outline' ? '/marca/pattern-outline.png' : variant === 'full' ? '/marca/pattern-champagne.png' : '/marca/tile-a.png'
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 bg-repeat ${opacity} ${className}`}
      style={{ backgroundImage: `url('${url}')`, backgroundSize: size }}
    />
  )
}
