import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, User, Heart, Check, ShoppingBag, X, Download, ShieldCheck,
  ImageOff, Clock, Sparkles, Info, LogOut, Maximize2,
  ChevronLeft, ChevronRight, QrCode, CreditCard, CalendarClock, Copy,
} from 'lucide-react'
import { formatBRL } from '../components/Money'
import Photo from '../components/Photo'
import AssinaturaJV from '../components/AssinaturaJV'
import { useApp } from '../context/AppContext'
import { GALERIA_CLIENTE_DEMO, GALERIA_PRONTA_DEMO } from '../data/galleries'
import { PACOTES } from '../data/studio'

const GAL_ID = 'demo'

// Formata uma data ISO para algo como "12 de junho" (pt-BR).
function formatarPrazo(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  } catch (e) {
    return ''
  }
}

export default function AreaCliente() {
  const [logged, setLogged] = useState(false)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="min-h-screen bg-cream-200 pt-20">
      {!logged ? <Login onLogin={() => setLogged(true)} /> : <Galeria onLogout={() => setLogged(false)} />}
      <AssinaturaJV variant="dark" className="pb-6 pt-2" />
    </motion.div>
  )
}

/* ---------------- LOGIN (simulado) ---------------- */
function Login({ onLogin }) {
  return (
    <div className="container-c grid min-h-[calc(100vh-5rem)] items-center py-12 lg:grid-cols-2">
      <div className="hidden lg:block">
        <div className="ph-gradient-3 relative aspect-[4/5] max-w-md overflow-hidden rounded-3xl shadow-2xl">
          <div className="absolute inset-0 grid place-items-center p-10 text-center">
            <div>
              <Sparkles className="mx-auto text-cream-100/60" size={32} />
              <p className="mt-4 font-serif text-3xl italic text-cream-100">Suas memórias,</p>
              <p className="font-serif text-3xl italic text-cream-100">à sua espera.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl bg-cream-50 p-8 shadow-sm ring-1 ring-cocoa-800/5 md:p-10">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cocoa-800 text-cream-50">
            <Lock size={24} />
          </div>
          <h1 className="mt-6 font-serif text-3xl text-cocoa-800">Área do Cliente</h1>
          <p className="mt-2 text-sm font-light text-cocoa-600">
            Acesse com os dados que enviamos por e-mail para ver e escolher as suas fotos.
          </p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-cocoa-700">Código da galeria</span>
              <input defaultValue="SPHOR2026" className="mt-1.5 w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-cocoa-700">Senha</span>
              <input type="password" defaultValue="demo123" className="mt-1.5 w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" />
            </label>
          </div>

          <button onClick={onLogin} className="btn-primary mt-7 w-full">
            <User size={16} /> Entrar na minha galeria
          </button>
          <p className="mt-4 rounded-lg bg-cream-200 p-3 text-center text-xs text-cocoa-500">
            <Info size={12} className="mr-1 inline" /> Demo: já preenchemos os dados, é só clicar em entrar.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---------------- GALERIA ---------------- */
function Galeria({ onLogout }) {
  const { statusEnsaio } = useApp()
  // Se admin já liberou, mostra download. Senão, mostra seleção.
  if (statusEnsaio === 'pronto') return <FotosProntas onLogout={onLogout} />
  if (statusEnsaio === 'editando' || statusEnsaio === 'enviado') return <AguardandoEdicao onLogout={onLogout} />
  return <Selecao onLogout={onLogout} />
}

/* ---- Modo SELEÇÃO (estilo Alboom) ---- */
function Selecao({ onLogout }) {
  const { selecoes, toggleFoto, enviarSelecao, definirPendencia, registrarPagamento } = useApp()
  const g = GALERIA_CLIENTE_DEMO
  const pacote = PACOTES.find((p) => p.id === g.pacote)
  const sel = selecoes[GAL_ID] || []
  const [zoomIdx, setZoomIdx] = useState(null) // índice da foto ampliada
  const [cartOpen, setCartOpen] = useState(false)
  const [pagamentoOpen, setPagamentoOpen] = useState(false)
  const [explicaOpen, setExplicaOpen] = useState(false)

  const extras = Math.max(0, sel.length - g.fotosInclusas)
  const valorExtra = extras * g.fotoExtra
  // Reserva já paga no agendamento (sinal). É abatida do valor final.
  const reserva = pacote.reserva || 0
  const totalGeral = pacote.preco + valorExtra
  const total = Math.max(0, totalGeral - reserva)

  const aberto = zoomIdx !== null
  const fotoZoom = aberto ? g.fotos[zoomIdx] : null
  const fecharZoom = useCallback(() => setZoomIdx(null), [])
  const navegar = useCallback(
    (dir) => setZoomIdx((i) => (i === null ? i : (i + dir + g.fotos.length) % g.fotos.length)),
    [g.fotos.length]
  )

  // Navegação por teclado: ← → e Esc
  useEffect(() => {
    if (!aberto) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') navegar(1)
      else if (e.key === 'ArrowLeft') navegar(-1)
      else if (e.key === 'Escape') fecharZoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto, navegar, fecharZoom])

  return (
    <div className="pb-32">
      {/* Header da galeria */}
      <div className="border-b border-cocoa-800/5 bg-cream-50">
        <div className="container-c flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="font-serif text-2xl text-cocoa-800">{g.ensaio}</p>
            <p className="text-sm text-clay-500">{g.clienteNome} · {g.fotos.length} fotos disponíveis</p>
          </div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 text-sm text-cocoa-500 hover:text-cocoa-800">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>

      {/* Instruções + proteção */}
      <div className="container-c py-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-cocoa-800 px-6 py-4 text-sm text-cream-100">
          <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-terracotta-400" /> Galeria protegida</span>
          <span className="flex items-center gap-2 text-cream-100/70"><ImageOff size={15} /> Download bloqueado nesta etapa</span>
          <span className="flex items-center gap-2 text-cream-100/70"><Heart size={15} /> Toque na foto para selecionar</span>
        </div>
      </div>

      {/* Explicação do favoritar */}
      <div className="container-c">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-clay-400/30 bg-sand-100/60 px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm text-cocoa-700">
            <Heart size={15} className="shrink-0 text-clay-500" />
            Marque as fotos que você mais amou — elas guiam a nossa edição.
          </p>
          <button onClick={() => setExplicaOpen(true)} className="text-xs font-medium text-clay-600 underline underline-offset-2 hover:text-cocoa-800">
            Saiba mais
          </button>
        </div>
      </div>

      {/* Grade de fotos */}
      <div className="container-c">
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
          {g.fotos.map((foto, idx) => {
            const ativo = sel.includes(foto.id)
            return (
              <div key={foto.id} className="group relative break-inside-avoid overflow-hidden rounded-xl">
                <button
                  onClick={() => setZoomIdx(idx)}
                  className="block w-full cursor-zoom-in"
                  aria-label="Ampliar foto"
                >
                  <Photo src={foto.src} alt={foto.alt} protect watermark className="aspect-[4/5]" />
                </button>
                {/* overlay */}
                <div className={`pointer-events-none absolute inset-0 transition-colors ${ativo ? 'bg-clay-500/30' : 'bg-cocoa-950/0 group-hover:bg-cocoa-950/20'}`} />
                {/* botão selecionar */}
                <button
                  onClick={() => toggleFoto(GAL_ID, foto.id)}
                  className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full transition-all ${
                    ativo ? 'bg-clay-400 text-cream-50 scale-100' : 'bg-cream-50/90 text-cocoa-600 scale-90 group-hover:scale-100'
                  }`}
                  aria-label="Selecionar"
                >
                  {ativo ? <Check size={18} /> : <Heart size={17} />}
                </button>
                {/* zoom */}
                <button
                  onClick={() => setZoomIdx(idx)}
                  className="absolute bottom-2.5 left-2.5 grid h-8 w-8 place-items-center rounded-full bg-cream-50/90 text-cocoa-600 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Ampliar"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Barra fixa de seleção (valor ao vivo) */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa-800/10 bg-cream-50/95 backdrop-blur-md"
      >
        <div className="container-c flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="font-serif text-3xl leading-none text-cocoa-800">{sel.length}</p>
              <p className="text-[11px] uppercase tracking-wide text-cocoa-400">selecionadas</p>
            </div>
            <div className="hidden h-10 w-px bg-cocoa-800/10 sm:block" />
            <div className="hidden text-sm sm:block">
              <p className="text-cocoa-600">{g.fotosInclusas} inclusas no pacote {pacote.nome}</p>
              <p className="text-clay-500">
                {extras > 0 ? `${extras} extra(s) × ${formatBRL(g.fotoExtra)} = ${formatBRL(valorExtra)}` : 'Nenhuma foto extra ainda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-cocoa-400">A pagar agora</p>
              <motion.p key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-serif text-2xl text-terracotta-500">
                {formatBRL(total)}
              </motion.p>
              {reserva > 0 && (
                <p className="text-[11px] text-clay-500">reserva de {formatBRL(reserva)} já abatida</p>
              )}
            </div>
            <button
              onClick={() => setCartOpen(true)}
              disabled={sel.length === 0}
              className="btn-primary disabled:opacity-40"
            >
              <ShoppingBag size={16} /> Revisar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Zoom modal com navegação lateral */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={fecharZoom}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-cocoa-950/95 p-4 backdrop-blur-sm"
          >
            {/* Fechar */}
            <button onClick={fecharZoom} className="absolute right-5 top-5 z-10 text-cream-100/70 transition hover:text-cream-100" aria-label="Fechar">
              <X size={28} />
            </button>

            {/* Contador */}
            <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-cocoa-950/60 px-4 py-1.5 text-sm text-cream-100/80">
              {zoomIdx + 1} de {g.fotos.length}
            </div>

            {/* Seta esquerda */}
            <button
              onClick={(e) => { e.stopPropagation(); navegar(-1) }}
              className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-cream-100/10 text-cream-100 transition hover:bg-cream-100/20 md:left-8"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={28} />
            </button>

            {/* Seta direita */}
            <button
              onClick={(e) => { e.stopPropagation(); navegar(1) }}
              className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-cream-100/10 text-cream-100 transition hover:bg-cream-100/20 md:right-8"
              aria-label="Próxima foto"
            >
              <ChevronRight size={28} />
            </button>

            {/* Imagem (anima ao trocar) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={fotoZoom.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-h-[85vh] overflow-hidden rounded-xl"
              >
                <Photo src={fotoZoom.src} alt={fotoZoom.alt} protect watermark className="max-h-[85vh]" />
                <button
                  onClick={() => toggleFoto(GAL_ID, fotoZoom.id)}
                  className={`absolute bottom-4 left-1/2 -translate-x-1/2 ${sel.includes(fotoZoom.id) ? 'btn-light' : 'btn-primary'} !py-2.5`}
                >
                  {sel.includes(fotoZoom.id) ? <><Check size={16} /> Selecionada</> : <><Heart size={16} /> Selecionar esta</>}
                </button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carrinho / resumo */}
      <AnimatePresence>
        {cartOpen && (
          <ResumoSelecao
            g={g} pacote={pacote} sel={sel} extras={extras} valorExtra={valorExtra}
            reserva={reserva} totalGeral={totalGeral} total={total}
            onClose={() => setCartOpen(false)}
            onConfirm={() => { setCartOpen(false); setPagamentoOpen(true) }}
          />
        )}
      </AnimatePresence>

      {/* Pagamento do valor restante */}
      <AnimatePresence>
        {pagamentoOpen && (
          <PopupPagamento
            valor={total}
            onPagar={(metodo) => {
              definirPendencia(total)
              registrarPagamento(metodo)
              enviarSelecao()
              setPagamentoOpen(false)
            }}
            onPagarDepois={() => {
              definirPendencia(total)
              enviarSelecao()
              setPagamentoOpen(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal "saiba mais" sobre favoritar */}
      <AnimatePresence>
        {explicaOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setExplicaOpen(false)}
            className="fixed inset-0 z-[75] grid place-items-center bg-cocoa-950/55 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-cream-50 p-7 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-serif text-2xl text-cocoa-800"><Heart size={20} className="text-clay-500" /> Como funciona favoritar</h3>
                <button onClick={() => setExplicaOpen(false)} className="text-cocoa-400 hover:text-cocoa-800"><X size={20} /></button>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-cocoa-600">
                <p>Ao tocar no coração, você <strong className="text-cocoa-800">favorita</strong> as fotos que mais te tocaram. Essa escolha tem dois papéis:</p>
                <p><strong className="text-cocoa-800">1. Guia a nossa edição.</strong> São essas fotos que vamos tratar com todo o carinho para a sua entrega final.</p>
                <p><strong className="text-cocoa-800">2. Podem virar destaque.</strong> Depois de prontas e entregues, as suas favoritas podem ser escolhidas pelo estúdio para o nosso portfólio — a sua história inspirando outras famílias. 🤍</p>
                <p className="text-xs text-cocoa-400">As fotos só vão para o portfólio depois de editadas e com a curadoria do estúdio. Nada é publicado sem cuidado.</p>
              </div>
              <button onClick={() => setExplicaOpen(false)} className="btn-primary mt-6 w-full">Entendi</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ResumoSelecao({ g, pacote, sel, extras, valorExtra, reserva, totalGeral, total, onClose, onConfirm }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex justify-end bg-cocoa-950/50 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-cream-50 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-cocoa-800/5 p-6">
          <h3 className="font-serif text-2xl text-cocoa-800">Sua seleção</h3>
          <button onClick={onClose} className="text-cocoa-400 hover:text-cocoa-800"><X size={22} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-2">
            {sel.slice(0, 12).map((id) => {
              const f = g.fotos.find((x) => x.id === id)
              return <img key={id} src={f.src} className="aspect-square rounded-lg object-cover no-select" draggable={false} />
            })}
            {sel.length > 12 && (
              <div className="grid aspect-square place-items-center rounded-lg bg-cocoa-800 text-sm font-medium text-cream-50">+{sel.length - 12}</div>
            )}
          </div>

          <div className="space-y-2.5 rounded-2xl bg-cream-200 p-5 text-sm">
            <Linha k={`Pacote ${pacote.nome}`} v={formatBRL(pacote.preco)} />
            <Linha k={`${g.fotosInclusas} fotos inclusas`} v="Grátis" muted />
            <Linha k={`${extras} foto(s) extra(s)`} v={formatBRL(valorExtra)} />
            {reserva > 0 && (
              <>
                <div className="my-2 border-t border-cocoa-800/10" />
                <Linha k="Subtotal" v={formatBRL(totalGeral)} />
                <Linha k="Reserva já paga no agendamento" v={`− ${formatBRL(reserva)}`} credito />
              </>
            )}
            <div className="my-2 border-t border-cocoa-800/10" />
            <div className="flex items-center justify-between">
              <span className="font-medium text-cocoa-800">A pagar agora</span>
              <span className="font-serif text-2xl text-terracotta-500">{formatBRL(total)}</span>
            </div>
          </div>
          <p className="text-xs text-cocoa-500">
            Ao confirmar, sua seleção é enviada ao estúdio para edição. Você poderá baixar
            as fotos prontas aqui mesmo assim que ficarem disponíveis.
          </p>
        </div>
        <div className="border-t border-cocoa-800/5 p-6">
          <button onClick={onConfirm} className="btn-primary w-full">
            <Check size={16} /> Confirmar e enviar seleção
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Linha({ k, v, muted, credito }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-cocoa-400' : 'text-cocoa-600'}>{k}</span>
      <span className={credito ? 'font-medium text-emerald-600' : muted ? 'text-clay-400' : 'font-medium text-cocoa-800'}>{v}</span>
    </div>
  )
}

/* ---- Modo AGUARDANDO edição ---- */
/* ---- POPUP de pagamento do valor restante ---- */
function PopupPagamento({ valor, onPagar, onPagarDepois }) {
  const [aba, setAba] = useState('pix') // 'pix' | 'cartao'
  const [copiado, setCopiado] = useState(false)
  const pixCode = '00020126BR.GOV.BCB.PIX.ALMA.FOTOGRAFIA5204000053039865802BR'

  const copiarPix = () => {
    navigator.clipboard?.writeText(pixCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-cocoa-950/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-cream-50 shadow-2xl"
      >
        {/* topo: mensagem educada */}
        <div className="bg-cocoa-800 p-7 text-cream-50">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cream-50/10">
            <Heart size={22} className="text-clay-300" />
          </div>
          <h3 className="mt-4 font-serif text-2xl">Seleção enviada com sucesso! 🤍</h3>
          <p className="mt-2 text-sm font-light leading-relaxed text-cream-100/85">
            Falta só um passo para começarmos a edição das suas fotos. Para concluir, o
            valor restante pode ser pago agora — ou quando preferir, pela sua Área do Cliente.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          {/* valor + prazo */}
          <div className="flex items-center justify-between rounded-2xl bg-cream-200 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-cocoa-400">Valor restante</p>
              <p className="font-serif text-2xl text-terracotta-500">{formatBRL(valor)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-clay-400/15 px-3 py-2 text-xs font-medium text-clay-600">
              <CalendarClock size={14} /> Prazo: 3 dias úteis
            </div>
          </div>

          {/* abas PIX / cartão */}
          <div className="mt-6 flex gap-2 rounded-full bg-cream-200 p-1">
            <button
              onClick={() => setAba('pix')}
              className={'flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition ' + (aba === 'pix' ? 'bg-cream-50 text-cocoa-800 shadow-sm' : 'text-cocoa-500')}
            >
              <QrCode size={16} /> PIX
            </button>
            <button
              onClick={() => setAba('cartao')}
              className={'flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition ' + (aba === 'cartao' ? 'bg-cream-50 text-cocoa-800 shadow-sm' : 'text-cocoa-500')}
            >
              <CreditCard size={16} /> Cartão
            </button>
          </div>

          {aba === 'pix' ? (
            <div className="mt-5 text-center">
              <div className="mx-auto grid h-40 w-40 place-items-center rounded-2xl bg-cocoa-800/5 ring-1 ring-cocoa-800/10">
                <QrCode size={96} className="text-cocoa-800" strokeWidth={1} />
              </div>
              <p className="mt-3 text-xs text-cocoa-500">Aponte a câmera do seu banco para o QR Code</p>
              <button
                onClick={copiarPix}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-cream-200 px-4 py-2.5 text-xs font-medium text-cocoa-700 transition hover:bg-sand-100"
              >
                <Copy size={14} /> {copiado ? 'Código copiado!' : 'Copiar código PIX'}
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <input className="w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="Número do cartão" inputMode="numeric" />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="Validade (MM/AA)" inputMode="numeric" />
                <input className="w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="CVV" inputMode="numeric" />
              </div>
              <input className="w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="Nome impresso no cartão" />
            </div>
          )}

          <p className="mt-5 text-center text-[11px] text-cocoa-400">
            <Info size={11} className="mr-1 inline" /> Demo: pagamento simulado. Na versão final, integramos PIX e cartão de verdade.
          </p>
        </div>

        {/* ações */}
        <div className="space-y-2.5 border-t border-cocoa-800/5 p-6">
          <button onClick={() => onPagar(aba)} className="btn-primary w-full">
            <ShieldCheck size={16} /> Pagar agora {formatBRL(valor)}
          </button>
          <button onClick={onPagarDepois} className="w-full rounded-xl py-3 text-sm font-medium text-cocoa-500 transition hover:bg-cream-200 hover:text-cocoa-800">
            Pagar depois na Área do Cliente
          </button>
          <p className="text-center text-[11px] text-cocoa-400">
            Sua seleção já será enviada de qualquer forma. Você tem 3 dias úteis para acertar o valor.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AguardandoEdicao({ onLogout }) {
  const { selecoes, pagamento, registrarPagamento } = useApp()
  const sel = selecoes[GAL_ID] || []
  const [pagar, setPagar] = useState(false)
  const pend = pagamento && pagamento.statusPagamento === 'pendente'
  const pago = pagamento && pagamento.statusPagamento === 'pago'
  return (
    <div className="container-c grid min-h-[calc(100vh-5rem)] place-items-center py-12 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sand-200 text-clay-600">
          <Clock size={36} />
        </div>
        <h2 className="mt-6 font-serif text-3xl text-cocoa-800">Seleção enviada! ✨</h2>
        <p className="mt-3 font-light text-cocoa-600">
          Recebemos as suas <strong className="font-medium">{sel.length} fotos</strong> e a nossa equipe
          já está caprichando na edição. Você será avisado(a) assim que ficarem prontas para download.
        </p>
        {pend && (
          <div className="mt-7 rounded-2xl border border-clay-400/30 bg-sand-100/60 p-5 text-left">
            <div className="flex items-center gap-2 text-clay-600">
              <CalendarClock size={18} />
              <p className="font-medium">Pagamento pendente</p>
            </div>
            <p className="mt-2 text-sm text-cocoa-600">
              Falta acertar o valor restante de{' '}
              <strong className="font-medium text-cocoa-800">{formatBRL(pagamento.valorPendente)}</strong>{' '}
              para liberarmos a edição. Você pode pagar agora ou até{' '}
              <strong className="font-medium text-cocoa-800">{formatarPrazo(pagamento.prazoPagamento)}</strong>.
            </p>
            <button onClick={() => setPagar(true)} className="btn-primary mt-4 w-full">
              <ShieldCheck size={16} /> Pagar {formatBRL(pagamento.valorPendente)} agora
            </button>
          </div>
        )}

        {pago && (
          <div className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-700 ring-1 ring-emerald-600/15">
            <Check size={16} /> Pagamento confirmado — obrigado! 💛
          </div>
        )}

        <div className="mt-7 flex flex-col items-center gap-3">
          <Link to="/" className="btn-primary">Voltar ao início</Link>
          <button onClick={onLogout} className="text-sm text-cocoa-500 hover:text-cocoa-800">Sair da galeria</button>
        </div>
        <p className="mt-8 rounded-xl bg-cream-50 p-4 text-xs text-cocoa-500 ring-1 ring-cocoa-800/5">
          <Info size={12} className="mr-1 inline" /> Demo: vá ao{' '}
          <Link to="/admin" className="font-medium underline">Painel do Admin</Link>{' '}
          para "editar" e liberar o download — depois volte aqui.
        </p>
      </div>

      <AnimatePresence>
        {pagar && (
          <PopupPagamento
            valor={pagamento.valorPendente}
            onPagar={(metodo) => { registrarPagamento(metodo); setPagar(false) }}
            onPagarDepois={() => setPagar(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---- Modo FOTOS PRONTAS (download) ---- */
function FotosProntas({ onLogout }) {
  const g = GALERIA_PRONTA_DEMO
  const [baixando, setBaixando] = useState(false)

  const baixarUma = (foto) => {
    const a = document.createElement('a')
    a.href = foto.src
    a.download = 'alma-fotografia-' + foto.id + '.jpg'
    a.click()
  }

  return (
    <div className="pb-20">
      <div className="border-b border-cocoa-800/5 bg-cream-50">
        <div className="container-c flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-400/15 px-3 py-1 text-xs font-medium text-clay-600">
              <Check size={12} /> Fotos prontas
            </span>
            <p className="mt-2 font-serif text-2xl text-cocoa-800">Suas fotos estão prontas! 🎉</p>
            <p className="text-sm text-clay-500">{g.fotos.length} fotos editadas, prontas para download em alta resolução</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setBaixando(true); setTimeout(() => setBaixando(false), 1500) }}
              className="btn-primary"
            >
              <Download size={16} /> {baixando ? 'Preparando…' : 'Baixar todas'}
            </button>
            <button onClick={onLogout} className="text-sm text-cocoa-500 hover:text-cocoa-800"><LogOut size={15} /></button>
          </div>
        </div>
      </div>

      <div className="container-c py-8">
        <div className="columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
          {g.fotos.map((foto) => (
            <div key={foto.id} className="group relative break-inside-avoid overflow-hidden rounded-xl">
              <Photo src={foto.src} alt={foto.alt} className="aspect-[4/5]" />
              <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-cocoa-950/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => baixarUma(foto)} className="inline-flex items-center gap-1.5 rounded-full bg-cream-50 px-3 py-2 text-xs font-medium text-cocoa-800 hover:bg-cream-100">
                  <Download size={13} /> Baixar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
