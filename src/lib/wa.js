// Link do WhatsApp a partir de um telefone (qualquer formatação) + texto opcional.
//
// O wa.me exige o número INTERNACIONAL completo: DDI + DDD + número.
// Decidimos pela CONTAGEM de dígitos, não pelo prefixo — o jeito antigo
// ("começa com 55? então já tem DDI") quebrava justamente nos DDDs 55 (RS),
// 51, 54... onde o DDD é igual ao DDI e o link saía sem o país.
//
//   10 ou 11 dígitos = nacional (DDD + 8/9)      -> falta o DDI, prefixa 55
//   12 ou 13 dígitos = já internacional          -> usa como veio
export function waLink(telefone, texto) {
  const tel = (telefone || '').replace(/\D/g, '')
  if (!tel) return null
  const num = tel.length === 10 || tel.length === 11 ? '55' + tel : tel
  return `https://wa.me/${num}${texto ? '?text=' + encodeURIComponent(texto) : ''}`
}
