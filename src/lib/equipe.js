// Equipe = profiles do Supabase Auth (Bloco 0).
import { supabase } from './supabase'

export function mapProfile(row) {
  return { id: row.id, nome: row.nome || '', email: row.email || '', role: row.role, ativo: row.ativo }
}

export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('nome', { ascending: true })
  if (error) { console.warn('[equipe] fetch profiles:', error.message); return [] }
  return (data || []).map(mapProfile)
}
