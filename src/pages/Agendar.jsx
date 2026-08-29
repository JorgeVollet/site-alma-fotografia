// SOLICITAR CONTATO (antiga página de agendamento).
//
// Decisão do Maurício (ago/2026): o site NÃO marca mais data e hora. Cada ensaio
// tem uma duração própria (uma criança mais agitada pede 2h30, não 2h), e fixar
// isso no site "dava muito B.O.". Agora o site faz o que faz melhor: capta o
// contato, registra o lead no CRM (pra alimentar o funil e os aniversários) e
// leva a conversa pro WhatsApp, onde a data e o valor são combinados a dedo.
import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, User, Mail, Phone, MessageCircle, Loader2, Camera, Heart } from 'lucide-react'
import PageHero from '../components/PageHero'
import { SERVICOS, STUDIO } from '../data/studio'
import { solicitarContato } from '../lib/contato'
import { waLink } from '../lib/wa'

const campo =
  'mt-1.5 w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm text-cocoa-800 outline-none transition focus:border-cocoa-800 focus:ring-1 focus:ring-cocoa-800'

export default function Agendar() {
  const [params] = useSearchParams()
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    servico: params.get('servico') || (SERVICOS[0] && SERVICOS[0].id) || 'gestante',
    mensagem: '',
  })

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const servicoSel = SERVICOS.find((s) => s.id === form.servico)
  const nomeServico = servicoSel ? servicoSel.nome : 'um ensaio'

  const valido = form.nome.trim().length >= 2 && form.telefone.replace(/\D/g, '').length >= 10

  // Texto que já vai escrito no WhatsApp — o estúdio recebe o contexto pronto.
  const textoWa = `Oi! Sou ${form.nome.trim()}. Vim pelo site e gostaria de saber mais sobre ${nomeServico}.${
    form.mensagem.trim() ? ` ${form.mensagem.trim()}` : ''
  }`
  const linkWa = waLink(STUDIO.whatsapp, textoWa)

  const enviar = async () => {
    if (!valido || enviando) return
    setEnviando(true)
    setErro('')

    // Abre a aba do WhatsApp AGORA, ainda dentro do clique: se abrirmos depois
    // do await, o navegador entende como pop-up e bloqueia. A aba fica em branco
    // por um instante e carrega sozinha.
    const aba = linkWa ? window.open(linkWa, '_blank', 'noopener') : null

    const r = await solicitarContato({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      servico: form.servico,           // slug ('gestante'), p/ filtrar depois
      servicoNome: nomeServico,        // nome bonito, p/ ler no CRM
      mensagem: form.mensagem,
    })
    setEnviando(false)

    // Mesmo se o registro falhar, o cliente NÃO fica na mão: o botão da tela
    // de sucesso continua levando pro WhatsApp.
    if (!r.ok) setErro(r.erro || 'Não conseguimos registrar, mas pode falar com a gente no WhatsApp.')
    setEnviado(true)
    if (!aba && linkWa) window.open(linkWa, '_blank', 'noopener')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <PageHero
        n="04"
        eyebrow="Vamos conversar"
        titulo="Conte pra gente"
        destaque="o que você sonha"
        sub="Deixe seu contato e o tipo de ensaio que você quer. A gente responde no WhatsApp para combinar a melhor data e montar um orçamento sob medida pra você."
        gradient="ph-gradient-3"
      />

      <section className="bg-cream-100 py-16 md:py-24">
        <div className="container-c mx-auto max-w-2xl">
          <div className="rounded-3xl bg-cream-50 p-7 shadow-sm ring-1 ring-cocoa-800/5 md:p-10">
            <AnimatePresence mode="wait">
              {enviado ? (
                <motion.div
                  key="pronto"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-4 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 160 }}
                    className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-clay-400 text-cream-50"
                  >
                    <Check size={40} />
                  </motion.div>
                  <h2 className="mt-6 font-serif text-3xl text-cocoa-800">Recebemos o seu recado! 💛</h2>
                  <p className="mx-auto mt-3 max-w-md font-sans font-light text-cocoa-600">
                    Obrigado, <strong className="font-medium">{form.nome.trim().split(' ')[0]}</strong>. Abrimos o
                    WhatsApp pra você — se a janela não apareceu, é só clicar no botão abaixo.
                  </p>
                  {erro && <p className="mx-auto mt-4 max-w-md text-xs text-clay-600">{erro}</p>}

                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {linkWa && (
                      <a href={linkWa} target="_blank" rel="noopener noreferrer" className="btn-primary">
                        <MessageCircle size={16} /> Falar no WhatsApp
                      </a>
                    )}
                    <Link to="/portfolio" className="btn-outline">
                      <Camera size={16} /> Ver o portfólio
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="font-serif text-2xl text-cocoa-800">Qual ensaio você deseja?</h2>
                  <p className="mt-1 text-sm text-cocoa-500">
                    Escolha o tipo — o valor é montado sob medida, na conversa.
                  </p>

                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {SERVICOS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => set('servico', s.id)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          form.servico === s.id
                            ? 'border-cocoa-800 bg-cocoa-800/5 ring-1 ring-cocoa-800'
                            : 'border-cocoa-800/10 hover:border-clay-400'
                        }`}
                      >
                        <p className="font-serif text-lg text-cocoa-800">{s.nome}</p>
                        {s.resumo && <p className="mt-0.5 text-xs text-clay-500">{s.resumo}</p>}
                      </button>
                    ))}
                  </div>

                  <div className="mt-9 border-t border-cocoa-800/5 pt-7">
                    <h2 className="font-serif text-2xl text-cocoa-800">Como falamos com você?</h2>
                    <div className="mt-5 space-y-5">
                      <label className="block">
                        <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700">
                          <User size={15} /> Nome
                        </span>
                        <input
                          className={campo}
                          value={form.nome}
                          onChange={(e) => set('nome', e.target.value)}
                          placeholder="Como podemos te chamar?"
                        />
                      </label>
                      <label className="block">
                        <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700">
                          <Phone size={15} /> WhatsApp
                        </span>
                        <input
                          className={campo}
                          value={form.telefone}
                          onChange={(e) => set('telefone', e.target.value)}
                          placeholder="(55) 9 9999-9999"
                        />
                      </label>
                      <label className="block">
                        <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700">
                          <Mail size={15} /> E-mail <span className="text-cocoa-400">(opcional)</span>
                        </span>
                        <input
                          type="email"
                          className={campo}
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                          placeholder="seu@email.com"
                        />
                      </label>
                      <label className="block">
                        <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700">
                          <Heart size={15} /> Conte um pouco <span className="text-cocoa-400">(opcional)</span>
                        </span>
                        <textarea
                          rows={3}
                          className={campo + ' resize-none'}
                          value={form.mensagem}
                          onChange={(e) => set('mensagem', e.target.value)}
                          placeholder="Ex: estou de 30 semanas e queria um ensaio ao ar livre no fim do mês…"
                        />
                      </label>
                    </div>

                    <button
                      onClick={enviar}
                      disabled={!valido || enviando}
                      className="btn-primary mt-7 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {enviando ? (
                        <><Loader2 size={16} className="animate-spin" /> Enviando…</>
                      ) : (
                        <><MessageCircle size={16} /> Enviar e falar no WhatsApp</>
                      )}
                    </button>
                    <p className="mt-3 text-center text-xs text-cocoa-400">
                      Sem compromisso — a gente responde para combinar data e valores.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
