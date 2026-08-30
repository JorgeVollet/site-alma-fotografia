import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mail, Phone, Calendar, Sparkles, FileText,
  Plus, Minus, Check, Trash2, Send, Camera, Wand2, Loader2, ChevronRight, Wallet,
} from 'lucide-react'
import { formatBRL } from '../../components/Money'
import MensagemModal from '../../components/MensagemModal'
import LeadInfo from './_LeadInfo'
import { FUNIL_ETAPAS } from '../../data/crm'
import { statusLabel, statusCor } from '../../data/statusEnsaio'
import { useApp } from '../../context/AppContext'
import { usePacotes, useProdutos } from '../../lib/catalogo'
import { fetchContaGaleria, fetchContasDaGaleria } from '../../lib/galerias'
import { fecharNegocio } from '../../lib/ensaios'
import NovoContrato, { ModalEnviar } from '../../components/contratos/NovoContrato'
import { hojeISO } from '../../lib/datas'

// Modal contextual do cliente — muda conforme a etapa do funil
export default function ClienteModal({ cliente, etapaAtual, onClose, onMover }) {
  const etapa = etapaAtual || cliente.funil
  const [ensaioAberto, setEnsaioAberto] = useState(null)
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 ring-1 ring-cream-100/10"
      >
        {/* Cabeçalho */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-cocoa-900/95 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className={cliente.avatarGrad + ' grid h-14 w-14 place-items-center rounded-2xl font-serif text-xl text-cream-50'}>{cliente.nome.charAt(0)}</div>
            <div>
              <h2 className="font-serif text-2xl text-cream-100">{cliente.nome}</h2>
              <p className="text-sm text-cream-100/50">{cliente.interesse || (cliente.ensaios[0] && cliente.ensaios[0].titulo)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={22} /></button>
        </div>

        <div className="px-6 pb-6">
          {/* Contato sempre presente */}
          <div className="grid grid-cols-2 gap-2.5">
            <Pill icon={Phone} texto={cliente.telefone} />
            <Pill icon={Mail} texto={cliente.email} />
          </div>

          {/* Todos os ensaios do cliente, com status individual — clique abre a ficha */}
          {cliente.ensaios.length > 0 && <BlocoEnsaios ensaios={cliente.ensaios} onAbrir={setEnsaioAberto} />}

          {/* Informações do lead + histórico — SEMPRE visíveis, em qualquer etapa */}
          <LeadInfo cliente={cliente} />

          {/* Conteúdo específico por etapa */}
          {etapa === 'orcamento' && <BlocoOrcamento cliente={cliente} />}
          {etapa === 'agendado' && <BlocoAgendado cliente={cliente} />}
          {etapa === 'producao' && <BlocoProducao cliente={cliente} />}
          {etapa === 'entregue' && <BlocoEntregue cliente={cliente} />}

          {/* Mover etapa */}
          <div className="mt-6 border-t border-cream-100/10 pt-5">
            <p className="text-xs uppercase tracking-wide text-cream-100/40">Mover para etapa</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {FUNIL_ETAPAS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onMover(cliente.id, e.id)}
                  className={'rounded-full px-3 py-1.5 text-xs transition ' + (e.id === etapa ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-800 text-cream-100/70 hover:bg-cocoa-700')}
                >
                  {e.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Pop-up do ensaio — ficha integrada (de onde vem cada coisa) */}
          <AnimatePresence>
            {ensaioAberto && <EnsaioModal ensaio={ensaioAberto} cliente={cliente} onClose={() => setEnsaioAberto(null)} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Pill({ icon: Icon, texto }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-cocoa-950 px-3 py-2.5 text-xs text-cream-100/70">
      <Icon size={13} className="shrink-0 text-terracotta-400" /> <span className="truncate">{texto}</span>
    </div>
  )
}

function Secao({ icon: Icon, titulo, children }) {
  return (
    <div className="mt-5">
      <p className="flex items-center gap-2 text-sm font-medium text-cream-100"><Icon size={15} className="text-terracotta-400" /> {titulo}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

function Campo({ label, valor }) {
  return (
    <div className="flex justify-between gap-3 border-b border-cream-100/5 py-2 text-sm last:border-0">
      <span className="text-cream-100/50">{label}</span>
      <span className="text-right text-cream-100/90">{valor}</span>
    </div>
  )
}

/* ---- ENSAIOS (todos, com status) — cada card abre a ficha integrada ---- */
function BlocoEnsaios({ ensaios, onAbrir }) {
  return (
    <Secao icon={Camera} titulo={'Ensaios (' + ensaios.length + ')'}>
      <div className="space-y-2">
        {ensaios.map((e) => (
          <button key={e.id} onClick={() => onAbrir && onAbrir(e)} className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-cocoa-950 p-3.5 text-left transition hover:bg-cocoa-800 hover:ring-1 hover:ring-terracotta-400/30">
            <div className="min-w-0">
              <p className="truncate text-sm text-cream-100/90">{e.titulo || 'Ensaio'}</p>
              <p className="text-xs text-cream-100/50">{e.data ? new Date(e.data + 'T12:00').toLocaleDateString('pt-BR') : 'Sem data'} · {formatBRL(e.valor || 0)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={'rounded-full px-2.5 py-1 text-[11px] ' + statusCor(e.status)}>{statusLabel(e.status)}</span>
              <ChevronRight size={16} className="text-cream-100/30 transition group-hover:text-terracotta-400" />
            </div>
          </button>
        ))}
      </div>
    </Secao>
  )
}

/* ---- FICHA INTEGRADA DO ENSAIO (pop-up: de onde vem cada coisa) ---- */
function EnsaioModal({ ensaio, cliente, onClose }) {
  const { galerias, contratos, criarContrato, enviarContrato, recarregarCRM } = useApp()
  const galeria = (galerias || []).find((g) => g.ensaioId === ensaio.id) || null
  const contrato = (contratos || []).find((ct) => ct.ensaioId === ensaio.id && ct.status !== 'cancelado') || null
  const [conta, setConta] = useState(undefined) // undefined=carregando · null=nenhuma
  const [novoContrato, setNovoContrato] = useState(false)
  const [enviarCt, setEnviarCt] = useState(null)
  const [fechando, setFechando] = useState(false)
  const [form, setForm] = useState({
    valor: ensaio.valor || '',
    sinal: ensaio.sinal ?? '',
    fotosInclusas: ensaio.fotosInclusas ?? '',
    fotoExtra: ensaio.fotoExtra ?? '',
  })
  const [msgFechar, setMsgFechar] = useState('')

  // FECHAR NEGÓCIO: digita o valor combinado UMA vez e o banco gera o resto —
  // valor do ensaio, conta do sinal, conta do saldo e o que a galeria herda.
  const fechar = async () => {
    if (fechando) return
    setFechando(true)
    setMsgFechar('')
    const r = await fecharNegocio({
      ensaioId: ensaio.id,
      valor: form.valor, sinal: form.sinal,
      fotosInclusas: form.fotosInclusas, fotoExtra: form.fotoExtra,
    })
    setFechando(false)
    if (!r.ok) { setMsgFechar(r.erro || 'Não foi possível fechar agora.'); return }
    setMsgFechar('Pronto! Sinal ' + formatBRL(r.sinal_a_receber) + ' e saldo ' + formatBRL(r.saldo_a_receber) + ' entraram em "A receber".')
    const cs = await fetchContasDaGaleria(galeria ? galeria.id : null, ensaio.id)
    setConta(cs[0] || null)
    if (recarregarCRM) recarregarCRM()
  }
  useEffect(() => {
    let v = true
    fetchContaGaleria(galeria ? galeria.id : null, ensaio.id).then((c) => { if (v) setConta(c) })
    return () => { v = false }
  }, [ensaio.id, galeria && galeria.id])

  const dataFmt = ensaio.data
    ? new Date(ensaio.data + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    : '—'
  const contaTxt = conta === undefined ? 'Carregando…'
    : conta ? `${conta.status === 'pago' ? 'Recebido' : 'Pendente'} · ${formatBRL(conta.valor)}${conta.vencimento && conta.status !== 'pago' ? ` · vence ${new Date(conta.vencimento + 'T12:00').toLocaleDateString('pt-BR')}` : ''}`
    : 'Nenhuma conta gerada ainda'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { e.stopPropagation(); onClose() }} className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cocoa-900 ring-1 ring-cream-100/10">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-cocoa-900/95 p-6 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-cream-100/40">Ensaio de {cliente.nome}</p>
            <h3 className="font-serif text-2xl text-cream-100">{ensaio.titulo || 'Ensaio'}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={'rounded-full px-2.5 py-0.5 text-[11px] ' + statusCor(ensaio.status)}>{statusLabel(ensaio.status)}</span>
              {ensaio.origem === 'site' && <span className="rounded-full bg-terracotta-500/20 px-2 py-0.5 text-[10px] text-terracotta-300">veio do site</span>}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-cream-100/40 hover:text-cream-100"><X size={22} /></button>
        </div>

        <div className="space-y-5 px-6 pb-6">
          <div className="rounded-2xl bg-cocoa-950 p-4">
            <Campo label="Tipo" valor={ensaio.tipo || '—'} />
            <Campo label="Pacote" valor={ensaio.pacote || '—'} />
            <Campo label="Data" valor={dataFmt} />
            {ensaio.hora && <Campo label="Horário" valor={ensaio.hora} />}
            {ensaio.local && <Campo label="Local" valor={ensaio.local} />}
            <Campo label="Valor" valor={formatBRL(ensaio.valor || 0)} />
            {ensaio.fotoExtra != null && <Campo label="Foto extra" valor={formatBRL(ensaio.fotoExtra)} />}
          </div>

          {ensaio.observacoes && (
            <div>
              <p className="text-xs uppercase tracking-wide text-cream-100/40">Observações</p>
              <p className="mt-1.5 rounded-2xl bg-cocoa-950 p-4 text-sm leading-relaxed text-cream-100/75">{ensaio.observacoes}</p>
            </div>
          )}

          {/* De onde vem cada coisa (organismo único) */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-cream-100/40">De onde vem cada coisa</p>
            <div className="space-y-2">
              <LinhaInt icon={Camera} titulo="Galeria / Seleção" ok={!!galeria}
                valor={galeria ? `${statusLabel(galeria.status)} · ${galeria.totalFotos || 0} fotos · código ${galeria.codigo || '—'}` : 'Nenhuma galeria criada ainda'} />
              <LinhaInt icon={FileText} titulo="Contrato" ok={contrato && contrato.status === 'assinado'}
                valor={contrato ? `${contrato.status} · ${formatBRL(contrato.valor || 0)}` : 'Sem contrato vinculado'} />
              <LinhaInt icon={Wallet} titulo="Financeiro (a receber)" ok={!!conta && conta.status === 'pago'}
                valor={contaTxt} />
            </div>
            <p className="mt-2 text-[11px] text-cream-100/40">Tudo ligado a este ensaio aparece aqui — galeria, contrato e o valor a receber.</p>
          </div>

          {/* FECHAR NEGÓCIO */}
          <div className="rounded-2xl bg-cocoa-950 p-4 ring-1 ring-terracotta-400/20">
            <p className="flex items-center gap-2 text-sm font-medium text-cream-100/90">
              <Wallet size={15} className="text-terracotta-400" /> Fechar negócio
            </p>
            <p className="mt-1 text-[11px] text-cream-100/45">
              Combinou o valor no WhatsApp? Digite aqui uma vez — o sistema cria a cobrança do sinal e a do saldo, e a galeria já nasce com os números certos.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[11px] text-cream-100/45">Valor combinado (R$)</span>
                <input type="number" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  placeholder="1200" className="mt-0.5 w-full rounded-lg border border-cream-100/10 bg-cocoa-900 px-3 py-1.5 text-sm outline-none focus:border-terracotta-400" />
              </label>
              <label className="block">
                <span className="text-[11px] text-cream-100/45">Sinal (R$)</span>
                <input type="number" value={form.sinal} onChange={(e) => setForm((f) => ({ ...f, sinal: e.target.value }))}
                  placeholder="100" className="mt-0.5 w-full rounded-lg border border-cream-100/10 bg-cocoa-900 px-3 py-1.5 text-sm outline-none focus:border-terracotta-400" />
              </label>
              <label className="block">
                <span className="text-[11px] text-cream-100/45">Fotos inclusas</span>
                <input type="number" value={form.fotosInclusas} onChange={(e) => setForm((f) => ({ ...f, fotosInclusas: e.target.value }))}
                  placeholder="10" className="mt-0.5 w-full rounded-lg border border-cream-100/10 bg-cocoa-900 px-3 py-1.5 text-sm outline-none focus:border-terracotta-400" />
              </label>
              <label className="block">
                <span className="text-[11px] text-cream-100/45">Foto extra (R$)</span>
                <input type="number" value={form.fotoExtra} onChange={(e) => setForm((f) => ({ ...f, fotoExtra: e.target.value }))}
                  placeholder="30" className="mt-0.5 w-full rounded-lg border border-cream-100/10 bg-cocoa-900 px-3 py-1.5 text-sm outline-none focus:border-terracotta-400" />
              </label>
            </div>
            {Number(form.valor) > 0 && (
              <p className="mt-2 text-[11px] text-cream-100/55">
                Sinal {formatBRL(Number(form.sinal) || 0)} + saldo {formatBRL(Math.max(0, (Number(form.valor) || 0) - (Number(form.sinal) || 0)))} = {formatBRL(Number(form.valor) || 0)}
              </p>
            )}
            <button onClick={fechar} disabled={fechando || !(Number(form.valor) > 0)}
              className="btn-light mt-3 w-full !py-2.5 text-xs disabled:opacity-40">
              {fechando ? <><Loader2 size={14} className="animate-spin" /> Gerando cobranças…</> : <><Check size={14} /> Fechar e gerar cobranças</>}
            </button>
            {msgFechar && <p className="mt-2 text-[11px] text-clay-300">{msgFechar}</p>}
          </div>

          {/* Ações — criar/enviar contrato a partir do ensaio (mesmo poder da aba Contratos) */}
          <div className="flex flex-wrap gap-2">
            {!contrato && <button onClick={() => setNovoContrato(true)} className="btn-light flex-1 !py-2.5 text-xs"><FileText size={14} /> Criar contrato</button>}
            {contrato && contrato.status !== 'assinado' && (
              <button onClick={() => setEnviarCt({ ...contrato, clienteNome: contrato.clienteNome || cliente.nome, telefone: contrato.telefone || cliente.telefone })} className="btn-light flex-1 !py-2.5 text-xs"><Send size={14} /> Enviar contrato p/ assinatura</button>
            )}
          </div>

          <AnimatePresence>
            {novoContrato && (
              <NovoContrato key="novoct" zClass="z-[90]" bloquearCliente clientePre={cliente.id}
                ensaioPre={{ id: ensaio.id, titulo: ensaio.titulo, tipo: ensaio.tipo, valor: ensaio.valor }}
                onClose={() => setNovoContrato(false)} onCriar={criarContrato}
                onCriado={(c) => { setNovoContrato(false); if (c) setEnviarCt({ ...c, clienteNome: cliente.nome, telefone: cliente.telefone }) }} />
            )}
            {enviarCt && (
              <ModalEnviar key="enviarct" zClass="z-[90]" contrato={enviarCt}
                onClose={() => setEnviarCt(null)}
                onConfirmar={(notif) => { enviarContrato(enviarCt.id, notif); setEnviarCt(null) }} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

function LinhaInt({ icon: Icon, titulo, valor, ok }) {
  return (
    <div className={'flex items-center gap-3 rounded-xl p-3 ring-1 ' + (ok ? 'bg-terracotta-500/20 ring-terracotta-500/45' : 'bg-cocoa-950 ring-cream-100/5')}>
      <div className={'grid h-9 w-9 shrink-0 place-items-center rounded-lg ' + (ok ? 'bg-terracotta-500 text-cream-50 shadow-sm shadow-terracotta-500/40' : 'bg-cocoa-800 text-cream-100/30')}><Icon size={16} /></div>
      <div className="min-w-0 flex-1">
        <p className={'text-xs ' + (ok ? 'font-semibold text-terracotta-600' : 'text-cream-100/45')}>{titulo}</p>
        <p className={'truncate text-sm ' + (ok ? 'font-medium text-cream-100' : 'text-cream-100/70')}>{valor}</p>
      </div>
      {ok && <Check size={17} className="shrink-0 text-terracotta-600" strokeWidth={2.5} />}
    </div>
  )
}

/* ---- ORÇAMENTO (real: catálogo + entrada/sinal, persiste + costura → 'orcamento') ---- */
function BlocoOrcamento({ cliente }) {
  const { editarCliente, moverFunil } = useApp()
  const PACOTES = usePacotes()
  const PRODUTOS = useProdutos()
  const base = cliente.orcamento || {}
  const [pacoteId, setPacoteId] = useState(base.pacoteId || '')
  const [produtos, setProdutos] = useState(base.produtos || [])
  const [fotosExtras, setFotosExtras] = useState((base.fotosExtras && base.fotosExtras.qtd) || 0)
  const [itens, setItens] = useState(base.itens || [])
  const [desconto, setDesconto] = useState(base.desconto || 0)
  const [sinal, setSinal] = useState(base.sinal != null ? base.sinal : 0)
  const [status, setStatus] = useState(base.status || null)
  const [novoDesc, setNovoDesc] = useState('')
  const [novoVal, setNovoVal] = useState('')
  const [prodSel, setProdSel] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [msgOpen, setMsgOpen] = useState(false)

  const pacote = PACOTES.find((p) => p.id === pacoteId) || null
  const pacotePreco = pacote ? pacote.preco : 0
  const fotoExtraVal = pacote && pacote.fotoExtra ? pacote.fotoExtra : 0
  const fotosExtrasTotal = fotosExtras * fotoExtraVal
  const produtosTotal = produtos.reduce((s, p) => s + p.preco * p.qtd, 0)
  const itensTotal = itens.reduce((s, i) => s + (i.valor || 0), 0)
  const subtotal = pacotePreco + produtosTotal + fotosExtrasTotal + itensTotal
  const total = Math.max(0, subtotal - desconto)
  const restante = Math.max(0, total - sinal)

  const escolherPacote = (id) => {
    setPacoteId(id)
    const p = PACOTES.find((x) => x.id === id)
    if (p) setSinal(p.reserva || 0) // sugere a reserva do pacote como entrada (editável)
  }
  const addProduto = () => {
    const p = PRODUTOS.find((x) => x.id === prodSel); if (!p) return
    setProdutos((arr) => {
      const ex = arr.find((x) => x.id === p.id)
      if (ex) return arr.map((x) => (x.id === p.id ? { ...x, qtd: x.qtd + 1 } : x))
      return [...arr, { id: p.id, nome: p.nome, preco: p.preco, qtd: 1 }]
    })
    setProdSel('')
  }
  const ajustarProduto = (id, d) => setProdutos((arr) => arr.flatMap((x) => (x.id === id ? (x.qtd + d <= 0 ? [] : [{ ...x, qtd: x.qtd + d }]) : [x])))
  const addItem = () => {
    if (!novoDesc.trim() || !novoVal) return
    setItens((arr) => [...arr, { desc: novoDesc.trim(), valor: +novoVal }])
    setNovoDesc(''); setNovoVal('')
  }
  const rmItem = (idx) => setItens((arr) => arr.filter((_, i) => i !== idx))

  const persistir = async (st) => {
    setSalvando(true)
    await editarCliente(cliente.id, { orcamento: {
      pacoteId, pacoteNome: pacote ? pacote.nome : null, inclui: pacote ? pacote.inclui : [],
      fotosInclusas: pacote ? pacote.fotosInclusas : null, fotoExtra: fotoExtraVal,
      produtos, fotosExtras: { qtd: fotosExtras, valor: fotoExtraVal }, itens,
      desconto, subtotal, total, sinal, restante,
      status: st, enviadoEm: st === 'enviado' ? new Date().toISOString() : (base.enviadoEm || null),
    } })
    setStatus(st); setSalvando(false)
  }
  const salvar = async () => { await persistir('rascunho'); setSalvo(true); setTimeout(() => setSalvo(false), 1600) }
  const enviar = async () => {
    await persistir('enviado')
    if (cliente.funil === 'lead') moverFunil(cliente.id, 'orcamento') // forward-only (não rebaixa agendado+)
    setMsgOpen(true)
  }

  const primeiroNome = (cliente.nome || '').split(' ')[0]
  const linhas = [
    pacote ? `${pacote.nome} — ${formatBRL(pacotePreco)}` : null,
    ...produtos.map((p) => `${p.nome}${p.qtd > 1 ? ` (x${p.qtd})` : ''} — ${formatBRL(p.preco * p.qtd)}`),
    fotosExtras > 0 ? `${fotosExtras} foto(s) extra — ${formatBRL(fotosExtrasTotal)}` : null,
    ...itens.map((i) => `${i.desc} — ${formatBRL(i.valor)}`),
  ].filter(Boolean)
  const corpo = linhas.join('\n')
  const presets = [
    `Olá, ${primeiroNome}! 💛 Segue seu orçamento na Alma Fotografia:\n${corpo}${desconto ? `\nDesconto: -${formatBRL(desconto)}` : ''}\nTotal: ${formatBRL(total)}.${sinal ? `\nPara reservar a data, a entrada é ${formatBRL(sinal)} (restante ${formatBRL(restante)} na entrega).` : ''}\nVamos marcar? ✨`,
    `Oi, ${primeiroNome}! ✨ Preparei um orçamento especial${pacote ? ` com o pacote ${pacote.nome}` : ''} — total ${formatBRL(total)}${sinal ? `, com entrada de ${formatBRL(sinal)} para garantir sua data` : ''}. Posso te explicar cada detalhe. 💛 — Alma Fotografia`,
    `${primeiroNome}, que alegria! 🎉 Seu orçamento ficou em ${formatBRL(total)}${sinal ? ` (entrada ${formatBRL(sinal)} + ${formatBRL(restante)} depois)` : ''}. Aceita que eu já reserve um horário pra você?`,
  ]

  const inp = 'rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  return (
    <Secao icon={FileText} titulo="Montar orçamento">
      {status === 'enviado' && <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-clay-400/15 px-2.5 py-1 text-[11px] text-clay-300"><Check size={11} /> Orçamento enviado</p>}
      <div className="space-y-3 rounded-2xl bg-cocoa-950 p-4">
        {/* Pacote do catálogo */}
        <label className="block"><span className="text-xs text-cream-100/50">Pacote</span>
          <select className={inp + ' mt-1 w-full'} value={pacoteId} onChange={(e) => escolherPacote(e.target.value)}>
            <option value="">Sem pacote (montar avulso)</option>
            {PACOTES.map((p) => <option key={p.id} value={p.id}>{p.nome} — {formatBRL(p.preco)}</option>)}
          </select>
        </label>
        {pacote && (
          <div className="rounded-xl bg-cocoa-900 p-3 text-xs text-cream-100/70">
            <p className="mb-1 text-cream-100/90">{pacote.ideal}</p>
            <ul className="space-y-0.5">
              {(pacote.inclui || []).map((b, i) => <li key={i} className="flex gap-1.5"><Check size={12} className="mt-0.5 shrink-0 text-clay-300" /> {b}</li>)}
            </ul>
            {pacote.fotosInclusas != null && <p className="mt-1.5 text-cream-100/50">{pacote.fotosInclusas} fotos inclusas · foto extra {formatBRL(fotoExtraVal)}</p>}
          </div>
        )}

        {/* Produtos adicionais do catálogo */}
        <div>
          <span className="text-xs text-cream-100/50">Produtos adicionais</span>
          <div className="mt-1 flex gap-2">
            <select className={inp + ' flex-1'} value={prodSel} onChange={(e) => setProdSel(e.target.value)}>
              <option value="">Adicionar produto…</option>
              {PRODUTOS.map((p) => <option key={p.id} value={p.id}>{p.nome} — {formatBRL(p.preco)}</option>)}
            </select>
            <button onClick={addProduto} disabled={!prodSel} className="grid w-10 shrink-0 place-items-center rounded-lg bg-terracotta-500 text-cream-50 hover:bg-terracotta-600 disabled:opacity-40"><Plus size={16} /></button>
          </div>
          {produtos.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {produtos.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-cream-100/80">{p.nome}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => ajustarProduto(p.id, -1)} className="grid h-6 w-6 place-items-center rounded bg-cocoa-800 text-cream-100"><Minus size={12} /></button>
                    <span className="w-5 text-center text-cream-100/90">{p.qtd}</span>
                    <button onClick={() => ajustarProduto(p.id, 1)} className="grid h-6 w-6 place-items-center rounded bg-cocoa-800 text-cream-100"><Plus size={12} /></button>
                    <span className="w-20 text-right text-cream-100/90">{formatBRL(p.preco * p.qtd)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fotos extras (quando o pacote define preço por foto extra) */}
        {fotoExtraVal > 0 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-cream-100/50">Fotos extras ({formatBRL(fotoExtraVal)} cada)</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setFotosExtras((n) => Math.max(0, n - 1))} className="grid h-6 w-6 place-items-center rounded bg-cocoa-800 text-cream-100"><Minus size={12} /></button>
              <span className="w-5 text-center text-cream-100/90">{fotosExtras}</span>
              <button onClick={() => setFotosExtras((n) => n + 1)} className="grid h-6 w-6 place-items-center rounded bg-cocoa-800 text-cream-100"><Plus size={12} /></button>
              <span className="w-20 text-right text-cream-100/90">{formatBRL(fotosExtrasTotal)}</span>
            </div>
          </div>
        )}

        {/* Itens avulsos (exceção) */}
        <div>
          <span className="text-xs text-cream-100/50">Itens avulsos</span>
          {itens.length > 0 && (
            <div className="mt-1 space-y-1">
              {itens.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-cream-100/80">{it.desc}</span>
                  <div className="flex items-center gap-2"><span className="text-cream-100/90">{formatBRL(it.valor)}</span>
                    <button onClick={() => rmItem(idx)} className="text-cream-100/30 hover:text-terracotta-400"><Trash2 size={13} /></button></div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-1 flex gap-2">
            <input className={inp + ' flex-1'} placeholder="Item (ex: Hora extra)" value={novoDesc} onChange={(e) => setNovoDesc(e.target.value)} />
            <input className={inp + ' w-24'} type="number" placeholder="R$" value={novoVal} onChange={(e) => setNovoVal(e.target.value)} />
            <button onClick={addItem} className="grid w-10 shrink-0 place-items-center rounded-lg bg-terracotta-500 text-cream-50 hover:bg-terracotta-600"><Plus size={16} /></button>
          </div>
        </div>

        {/* Totais + entrada/sinal */}
        <div className="space-y-1.5 border-t border-cream-100/10 pt-3 text-sm">
          <div className="flex justify-between text-cream-100/60"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
          <div className="flex items-center justify-between text-cream-100/60">
            <span>Desconto</span>
            <div className="flex items-center gap-1"><span>R$</span><input type="number" className={inp + ' w-20 py-1'} value={desconto} onChange={(e) => setDesconto(+e.target.value || 0)} /></div>
          </div>
          <div className="flex justify-between border-t border-cream-100/10 pt-2 text-base"><span className="font-medium text-cream-100">Total</span><span className="font-serif text-xl text-terracotta-400">{formatBRL(total)}</span></div>
          <div className="flex items-center justify-between text-cream-100/60">
            <span>Entrada / sinal</span>
            <div className="flex items-center gap-1"><span>R$</span><input type="number" className={inp + ' w-20 py-1'} value={sinal} onChange={(e) => setSinal(+e.target.value || 0)} /></div>
          </div>
          <div className="flex justify-between text-xs text-cream-100/50"><span>Restante (na entrega)</span><span>{formatBRL(restante)}</span></div>
        </div>
      </div>

      <div className="mt-4 flex gap-2.5">
        <button onClick={salvar} disabled={salvando} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-cocoa-800 py-2.5 text-xs text-cream-100/80 ring-1 ring-cream-100/15 transition hover:text-cream-100 disabled:opacity-50">{salvando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {salvo ? 'Salvo!' : 'Salvar'}</button>
        <button onClick={enviar} disabled={salvando || subtotal === 0} className="btn-light flex-1 !py-2.5 text-xs disabled:opacity-50"><Send size={14} /> Enviar orçamento</button>
      </div>
      <p className="mt-2 text-center text-[11px] text-cream-100/40">Enviar move o cliente para “Orçamento” e abre a mensagem pronta. Ao fechar o orçamento, o sinal vira cobrança (próxima etapa).</p>

      <AnimatePresence>
        {msgOpen && (
          <MensagemModal
            titulo="Enviar orçamento 💰"
            subtitulo={`Para ${cliente.nome} · total ${formatBRL(total)}`}
            presets={presets}
            presetKey="orcamento"
            cliente={cliente}
            assunto="Seu orçamento — Alma Fotografia"
            onClose={() => setMsgOpen(false)}
          />
        )}
      </AnimatePresence>
    </Secao>
  )
}

/* ---- AGENDADO ---- */
function BlocoAgendado({ cliente }) {
  // ANTES lia cliente.agendamento — campo que não existe no cliente mapeado, e
  // por isso data, horário e local apareciam sempre vazios. A verdade está no
  // próprio ensaio. Mostra o ensaio marcado mais próximo, não só o [0].
  // Mostra o PRÓXIMO ensaio marcado (o que interessa em "Agendado"); se todos já
  // passaram, mostra o mais recente. Ordenar só crescente pegava o mais ANTIGO e
  // exibia data, hora e valor de um ensaio já entregue.
  const comData = (cliente.ensaios || []).filter((x) => x.data)
  const hoje = hojeISO()
  const futuros = comData.filter((x) => String(x.data).slice(0, 10) >= hoje)
    .sort((x, y) => String(x.data).localeCompare(String(y.data)))
  const passados = comData.filter((x) => String(x.data).slice(0, 10) < hoje)
    .sort((x, y) => String(y.data).localeCompare(String(x.data)))
  const e = (futuros[0] || passados[0] || (cliente.ensaios || [])[0]) || {}
  const a = cliente.agendamento || {}
  return (
    <>
      <Secao icon={Calendar} titulo="Detalhes do agendamento">
        <div className="rounded-2xl bg-cocoa-950 p-4">
          <Campo label="Ensaio" valor={e.titulo} />
          <Campo label="Data" valor={e.data ? new Date(String(e.data).slice(0, 10) + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '—'} />
          <Campo label="Horário" valor={e.hora || '—'} />
          <Campo label="Local" valor={e.local || a.local || '—'} />
          <Campo label="Valor" valor={formatBRL(e.valor || 0)} />
        </div>
      </Secao>
      {a.obs && (
        <Secao icon={FileText} titulo="Observações">
          <p className="rounded-2xl bg-cocoa-950 p-4 text-sm leading-relaxed text-cream-100/70">{a.obs}</p>
        </Secao>
      )}
    </>
  )
}

/* ---- PRODUÇÃO ---- */
function BlocoProducao({ cliente }) {
  // ANTES lia cliente.producao — campo inexistente no cliente mapeado. Fotos
  // brutas, selecionadas, prazo e situação vinham SEMPRE vazios e a barra ficava
  // travada em 0%. A verdade está na GALERIA ligada ao ensaio.
  const { producaoOverride, setEditadas, galerias } = useApp()
  const p = cliente.producao || {}
  const comData = (cliente.ensaios || []).filter((x) => x.data)
  const e = (comData.length
    ? [...comData].sort((x, y) => String(y.data).localeCompare(String(x.data)))[0]
    : (cliente.ensaios || [])[0]) || {}
  const gal = (galerias || []).find((g) => g.ensaioId === e.id) || null
  const selecionadas = p.selecionadas || 0
  // editadas vem do override (se o usuário ajustou) ou do valor base
  const override = producaoOverride[cliente.id]
  const editadas = override ? override.editadas : (p.editadas || 0)
  const editPct = selecionadas ? Math.round((editadas / selecionadas) * 100) : 0
  const concluido = selecionadas > 0 && editadas >= selecionadas

  const ajustar = (delta) => {
    const novo = Math.max(0, Math.min(selecionadas, editadas + delta))
    setEditadas(cliente.id, novo)
  }

  return (
    <>
      <Secao icon={Camera} titulo="Status da produção">
        <div className="rounded-2xl bg-cocoa-950 p-4">
          <Campo label="Ensaio" valor={e.titulo} />
          <Campo label="Galeria" valor={gal ? gal.nome : 'ainda não criada'} />
          <Campo label="Fotos na galeria" valor={gal ? gal.totalFotos : '—'} />
          <Campo label="Fotos inclusas no pacote" valor={gal ? gal.fotosInclusas : '—'} />
          <Campo label="Situação" valor={gal ? statusLabel(gal.status) : 'aguardando galeria'} />
        </div>
      </Secao>

      {selecionadas > 0 && (
        <Secao icon={Wand2} titulo="Progresso da edição">
          <div className="rounded-2xl bg-cocoa-950 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-cream-100/70">Fotos editadas</p>
              <div className="flex items-center gap-3">
                <button onClick={() => ajustar(-1)} disabled={editadas <= 0} className="grid h-8 w-8 place-items-center rounded-lg bg-cocoa-800 text-cream-100 transition hover:bg-cocoa-700 disabled:opacity-30"><Minus size={15} /></button>
                <span className="w-16 text-center font-serif text-xl text-cream-100">{editadas}<span className="text-sm text-cream-100/40">/{selecionadas}</span></span>
                <button onClick={() => ajustar(1)} disabled={editadas >= selecionadas} className="grid h-8 w-8 place-items-center rounded-lg bg-terracotta-500 text-cream-50 transition hover:bg-terracotta-600 disabled:opacity-30"><Plus size={15} /></button>
              </div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cocoa-900">
              <motion.div animate={{ width: editPct + '%' }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={'h-full rounded-full ' + (concluido ? 'bg-clay-400' : 'bg-terracotta-500')} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-cream-100/50">{editPct}% concluído</p>
              <div className="flex gap-2">
                <button onClick={() => setEditadas(cliente.id, 0)} className="text-xs text-cream-100/40 hover:text-cream-100">Zerar</button>
                <button onClick={() => setEditadas(cliente.id, selecionadas)} className="text-xs text-terracotta-400 hover:underline">Marcar todas</button>
              </div>
            </div>
          </div>
          {concluido && <p className="mt-2 flex items-center gap-1.5 text-xs text-clay-300"><Check size={13} /> Tudo editado! Pronto para liberar o download na aba Seleções.</p>}
        </Secao>
      )}
    </>
  )
}

/* ---- ENTREGUE ---- */
function BlocoEntregue({ cliente }) {
  const e = cliente.ensaios[0] || {}
  return (
    <Secao icon={Sparkles} titulo="Ensaio entregue">
      <div className="rounded-2xl bg-clay-400/10 p-4 ring-1 ring-clay-400/20">
        <Campo label="Ensaio" valor={e.titulo} />
        <Campo label="Valor total" valor={formatBRL(e.valor || 0)} />
        <p className="mt-3 text-sm text-clay-300">✓ Fotos entregues. Que tal pedir uma avaliação ou oferecer um próximo ensaio?</p>
      </div>
    </Secao>
  )
}
