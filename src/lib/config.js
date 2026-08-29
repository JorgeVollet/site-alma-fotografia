// Configuração do estúdio (tabela singleton config_estudio, id=1).
// Guarda o que varia de estúdio pra estúdio — importante pra PASTA FONTE, onde
// outro estúdio pode querer preços à vista ou pagamento online ligado por padrão.
import { supabase } from './supabase'

export function mapConfig(row) {
  return {
    sinalReserva: row?.sinal_reserva != null ? Number(row.sinal_reserva) : 0,
    mostrarPrecos: !!row?.mostrar_precos,
    pagamentoOnlinePadrao: !!row?.pagamento_online_padrao,
  }
}

export async function fetchConfig() {
  const { data, error } = await supabase.from('config_estudio').select('*').eq('id', 1).maybeSingle()
  if (error) { console.warn('[config] fetch falhou:', error.message); return null }
  return data ? mapConfig(data) : null
}

export async function atualizarConfig(campos) {
  const col = {}
  if ('sinalReserva' in campos) col.sinal_reserva = campos.sinalReserva
  if ('mostrarPrecos' in campos) col.mostrar_precos = !!campos.mostrarPrecos
  if ('pagamentoOnlinePadrao' in campos) col.pagamento_online_padrao = !!campos.pagamentoOnlinePadrao
  col.atualizado_em = new Date().toISOString()
  const { data, error } = await supabase.from('config_estudio').update(col).eq('id', 1).select().single()
  if (error) { console.warn('[config] atualizar falhou:', error.message); return null }
  return mapConfig(data)
}
