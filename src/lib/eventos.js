// Agenda do estúdio (Bloco 22) — compromissos livres, além dos ensaios.
//
// A agenda antiga só sabia ler `agendamentos` (as reservas do site), e o site
// deixou de agendar — então ela vivia vazia. Agora a agenda junta TUDO que tem
// data: ensaios, compromissos criados à mão, aniversários e contas a vencer.
import { supabase } from './supabase'

// Cores por tipo — o estúdio bate o olho e sabe o que é.
export const CORES_EVENTO = {
  ensaio:      { nome: 'Ensaio',            cor: '#c1795a' },
  reuniao:     { nome: 'Reunião',           cor: '#5b7c99' },
  entrega:     { nome: 'Entrega / álbum',   cor: '#7a9a6d' },
  bloqueio:    { nome: 'Bloqueio',          cor: '#8a8580' },
  pessoal:     { nome: 'Pessoal',           cor: '#9b7bb8' },
  evento:      { nome: 'Outro',             cor: '#b08968' },
  aniversario: { nome: 'Aniversário',       cor: '#d4a373' },
  conta:       { nome: 'Conta a vencer',    cor: '#b5563f' },
}
export const corDoTipo = (tipo) => (CORES_EVENTO[tipo] || CORES_EVENTO.evento).cor

export function mapEvento(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao || '',
    inicio: row.inicio,
    fim: row.fim,
    diaInteiro: !!row.dia_inteiro,
    cor: row.cor || corDoTipo(row.tipo),
    tipo: row.tipo || 'evento',
    clienteId: row.cliente_id,
    ensaioId: row.ensaio_id,
  }
}

export async function fetchEventos() {
  const { data, error } = await supabase.from('eventos').select('*').order('inicio', { ascending: true })
  if (error) { console.warn('[eventos] fetch falhou:', error.message); return [] }
  return (data || []).map(mapEvento)
}

function paraColunas(campos) {
  const col = {}
  if ('titulo' in campos) col.titulo = campos.titulo
  if ('descricao' in campos) col.descricao = campos.descricao || null
  if ('inicio' in campos) col.inicio = campos.inicio
  if ('fim' in campos) col.fim = campos.fim || null
  if ('diaInteiro' in campos) col.dia_inteiro = !!campos.diaInteiro
  if ('cor' in campos) col.cor = campos.cor || null
  if ('tipo' in campos) col.tipo = campos.tipo || 'evento'
  if ('clienteId' in campos) col.cliente_id = campos.clienteId || null
  if ('ensaioId' in campos) col.ensaio_id = campos.ensaioId || null
  return col
}

export async function criarEvento(campos) {
  const { data, error } = await supabase.from('eventos').insert(paraColunas(campos)).select().single()
  if (error) { console.warn('[eventos] criar falhou:', error.message); return { erro: error.message } }
  return mapEvento(data)
}

export async function atualizarEvento(id, campos) {
  const { data, error } = await supabase.from('eventos').update(paraColunas(campos)).eq('id', id).select().single()
  if (error) { console.warn('[eventos] atualizar falhou:', error.message); return { erro: error.message } }
  return mapEvento(data)
}

export async function excluirEvento(id) {
  const { error } = await supabase.from('eventos').delete().eq('id', id)
  if (error) { console.warn('[eventos] excluir falhou:', error.message); return false }
  return true
}
