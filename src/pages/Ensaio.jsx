import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ArrowLeft, Camera } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import Photo from '../components/Photo'
import { useApp } from '../context/AppContext'
import { CATEGORIAS_PORTFOLIO } from '../data/studio'
import { ensaiosDemo } from '../data/galleries'

const nomeCat = (id) => CATEGORIAS_PORTFOLIO.find((c) => c.id === id)?.nome || id

export default function Ensaio() {
  const { id } = useParams()
  const { ensaios } = useApp()
  // procura nos ensaios reais; se não achar e for um id demo, reconstrói
  const ensaio = ensaios.find((e) => e.id === id) || ensaiosDemo().find((e) => e.id === id)
  const [lightbox, setLightbox] = useState(null)

  if (!ensaio) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[70vh] place-items-center bg-cream-100 px-4 pt-20 text-center">
        <div>
          <p className="font-serif text-2xl text-cocoa-800">Ensaio não encontrado</p>
          <p className="mt-2 text-sm text-cocoa-600">Este ensaio pode ter sido removido.</p>
          <Link to="/portfolio" className="btn-dark mt-6 inline-flex"><ArrowLeft size={16} /> Voltar ao portfólio</Link>
        </div>
      </motion.div>
    )
  }

  const fotos = ensaio.fotos
  const capa = ensaio.capa || fotos[0]?.src

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      {/* Hero do ensaio */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden bg-cocoa-950 pt-20">
        {capa && (
          <>
            <Photo src={capa} alt={ensaio.titulo} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa-950 via-cocoa-950/40 to-cocoa-950/30" />
          </>
        )}
        <div className="container-c relative z-10 pb-12">
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm text-cream-100/70 transition hover:text-cream-100">
            <ArrowLeft size={16} /> Portfólio
          </Link>
          <p className="mt-5 font-sans text-xs uppercase tracking-widest2 text-terracotta-400">{nomeCat(ensaio.categoria)}</p>
          <h1 className="display mt-3 text-4xl text-cream-50 md:text-6xl">{ensaio.titulo}</h1>
          {ensaio.subtitulo && <p className="mt-3 max-w-xl font-sans text-sm font-light text-cream-100/80 md:text-base">{ensaio.subtitulo}</p>}
        </div>
      </section>

      {/* Galeria */}
      <section className="bg-cream-100 py-16 md:py-24">
        <div className="container-c">
          {fotos.length === 0 ? (
            <p className="text-center text-sm text-cocoa-600">As fotos deste ensaio ainda estão a caminho.</p>
          ) : (
            <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
              {fotos.map((foto, i) => (
                <motion.button
                  key={foto.id}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: (i % 8) * 0.03 }}
                  onClick={() => setLightbox(i)}
                  className="group block w-full break-inside-avoid overflow-hidden rounded-xl"
                >
                  <Photo
                    src={foto.src}
                    alt={`${ensaio.titulo} — foto ${i + 1}`}
                    className={`${i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'} transition-transform duration-700 ease-smooth group-hover:scale-105`}
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cocoa-900 py-20 text-center text-cream-100">
        <div className="container-c">
          <Reveal><h2 className="display text-3xl md:text-4xl">Quer um ensaio assim para você?</h2></Reveal>
          <Reveal delay={0.1}>
            <Link to="/agendar" className="btn-light mt-8"><Camera size={16} /> Vamos criar juntos</Link>
          </Reveal>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            fotos={fotos}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onNav={(dir) => setLightbox((p) => (p + dir + fotos.length) % fotos.length)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Lightbox({ fotos, index, onClose, onNav }) {
  const foto = fotos[index]
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] grid place-items-center bg-cocoa-950/95 p-4 backdrop-blur-sm"
    >
      <button onClick={onClose} className="absolute right-5 top-5 text-cream-100/70 hover:text-cream-100"><X size={30} /></button>
      <button onClick={(e) => { e.stopPropagation(); onNav(-1) }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-cream-100/10 p-2 text-cream-100 hover:bg-cream-100/20 md:left-8"><ChevronLeft size={26} /></button>
      <button onClick={(e) => { e.stopPropagation(); onNav(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-cream-100/10 p-2 text-cream-100 hover:bg-cream-100/20 md:right-8"><ChevronRight size={26} /></button>
      <motion.div
        key={foto.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-3xl overflow-hidden rounded-xl shadow-2xl"
      >
        <img src={foto.src} alt="" className="max-h-[85vh] w-auto no-select" draggable={false} />
      </motion.div>
    </motion.div>
  )
}
