// =====================================================================
//  NOTAS FISCAIS — dados de DEMONSTRAÇÃO (mock)
//  Estrutura espelha o que o backend (Focus NFe) vai devolver, para que
//  a troca por dados reais seja só substituir esta fonte por uma chamada
//  ao backend. Campos por nota:
//   { id, numero, tipo: 'nfse'|'nfe', cliente, cpfCnpj, descricao,
//     valor, status, emitidaEm, pdf, xml, motivoErro }
//  status: 'autorizada' | 'processando' | 'pendente' | 'rejeitada' | 'cancelada'
// =====================================================================

// VAZIO — as notas fiscais reais vêm do backend (Focus NFe) no Bloco 8.
// O admin começa sem notas; aparecem conforme forem emitidas de verdade.
export const NOTAS_DEMO = []

// Configuração visual de cada status (rótulo + classes Tailwind).
export const STATUS_NF = {
  autorizada: { label: 'Autorizada', dot: 'bg-emerald-400', chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25' },
  processando: { label: 'Processando', dot: 'bg-sky-400', chip: 'bg-sky-500/15 text-sky-300 ring-sky-400/25' },
  pendente: { label: 'Pendente', dot: 'bg-amber-400', chip: 'bg-amber-500/15 text-amber-300 ring-amber-400/25' },
  rejeitada: { label: 'Rejeitada', dot: 'bg-terracotta-400', chip: 'bg-terracotta-500/15 text-terracotta-300 ring-terracotta-400/25' },
  cancelada: { label: 'Cancelada', dot: 'bg-cream-100/40', chip: 'bg-cream-100/10 text-cream-100/50 ring-cream-100/15' },
}

export const TIPO_NF = {
  nfse: { label: 'NFS-e', sub: 'Serviço', chip: 'bg-clay-400/15 text-clay-300' },
  nfe: { label: 'NF-e', sub: 'Produto', chip: 'bg-cream-100/10 text-cream-100/70' },
}
