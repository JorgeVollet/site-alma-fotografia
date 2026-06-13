import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, Camera } from 'lucide-react'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Photo from '../components/Photo'
import CardEquipe from '../components/CardEquipe'
import { SERVICOS, EQUIPE, STUDIO, ESSENCIA } from '../data/studio'

export default function Servicos() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <PageHero
        n="02"
        eyebrow="Nossos serviços"
        titulo="Cada fase,"
        destaque="um olhar de carinho."
        sub="Conheça em detalhes os ensaios que realizamos. Cada um pensado para acolher a sua família e revelar a beleza de cada momento."
      />

      {/* Manifesto / quem somos */}
      <section className="bg-cream-100 py-[12vh]">
        <div className="container-c grid gap-10 md:grid-cols-12">
          <div className="md:col-span-3">
            <Reveal><span className="font-sans text-xs uppercase tracking-widest2 text-clay-600">Quem somos</span></Reveal>
          </div>
          <div className="md:col-span-9">
            <Reveal delay={0.1}>
              <h2 className="display text-balance text-3xl leading-[1.05] text-cocoa-900 md:text-5xl">
                {ESSENCIA.titulo}
              </h2>
            </Reveal>
            <div className="mt-6 max-w-2xl space-y-4">
              {ESSENCIA.texto.map((par, i) => (
                <Reveal key={i} delay={0.15 + i * 0.08}>
                  <p className="font-sans text-base font-light leading-relaxed text-cocoa-600">{par}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.4}>
              <p className="mt-6 font-serif text-xl italic text-clay-500 md:text-2xl">
                {ESSENCIA.boasVindas[0]}<br />{ESSENCIA.boasVindas[1]}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Serviços — índice editorial alternando lado da foto */}
      <section className="bg-cocoa-950 py-[12vh] text-cream-100">
        <div className="container-c">
          {SERVICOS.map((s, i) => {
            const reverse = i % 2 === 1
            return (
              <Reveal key={s.id} delay={0.04}>
                <div id={s.id} className="grid scroll-mt-28 items-center gap-8 border-t border-cream-100/10 py-12 md:grid-cols-12">
                  <div className={`md:col-span-5 ${reverse ? 'md:order-2' : ''}`}>
                    {s.foto ? (
                      <img
                        src={s.foto}
                        alt={`Ensaio ${s.nome} — Alma Fotografia`}
                        loading="lazy"
                        draggable={false}
                        className="h-auto max-h-[520px] w-auto max-w-full rounded-sm object-contain"
                      />
                    ) : (
                      <div className={`${s.gradient} aspect-[5/4] w-full rounded-sm`} />
                    )}
                  </div>
                  <div className={`md:col-span-7 ${reverse ? 'md:order-1 md:pr-10' : 'md:pl-10'}`}>
                    <span className="font-sans text-sm text-cream-100/30">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="display mt-2 text-4xl text-cream-100 md:text-6xl">{s.nome}</h3>
                    <p className="mt-4 max-w-md font-sans text-sm font-light leading-relaxed text-cream-100/65">{s.descricao}</p>
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {s.tags.map((t) => (
                        <li key={t} className="rounded-full border border-cream-100/15 px-3 py-1.5 text-xs text-cream-100/70">{t}</li>
                      ))}
                    </ul>
                    <Link to="/agendar" className="mt-7 inline-flex items-center gap-2 text-sm text-clay-400 link-underline">
                      Agendar {s.nome} <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Equipe */}
      <section className="bg-cream-100 py-[12vh]">
        <div className="container-c">
          <Reveal>
            <span className="font-sans text-xs uppercase tracking-widest2 text-clay-600">Nossa equipe</span>
            <h2 className="display mt-4 text-4xl text-cocoa-800 md:text-6xl">
              Por trás das <span className="italic text-clay-500">lentes.</span>
            </h2>
            <p className="mt-3 text-sm text-cocoa-500">Aline & Maurício — os dois corações por trás da Alma.</p>
          </Reveal>
          <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-3">
                        {EQUIPE.map((m, i) => (
              <Reveal key={m.nome} delay={i * 0.12}>
                <CardEquipe m={m} i={i} cta="Agendar ensaio" to="/agendar" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cocoa-950 py-[12vh] text-center text-cream-100">
        <div className="container-c">
          <Reveal>
            <h2 className="display text-4xl md:text-6xl">Encontrou o ensaio <span className="italic text-clay-300">perfeito?</span></h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/agendar" className="btn-blush mt-8"><Camera size={16} /> Agendar agora <ArrowRight size={15} /></Link>
          </Reveal>
        </div>
      </section>
    </motion.div>
  )
}
