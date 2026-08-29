// Diagnóstico do Bloco 1: lê pacotes via anon key, igual ao site faz.
// Uso: node scripts/diag-catalogo.mjs
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// lê o .env na mão (sem depender do Vite)
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
console.log('URL:', url)
console.log('anon key começa com:', key?.slice(0, 12), '… (len', key?.length, ')')

const supabase = createClient(url, key)

// 1) Query idêntica à do site (só ativos)
const ativos = await supabase.from('pacotes').select('slug,nome,preco,ativo').eq('ativo', true).order('ordem')
console.log('\n[A] select ativos (igual ao site):')
console.log('   error:', ativos.error)
console.log('   linhas:', ativos.data?.length)
console.table(ativos.data ?? [])

// 2) Query SEM filtro de ativo (vê se há linhas inativas)
const todos = await supabase.from('pacotes').select('slug,nome,preco,ativo').order('ordem')
console.log('\n[B] select TODOS (sem filtro ativo):')
console.log('   error:', todos.error)
console.log('   linhas:', todos.data?.length)
console.table(todos.data ?? [])
