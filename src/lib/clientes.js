// Camada de dados de CLIENTES (Bloco 2).
// Lê/escreve no Supabase. SEM fallback: o admin começa VAZIO — o Jorge
// cria os clientes de verdade testando. Só a equipe (authenticated) acessa.
import { supabase } from './supabase'

const GRADS = ['ph-gradient', 'ph-gradient-2', 'ph-gradient-3', 'ph-gradient-4']
const gradAleatorio = () => GRADS[Math.floor(Math.random() * GRADS.length)]

// Linha do banco -> shape que o AppContext/telas já esperam.
export function mapCliente(row) {
  const etapa = row.funil_etapa || 'lead'
  return {
    id: row.id,
    nome: row.nome,
    contato: row.contato || '',
    email: row.email || '',
    telefone: row.telefone || '',
    dataNascimento: row.data_nascimento || null,
    interesse: row.interesse || '',
    origem: row.origem || '',
    notas: row.notas || '',
    urgencia: row.urgencia || '',
    primeiroContato: row.primeiro_contato || null,
    orcamento: row.orcamento || null,
    desde: row.desde,
    funil: etapa,
    etapa,
    avatarGrad: row.avatar_grad || 'ph-gradient-2',
    // objeto consumido pelo BlocoLead do ClienteModal (estava sempre vazio)
    lead: {
      origem: row.origem || '',
      primeiroContato: row.primeiro_contato || null,
      interesse: row.interesse || '',
      urgencia: row.urgencia || '',
      notas: row.notas || '',
    },
    ensaios: [],      // Bloco 3 (Ensaios) anexa os ensaios do cliente
    custom: true,     // tudo é "real" agora (não há mais demo)
  }
}

// Campos do app -> colunas do banco (só os presentes).
function paraColunas(campos) {
  const col = {}
  if ('nome' in campos) col.nome = campos.nome
  if ('contato' in campos) col.contato = campos.contato || null
  if ('email' in campos) col.email = campos.email || null
  if ('telefone' in campos) col.telefone = campos.telefone || null
  if ('dataNascimento' in campos) col.data_nascimento = campos.dataNascimento || null
  if ('interesse' in campos) col.interesse = campos.interesse || null
  if ('origem' in campos) col.origem = campos.origem || null
  if ('notas' in campos) col.notas = campos.notas || null
  if ('urgencia' in campos) col.urgencia = campos.urgencia || null
  if ('primeiroContato' in campos) col.primeiro_contato = campos.primeiroContato || null
  if ('orcamento' in campos) col.orcamento = campos.orcamento || null
  if ('funil' in campos) col.funil_etapa = campos.funil
  if ('avatarGrad' in campos) col.avatar_grad = campos.avatarGrad
  return col
}

export async function fetchClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.warn('[clientes] fetch falhou:', error.message)
    return []
  }
  return (data || []).map(mapCliente)
}

export async function criarCliente(campos) {
  const payload = paraColunas({ funil: 'lead', avatarGrad: gradAleatorio(), ...campos })
  const { data, error } = await supabase
    .from('clientes')
    .insert(payload)
    .select()
    .single()
  if (error) {
    console.warn('[clientes] criar falhou:', error.message)
    return null
  }
  return mapCliente(data)
}

export async function atualizarCliente(id, campos) {
  const { data, error } = await supabase
    .from('clientes')
    .update(paraColunas(campos))
    .eq('id', id)
    .select()
    .single()
  if (error) {
    console.warn('[clientes] atualizar falhou:', error.message)
    return null
  }
  return mapCliente(data)
}

export async function moverClienteFunil(id, etapa) {
  return atualizarCliente(id, { funil: etapa })
}

export async function removerCliente(id) {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) {
    console.warn('[clientes] remover falhou:', error.message)
    return false
  }
  return true
}
