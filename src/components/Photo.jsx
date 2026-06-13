import { useState } from 'react'

export default function Photo({
  src,
  alt = '',
  className = '',
  protect = false,
  watermark = false,
  fallback = 'ph-gradient',
}) {
  const [erro, setErro] = useState(false)
  return (
    <div className={'relative overflow-hidden ' + (erro ? fallback + ' ' : '') + className}>
      {!erro && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          onError={() => setErro(true)}
          onContextMenu={protect ? (e) => e.preventDefault() : undefined}
          className={'h-full w-full object-cover ' + (protect ? 'no-select pointer-events-none' : '')}
        />
      )}
      {watermark && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rotate-[-20deg] select-none font-serif text-2xl italic text-white/25">
            Alma Fotografia
          </span>
        </div>
      )}
    </div>
  )
}
