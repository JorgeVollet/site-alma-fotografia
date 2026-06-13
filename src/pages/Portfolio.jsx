import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowUpRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../components/PageHero'
import Reveal from '../components/Reveal'
import Photo from '../components/Photo'
import { useApp } from '../context/AppContext'
import { CATEGORIAS_PORTFOLIO } from '../data/studio'
import { ensaiosDemo } from '../data/galleries'

const nomeCat = (id) => CATEGORIAS_PORTFOLIO.find((c) => c.id === id)?.nome || id

export default function Portfolio() {
  const { ensaios } = useApp()
  const [searchParams] = useSearchParams()
  const [cat, setCat] = useState(searchParams.get('cat') || 'todos')

  // ensaios reais primeiro; completa com demos das categorias sem ensaio real
  const lista = useMemo(() => {
    const reais = ensaios
    const catsComReal = new Set(reais.map((e) => e.categoria))
    const demos = ensaiosDemo().filter((d) => !catsComReal.has(d.categoria))
    return [...reais, ...demos]
  }, [ensaios])

  const filtrados = useMemo(
    () => (cat === 'todos' ? lista : lista.filter((e) => e.categoria === cat)),
    [lista, cat]
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <PageHero
        n="03"
        eyebrow="Portfólio"
        titulo="Momentos que"
        destaque="contam histórias"
        sub="Cada ensaio é uma história completa. Escolha uma categoria e clique para mergulhar na galeria."
        gradient="ph-gradient"
      />

      <section className="bg-cream-100 py-16 md:py-24">
        <div className="container-c">
          {/* Filtros */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {CATEGORIAS_PORTFOLIO.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`rounded-full px-5 py-2.5 font-sans text-sm tracking-wide transition-all duration-300 ${
                  cat === c.id
                    ? 'bg-cocoa-800 text-cream-100 shadow-md'
                    : 'bg-cream-200 text-cocoa-600 hover:bg-sand-100'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>

          {/* Grade de ensaios (cards) */}
          <motion.div layout className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtrados.map((e, i) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, delay: (i % 9) * 0.04 }}
                >
                  <CardEnsaio ensaio={e} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filtrados.length === 0 && (
            <p className="mt-12 text-center text-sm text-cocoa-600">Nenhum ensaio nesta categoria ainda.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cocoa-900 py-20 text-center text-cream-100">
        <div className="container-c">
          <Reveal><h2 className="display text-3xl md:text-4xl">Quer ver a sua história aqui?</h2></Reveal>
          <Reveal delay={0.1}>
            <Link to="/agendar" className="btn-light mt-8"><Camera size={16} /> Vamos criar juntos</Link>
          </Reveal>
        </div>
      </section>
    </motion.div>
  )
}

// Card de ensaio: capa + overlay com título/subtítulo no hover, clicável.
function CardEnsaio({ ensaio }) {
  const capa = ensaio.capa || ensaio.fotos[0]?.src
  return (
    <Link to={`/ensaio/${ensaio.id}`} className="group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-200 shadow-sm ring-1 ring-cocoa-900/5"
      >
        <Photo
          src={capa}
          alt={ensaio.titulo}
          className="h-full w-full transition-transform duration-700 ease-smooth group-hover:scale-105"
        />
        {/* gradiente sempre presente em baixo p/ legibilidade do título */}
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950/85 via-cocoa-950/10 to-transparent" />

        {/* badge categoria */}
        <span className="absolute left-4 top-4 rounded-full bg-cocoa-950/55 px-3 py-1 font-sans text-[11px] uppercase tracking-widest text-cream-100/90 backdrop-blur-sm">
          {nomeCat(ensaio.categoria)}
        </span>

        {/* texto base */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-serif text-xl text-cream-50 md:text-2xl">{ensaio.titulo}</h3>
          {ensaio.subtitulo && (
            <p className="mt-1 font-sans text-xs text-cream-100/75">{ensaio.subtitulo}</p>
          )}
          <span className="mt-3 inline-flex translate-y-2 items-center gap-1.5 font-sans text-xs uppercase tracking-widest text-cream-50/0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-terracotta-300">
            Ver ensaio <ArrowUpRight size={14} />
          </span>
        </div>
      </motion.div>
    </Link>
  )
}
