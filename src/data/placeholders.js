// Geradores de placeholder (degradês elegantes em SVG data-uri)

// Tons suaves da Alma — blush, sálvia, champagne e rosé
const TONS = [
  ['#fbeae6', '#c98e86'],
  ['#eef1ea', '#869575'],
  ['#f0e6db', '#bb8259'],
  ['#f6d6cf', '#b1736b'],
  ['#dde3d6', '#5f6b5e'],
  ['#fdf6f4', '#dcae8a'],
]

export function fakePhoto(seed, label = '') {
  const [a, b] = TONS[seed % TONS.length]
  const rot = (seed * 37) % 360
  const cx1 = 200 + ((seed * 53) % 400)
  const cy1 = 260 + ((seed * 71) % 300)
  const r1 = 110 + (seed % 5) * 26
  const cx2 = 300 + ((seed * 29) % 350)
  const cy2 = 520 + ((seed * 41) % 260)
  const r2 = 70 + (seed % 4) * 22
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'>" +
    "<defs><linearGradient id='g' gradientTransform='rotate(" + rot + ")'>" +
    "<stop offset='0%' stop-color='" + a + "'/><stop offset='100%' stop-color='" + b + "'/>" +
    "</linearGradient><radialGradient id='v' cx='50%' cy='38%' r='75%'>" +
    "<stop offset='55%' stop-color='rgba(0,0,0,0)'/><stop offset='100%' stop-color='rgba(0,0,0,0.18)'/>" +
    "</radialGradient></defs>" +
    "<rect width='800' height='1000' fill='url(%23g)'/>" +
    "<circle cx='" + cx1 + "' cy='" + cy1 + "' r='" + r1 + "' fill='rgba(255,255,255,0.14)'/>" +
    "<circle cx='" + cx2 + "' cy='" + cy2 + "' r='" + r2 + "' fill='rgba(0,0,0,0.05)'/>" +
    "<rect width='800' height='1000' fill='url(%23v)'/>" +
    "<text x='50%' y='50%' font-family='Georgia, serif' font-size='40' fill='rgba(255,255,255,0.6)' text-anchor='middle' font-style='italic'>" + label + "</text>" +
    "</svg>"
  return "data:image/svg+xml," + encodeURIComponent(svg)
}

export function buildPhotos(n, prefix, categoria) {
  return Array.from({ length: n }, (_, i) => {
    const seed = i + categoria.length * 3
    const num = String(i + 1).padStart(2, '0')
    return {
      id: prefix + '-' + (i + 1),
      src: fakePhoto(seed, prefix.toUpperCase() + ' ' + num),
      categoria,
      alt: 'Foto ' + (i + 1) + ' — ' + categoria,
    }
  })
}
