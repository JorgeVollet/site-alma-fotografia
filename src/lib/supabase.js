import { createClient } from '@supabase/supabase-js'

// Client único do Supabase para todo o app.
// Só a anon key vai pro frontend — a service_role NUNCA entra aqui
// (fica só em Edge Functions/servidor). Ver CONTEXTO-PARA-CLAUDE-CODE.md.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigurado = Boolean(url && anonKey)

const AVISO =
  '[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes. ' +
  'No deploy (Vercel/Netlify), cadastre as duas variáveis no painel do projeto ' +
  'e faça um novo deploy. Localmente, confira o arquivo .env na raiz.'

// Sem as chaves, createClient LANÇA e derruba o bundle inteiro — inclusive as
// páginas que nem usam banco (Home, Portfólio, Serviços), deixando o site em
// branco. Foi o que aconteceu no primeiro deploy: o .env é gitignored, então a
// Vercel subiu sem as variáveis.
//
// Este cliente inerte responde a qualquer cadeia de chamadas com
// { data: null, error } em vez de estourar. O site institucional continua de
// pé e só o que depende do banco fica indisponível — com erro visível, não
// com tela branca.
function clienteInerte() {
  const erro = { message: 'Supabase não configurado neste ambiente.', code: 'SEM_CONFIG' }
  const resposta = { data: { session: null, user: null, subscription: null }, error: erro, count: 0 }

  const criar = () => new Proxy(function () {}, {
    get(_alvo, prop) {
      // torna qualquer ponto da cadeia "awaitable": await supabase.from(..).select()
      // devolve { data, error } como o cliente real devolveria.
      if (prop === 'then') return (resolve) => resolve(resposta)
      if (prop === 'data') return resposta.data
      if (prop === 'error') return erro
      return criar()
    },
    apply() { return criar() },
  })
  return criar()
}

if (!supabaseConfigurado) console.error(AVISO)

export const supabase = supabaseConfigurado
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : clienteInerte()
