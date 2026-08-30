// Datas no fuso de QUEM USA, não em UTC.
//
// O sistema usava `new Date().toISOString().slice(0,10)` para descobrir "hoje".
// toISOString devolve UTC: no Brasil (UTC-3), a partir das 21h a data já virou
// para o dia seguinte. Resultado: depois das 21h uma conta que vence amanhã
// aparecia como VENCIDA, o "hoje" da agenda pulava um dia e os prazos de
// produção contavam errado.

// 'YYYY-MM-DD' do dia de hoje no fuso local.
export function hojeISO() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

// 'YYYY-MM-DD' -> Date ao MEIO-DIA local (nunca cruza a virada do dia por fuso).
export function dataLocal(iso) {
  if (!iso) return null
  const d = new Date(String(iso).slice(0, 10) + 'T12:00')
  return Number.isNaN(d.getTime()) ? null : d
}

// Formata 'YYYY-MM-DD' para o padrão brasileiro, sem susto de fuso.
export function formatarData(iso, opcoes) {
  const d = dataLocal(iso)
  return d ? d.toLocaleDateString('pt-BR', opcoes) : '—'
}
