// Logo oficial da Alma Fotografia (logotipo real do guia de marca).
// dark=true  -> fundo claro  -> logotipo sálvia
// dark=false -> fundo escuro -> logotipo off-white
// A altura vem da className (ex: "h-8", "h-10"); default h-8.
export default function Logo({ className = '', dark = false, stacked = false }) {
  const src = dark ? '/marca/logotipo-salvia.png' : '/marca/logotipo-claro.png'
  const iconeSrc = dark ? '/marca/icone-salvia.png' : '/marca/icone-claro.png'
  const hasH = /(^|\s)h-/.test(className)

  if (stacked) {
    return (
      <img
        src={iconeSrc}
        alt="Alma Fotografia"
        draggable={false}
        className={`w-auto select-none ${hasH ? '' : 'h-12'} ${className}`}
      />
    )
  }
  return (
    <img
      src={src}
      alt="Alma Fotografia"
      draggable={false}
      className={`w-auto select-none ${hasH ? '' : 'h-8'} ${className}`}
    />
  )
}
