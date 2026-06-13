// =====================================================================
//  NOTAS FISCAIS — dados de DEMONSTRAÇÃO (mock)
//  Estrutura espelha o que o backend (Focus NFe) vai devolver, para que
//  a troca por dados reais seja só substituir esta fonte por uma chamada
//  ao backend. Campos por nota:
//   { id, numero, tipo: 'nfse'|'nfe', cliente, cpfCnpj, descricao,
//     valor, status, emitidaEm, pdf, xml, motivoErro }
//  status: 'autorizada' | 'processando' | 'pendente' | 'rejeitada' | 'cancelada'
// =====================================================================

export const NOTAS_DEMO = [
  {
    id: 'nf-001', numero: '000128', tipo: 'nfse',
    cliente: 'Família Sphor', cpfCnpj: '012.345.678-90',
    descricao: 'Ensaio Newborn · Pacote Memórias',
    valor: 890, status: 'autorizada', emitidaEm: '2026-06-09T14:20:00',
    pdf: '#', xml: '#', motivoErro: null,
  },
  {
    id: 'nf-002', numero: '000129', tipo: 'nfe',
    cliente: 'Família Sphor', cpfCnpj: '012.345.678-90',
    descricao: 'Álbum encadernado premium 20x30',
    valor: 690, status: 'autorizada', emitidaEm: '2026-06-10T09:05:00',
    pdf: '#', xml: '#', motivoErro: null,
  },
  {
    id: 'nf-003', numero: '—', tipo: 'nfse',
    cliente: 'Patrícia Krever', cpfCnpj: '987.654.321-00',
    descricao: 'Ensaio Gestante · Pacote Pocket',
    valor: 600, status: 'processando', emitidaEm: '2026-06-11T16:40:00',
    pdf: null, xml: null, motivoErro: null,
  },
  {
    id: 'nf-004', numero: '—', tipo: 'nfse',
    cliente: 'Daniela Schroter', cpfCnpj: '111.222.333-44',
    descricao: 'Ensaio de Família · Pacote Memórias',
    valor: 890, status: 'pendente', emitidaEm: null, pdf: null, xml: null,
    motivoErro: null,
  },
  {
    id: 'nf-005', numero: '—', tipo: 'nfe',
    cliente: 'Majoire Sphor', cpfCnpj: '555.666.777-88',
    descricao: 'Quadro em metacrilato 30x45',
    valor: 320, status: 'rejeitada', emitidaEm: '2026-06-08T11:15:00',
    pdf: null, xml: null,
    motivoErro: 'CPF do tomador inválido. Corrija o cadastro e reemita.',
  },
  {
    id: 'nf-006', numero: '000125', tipo: 'nfse',
    cliente: 'Família Alma', cpfCnpj: '999.888.777-66',
    descricao: 'Ensaio Smash the Cake · Pacote Memórias',
    valor: 890, status: 'cancelada', emitidaEm: '2026-06-05T10:00:00',
    pdf: '#', xml: '#', motivoErro: 'Cancelada a pedido — dados do tomador incorretos.',
  },
]

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
