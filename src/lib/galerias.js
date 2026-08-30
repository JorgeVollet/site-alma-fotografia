// Camada de dados de GALERIAS + FOTOS (Bloco 4A). Só a equipe (authenticated).
import { supabase } from './supabase'
import { gerarVersoes, uploadFotoVersoes, gerarEntrega, uploadEntrega, apagarArquivosFoto } from './storage'
import { fetchConfig } from './config'

export function mapGaleria(row) {
  return {
    id: row.id,
    ensaioId: row.ensaio_id,
    clienteId: row.cliente_id,
    nome: row.nome,
    codigo: row.codigo || '',
    senha: row.senha || '',
    status: row.status || 'selecionando',
    fotosInclusas: row.fotos_inclusas || 0,
    fotoExtra: row.foto_extra != null ? Number(row.foto_extra) : null,
    clienteNome: row.cliente?.nome || '',
    ensaioTitulo: row.ensaio?.titulo || '',
    mensagemFotografo: row.mensagem_fotografo || '',
    pagamentoOnline: !!row.pagamento_online,
    valorTotal: row.valor_total != null ? Number(row.valor_total) : 0,
    reserva: row.reserva != null ? Number(row.reserva) : 0,
    totalFotos: Array.isArray(row.fotos) ? (row.fotos[0]?.count ?? 0) : 0,
    criadoEm: row.created_at,
  }
}

export function mapFoto(row) {
  return {
    id: row.id,
    galeriaId: row.galeria_id,
    ordem: row.ordem,
    originalPath: row.original_path,
    previewPath: row.preview_path,
    thumbPath: row.thumb_path,
    nomeArquivo: row.nome_arquivo || '',
    tipo: row.tipo || 'selecao',
    selecionada: row.selecionada,
    favorita: !!row.favorita_fotografo,
    observacao: row.observacao || '',
  }
}

export async function fetchGalerias() {
  const { data, error } = await supabase
    .from('galerias')
    .select('*, cliente:clientes(nome), ensaio:ensaios(titulo), fotos(count)')
    .order('created_at', { ascending: false })
  if (error) { console.warn('[galerias] fetch falhou:', error.message); return [] }
  return (data || []).map(mapGaleria)
}

export async function criarGaleria(campos) {
  // Galeria nova nasce com o padrão do estúdio; o toggle da aba "Entrega"
  // sobrepõe caso a caso (o Maurício decide cliente a cliente).
  const cfg = await fetchConfig()
  const payload = {
    ensaio_id: campos.ensaioId || null,
    cliente_id: campos.clienteId || null,
    nome: campos.nome,
    codigo: campos.codigo || null,
    senha: campos.senha || null,
    fotos_inclusas: campos.fotosInclusas || 0,
    foto_extra: campos.fotoExtra ?? null,
    valor_total: campos.valorTotal ?? 0,
    reserva: campos.reserva ?? 0,
    pagamento_online: campos.pagamentoOnline ?? cfg?.pagamentoOnlinePadrao ?? false,
  }
  const { data, error } = await supabase.from('galerias').insert(payload).select().single()
  if (error) { console.warn('[galerias] criar falhou:', error.message); return null }
  return mapGaleria(data)
}

// Atualiza campos da galeria (senha, foto_extra, status, mensagem...).
export async function atualizarGaleria(id, campos) {
  const col = {}
  if ('senha' in campos) col.senha = campos.senha
  if ('fotoExtra' in campos) col.foto_extra = campos.fotoExtra
  if ('status' in campos) col.status = campos.status
  if ('fotosInclusas' in campos) col.fotos_inclusas = campos.fotosInclusas
  if ('mensagemFotografo' in campos) col.mensagem_fotografo = campos.mensagemFotografo
  if ('pagamentoOnline' in campos) col.pagamento_online = !!campos.pagamentoOnline
  // valores editáveis: a galeria congelava o preço na criação e não havia como
  // corrigir quando o ensaio nascia sem valor (lead do site)  [20]
  if ('valorTotal' in campos) col.valor_total = campos.valorTotal
  if ('reserva' in campos) col.reserva = campos.reserva
  const { data, error } = await supabase.from('galerias').update(col).eq('id', id).select().single()
  if (error) { console.warn('[galerias] atualizar falhou:', error.message); return null }
  return mapGaleria(data)
}

// O estúdio INDICA/desindica uma foto ao cliente (favorita do fotógrafo).
export async function toggleFavoritaFoto(id, favorita) {
  const { error } = await supabase.from('fotos').update({ favorita_fotografo: favorita }).eq('id', id)
  if (error) { console.warn('[fotos] favoritar falhou:', error.message); return false }
  return true
}

export async function excluirGaleria(id) {
  const { error } = await supabase.from('galerias').delete().eq('id', id)
  if (error) { console.warn('[galerias] excluir falhou:', error.message); return false }
  return true
}

// Conta a receber da seleção. A conta pode estar ligada à GALERIA (quando o
// cliente finalizou direto) OU só ao ENSAIO (o trigger do 09 cria a conta do
// saldo no ensaio com galeria_id nulo, e finalizar_selecao atualiza essa).
// Por isso buscamos por galeria_id OU ensaio_id — senão o painel some.
export async function fetchContaGaleria(galeriaId, ensaioId) {
  let q = supabase.from('contas_receber').select('*').neq('status', 'cancelado')
  if (galeriaId && ensaioId) q = q.or(`galeria_id.eq.${galeriaId},ensaio_id.eq.${ensaioId}`)
  else if (ensaioId) q = q.eq('ensaio_id', ensaioId) // ensaio sem galeria ainda (conta do saldo já existe)
  else q = q.eq('galeria_id', galeriaId)
  // ASC = mesma conta que o finalizar_selecao (09) atualiza (a mais antiga do
  // ensaio, criada pelo handle_new_ensaio). Se houver 2+ contas, ambos batem.
  const { data, error } = await q.order('created_at', { ascending: true }).limit(1).maybeSingle()
  if (error) { console.warn('[contas] fetch falhou:', error.message); return null }
  if (!data) return null
  return { id: data.id, valor: Number(data.valor), vencimento: data.vencimento, status: data.status, descricao: data.descricao }
}

// Todas as contas a receber (para Financeiro/Visão).
export async function fetchContasReceber() {
  const { data, error } = await supabase
    .from('contas_receber')
    .select('*')
    .order('vencimento', { ascending: true })
  if (error) { console.warn('[contas] fetch todas falhou:', error.message); return [] }
  return (data || []).map((c) => ({
    id: c.id, clienteId: c.cliente_id, galeriaId: c.galeria_id, descricao: c.descricao,
    valor: Number(c.valor), vencimento: c.vencimento, status: c.status, pagoEm: c.pago_em,
  }))
}

// Total de fotos marcadas como selecionadas (KPI do dashboard).
export async function contarFotosSelecionadas() {
  const { count, error } = await supabase.from('fotos').select('id', { count: 'exact', head: true }).eq('selecionada', true)
  if (error) { console.warn('[fotos] contar falhou:', error.message); return 0 }
  return count || 0
}

export async function marcarContaRecebida(id) {
  const { error } = await supabase.from('contas_receber').update({ status: 'pago', pago_em: new Date().toISOString() }).eq('id', id)
  if (error) { console.warn('[contas] marcar falhou:', error.message); return false }
  return true
}

// Desfaz o recebimento (volta de pago para pendente) — clique acidental.
export async function reabrirConta(id) {
  const { error } = await supabase.from('contas_receber').update({ status: 'pendente', pago_em: null }).eq('id', id)
  if (error) { console.warn('[contas] reabrir falhou:', error.message); return false }
  return true
}

export async function fetchFotos(galeriaId) {
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .eq('galeria_id', galeriaId)
    .order('ordem', { ascending: true })
  if (error) { console.warn('[fotos] fetch falhou:', error.message); return [] }
  return (data || []).map(mapFoto)
}

export async function excluirFoto(id) {
  // busca os caminhos ANTES de apagar a linha, senão perdemos a referência
  const { data: alvo } = await supabase.from('fotos').select('*').eq('id', id).maybeSingle()
  const { error } = await supabase.from('fotos').delete().eq('id', id)
  if (error) { console.warn('[fotos] excluir falhou:', error.message); return false }
  if (alvo) await apagarArquivosFoto(mapFoto(alvo))
  return true
}

// Exclui várias fotos de uma vez.
export async function excluirFotos(ids) {
  if (!ids || !ids.length) return false
  const { data: alvos } = await supabase.from('fotos').select('*').in('id', ids)
  const { error } = await supabase.from('fotos').delete().in('id', ids)
  if (error) { console.warn('[fotos] excluir várias falhou:', error.message); return false }
  for (const a of alvos || []) await apagarArquivosFoto(mapFoto(a))
  return true
}

// Sobe N arquivos para a galeria. tipo='selecao' gera prova 1024px com marca;
// tipo='entrega' sobe a final sem marca, no tamanho real. onProgress(feitas,total).
export async function adicionarFotos(galeriaId, files, tipo = 'selecao', ordemInicial = 0, onProgress) {
  const lista = Array.from(files)
  const criadas = []
  const falhas = []
  let ordem = ordemInicial
  for (let i = 0; i < lista.length; i++) {
    const file = lista[i]
    try {
      const fotoId = crypto.randomUUID()
      const paths = tipo === 'entrega'
        ? await uploadEntrega(galeriaId, fotoId, await gerarEntrega(file))
        : await uploadFotoVersoes(galeriaId, fotoId, await gerarVersoes(file))
      if (paths) {
        const { data, error } = await supabase
          .from('fotos')
          .insert({
            id: fotoId,
            galeria_id: galeriaId,
            ordem: ordem++,
            tipo,
            nome_arquivo: file.name || null,
            original_path: paths.original_path,
            preview_path: paths.preview_path,
            thumb_path: paths.thumb_path,
          })
          .select()
          .single()
        if (!error && data) criadas.push(mapFoto(data))
        else falhas.push({ nome: file.name || 'foto', motivo: error?.message || 'não foi possível registrar' })
      } else {
        falhas.push({ nome: file.name || 'foto', motivo: 'o envio para o storage falhou' })
      }
    } catch (e) {
      console.warn('[fotos] falha ao processar', file.name, e)
      falhas.push({ nome: file.name || 'foto', motivo: e?.message || 'arquivo não pôde ser lido' })
    }
    if (onProgress) onProgress(i + 1, lista.length)
  }
  // Devolve as FALHAS junto: antes a barra chegava a 100% e as fotos que não
  // subiram simplesmente sumiam, sem o fotógrafo perceber.
  return { criadas, falhas }
}
