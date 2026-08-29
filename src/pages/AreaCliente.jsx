import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, User, Check, Maximize2, X, ChevronLeft, ChevronRight, Send,
  ShieldCheck, Info, Sparkles, MessageSquare, LogOut, Loader2, Heart,
  QrCode, CalendarClock, Star, Download, Images,
} from 'lucide-react'
import JSZip from 'jszip'
import { formatBRL } from '../components/Money'
import Photo from '../components/Photo'
import AssinaturaJV from '../components/AssinaturaJV'
import { entrarGaleria, salvarSelecaoFoto, finalizarSelecao, reenviarSelecao } from '../lib/clienteGaleria'

export default function AreaCliente() {
  const [sessao, setSessao] = useState(null) // { token, galeria, fotos }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="min-h-screen bg-cream-200 pt-20">
      {!sessao
        ? <Login onEntrar={setSessao} />
        : <Galeria sessao={sessao} onSair={() => setSessao(null)} />}
      <AssinaturaJV variant="dark" className="pb-6 pt-2" />
    </motion.div>
  )
}

/* ---------------- LOGIN ---------------- */
function Login({ onEntrar }) {
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setErro('')
    setEntrando(true)
    const r = await entrarGaleria(codigo.trim(), senha)
    setEntrando(false)
    if (r.ok) onEntrar(r)
    else setErro(r.erro)
  }

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
        <form onSubmit={entrar} className="rounded-3xl bg-cream-50 p-8 shadow-sm ring-1 ring-cocoa-800/5 md:p-10">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cocoa-800 text-cream-50"><Lock size={24} /></div>
          <h1 className="mt-6 font-serif text-3xl text-cocoa-800">Área do Cliente</h1>
          <p className="mt-2 text-sm font-light text-cocoa-600">Acesse com o código e a senha que enviamos para ver e escolher as suas fotos.</p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-cocoa-700">Código da galeria</span>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Ex: SILVA1234" className="mt-1.5 w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm uppercase outline-none focus:border-cocoa-800" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-cocoa-700">Senha</span>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••" className="mt-1.5 w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" />
            </label>
          </div>

          {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}

          <button type="submit" disabled={entrando} className="btn-primary mt-7 w-full disabled:opacity-60">
            {entrando ? <><Loader2 size={16} className="animate-spin" /> Entrando…</> : <><User size={16} /> Entrar na minha galeria</>}
          </button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-cocoa-500"><ShieldCheck size={12} /> Suas fotos ficam protegidas e visíveis só para você.</p>
        </form>
      </div>
    </div>
  )
}

/* ---------------- GALERIA + SELEÇÃO ---------------- */
function Galeria({ sessao, onSair }) {
  const { token, galeria } = sessao
  const [fotos, setFotos] = useState(sessao.fotos)
  const entregas = sessao.entregas || []
  const temEntregas = entregas.length > 0
  const [aba, setAba] = useState(galeria.status === 'pronto' && temEntregas ? 'entrega' : 'selecao')
  const [lightbox, setLightbox] = useState(null) // índice da foto aberta
  const [jaEnviou, setJaEnviou] = useState(galeria.status !== 'selecionando')
  const [pagModal, setPagModal] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [aviso, setAviso] = useState(false)
  const [baixandoTodas, setBaixandoTodas] = useState(false)

  const selecionadas = fotos.filter((f) => f.selecionada)
  const favoritas = fotos.filter((f) => f.favorita)
  const extras = Math.max(0, selecionadas.length - galeria.fotosInclusas)
  const valorExtra = extras * (galeria.fotoExtra || 0)
  const saldo = Math.max(0, (galeria.valorTotal || 0) - (galeria.reserva || 0))
  const total = saldo + valorExtra

  const patch = useCallback((id, campos) => {
    setFotos((fs) => fs.map((f) => (f.id === id ? { ...f, ...campos } : f)))
  }, [])

  const toggle = useCallback((foto) => {
    const nova = !foto.selecionada
    patch(foto.id, { selecionada: nova })
    salvarSelecaoFoto(token, foto.id, nova, foto.observacao)
  }, [token, patch])

  const setObs = useCallback((foto, texto) => {
    patch(foto.id, { observacao: texto })
  }, [patch])

  const salvarObs = useCallback((foto) => {
    salvarSelecaoFoto(token, foto.id, foto.selecionada, foto.observacao)
  }, [token])

  const finalizar = async (pagarAgora) => {
    setFinalizando(true)
    const r = await finalizarSelecao(token, pagarAgora)
    setFinalizando(false)
    if (r.ok) { setResultado(r); setPagModal(false); setJaEnviou(true); setAviso(true) }
  }

  // Recorrência: já enviou antes → só reabre p/ o estúdio (sem pagamento aqui).
  const reenviar = async () => {
    setFinalizando(true)
    const r = await reenviarSelecao(token)
    setFinalizando(false)
    if (r.ok) { setResultado(null); setAviso(true) }
  }
  const onEnviar = () => { if (jaEnviou) reenviar(); else setPagModal(true) }

  // Download das finais (fetch do blob p/ forçar o download mesmo cross-origin).
  const baixar = async (f) => {
    try {
      const res = await fetch(f.fullUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = f.nome || 'foto.jpg'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch (e) { window.open(f.fullUrl, '_blank', 'noopener') }
  }
  // Baixa TODAS as finais num único .zip (JSZip, no navegador).
  const baixarTodas = async () => {
    if (!entregas.length) return
    setBaixandoTodas(true)
    try {
      const zip = new JSZip()
      const usados = new Set()
      for (let i = 0; i < entregas.length; i++) {
        const f = entregas[i]
        const res = await fetch(f.fullUrl)
        const blob = await res.blob()
        let nome = f.nome || `foto-${String(i + 1).padStart(3, '0')}.jpg`
        if (usados.has(nome)) {
          const p = nome.lastIndexOf('.')
          nome = p > 0 ? `${nome.slice(0, p)}-${i + 1}${nome.slice(p)}` : `${nome}-${i + 1}`
        }
        usados.add(nome)
        zip.file(nome, blob)
      }
      const conteudo = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(conteudo)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(galeria.nome || 'fotos').replace(/[^\w\- ]+/g, '').trim() || 'fotos'}.zip`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 6000)
    } catch (e) {
      console.warn('[entrega] zip falhou, baixando individual', e)
      for (const f of entregas) await baixar(f)
    }
    setBaixandoTodas(false)
  }

  const vencAviso = resultado?.vencimento ? new Date(resultado.vencimento + 'T12:00').toLocaleDateString('pt-BR') : null

  return (
    <div className="container-c py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-cocoa-800">{galeria.nome}</h1>
          <p className="mt-1 text-sm text-cocoa-600">
            {aba === 'entrega'
              ? 'Suas fotos finais, prontas para baixar em alta resolução. 💛'
              : 'Clique nas fotos que você quer escolher. Toque na lupa para ampliar e deixar uma observação.'}
          </p>
        </div>
        <button onClick={onSair} className="inline-flex items-center gap-2 rounded-full bg-cream-50 px-4 py-2 text-xs text-cocoa-600 ring-1 ring-cocoa-800/10 hover:text-cocoa-900"><LogOut size={14} /> Sair</button>
      </div>

      {/* Abas (aparecem quando há fotos finais) */}
      {temEntregas && (
        <div className="mt-5 flex gap-2">
          <button onClick={() => setAba('selecao')} className={'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ' + (aba === 'selecao' ? 'bg-cocoa-800 text-cream-50' : 'bg-cream-50 text-cocoa-600 ring-1 ring-cocoa-800/10 hover:text-cocoa-900')}><Heart size={14} /> Escolher fotos</button>
          <button onClick={() => setAba('entrega')} className={'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition ' + (aba === 'entrega' ? 'bg-cocoa-800 text-cream-50' : 'bg-cream-50 text-cocoa-600 ring-1 ring-cocoa-800/10 hover:text-cocoa-900')}><Images size={14} /> Minhas fotos ({entregas.length})</button>
        </div>
      )}

      {/* Banner de sucesso (envio / reenvio) */}
      {aviso && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-clay-500/10 p-4 ring-1 ring-clay-500/25">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-clay-500 text-cream-50"><Check size={16} /></span>
          <div className="flex-1 text-sm text-cocoa-700">
            <strong className="text-cocoa-800">Seleção enviada! 💛</strong> Recebemos as suas {selecionadas.length} fotos. Vamos tratar cada uma com carinho e avisamos quando estiverem prontas.
            {resultado && (
              <span className="mt-1 block text-clay-700">Total {formatBRL(resultado.total)} · {resultado.status === 'pago' ? 'Pago ✓' : `a pagar até ${vencAviso}`}</span>
            )}
          </div>
          <button onClick={() => setAviso(false)} className="text-cocoa-400 hover:text-cocoa-700"><X size={16} /></button>
        </div>
      )}

      {aba === 'entrega' ? (
        /* ----- ENTREGA: baixar as finais ----- */
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-cocoa-600">{entregas.length} foto(s) prontas — sem marca d'água, no tamanho original.</p>
            <button onClick={baixarTodas} disabled={baixandoTodas} className="btn-primary !py-2 text-xs disabled:opacity-50">
              {baixandoTodas ? <><Loader2 size={14} className="animate-spin" /> Preparando o .zip…</> : <><Download size={14} /> Baixar todas (.zip)</>}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {entregas.map((f) => (
              <div key={f.id} className="group relative overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cocoa-800/10">
                <Photo src={f.thumbUrl} alt="" fallback="ph-gradient-2" className="aspect-square" />
                <button onClick={() => baixar(f)} className="absolute inset-0 grid place-items-center bg-cocoa-950/0 opacity-0 transition group-hover:bg-cocoa-950/30 group-hover:opacity-100" title="Baixar">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-50 px-3 py-1.5 text-xs font-medium text-cocoa-800"><Download size={13} /> Baixar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <>
      {/* Barra de resumo (sticky) */}
      <div className="sticky top-20 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cocoa-800 px-5 py-3 text-cream-50 shadow-lg">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5"><Heart size={15} className="text-clay-300" /> <strong>{selecionadas.length}</strong> selecionadas</span>
          <span className="text-cream-100/70">{galeria.fotosInclusas} inclusas</span>
          {extras > 0
            ? <span className="text-clay-300">+{extras} extra(s) · {formatBRL(valorExtra)}</span>
            : <span className="text-cream-100/50">dentro do incluso</span>}
        </div>
        <button onClick={onEnviar} disabled={selecionadas.length === 0 || finalizando} className="inline-flex items-center gap-2 rounded-full bg-clay-500 px-5 py-2 text-sm font-medium text-cream-50 transition hover:bg-clay-600 disabled:opacity-40">
          {finalizando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {jaEnviou ? 'Enviar novas escolhas' : 'Enviar seleção'}
        </button>
      </div>

      {jaEnviou && (
        <p className="mt-2 text-center text-xs text-cocoa-500">Você já enviou sua seleção 💛 Quer mais fotos? Escolha e clique em <strong>“Enviar novas escolhas”</strong> — combinamos as avulsas com você.</p>
      )}

      {/* Destaques da Alma (fotos indicadas pelo fotógrafo) */}
      {(favoritas.length > 0 || galeria.mensagemFotografo) && (
        <div className="mt-6 rounded-3xl bg-clay-500/10 p-5 ring-1 ring-clay-500/20 md:p-6">
          <div className="flex items-center gap-2">
            <Star size={18} className="fill-current text-clay-500" />
            <h2 className="font-serif text-xl text-cocoa-800">A Alma indica pra você</h2>
          </div>
          {galeria.mensagemFotografo
            ? <p className="mt-2 text-sm leading-relaxed text-cocoa-600">{galeria.mensagemFotografo}</p>
            : <p className="mt-2 text-sm leading-relaxed text-cocoa-600">Separamos algumas fotos que amamos deste ensaio — dá uma olhada com carinho 💛</p>}
          {favoritas.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {favoritas.map((f) => {
                const i = fotos.indexOf(f)
                return (
                  <div key={f.id} className={'group relative w-28 shrink-0 overflow-hidden rounded-xl ring-2 transition sm:w-32 ' + (f.selecionada ? 'ring-clay-500' : 'ring-clay-500/30')}>
                    <button onClick={() => toggle(f)} className="block w-full">
                      <Photo src={f.thumbUrl} alt="" protect fallback="ph-gradient-2" className="aspect-square" />
                      <span className={'absolute inset-0 transition ' + (f.selecionada ? 'bg-clay-500/10' : 'group-hover:bg-cocoa-950/10')} />
                    </button>
                    <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-clay-500 text-cream-50" title="Indicada pela Alma"><Star size={12} className="fill-current" /></span>
                    {f.selecionada && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-cocoa-800 text-cream-50"><Check size={12} /></span>}
                    <button onClick={() => setLightbox(i)} className="absolute bottom-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-cream-50/85 text-cocoa-700 opacity-0 transition hover:bg-cream-50 group-hover:opacity-100" title="Ampliar"><Maximize2 size={12} /></button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {fotos.length === 0 ? (
        <p className="mt-10 text-center text-sm text-cocoa-500">As fotos ainda não foram enviadas pelo estúdio. Volte em breve 💛</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotos.map((f, i) => (
            <div key={f.id} className={'group relative overflow-hidden rounded-xl ring-2 transition ' + (f.selecionada ? 'ring-clay-500' : 'ring-transparent')}>
              <button onClick={() => toggle(f)} className="block w-full">
                <Photo src={f.thumbUrl} alt="" protect fallback="ph-gradient-2" className="aspect-square" />
                <span className={'absolute inset-0 transition ' + (f.selecionada ? 'bg-clay-500/10' : 'bg-cocoa-950/0 group-hover:bg-cocoa-950/10')} />
              </button>
              {/* selo selecionada */}
              <span className={'absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full transition ' + (f.selecionada ? 'bg-clay-500 text-cream-50' : 'bg-cream-50/80 text-cocoa-400')}>
                {f.selecionada ? <Check size={15} /> : <Heart size={14} />}
              </span>
              {/* observação? */}
              {f.observacao && <span className="absolute bottom-2 left-2 rounded-full bg-cocoa-800/85 px-2 py-0.5 text-[10px] text-cream-50"><MessageSquare size={9} className="mr-1 inline" />nota</span>}
              {/* ampliar */}
              <button onClick={() => setLightbox(i)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-cream-50/85 text-cocoa-700 opacity-0 transition hover:bg-cream-50 group-hover:opacity-100" title="Ampliar"><Maximize2 size={13} /></button>
              {/* indicada pela Alma */}
              {f.favorita && <span className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-clay-500 text-cream-50 shadow" title="Indicada pela Alma"><Star size={12} className="fill-current" /></span>}
            </div>
          ))}
        </div>
      )}
      </>
      )}

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            fotos={fotos}
            indice={lightbox}
            onFechar={() => setLightbox(null)}
            onNavegar={setLightbox}
            onToggle={toggle}
            onObs={setObs}
            onSalvarObs={salvarObs}
          />
        )}
        {pagModal && (
          <PagamentoModal
            qtd={selecionadas.length}
            inclusas={galeria.fotosInclusas}
            extras={extras}
            valorExtra={valorExtra}
            saldo={saldo}
            total={total}
            finalizando={finalizando}
            onPagar={finalizar}
            onFechar={() => !finalizando && setPagModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- PAGAMENTO (ao enviar a seleção) ---------------- */
function PagamentoModal({ qtd, inclusas, extras, valorExtra, saldo, total, finalizando, onPagar, onFechar }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onFechar} className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa-950/50 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cream-50 p-7 md:p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-cocoa-800">Confirmar seleção</h3>
          <button onClick={onFechar} className="text-cocoa-400 hover:text-cocoa-700"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cocoa-600">Você escolheu <strong>{qtd}</strong> fotos ({inclusas} inclusas{extras > 0 ? ` + ${extras} extra` : ''}).</p>

        <div className="mt-5 space-y-2 rounded-2xl bg-cream-100 p-4 text-sm">
          <div className="flex justify-between"><span className="text-cocoa-500">Saldo do ensaio</span><span className="text-cocoa-800">{formatBRL(saldo)}</span></div>
          {extras > 0 && <div className="flex justify-between"><span className="text-cocoa-500">{extras} foto(s) extra</span><span className="text-cocoa-800">{formatBRL(valorExtra)}</span></div>}
          <div className="mt-1 flex justify-between border-t border-cocoa-800/10 pt-2 text-base"><span className="font-medium text-cocoa-700">Total</span><span className="font-serif text-xl text-clay-600">{formatBRL(total)}</span></div>
        </div>

        <p className="mt-5 text-sm font-medium text-cocoa-700">Como você prefere pagar?</p>
        <div className="mt-3 grid gap-3">
          <button onClick={() => onPagar(true)} disabled={finalizando} className="flex items-center justify-between rounded-2xl bg-cocoa-800 px-5 py-4 text-left text-cream-50 transition hover:bg-cocoa-900 disabled:opacity-50">
            <span className="flex items-center gap-3"><QrCode size={20} className="text-clay-300" /><span><span className="block font-medium">Pagar agora</span><span className="block text-xs text-cream-100/60">PIX / cartão (simulado no demo)</span></span></span>
            {finalizando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          </button>
          <button onClick={() => onPagar(false)} disabled={finalizando} className="flex items-center justify-between rounded-2xl bg-cream-100 px-5 py-4 text-left text-cocoa-800 ring-1 ring-cocoa-800/10 transition hover:bg-cream-200 disabled:opacity-50">
            <span className="flex items-center gap-3"><CalendarClock size={20} className="text-clay-500" /><span><span className="block font-medium">Pagar em até 3 dias úteis</span><span className="block text-xs text-cocoa-500">Combinamos o pagamento com você</span></span></span>
            {finalizando ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------------- LIGHTBOX (ampliar + observação) ---------------- */
function Lightbox({ fotos, indice, onFechar, onNavegar, onToggle, onObs, onSalvarObs }) {
  const foto = fotos[indice]
  const ir = (delta) => {
    const novo = (indice + delta + fotos.length) % fotos.length
    onNavegar(novo)
  }
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onFechar()
      if (e.key === 'ArrowLeft') ir(-1)
      if (e.key === 'ArrowRight') ir(1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa-950/90 p-4" onClick={onFechar}>
      <button onClick={onFechar} className="absolute right-4 top-4 text-cream-100/70 hover:text-cream-50"><X size={26} /></button>
      <button onClick={(e) => { e.stopPropagation(); ir(-1) }} className="absolute left-3 text-cream-100/60 hover:text-cream-50 md:left-6"><ChevronLeft size={34} /></button>
      <button onClick={(e) => { e.stopPropagation(); ir(1) }} className="absolute right-3 text-cream-100/60 hover:text-cream-50 md:right-6"><ChevronRight size={34} /></button>

      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[88vh] w-full max-w-5xl flex-col gap-4 md:flex-row">
        <div className="relative flex-1 overflow-hidden rounded-2xl">
          <Photo src={foto.previewUrl} alt="" protect fallback="ph-gradient-2" className="max-h-[60vh] w-full md:max-h-[80vh]" />
        </div>
        <div className="w-full shrink-0 rounded-2xl bg-cream-50 p-5 md:w-72">
          <button onClick={() => onToggle(foto)} className={'inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ' + (foto.selecionada ? 'bg-clay-500 text-cream-50 hover:bg-clay-600' : 'bg-cocoa-800 text-cream-50 hover:bg-cocoa-700')}>
            {foto.selecionada ? <><Check size={16} /> Selecionada</> : <><Heart size={16} /> Selecionar</>}
          </button>
          <label className="mt-5 block">
            <span className="flex items-center gap-1.5 text-sm font-medium text-cocoa-700"><MessageSquare size={14} /> Observação para esta foto</span>
            <textarea
              value={foto.observacao}
              onChange={(e) => onObs(foto, e.target.value)}
              onBlur={() => onSalvarObs(foto)}
              rows={4}
              placeholder="Ex: arrumar o cabelo, tirar a marquinha..."
              className="mt-2 w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-3 py-2 text-sm text-cocoa-800 outline-none focus:border-cocoa-800"
            />
            <span className="mt-1 block text-xs text-cocoa-400">O estúdio lê a sua observação na hora de tratar a foto.</span>
          </label>
          <p className="mt-4 text-center text-xs text-cocoa-400">{indice + 1} de {fotos.length}</p>
        </div>
      </div>
    </motion.div>
  )
}
