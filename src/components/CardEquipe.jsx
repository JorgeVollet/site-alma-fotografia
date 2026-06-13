import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Photo from './Photo'

// =====================================================================
//  CARD EQUIPE — foto full com título sempre visível; no hover revela
//  um painel de vidro (terracota da marca) com a bio + CTA. Padrão de
//  "expanding card" adaptado à paleta Alma.
// =====================================================================
export default function CardEquipe({ m, i = 0, cta = 'Conheça a equipe', to = '/servicos' }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative w-full overflow-hidden rounded-2xl ring-1 ring-cocoa-800/10 shadow-[0_10px_40px_rgba(104,111,103,0.12)] transition-all duration-500 hover:shadow-[0_24px_70px_rgba(152,110,77,0.25)]"
    >
      {/* foto — preenche o card e dá um leve zoom no hover */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand-200">
        <Photo
          src={m.foto}
          alt={m.nome}
          className="absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] [&_img]:object-cover [&_img]:object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          fallback={m.gradient}
        />

        {/* gradiente pra título sempre legível */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cocoa-950/75 via-cocoa-950/10 to-cocoa-950/20" />

        {/* numeração */}
        <span className="absolute left-4 top-4 z-10 font-sans text-xs uppercase tracking-widest2 text-cream-50/80 mix-blend-difference">
          {String(i + 1).padStart(2, '0')}
        </span>

        {/* título + função — SEMPRE visível, sobe um pouco no hover pra dar espaço ao painel */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-5 transition-transform duration-500 ease-out group-hover:-translate-y-1">
          <h3 className="font-serif text-2xl text-cream-50 md:text-3xl">{m.nome}</h3>
          <p className="mt-1 font-sans text-xs uppercase tracking-widest text-sand-200">{m.funcao}</p>
        </div>

        {/* painel REVELADO no hover — vidro terracota com bio + CTA */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-6 p-4 opacity-0 transition-all duration-500 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
          <div
            className="rounded-xl border border-cream-50/15 p-4 backdrop-blur-md sm:p-5"
            style={{ backgroundImage: 'linear-gradient(135deg, rgba(152,110,77,0.82) 0%, rgba(86,92,85,0.78) 100%)' }}
          >
            <p className="font-sans text-sm font-light leading-relaxed text-cream-50/90">{m.bio}</p>
            <Link
              to={to}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cream-50/25 bg-cream-50/10 px-3 py-2 font-sans text-sm font-medium text-cream-50 ring-inset transition hover:bg-cream-50/20"
            >
              {cta} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
