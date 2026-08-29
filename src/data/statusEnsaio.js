// Status de produção de uma galeria/ensaio — vocabulário único do sistema.
export const FLUXO_GALERIA = ['selecionando', 'enviado', 'editando', 'pronto']

export function statusLabel(s) {
  return {
    solicitado: 'Solicitado',
    orcamento: 'Orçamento',
    selecionando: 'Cliente escolhendo',
    enviado: 'Seleção recebida',
    editando: 'Em edição',
    pronto: 'Entregue',
    agendado: 'Agendado',
  }[s] || s
}

export function statusCor(s) {
  return {
    solicitado: 'bg-cream-100/10 text-cream-100/60',
    orcamento: 'bg-amber-400/15 text-amber-300',
    selecionando: 'bg-clay-400/15 text-clay-300',
    enviado: 'bg-terracotta-500/20 text-terracotta-300',
    editando: 'bg-sky-500/15 text-sky-300',
    pronto: 'bg-emerald-500/15 text-emerald-300',
    agendado: 'bg-sand-300/15 text-sand-200',
  }[s] || 'bg-cream-100/10 text-cream-100/60'
}

// Etapa do funil derivada do status da galeria.
export function etapaFunilDeGaleria(gstatus) {
  if (gstatus === 'pronto') return 'entregue'
  return 'producao' // selecionando/enviado/editando = em produção
}
