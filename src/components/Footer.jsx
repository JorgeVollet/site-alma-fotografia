import { Link, useLocation } from 'react-router-dom'
import { Instagram, Facebook, MapPin, Phone, Mail, Camera, ArrowUpRight, Lock, Star } from 'lucide-react'
import Logo from './Logo'
import { SeloCircular } from './MarcaDagua'
import { STUDIO } from '../data/studio'

export default function Footer() {
  const { pathname } = useLocation()
  // Na página de Pacotes o selo sobe 15px (de -241px para -256px); nas demais fica em -241px.
  const seloTop = pathname === '/pacotes' ? 'md:-top-[271px]' : 'md:-top-[241px]'
  return (
    <footer className="relative bg-cocoa-950 text-cream-200">
      <div className="grain pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]" />
      {pathname !== '/' && (
        <SeloCircular className={`absolute -right-12 -top-12 opacity-10 md:right-16 ${seloTop} md:opacity-20`} size="h-40 w-40 md:h-48 md:w-48" />
      )}
      <div className="container-c relative py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo className="h-9 md:h-10" />
            <p className="mt-5 max-w-xs font-serif text-xl italic leading-snug text-cream-100/80">
              {STUDIO.tagline}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={STUDIO.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-sand-200 link-underline"
              >
                <Instagram size={16} /> {STUDIO.instagramHandle}
              </a>
              <a
                href={STUDIO.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-sand-200 link-underline"
              >
                <Facebook size={16} /> /fotografiaalma
              </a>
              <a
                href={STUDIO.googleLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-sand-200 link-underline"
              >
                <Star size={16} className="fill-terracotta-400 text-terracotta-400" /> {STUDIO.googleNota} · {STUDIO.googleQtd} avaliações
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="eyebrow !text-sand-300">Navegação</h4>
            <ul className="mt-5 space-y-3 text-sm text-cream-100/70">
              {[
                ['Serviços', '/servicos'],
                ['Portfólio', '/portfolio'],
                ['Pacotes', '/pacotes'],
                ['Agendar ensaio', '/agendar'],
                ['Área do Cliente', '/cliente'],
              ].map(([l, to]) => (
                <li key={to}>
                  <Link to={to} className="link-underline">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="eyebrow !text-sand-300">Contato</h4>
            <ul className="mt-5 space-y-4 text-sm text-cream-100/70">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-terracotta-400" />
                <span>{STUDIO.endereco}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-terracotta-400" />
                <span>{STUDIO.whatsappDisplay}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-terracotta-400" />
                <span>{STUDIO.email}</span>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${STUDIO.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="btn-light !py-2.5 text-xs"
              >
                <Camera size={14} /> Falar no WhatsApp <ArrowUpRight size={14} />
              </a>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-cream-100/25 px-5 py-2.5 text-xs text-cream-100/80 transition hover:border-cream-100/50 hover:text-cream-100"
              >
                <Lock size={13} /> Painel Administrador
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-cream-100/10 pt-7 text-xs text-cream-100/40 md:flex-row">
          <p>© {new Date().getFullYear()} {STUDIO.nome} · {STUDIO.cidade}/{STUDIO.estado}. Todos os direitos reservados.</p>
          <p>
            Site demonstrativo — feito com carinho por{' '}
            <a
              href="https://www.jvwebstudio.agency"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cream-100/70 transition-colors hover:text-clay-400"
            >
              JV WEB STUDIO
            </a>{' '}
            💜
          </p>
        </div>
      </div>
    </footer>
  )
}
