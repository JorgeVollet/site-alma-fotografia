import { createClient } from '@supabase/supabase-js'

// Client único do Supabase para todo o app.
// Só a anon key vai pro frontend — a service_role NUNCA entra aqui
// (fica só em Edge Functions/servidor). Ver CONTEXTO-PARA-CLAUDE-CODE.md.
// Limpa o que vem do ambiente antes de usar.
//
// Copiar/colar a chave num painel de deploy costuma trazer carona invisivel:
// espaco nao-quebravel (U+00A0), zero-width (U+200B), aspas curvas, quebra de
// linha. O Supabase manda a anon key num HEADER HTTP, e header so aceita
// Latin-1 — um caractere desses derruba o fetch com um erro cripitico
// ("String contains non ISO-8859-1 code point") que nao diz o que houve.
//
// A anon key e um JWT: so pode ter letras, numeros, '-', '_' e '.'. Entao
// remover qualquer outra coisa e seguro e conserta o colar sujo.
function limparChave(v) {
  return String(v || '').trim().replace(/[^A-Za-z0-9._-]/g, '')
}
function limparUrl(v) {
  return String(v || '').trim().replace(/[^!-~]/g, '').replace(/\/+$/, '')
}

const url = limparUrl(import.meta.env.VITE_SUPABASE_URL)
const anonKey = limparChave(import.meta.env.VITE_SUPABASE_ANON_KEY)

// avisa se a limpeza precisou agir — assim da para corrigir na origem
if (import.meta.env.VITE_SUPABASE_ANON_KEY &&
    anonKey !== String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim()) {
  console.warn(
    '[supabase] A anon key tinha caracteres invalidos (invisiveis) e foi limpa. ' +
    'Recomende-se recolar o valor no painel de deploy, sem formatacao.'
  )
}
if (anonKey && anonKey.split('.').length !== 3) {
  console.error(
    '[supabase] A anon key nao parece um JWT valido (deveria ter 3 partes separadas por ponto). ' +
    'Confira o valor de VITE_SUPABASE_ANON_KEY no painel de deploy.'
  )
}

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
