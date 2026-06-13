import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, Download, FileCode2, RotateCcw, Ban, X, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, Filter, Mail,
} from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { NOTAS_DEMO, STATUS_NF, TIPO_NF } from '../../data/notasFiscais'

const dataFmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const dataHoraFmt = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export default function NotasFiscais() {
  // No futuro, NOTAS_DEMO vira uma chamada ao backend (Focus NFe).
  const [notas] = useState(NOTAS_DEMO)
  const [tipo, setTipo] = useState('todos') // todos | nfse | nfe
  const [status, setStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [aberta, setAberta] = useState(null)

  const filtradas = useMemo(() => {
    return notas.filter((n) => {
      if (tipo !== 'todos' && n.tipo !== tipo) return false
      if (status !== 'todos' && n.status !== status) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        if (!n.cliente.toLowerCase().includes(q) && !n.descricao.toLowerCase().includes(q) && !n.numero.includes(q)) return false
      }
      return true
    })
  }, [notas, tipo, status, busca])

  // Resumo
  const autorizadas = notas.filter((n) => n.status === 'autorizada')
  const pendentes = notas.filter((n) => ['pendente', 'processando'].includes(n.status))
  const comErro = notas.filter((n) => n.status === 'rejeitada')
  const totalAutorizado = autorizadas.reduce((s, n) => s + n.valor, 0)

  if (aberta) return <DetalheNota nota={aberta} onVoltar={() => setAberta(null)} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Notas fiscais</h1>
          <p className="mt-1 text-sm text-cream-100/60">NFS-e (serviço) e NF-e (produto) emitidas pelo site. Clique para ver detalhes.</p>
        </div>
        <span className="rounded-full bg-cream-100/5 px-3 py-1.5 text-[11px] text-cream-100/40 ring-1 ring-cream-100/10">
          Demo — integração Focus NFe em construção
        </span>
      </div>

      {/* Cards de resumo */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Resumo icon={CheckCircle2} cor="text-emerald-300" label="Autorizadas" valor={autorizadas.length} />
        <Resumo icon={Clock} cor="text-amber-300" label="Em processamento" valor={pendentes.length} />
        <Resumo icon={AlertTriangle} cor="text-terracotta-300" label="Com erro" valor={comErro.length} alerta={comErro.length > 0} />
        <Resumo icon={FileText} cor="text-clay-300" label="Total autorizado" valor={formatBRL(totalAutorizado)} />
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full bg-cocoa-900 p-1 ring-1 ring-cream-100/10">
          {[['todos', 'Todas'], ['nfse', 'NFS-e'], ['nfe', 'NF-e']].map(([id, lbl]) => (
            <button key={id} onClick={() => setTipo(id)} className={'rounded-full px-4 py-1.5 text-xs transition ' + (tipo === id ? 'bg-terracotta-500 text-cream-50' : 'text-cream-100/60 hover:text-cream-100')}>{lbl}</button>
          ))}
        </div>

        <div className="relative">
          <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-100/40" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="appearance-none rounded-full bg-cocoa-900 py-2 pl-9 pr-8 text-xs text-cream-100/80 outline-none ring-1 ring-cream-100/10 focus:ring-terracotta-400/40">
            <option value="todos">Todos os status</option>
            <option value="autorizada">Autorizada</option>
            <option value="processando">Processando</option>
            <option value="pendente">Pendente</option>
            <option value="rejeitada">Rejeitada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-100/40" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por cliente, descrição ou número…" className="w-full rounded-full bg-cocoa-900 py-2 pl-9 pr-4 text-xs text-cream-100 outline-none ring-1 ring-cream-100/10 placeholder:text-cream-100/30 focus:ring-terracotta-400/40" />
        </div>
      </div>

      {/* Lista */}
      <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
        {/* cabeçalho (desktop) */}
        <div className="hidden grid-cols-12 gap-3 bg-cocoa-900 px-5 py-3 text-[11px] uppercase tracking-wide text-cream-100/40 md:grid">
          <span className="col-span-1">Nº</span>
          <span className="col-span-2">Tipo</span>
          <span className="col-span-4">Cliente / descrição</span>
          <span className="col-span-2">Valor</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1 text-right">Data</span>
        </div>

        <AnimatePresence mode="popLayout">
          {filtradas.map((n) => {
            const st = STATUS_NF[n.status]
            const tp = TIPO_NF[n.tipo]
            return (
              <motion.button
                key={n.id} layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setAberta(n)}
                className="grid w-full grid-cols-2 gap-3 border-t border-cream-100/5 bg-cocoa-950/40 px-5 py-4 text-left transition hover:bg-cocoa-900/70 md:grid-cols-12 md:items-center"
              >
                <span className="order-1 font-mono text-sm text-cream-100/60 md:col-span-1">{n.numero}</span>
                <span className="order-3 md:order-2 md:col-span-2">
                  <span className={'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ' + tp.chip}>{tp.label}</span>
                </span>
                <span className="order-5 col-span-2 md:order-3 md:col-span-4">
                  <span className="block text-sm text-cream-100">{n.cliente}</span>
                  <span className="block truncate text-xs text-cream-100/50">{n.descricao}</span>
                </span>
                <span className="order-2 text-right font-serif text-base text-cream-100 md:order-4 md:col-span-2 md:text-left">{formatBRL(n.valor)}</span>
                <span className="order-4 md:order-5 md:col-span-2">
                  <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1 ' + st.chip}>
                    <span className={'h-1.5 w-1.5 rounded-full ' + st.dot} /> {st.label}
                  </span>
                </span>
                <span className="order-6 hidden text-right text-xs text-cream-100/50 md:col-span-1 md:block">{dataFmt(n.emitidaEm)}</span>
              </motion.button>
            )
          })}
        </AnimatePresence>

        {filtradas.length === 0 && (
          <div className="border-t border-cream-100/5 bg-cocoa-950/40 px-5 py-12 text-center">
            <FileText size={26} className="mx-auto text-cream-100/25" />
            <p className="mt-3 text-sm text-cream-100/50">Nenhuma nota encontrada com esses filtros.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Resumo({ icon: Icon, cor, label, valor, alerta }) {
  return (
    <div className={'rounded-2xl p-5 ring-1 ' + (alerta ? 'bg-terracotta-500/10 ring-terracotta-400/30' : 'bg-cocoa-900 ring-cream-100/10')}>
      <Icon size={20} className={cor} />
      <p className="mt-3 font-serif text-2xl">{valor}</p>
      <p className="text-xs text-cream-100/50">{label}</p>
    </div>
  )
}

// ---------------------------------------------------------------------
//  Detalhe da nota
// ---------------------------------------------------------------------
function DetalheNota({ nota, onVoltar }) {
  const st = STATUS_NF[nota.status]
  const tp = TIPO_NF[nota.tipo]
  const temArquivos = nota.status === 'autorizada' || nota.status === 'cancelada'
  const podeReemitir = nota.status === 'rejeitada'
  const podeCancelar = nota.status === 'autorizada'

  return (
    <div>
      <button onClick={onVoltar} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100">
        <ArrowLeft size={16} /> Voltar para notas
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ' + tp.chip}>{tp.label} · {tp.sub}</span>
            <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1 ' + st.chip}>
              <span className={'h-1.5 w-1.5 rounded-full ' + st.dot} /> {st.label}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-3xl">Nota nº {nota.numero}</h1>
          <p className="mt-1 text-sm text-cream-100/60">{nota.descricao}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-cream-100/40">Valor</p>
          <p className="font-serif text-3xl text-terracotta-400">{formatBRL(nota.valor)}</p>
        </div>
      </div>

      {/* erro destacado */}
      {nota.motivoErro && nota.status === 'rejeitada' && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-terracotta-500/10 p-4 ring-1 ring-terracotta-400/25">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-terracotta-300" />
          <div>
            <p className="text-sm font-medium text-terracotta-200">Nota rejeitada</p>
            <p className="text-sm text-cream-100/70">{nota.motivoErro}</p>
          </div>
        </div>
      )}

      {/* dados */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Campo label="Cliente" valor={nota.cliente} />
        <Campo label="CPF / CNPJ" valor={nota.cpfCnpj} mono />
        <Campo label="Emitida em" valor={dataHoraFmt(nota.emitidaEm)} />
        <Campo label="Tipo de nota" valor={`${tp.label} (${tp.sub})`} />
      </div>

      {/* ações */}
      <div className="mt-6 flex flex-wrap gap-3">
        {temArquivos && (
          <>
            <BotaoAcao icon={Download} onClick={() => {}}>Baixar PDF</BotaoAcao>
            <BotaoAcao icon={FileCode2} onClick={() => {}}>Baixar XML</BotaoAcao>
            <BotaoAcao icon={Mail} onClick={() => {}}>Reenviar por e-mail</BotaoAcao>
          </>
        )}
        {podeReemitir && (
          <BotaoAcao icon={RotateCcw} onClick={() => {}} destaque>Reemitir nota</BotaoAcao>
        )}
        {podeCancelar && (
          <BotaoAcao icon={Ban} onClick={() => {}} perigo>Cancelar nota</BotaoAcao>
        )}
      </div>

      <p className="mt-6 rounded-xl bg-cocoa-900 p-4 text-xs text-cream-100/40 ring-1 ring-cream-100/10">
        Demo: os botões de download e ações ficam ativos quando o backend de emissão (Focus NFe) estiver conectado.
      </p>
    </div>
  )
}

function Campo({ label, valor, mono }) {
  return (
    <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
      <p className="text-xs text-cream-100/50">{label}</p>
      <p className={'mt-1 text-cream-100 ' + (mono ? 'font-mono text-base' : 'text-lg')}>{valor}</p>
    </div>
  )
}

function BotaoAcao({ icon: Icon, children, onClick, destaque, perigo }) {
  const base = 'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs transition ring-1 '
  const cls = perigo
    ? 'bg-terracotta-500/10 text-terracotta-300 ring-terracotta-400/30 hover:bg-terracotta-500/20'
    : destaque
    ? 'bg-terracotta-500 text-cream-50 ring-transparent hover:bg-terracotta-600'
    : 'bg-cocoa-800 text-cream-100 ring-cream-100/15 hover:bg-cocoa-950'
  return (
    <button onClick={onClick} className={base + cls}>
      <Icon size={15} /> {children}
    </button>
  )
}
