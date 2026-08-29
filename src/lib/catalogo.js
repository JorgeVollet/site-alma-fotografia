// Camada de dados do CATÁLOGO (pacotes + produtos).
// Lê do Supabase, mas com FALLBACK para os valores embutidos em studio.js:
// se o banco estiver fora/lento/vazio, o site nunca quebra nem pisca spinner —
// renderiza o embutido na hora e troca pelo do banco quando chega.
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { PACOTES as PACOTES_FALLBACK, PRODUTOS as PRODUTOS_FALLBACK } from '../data/studio'

// Linha do banco -> shape usado no frontend (mesmos nomes de campo de studio.js).
// 'id' continua sendo o slug (o app usa em URLs e keys); o uuid fica em 'uuid'.
function mapPacote(row) {
  return {
    id: row.slug,
    uuid: row.id,
    nome: row.nome,
    ideal: row.ideal,
    preco: Number(row.preco),
    reserva: Number(row.reserva),
    destaque: row.destaque,
    selo: row.selo,
    inclui: row.inclui || [],
    fotosInclusas: row.fotos_inclusas,
    fotoExtra: row.foto_extra != null ? Number(row.foto_extra) : null,
    tipo_fiscal: row.tipo_fiscal,
  }
}

function mapProduto(row) {
  return {
    id: row.slug,
    uuid: row.id,
    nome: row.nome,
    descricao: row.descricao,
    preco: Number(row.preco),
    tipo_fiscal: row.tipo_fiscal,
    personalizado: row.personalizado,
  }
}

export async function fetchPacotes() {
  const { data, error } = await supabase
    .from('pacotes')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
  if (error) {
    console.warn('[catalogo] falha ao ler pacotes, usando fallback:', error.message)
    return PACOTES_FALLBACK
  }
  if (!data || data.length === 0) return PACOTES_FALLBACK
  return data.map(mapPacote)
}

export async function fetchProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
  if (error) {
    console.warn('[catalogo] falha ao ler produtos, usando fallback:', error.message)
    return PRODUTOS_FALLBACK
  }
  if (!data || data.length === 0) return PRODUTOS_FALLBACK
  return data.map(mapProduto)
}

// Hooks: começam com o fallback (render instantâneo) e trocam pelo banco.
export function usePacotes() {
  const [pacotes, setPacotes] = useState(PACOTES_FALLBACK)
  useEffect(() => {
    let vivo = true
    fetchPacotes().then((p) => { if (vivo) setPacotes(p) })
    return () => { vivo = false }
  }, [])
  return pacotes
}

export function useProdutos() {
  const [produtos, setProdutos] = useState(PRODUTOS_FALLBACK)
  useEffect(() => {
    let vivo = true
    fetchProdutos().then((p) => { if (vivo) setProdutos(p) })
    return () => { vivo = false }
  }, [])
  return produtos
}
