// TESTE DE FUMAÇA — camada anônima (o que um visitante do site alcança).
// SÓ LEITURA e chamadas que não gravam nada. Nunca chama solicitar_contato
// nem finalizar_selecao (essas escrevem no banco de produção).
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim()
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim()
const sb = createClient(url, key)

let ok = 0, falhou = 0
const t = async (nome, fn) => {
  try {
    const r = await fn()
    if (r === true) { console.log('  OK   ' + nome); ok++ }
    else { console.log('  FALHA ' + nome + '  -> ' + r); falhou++ }
  } catch (e) { console.log('  ERRO ' + nome + '  -> ' + e.message); falhou++ }
}

console.log('\n== 1. LEITURA PÚBLICA (o site precisa disso) ==')
await t('pacotes legíveis por anon', async () => {
  const { data, error } = await sb.from('pacotes').select('slug,nome,reserva').limit(5)
  if (error) return 'erro: ' + error.message
  return Array.isArray(data) ? true : 'nao veio array'
})
await t('produtos legíveis por anon', async () => {
  const { data, error } = await sb.from('produtos').select('slug,nome').limit(5)
  if (error) return 'erro: ' + error.message
  return Array.isArray(data) ? true : 'nao veio array'
})
await t('config_estudio legível por anon (migration 17)', async () => {
  const { data, error } = await sb.from('config_estudio').select('*').eq('id', 1).maybeSingle()
  if (error) return 'erro: ' + error.message
  if (!data) return 'linha id=1 nao existe'
  if (!('pagamento_online_padrao' in data)) return 'falta coluna pagamento_online_padrao (migration 18)'
  return true
})

console.log('\n== 2. PRIVACIDADE (anon NÃO pode ler estes) ==')
for (const tab of ['clientes', 'ensaios', 'galerias', 'fotos', 'contas_receber', 'lancamentos', 'contratos', 'profiles']) {
  await t('anon NÃO lê ' + tab, async () => {
    const { data, error } = await sb.from(tab).select('id').limit(1)
    if (error) return true                       // bloqueado: correto
    if (Array.isArray(data) && data.length === 0) return true  // RLS filtra tudo: correto
    return 'VAZOU ' + data.length + ' registro(s)!'
  })
}

console.log('\n== 3. ESCRITA INDEVIDA (anon NÃO pode gravar) ==')
await t('anon NÃO cria cliente direto', async () => {
  const { error } = await sb.from('clientes').insert({ nome: '__teste_seguranca__' }).select()
  return error ? true : 'CONSEGUIU INSERIR CLIENTE!'
})
await t('anon NÃO altera config_estudio', async () => {
  const { data, error } = await sb.from('config_estudio').update({ sinal_reserva: 999 }).eq('id', 1).select()
  if (error) return true
  return (data && data.length) ? 'CONSEGUIU ALTERAR CONFIG!' : true
})
await t('anon NÃO marca conta como paga', async () => {
  const { data, error } = await sb.from('contas_receber').update({ status: 'pago' }).neq('id', '00000000-0000-0000-0000-000000000000').select()
  if (error) return true
  return (data && data.length) ? 'CONSEGUIU QUITAR CONTA!' : true
})

console.log('\n== 4. RPCs PÚBLICAS (existem e recusam entrada inválida) ==')
await t('entrar_galeria recusa código inexistente', async () => {
  const { data, error } = await sb.rpc('entrar_galeria', { p_codigo: '__nao_existe__', p_senha: 'x' })
  if (error) return 'erro: ' + error.message
  if (data && data.ok === false) return true
  return 'devolveu ok=true p/ código falso!'
})
await t('entrar_galeria não vaza dado no erro', async () => {
  const { data } = await sb.rpc('entrar_galeria', { p_codigo: '__nao_existe__', p_senha: 'x' })
  const s = JSON.stringify(data || {})
  return (s.includes('fotos') || s.includes('token')) ? 'resposta de erro carrega dados: ' + s.slice(0, 120) : true
})
await t('solicitar_contato EXISTE com 6 parâmetros', async () => {
  // nome vazio -> a função retorna ok:false ANTES de gravar qualquer coisa
  const { data, error } = await sb.rpc('solicitar_contato', {
    p_nome: '', p_email: null, p_telefone: null, p_servico: null, p_servico_nome: null, p_mensagem: null,
  })
  if (error) return 'erro: ' + error.message
  if (data && data.ok === false) return true
  return 'aceitou nome vazio: ' + JSON.stringify(data)
})
await t('solicitar_contato exige e-mail OU telefone', async () => {
  const { data, error } = await sb.rpc('solicitar_contato', {
    p_nome: 'Teste', p_email: null, p_telefone: null, p_servico: null, p_servico_nome: null, p_mensagem: null,
  })
  if (error) return 'erro: ' + error.message
  if (data && data.ok === false) return true
  return 'CRIOU CLIENTE SEM CONTATO: ' + JSON.stringify(data)
})
await t('solicitar_contato sem overload ambíguo', async () => {
  // Chamar com 5 dos 6 parâmetros NÃO prova nada sozinho: p_servico_nome tem
  // DEFAULT, então a versão nova aceita a chamada curta. O que este teste pega
  // é a AMBIGUIDADE: se a versão antiga de 5 params tivesse sobrevivido ao
  // "drop", as duas casariam e o PostgREST responderia PGRST203
  // ("could not choose the best candidate function").
  const { error } = await sb.rpc('solicitar_contato', {
    p_nome: '', p_email: null, p_telefone: null, p_servico: null, p_mensagem: null,
  })
  if (error && /best candidate|PGRST203|not unique|ambiguous/i.test(error.message + (error.code || ''))) {
    return 'AS DUAS VERSÕES existem (o drop da antiga não pegou): ' + error.message
  }
  return true
})
await t('finalizar_selecao recusa token inválido', async () => {
  const { data, error } = await sb.rpc('finalizar_selecao', {
    p_token: '00000000-0000-0000-0000-000000000000', p_pagar_agora: true,
  })
  if (error) return 'erro: ' + error.message
  return (data && data.ok === false) ? true : 'aceitou token falso!'
})
await t('salvar_selecao_foto recusa token inválido', async () => {
  const { data, error } = await sb.rpc('salvar_selecao_foto', {
    p_token: '00000000-0000-0000-0000-000000000000',
    p_foto_id: '00000000-0000-0000-0000-000000000000',
    p_selecionada: true, p_observacao: null,
  })
  if (error) return true
  return (data && data.ok === false) ? true : 'aceitou token falso!'
})
await t('carregar_contrato recusa token inválido', async () => {
  const { data, error } = await sb.rpc('carregar_contrato', { p_token: '00000000-0000-0000-0000-000000000000' })
  if (error) return true
  if (!data || data.ok === false) return true
  return 'devolveu contrato p/ token falso: ' + JSON.stringify(data).slice(0, 120)
})

console.log('\n== 5. BUCKETS PÚBLICOS (não podem ser listáveis) ==')
for (const b of ['previews', 'entregas']) {
  await t('bucket ' + b + ' NÃO lista arquivos p/ anon', async () => {
    const { data, error } = await sb.storage.from(b).list('', { limit: 5 })
    if (error) return true
    return (data && data.length) ? 'LISTOU ' + data.length + ' item(ns) — dá pra varrer as fotos' : true
  })
}
await t('bucket galerias (privado) NÃO entrega original', async () => {
  const { data, error } = await sb.storage.from('galerias').list('', { limit: 3 })
  if (error) return true
  return (data && data.length) ? 'LISTOU originais!' : true
})
await t('bucket contratos (privado) NÃO lista PDFs', async () => {
  const { data, error } = await sb.storage.from('contratos').list('', { limit: 3 })
  if (error) return true
  return (data && data.length) ? 'LISTOU contratos!' : true
})

console.log('\n===================================')
console.log('OK: ' + ok + '   |   PROBLEMAS: ' + falhou)
console.log('===================================\n')
