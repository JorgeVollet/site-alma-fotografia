// Acesso do CLIENTE FINAL à galeria (Bloco 5). O cliente é anônimo: tudo
// passa por funções SQL no servidor (RPC), validando código+senha / token.
import { supabase } from './supabase'
import { urlPublica, urlEntrega } from './storage'

function mapFotoCliente(f) {
  return {
    id: f.id,
    previewUrl: urlPublica(f.preview_path),
    thumbUrl: urlPublica(f.thumb_path),
    selecionada: !!f.selecionada,
    favorita: !!f.favorita_fotografo,
    observacao: f.observacao || '',
  }
}

// Foto de ENTREGA (final, sem marca) — o cliente baixa no tamanho real.
function mapEntregaCliente(f) {
  return {
    id: f.id,
    fullUrl: urlEntrega(f.preview_path),
    thumbUrl: urlEntrega(f.thumb_path),
    nome: f.nome_arquivo || 'foto.jpg',
  }
}

export async function entrarGaleria(codigo, senha) {
  const { data, error } = await supabase.rpc('entrar_galeria', { p_codigo: codigo, p_senha: senha })
  if (error) {
    console.warn('[cliente] login falhou:', error.message)
    return { ok: false, erro: 'Não foi possível entrar agora. Tente de novo.' }
  }
  if (!data?.ok) return { ok: false, erro: data?.erro || 'Código ou senha inválidos.' }
  return {
    ok: true,
    token: data.token,
    galeria: {
      id: data.galeria.id,
      nome: data.galeria.nome,
      status: data.galeria.status,
      fotosInclusas: data.galeria.fotos_inclusas || 0,
      fotoExtra: data.galeria.foto_extra != null ? Number(data.galeria.foto_extra) : 0,
      valorTotal: data.galeria.valor_total != null ? Number(data.galeria.valor_total) : 0,
      reserva: data.galeria.reserva != null ? Number(data.galeria.reserva) : 0,
      mensagemFotografo: data.galeria.mensagem_fotografo || '',
    },
    fotos: (data.fotos || []).map(mapFotoCliente),
    entregas: (data.entregas || []).map(mapEntregaCliente),
  }
}

// Recorrência: cliente escolheu mais fotos e reenvia (status volta a 'enviado').
export async function reenviarSelecao(token) {
  const { data, error } = await supabase.rpc('reenviar_selecao', { p_token: token })
  if (error) { console.warn('[cliente] reenviar falhou:', error.message); return { ok: false } }
  return data || { ok: false }
}

export async function salvarSelecaoFoto(token, fotoId, selecionada, observacao) {
  const { data, error } = await supabase.rpc('salvar_selecao_foto', {
    p_token: token,
    p_foto_id: fotoId,
    p_selecionada: selecionada,
    p_observacao: observacao ?? null,
  })
  if (error) { console.warn('[cliente] salvar seleção falhou:', error.message); return false }
  return !!data?.ok
}

// Finaliza a seleção definindo o pagamento (agora ou em 3 dias úteis).
// Devolve o detalhamento do total e o vencimento.
export async function finalizarSelecao(token, pagarAgora) {
  const { data, error } = await supabase.rpc('finalizar_selecao', { p_token: token, p_pagar_agora: pagarAgora })
  if (error) { console.warn('[cliente] finalizar falhou:', error.message); return { ok: false } }
  return data || { ok: false }
}
