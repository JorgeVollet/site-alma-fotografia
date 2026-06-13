import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowUpRight, Instagram } from 'lucide-react'
import Logo from './Logo'
import { STUDIO } from '../data/studio'

const NAV = [
  { to: '/', label: 'Início', n: '01' },
  { to: '/servicos', label: 'Serviços', n: '02' },
  { to: '/portfolio', label: 'Portfólio', n: '03' },
  { to: '/pacotes', label: 'Pacotes', n: '04' },
  { to: '/agendar', label: 'Agendar', n: '05' },
  { to: '/cliente', label: 'Área do Cliente', n: '06' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Todas as páginas têm hero escuro no topo -> conteúdo claro até rolar.
  // Quando rola, vira barra clara sólida -> conteúdo escuro.
  const light = !scrolled || open // true = elementos claros (sobre fundo escuro)
  const barraStroke = light ? 'bg-cream-50' : 'bg-cocoa-800'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] transition-all duration-500 ease-smooth ${
          scrolled && !open ? 'bg-cream-100/85 py-3 backdrop-blur-md shadow-sm' : 'py-5'
        }`}
      >
        <div className="container-c flex items-center justify-between">
          <Link to="/" className="relative z-[70]">
            <Logo dark={!light} className="h-7 md:h-8" />
          </Link>

          <button
            onClick={() => setOpen((o) => !o)}
            className="relative z-[70] flex items-center gap-3 uppercase"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            <span className={`hidden font-sans text-xs tracking-widest2 sm:inline ${light ? 'text-cream-50' : 'text-cocoa-700'}`}>
              {open ? 'Fechar' : 'Menu'}
            </span>
            <span className="relative flex h-4 w-7 flex-col justify-between">
              <span className={`block h-px w-full origin-center transition-all duration-300 ${open ? 'translate-y-[7px] rotate-45 bg-cream-50' : barraStroke}`} />
              <span className={`block h-px w-full transition-all duration-300 ${open ? 'opacity-0' : barraStroke}`} />
              <span className={`block h-px w-full origin-center transition-all duration-300 ${open ? '-translate-y-[7px] -rotate-45 bg-cream-50' : barraStroke}`} />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[55] bg-cocoa-950 text-cream-100"
          >
            <div className="grain pointer-events-none absolute inset-0 opacity-[0.05]" />
            <div className="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-clay-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-32 bottom-0 h-[380px] w-[380px] rounded-full bg-sage-500/15 blur-3xl" />

            <div className="container-c relative flex h-full flex-col justify-center pt-20">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-sans text-xs uppercase tracking-widest2 text-terracotta-400"
              >
                Navegação
              </motion.span>

              <nav className="mt-6 flex flex-col">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.2 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `group flex items-baseline gap-4 border-b border-cream-100/10 py-3 transition-colors hover:text-clay-400 md:py-4 ${
                          isActive ? 'text-clay-400' : 'text-cream-100'
                        }`
                      }
                    >
                      <span className="font-sans text-xs text-cream-100/40">{item.n}</span>
                      <span className="display text-4xl leading-none md:text-6xl lg:text-7xl">{item.label}</span>
                      <ArrowUpRight className="ml-auto self-center text-cream-100/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-clay-400" size={28} />
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
              >
                <div className="space-y-1 text-sm text-cream-100/60">
                  <p>{STUDIO.endereco}</p>
                  <p>{STUDIO.whatsappDisplay} · {STUDIO.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <a href={STUDIO.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-sand-200 link-underline">
                    <Instagram size={16} /> {STUDIO.instagramHandle}
                  </a>
                  <Link to="/agendar" className="btn-blush !py-2.5 text-xs">
                    <Camera size={14} /> Agendar ensaio
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
