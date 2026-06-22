import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, Clock, Wand2, Send, CheckCircle2, RefreshCw, Download, ChevronDown, MessageCircle, X, Wallet, CalendarClock, AlertCircle, Sparkles } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import Photo from '../../components/Photo'
import { useApp } from '../../context/AppContext'
import { CLIENTES, getGaleriaData } from '../../data/crm'
import { PACOTES } from '../../data/studio'
import { favoritasFinais, GALERIA_CLIENTE_DEMO, GALERIA_PRONTA_DEMO } from '../../data/galleries'
import LevarFavoritasPortfolio from '../../components/LevarFavoritasPortfolio'

const ORDER = ['selecionando', 'enviado', 'editando', 'pronto']
function statusLabel(s) {
  return { selecionando: 'Cliente escolhendo', enviado: 'Seleção recebida', editando: 'Em edição', pronto: 'Entregue' }[s] || s
}

// Só clientes que já têm galeria/ensaio
const CLIENTES_COM_ENSAIO = CLIENTES.filter((c) => c.galeriaId)

export default function Selecoes() {
  const app = useApp()
  const [clienteId, setClienteId] = useState('sphor')
  const [dropdown, setDropdown] = useState(false)
  const [notif, setNotif] = useState(null)
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const [feito, setFeito] = useState(false)

  const cliente = CLIENTES_COM_ENSAIO.find((c) => c.id === clienteId)
  const galeriaId = cliente.galeriaId
  const gdata = getGaleriaData(galeriaId)
  const pacote = PACOTES.find((p) => p.id === gdata.pacote)

  // Helena = ensaio ao vivo (usa selecoes + statusEnsaio do contexto)
  const ehDemo = galeriaId === 'demo'
  const sel = ehDemo ? (app.selecoes['demo'] || []) : (gdata.selecionadas || [])
  const status = ehDemo ? app.statusEnsaio : cliente.ensaios[0].status

  const extras = Math.max(0, sel.length - gdata.fotosInclusas)
  const total = pacote.preco + extras * gdata.fotoExtra
  const fotosSel = gdata.fotos.filter((f) => sel.includes(f.id))
  // Favoritas em versão FINAL — só faz sentido com ensaio 'pronto' (demo ao vivo).
  const favFinais = ehDemo && status === 'pronto' ? favoritasFinais(sel, GALERIA_CLIENTE_DEMO, GALERIA_PRONTA_DEMO) : []

  // Status de pagamento — só o ensaio AO VIVO (demo) tem pagamento real no estado.
  const pag = ehDemo ? (app.pagamento || {}) : null
  const reserva = pacote.reserva || 0
  const pagoReserva = reserva // a reserva do agendamento sempre foi paga
  const restante = Math.max(0, total - reserva)
  const prazoPagFmt = pag && pag.prazoPagamento
    ? new Date(pag.prazoPagamento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : ''

  const exportarLightroom = () => {
    const linhas = fotosSel.map((f) => f.id + '.jpg')
    const conteudo = '# Seleção — ' + cliente.nome + '\n# ' + cliente.ensaios[0].titulo + '\n# ' + fotosSel.length + ' fotos\n\n' + linhas.join('\n')
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'selecao-' + cliente.nome.toLowerCase().replace(/\s+/g, '-') + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const linkSite = 'almafotografia.com.br/cliente'
  const msgEditando = {
    titulo: 'Mensagem de "em edição"',
    para: cliente.nome,
    texto: 'Oi, ' + cliente.contato + '! 💛 Recebemos a sua seleção e já estamos trabalhando nas suas fotos com muito amor e carinho. Em breve avisamos quando estiverem prontas. Com carinho, Alma Fotografia.',
  }
  const msgPronto = {
    titulo: 'Mensagem de "entregue"',
    para: cliente.nome,
    texto: 'Boas notícias, ' + cliente.contato + '! ✨ Suas fotos ficaram prontas e já estão disponíveis. Acesse ' + linkSite + ' para visualizar e baixar tudo. Esperamos que você ame o resultado! 🤎 Alma Fotografia.',
  }

  const iniciarEdicao = () => {
    if (ehDemo) app.marcarEditando({ tipo: 'editando', cliente: cliente.nome, texto: msgEditando.texto })
    setNotif(msgEditando)
  }
  const liberar = () => {
    if (ehDemo) app.liberarDownload({ tipo: 'pronto', cliente: cliente.nome, texto: msgPronto.texto })
    setNotif(msgPronto)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Seleções dos clientes</h1>
          <p className="mt-1 text-sm text-cream-100/60">Escolha o cliente para ver e gerenciar a seleção de fotos dele.</p>
        </div>
        {ehDemo && (
          <button onClick={app.resetDemo} className="inline-flex items-center gap-2 rounded-full bg-cocoa-900 px-4 py-2 text-xs text-cream-100/60 ring-1 ring-cream-100/10 hover:text-cream-100">
            <RefreshCw size={13} /> Resetar demo
          </button>
        )}
      </div>

      {/* Seletor de cliente */}
      <div className="relative mt-5 inline-block">
        <button onClick={() => setDropdown((d) => !d)} className="flex items-center gap-3 rounded-2xl bg-cocoa-900 px-5 py-3 ring-1 ring-cream-100/10 hover:ring-terracotta-400/40">
          <div className={cliente.avatarGrad + ' grid h-9 w-9 place-items-center rounded-full font-serif text-sm text-cream-50'}>{cliente.nome.charAt(0)}</div>
          <div className="text-left">
            <p className="text-sm font-medium">{cliente.nome}</p>
            <p className="text-xs text-cream-100/50">{cliente.ensaios[0].titulo}</p>
          </div>
          <ChevronDown size={16} className={'ml-2 text-cream-100/50 transition ' + (dropdown ? 'rotate-180' : '')} />
        </button>
        {dropdown && (
          <div className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-2xl bg-cocoa-900 p-1.5 shadow-2xl ring-1 ring-cream-100/10">
            {CLIENTES_COM_ENSAIO.map((c) => {
              const cs = c.galeriaId === 'demo' ? (app.selecoes['demo'] || []).length : (getGaleriaData(c.galeriaId).selecionadas || []).length
              const st = c.galeriaId === 'demo' ? app.statusEnsaio : c.ensaios[0].status
              return (
                <button key={c.id} onClick={() => { setClienteId(c.id); setDropdown(false) }} className={'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ' + (clienteId === c.id ? 'bg-terracotta-500/15' : 'hover:bg-cocoa-800')}>
                  <div className={c.avatarGrad + ' grid h-8 w-8 place-items-center rounded-full font-serif text-xs text-cream-50'}>{c.nome.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{c.nome}</p>
                    <p className="truncate text-xs text-cream-100/50">{cs} fotos · {statusLabel(st)}</p>
                  </div>
                  {c.galeriaId === 'demo' && <span className="rounded-full bg-terracotta-500/20 px-2 py-0.5 text-[10px] text-terracotta-400">AO VIVO</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Pipeline de status */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
        {[['selecionando', 'Escolhendo', Clock], ['enviado', 'Recebida', Check], ['editando', 'Em edição', Wand2], ['pronto', 'Entregue', CheckCircle2]].map(([key, label, Icon], i, arr) => {
          const cur = ORDER.indexOf(status)
          const me = ORDER.indexOf(key)
          const done = me <= cur
          return (
            <div key={key} className="flex shrink-0 items-center">
              <div className={'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ' + (done ? 'bg-terracotta-500/20 text-terracotta-400' : 'text-cream-100/40')}>
                <Icon size={14} /> {label}
              </div>
              {i < arr.length - 1 && <div className={'mx-1 h-px w-6 ' + (me < cur ? 'bg-terracotta-400/50' : 'bg-cream-100/10')} />}
            </div>
          )
        })}
      </div>

      {status === 'selecionando' && ehDemo && (
        <div className="mt-6 rounded-2xl bg-cocoa-900 p-8 text-center ring-1 ring-cream-100/10">
          <Clock size={32} className="mx-auto text-cream-100/40" />
          <p className="mt-4 text-cream-100/70">A {cliente.nome} ainda está escolhendo as fotos.</p>
          <p className="mt-1 text-sm text-cream-100/40">Vá à <Link to="/cliente" className="text-terracotta-400 underline">Área do Cliente</Link>, selecione fotos e confirme — aparecem aqui.</p>
        </div>
      )}

      {(status !== 'selecionando' || !ehDemo) && (
        <>
          {/* Status de pagamento */}
          {pag && pag.statusPagamento === 'pago' && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/25">
              <CheckCircle2 size={18} className="text-emerald-300" />
              <p className="text-sm text-cream-100/85">
                <strong className="text-emerald-300">Pagamento recebido.</strong> O cliente acertou o valor restante de {formatBRL(restante)}{pag.metodo ? ' via ' + (pag.metodo === 'cartao' ? 'cartão' : 'PIX') : ''}. Pode seguir com a edição.
              </p>
            </div>
          )}
          {pag && pag.statusPagamento === 'pendente' && (
            <div className="mt-6 flex flex-wrap items-start gap-3 rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-400/30">
              <CalendarClock size={18} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-sm text-cream-100/80">
                <strong className="text-amber-200">Pagamento pendente.</strong> Falta receber {formatBRL(pag.valorPendente || restante)}{prazoPagFmt ? ' — prazo até ' + prazoPagFmt + ' (3 dias úteis)' : ''}. A reserva de {formatBRL(pagoReserva)} já foi paga no agendamento.
              </p>
            </div>
          )}
          {pag && (!pag.statusPagamento || pag.statusPagamento === 'aguardando') && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
              <Wallet size={18} className="text-cream-100/40" />
              <p className="text-sm text-cream-100/60">Aguardando o cliente enviar a seleção e acertar o valor restante.</p>
            </div>
          )}
          {!pag && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
              <Wallet size={18} className="text-cream-100/40" />
              <p className="text-sm text-cream-100/60">Pagamento controlado fora do demo ao vivo. (Reserva de {formatBRL(pagoReserva)} paga no agendamento.)</p>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Stat label="Fotos escolhidas" valor={sel.length} />
            <Stat label="Extras" valor={extras + ' × ' + formatBRL(gdata.fotoExtra)} />
            <Stat label="Total do ensaio" valor={formatBRL(total)} highlight />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {sel.length > 0 && (
              <button onClick={exportarLightroom} className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100 ring-1 ring-cream-100/15 transition hover:bg-cocoa-950"><Download size={15} /> Exportar lista p/ Lightroom</button>
            )}
            {status === 'enviado' && <button onClick={iniciarEdicao} className="btn-light !py-2.5 text-xs"><Wand2 size={15} /> Iniciar edição</button>}
            {status === 'editando' && <button onClick={liberar} className="btn-light !py-2.5 text-xs"><Send size={15} /> Liberar download p/ cliente</button>}
            {status === 'pronto' && <span className="inline-flex items-center gap-2 rounded-full bg-clay-400/20 px-4 py-2.5 text-xs text-clay-300"><CheckCircle2 size={15} /> Fotos entregues</span>}
          </div>

          {/* Sugestão: levar favoritas (já editadas) pro portfólio */}
          {favFinais.length > 0 && !feito && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-terracotta-400/30 bg-gradient-to-br from-terracotta-500/12 to-cocoa-900 p-5">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="mt-0.5 shrink-0 text-terracotta-400" />
                <div>
                  <p className="font-medium text-cream-100">{cliente.nome} amou {favFinais.length} {favFinais.length === 1 ? 'foto' : 'fotos'} deste ensaio.</p>
                  <p className="mt-0.5 text-sm text-cream-100/65">Agora que estão editadas e entregues, que tal levá-las pro seu portfólio? Você revisa antes.</p>
                </div>
              </div>
              <button onClick={() => setPortfolioOpen(true)} className="btn-light !py-2.5 text-xs"><Sparkles size={15} /> Levar pro portfólio</button>
            </div>
          )}
          {feito && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/25">
              <CheckCircle2 size={18} className="text-emerald-300" />
              <p className="text-sm text-cream-100/85">Favoritas adicionadas ao seu portfólio! Veja na aba <strong className="text-emerald-300">Portfólio</strong>.</p>
            </div>
          )}

          <h3 className="mt-8 font-serif text-xl">Fotos selecionadas por {cliente.nome}</h3>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {fotosSel.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-lg">
                <Photo src={f.src} alt={f.alt} className="aspect-square" />
                {status === 'pronto' && <div className="absolute right-1 top-1 rounded-full bg-clay-400 p-1 text-cream-50"><Check size={11} /></div>}
              </div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {portfolioOpen && (
          <LevarFavoritasPortfolio
            fotos={favFinais}
            clienteNome={cliente.nome}
            ensaioNome={cliente.ensaios[0].titulo}
            onClose={() => setPortfolioOpen(false)}
            onConcluido={() => { setPortfolioOpen(false); setFeito(true) }}
          />
        )}
      </AnimatePresence>
      {notif && <NotifModal notif={notif} onClose={() => setNotif(null)} />}
    </div>
  )
}

function Stat({ label, valor, highlight }) {
  return (
    <div className={'rounded-2xl p-5 ring-1 ' + (highlight ? 'bg-terracotta-500/15 ring-terracotta-400/30' : 'bg-cocoa-900 ring-cream-100/10')}>
      <p className="text-xs text-cream-100/50">{label}</p>
      <p className={'mt-1 font-serif text-2xl ' + (highlight ? 'text-terracotta-400' : '')}>{valor}</p>
    </div>
  )
}

function NotifModal({ notif, onClose }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-clay-300"><MessageCircle size={20} /> <h3 className="font-serif text-xl text-cream-100">Notificação enviada ✓</h3></div>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/50">{notif.titulo} · para {notif.para}</p>
        <div className="mt-4 rounded-2xl rounded-bl-sm bg-[#25D366]/10 p-4 ring-1 ring-[#25D366]/20">
          <p className="text-sm leading-relaxed text-cream-100/90">{notif.texto}</p>
        </div>
        <p className="mt-3 text-center text-xs text-cream-100/40">📲 Demo: na versão final, enviado automaticamente por WhatsApp/e-mail via API.</p>
        <button onClick={onClose} className="btn-light mt-5 w-full">Entendi</button>
      </div>
    </div>
  )
}
