export function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Money({ value, className = '' }) {
  return <span className={className}>{formatBRL(value)}</span>
}
