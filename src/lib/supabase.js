import { createClient } from '@supabase/supabase-js'

// Client único do Supabase para todo o app.
// Só a anon key vai pro frontend — a service_role NUNCA entra aqui
// (fica só em Edge Functions/servidor). Ver CONTEXTO-PARA-CLAUDE-CODE.md.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Não derruba o app: avisa no console para o dev conferir o .env.
  console.warn(
    '[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes. ' +
    'Confira o arquivo .env na raiz do projeto.'
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
