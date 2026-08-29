// Solicitação de contato pelo site (Bloco 18).
// O site NÃO marca mais data/hora (decisão do Maurício: cada ensaio tem uma
// duração própria, marcar no site dava B.O.). Aqui a gente só CAPTA O LEAD —
// o cliente entra no CRM e a conversa continua no WhatsApp.
import { supabase } from './supabase'

export async function solicitarContato({ nome, email, telefone, servico, mensagem }) {
  const { data, error } = await supabase.rpc('solicitar_contato', {
    p_nome: nome,
    p_email: email || null,
    p_telefone: telefone || null,
    p_servico: servico || null,
    p_mensagem: mensagem || null,
  })
  if (error) {
    console.warn('[contato] solicitar falhou:', error.message)
    return { ok: false, erro: 'Não foi possível enviar agora. Fale com a gente no WhatsApp.' }
  }
  return data || { ok: false }
}
