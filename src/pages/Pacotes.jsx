import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, ArrowUpRight, Camera, Plus } from 'lucide-react'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import { formatBRL } from '../components/Money'
import { PACOTES } from '../data/studio'

const FAQ = [
  {
    q: 'Como funciona o pagamento da reserva?',
    a: 'Para garantir sua data, você paga apenas o valor da reserva no agendamento. O restante é acertado no dia do ensaio ou conforme combinarmos. No site, o pagamento da reserva é simulado (demo) — na versão final integramos PIX e cartão de verdade.',
  },
  {
    q: 'Posso escolher mais fotos do que o pacote inclui?',
    a: 'Sim! Cada pacote inclui um número de fotos tratadas, mas na sua galeria você pode adicionar fotos extras. O valor de cada foto adicional aparece em tempo real enquanto você seleciona.',
  },
  {
    q: 'Qual o prazo de entrega?',
    a: 'A entrega das fotos tratadas varia de 10 a 15 dias após a sua seleção, dependendo do pacote. O pacote Experiência Alma tem entrega prioritária.',
  },
  {
    q: 'As fotos ficam disponíveis por quanto tempo?',
    a: 'Suas fotos prontas ficam disponíveis para download na Área do Cliente. Recomendamos baixar e fazer backup assim que liberadas.',
  },
]

export default function Pacotes() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <PageHero
        n="04"
        eyebrow="Investimento"
        titulo="Pacotes para"
        destaque="cada momento."
        sub="Escolha o que melhor combina com a sua história. Valores ilustrativos para o demo — ajustamos juntos com o estúdio."
        gradient="ph-gradient-2"
      />

      {/* Pacotes — SPLIT-SCREEN: coluna esquerda sticky + pacotes rolando à direita */}
      <section className="relative bg-cream-100">
        <div className="container-c">
          <div className="grid md:grid-cols-12">
            {/* ESQUERDA — fixa na tela enquanto a direita rola */}
            <div className="md:col-span-5 md:pr-12">
              <div className="sticky top-0 flex min-h-screen flex-col justify-center py-[12vh]">
                <span className="font-sans text-xs uppercase tracking-widest2 text-terracotta-500">Investimento</span>
                <h2 className="display mt-4 text-5xl leading-[0.95] text-cocoa-900 md:text-7xl">
                  Um plano para <span className="italic text-terracotta-600">cada história.</span>
                </h2>
                <p className="mt-6 max-w-sm font-sans text-base font-light leading-relaxed text-cocoa-600">
                  Role para conhecer cada pacote. Valores ilustrativos para o demo — ajustamos juntos com o estúdio o que melhor combina com o seu momento.
                </p>
                <Link to="/agendar" className="btn-blush mt-8 w-fit">
                  Falar com a gente <ArrowUpRight size={16} />
                </Link>
                <p className="mt-6 font-sans text-sm text-cocoa-500">
                  Precisa de algo sob medida?{' '}
                  <Link to="/agendar" className="font-medium text-clay-500 link-underline">Montamos pra você.</Link>
                </p>
              </div>
            </div>

            {/* DIREITA — pacotes empilhados, rolam naturalmente */}
            <div className="md:col-span-7 md:py-[12vh]">
              <div className="flex flex-col gap-8 pb-[12vh] md:pb-0">
                {PACOTES.map((p, i) => (
                  <Reveal key={p.id} delay={0.05 * i}>
                    <div className={`rounded-2xl border p-7 md:p-9 ${p.destaque ? 'border-transparent bg-cocoa-950 text-cream-100 shadow-[0_24px_70px_rgba(86,92,85,0.3)]' : 'border-cocoa-800/12 bg-cream-50 shadow-[0_10px_40px_rgba(104,111,103,0.10)]'}`}>
                      {(p.destaque || p.selo) && (
                        <span className={`inline-block text-xs uppercase tracking-widest2 ${p.destaque ? 'text-clay-300' : 'text-terracotta-500'}`}>
                          {p.destaque ? 'Mais escolhido' : p.selo}
                        </span>
                      )}
                      <h3 className={`display mt-2 text-4xl md:text-5xl ${p.destaque ? 'text-cream-50' : 'text-cocoa-900'}`}>{p.nome}</h3>
                      <p className={`mt-2 font-sans text-sm ${p.destaque ? 'text-cream-100/60' : 'text-clay-600'}`}>{p.ideal}</p>
                      <div className="mt-5 flex items-baseline gap-3">
                        <span className={`display text-5xl ${p.destaque ? 'text-cream-50' : 'text-cocoa-900'}`}>{formatBRL(p.preco)}</span>
                        <span className={`text-xs ${p.destaque ? 'text-cream-100/50' : 'text-cocoa-500'}`}>reserva {formatBRL(p.reserva)}</span>
                      </div>
                      <ul className={`mt-6 grid gap-3 border-t pt-6 sm:grid-cols-2 ${p.destaque ? 'border-cream-100/15' : 'border-cocoa-800/10'}`}>
                        {p.inclui.map((item) => (
                          <li key={item} className="flex items-start gap-3 text-sm font-light">
                            <Check size={16} className={`mt-0.5 shrink-0 ${p.destaque ? 'text-clay-300' : 'text-clay-500'}`} />
                            <span className={p.destaque ? 'text-cream-100/85' : 'text-cocoa-600'}>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to={`/agendar?pacote=${p.id}`} className={`mt-7 inline-flex ${p.destaque ? 'btn-light' : 'btn-blush'}`}>
                        Escolher {p.nome} <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cocoa-950 py-[12vh] text-cream-100">
        <div className="container-c grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Reveal>
              <span className="font-sans text-xs uppercase tracking-widest2 text-terracotta-400">Dúvidas</span>
              <h2 className="display mt-4 text-4xl md:text-5xl">Perguntas <span className="italic text-clay-300">& respostas.</span></h2>
            </Reveal>
          </div>
          <div className="md:col-span-8">
            <div className="border-t border-cream-100/10">
              {FAQ.map((f, i) => (
                <Reveal key={i} delay={i * 0.05}>
                  <details className="group border-b border-cream-100/10 py-5 [&_summary]:cursor-pointer">
                    <summary className="flex items-center justify-between gap-4 font-serif text-xl text-cream-100 marker:content-['']">
                      {f.q}
                      <Plus size={20} className="shrink-0 text-clay-400 transition-transform group-open:rotate-45" />
                    </summary>
                    <p className="mt-4 max-w-2xl font-sans text-sm font-light leading-relaxed text-cream-100/65">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-100 py-[12vh] text-center">
        <div className="container-c">
          <Reveal><h2 className="display text-4xl text-cocoa-800 md:text-6xl">Pronto para garantir <span className="italic text-clay-500">sua data?</span></h2></Reveal>
          <Reveal delay={0.1}>
            <Link to="/agendar" className="btn-blush mt-8"><Camera size={16} /> Agendar e reservar</Link>
          </Reveal>
        </div>
      </section>
    </motion.div>
  )
}
