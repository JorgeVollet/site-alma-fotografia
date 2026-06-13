import { useRef } from 'react'
import { fonteCss } from '../../../data/album'

// Elemento individual no canvas: arrastável + redimensionável + selecionável.
// Coordenadas em % do canvas. canvasRef é o container medido.
export default function CanvasElement({ el, selecionado, onSelect, onChange, onEditText, canvasRef, escala }) {
  const dragRef = useRef(null)

  // --- mover ---
  const iniciarMover = (e) => {
    if (e.button === 2) return
    e.stopPropagation()
    onSelect(el.id)
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const startX = e.clientX, startY = e.clientY
    const ox = el.x, oy = el.y
    dragRef.current = { tipo: 'mover', startX, startY, ox, oy, rect }

    const onMove = (ev) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      onChange(el.id, { x: Math.max(-5, Math.min(100 - el.w + 5, ox + dx)), y: Math.max(-5, Math.min(100 - el.h + 5, oy + dy)) })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  // --- redimensionar (alça do canto) ---
  const iniciarResize = (e, canto) => {
    e.stopPropagation()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const startX = e.clientX, startY = e.clientY
    const o = { x: el.x, y: el.y, w: el.w, h: el.h }

    const onMove = (ev) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      let { x, y, w, h } = o
      if (canto.includes('e')) w = Math.max(5, o.w + dx)
      if (canto.includes('s')) h = Math.max(4, o.h + dy)
      if (canto.includes('w')) { w = Math.max(5, o.w - dx); x = o.x + dx }
      if (canto.includes('n')) { h = Math.max(4, o.h - dy); y = o.y + dy }
      onChange(el.id, { x, y, w, h })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }

  const estiloBase = {
    left: el.x + '%', top: el.y + '%', width: el.w + '%', height: el.h + '%',
    transform: 'rotate(' + (el.rot || 0) + 'deg)', opacity: el.opacidade != null ? el.opacidade : 1,
    zIndex: el.z || 0,
  }

  // Conteúdo por tipo
  let conteudo = null
  if (el.tipo === 'foto') {
    conteudo = el.src
      ? <img src={el.src} className="h-full w-full object-cover no-select" draggable={false} style={{ borderRadius: (el.raio || 0) + 'px' }} />
      : <div className="grid h-full w-full place-items-center bg-black/5 text-black/30 text-xs">foto</div>
  } else if (el.tipo === 'texto' || el.tipo === 'titulo') {
    conteudo = (
      <div
        onDoubleClick={() => onEditText && onEditText(el)}
        className="flex h-full w-full items-center px-1 no-select"
        style={{
          fontFamily: fonteCss(el.fonte), fontSize: (el.tamanho * (escala || 1)) + 'px', color: el.cor,
          fontWeight: el.peso, fontStyle: el.italico ? 'italic' : 'normal',
          justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
          textAlign: el.align, lineHeight: 1.15, overflow: 'hidden',
        }}
      >
        {el.texto}
      </div>
    )
  } else if (el.tipo === 'forma') {
    const base = { width: '100%', height: '100%', background: el.forma === 'linha' ? 'transparent' : el.cor, opacity: 1, border: el.borda ? el.borda + 'px solid ' + el.bordaCor : 'none' }
    if (el.forma === 'circulo') base.borderRadius = '50%'
    else if (el.forma === 'retangulo') base.borderRadius = (el.raio || 0) + 'px'
    else if (el.forma === 'linha') { base.height = (el.borda || 2) + 'px'; base.background = el.bordaCor || el.cor; base.border = 'none'; base.marginTop = 'auto'; base.marginBottom = 'auto' }
    conteudo = <div style={base} />
  }

  return (
    <div
      onMouseDown={iniciarMover}
      className={'absolute cursor-move ' + (selecionado ? 'outline outline-2 outline-terracotta-500' : 'hover:outline hover:outline-1 hover:outline-terracotta-400/50')}
      style={estiloBase}
    >
      {conteudo}
      {/* alças de redimensionamento */}
      {selecionado && ['nw', 'ne', 'sw', 'se'].map((c) => (
        <div
          key={c}
          onMouseDown={(e) => iniciarResize(e, c)}
          className="absolute h-3 w-3 rounded-full border border-cocoa-900 bg-terracotta-500"
          style={{
            cursor: c + '-resize',
            left: c.includes('w') ? -6 : undefined, right: c.includes('e') ? -6 : undefined,
            top: c.includes('n') ? -6 : undefined, bottom: c.includes('s') ? -6 : undefined,
          }}
        />
      ))}
    </div>
  )
}
