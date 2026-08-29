// Link do WhatsApp a partir de um telefone (qualquer formatação) + texto opcional.
// Normaliza o DDI 55 (Brasil) sem duplicar; retorna null se não houver número.
export function waLink(telefone, texto) {
  const tel = (telefone || '').replace(/\D/g, '')
  if (!tel) return null
  const num = tel.startsWith('55') ? tel : '55' + tel
  return `https://wa.me/${num}${texto ? '?text=' + encodeURIComponent(texto) : ''}`
}
