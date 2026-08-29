// Camada de dados de AGENDAMENTOS (Bloco 3A) — reservas feitas no SITE.
// O site (anon) só INSERE (status "a-confirmar"); a equipe lê e gerencia.
import { supabase } from './supabase'

export function mapAgendamento(row) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email || '',
    telefone: row.telefone || '',
    servico: row.servico || '',
    pacote: row.pacote_slug || '',
    pacoteNome: row.pacote_nome || '',
    dia: row.dia || '',
    hora: row.hora || '',
    valorReserva: row.valor_reserva != null ? Number(row.valor_reserva) : 0,
    valorTotal: row.valor_total != null ? Number(row.valor_total) : 0,
    status: row.status || 'a-confirmar',
    duracaoMin: row.duracao_min != null ? Number(row.duracao_min) : null,
    clienteId: row.cliente_id || null,
    ensaioId: row.ensaio_id || null,
    observacoes: row.observacoes || '',
    criadoEm: row.created_at,
  }
}

// Insert público (site). Força status "a-confirmar" (a RLS também exige isso).
export async function criarAgendamento(ag) {
  const payload = {
    nome: ag.nome,
    email: ag.email || null,
    telefone: ag.telefone || null,
    servico: ag.servico || null,
    pacote_slug: ag.pacote || null,
    pacote_nome: ag.pacoteNome || null,
    dia: ag.dia || null,
    hora: ag.hora || null,
    valor_reserva: ag.valorReserva ?? null,
    valor_total: ag.valorTotal ?? null,
    status: 'a-confirmar',
    observacoes: ag.observacoes || null,
  }
  const { data, error } = await supabase
    .from('agendamentos')
    .insert(payload)
    .select()
    .single()
  if (error) {
    console.warn('[agendamentos] criar falhou:', error.message)
    return null
  }
  return mapAgendamento(data)
}

// Leitura (admin).
export async function fetchAgendamentos() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[agendamentos] fetch falhou:', error.message)
    return []
  }
  return (data || []).map(mapAgendamento)
}

export async function atualizarAgendamentoStatus(id, status) {
  const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id)
  if (error) {
    console.warn('[agendamentos] status falhou:', error.message)
    return false
  }
  return true
}

// Confirma a reserva com a DURAÇÃO REAL do ensaio (em minutos).
export async function confirmarAgendamentoDB(id, duracaoMin) {
  const { error } = await supabase.from('agendamentos')
    .update({ status: 'confirmado', duracao_min: duracaoMin || null }).eq('id', id)
  if (error) { console.warn('[agendamentos] confirmar falhou:', error.message); return false }
  return true
}
