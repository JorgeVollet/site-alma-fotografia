import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, Download, FileCode2, RotateCcw, Ban, ArrowLeft,
  CheckCircle2, Clock, AlertTriangle, Filter, Mail, Receipt, Sparkles, Loader2, Trash2,
} from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { STATUS_NF, TIPO_NF } from '../../data/notasFiscais'
import { useApp } from '../../context/AppContext'

const dataFmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
const dataHoraFmt = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export default function NotasFiscais() {
  const { notas, faturaveis, gerarNota, marcarNotaEmitida, reverterEmissao, cancelarNota, excluirNota, recarregarFiscal } = useApp()
  // A fila "Pronto para emitir" deriva das contas pagas (marcadas em Contas/Seleções,
  // que têm estado próprio). Sem realtime: ao abrir Notas, refaz a busca da fila.
  useEffect(() => { recarregarFiscal() }, [recarregarFiscal])
  const [tipo, setTipo] = useState('todos') // todos | nfse | nfe
  const [status, setStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [aberta, setAberta] = useState(null)
  const [gerando, setGerando] = useState(null) // contaId sendo gerado

  const filtradas = useMemo(() => {
    return notas.filter((n) => {
      if (tipo !== 'todos' && n.tipo !== tipo) return false
      if (status !== 'todos' && n.status !== status) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        if (!n.cliente.toLowerCase().includes(q) && !n.descricao.toLowerCase().includes(q) && !String(n.numero).includes(q)) return false
      }
      return true
    })
  }, [notas, tipo, status, busca])

  // Resumo
  const autorizadas = notas.filter((n) => n.status === 'autorizada')
  const pendentes = notas.filter((n) => ['pendente', 'processando'].includes(n.status))
  const comErro = notas.filter((n) => n.status === 'rejeitada')
  const totalAutorizado = autorizadas.reduce((s, n) => s + n.valor, 0)

  const handleGerar = async (faturavel, tp) => {
    setGerando(faturavel.lancamentoId)
    const nova = await gerarNota(faturavel, tp)
    setGerando(null)
    if (!nova) alert('Não foi possível gerar a nota agora. Tente novamente.')
  }

  if (aberta) {
    const atual = notas.find((n) => n.id === aberta.id) || aberta
    return <DetalheNota nota={atual} onVoltar={() => setAberta(null)} onEmitir={marcarNotaEmitida} onReverter={reverterEmissao} onCancelar={cancelarNota} onExcluir={(id) => { excluirNota(id); setAberta(null) }} />
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Notas fiscais</h1>
          <p className="mt-1 text-sm text-cream-100/60">Pagamentos recebidos viram nota a 1 clique. A emissão fiscal real (Focus NFe) conecta depois.</p>
        </div>
        <span className="rounded-full bg-cream-100/5 px-3 py-1.5 text-[11px] text-cream-100/40 ring-1 ring-cream-100/10">
          Emissão Focus NFe — em construção
        </span>
      </div>

      {/* Pronto para emitir: contas recebidas que ainda não viraram nota */}
      <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-terracotta-400" />
          <h2 className="font-serif text-xl">Pronto para emitir</h2>
          <span className="rounded-full bg-terracotta-500/15 px-2 py-0.5 text-[11px] text-terracotta-300">{faturaveis.length}</span>
        </div>
        <p className="mt-1 text-xs text-cream-100/50">Pagamentos já recebidos, sem nota. Gere a nota vinculada — sem redigitar nada.</p>

        <div className="mt-4 space-y-2.5">
          <AnimatePresence mode="popLayout">
            {faturaveis.map((f) => (
              <motion.div
                key={f.lancamentoId} layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cocoa-950 px-4 py-3 ring-1 ring-cream-100/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-cream-100">{f.cliente}</p>
                  <p className="truncate text-xs text-cream-100/50">{f.descricao}{f.categoria ? ` · ${f.categoria}` : ''} · recebido {dataFmt(f.pagoEm)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-serif text-base text-cream-100">{formatBRL(f.valor)}</span>
                  <GerarBotao faturavel={f} onGerar={handleGerar} ocupado={gerando === f.lancamentoId} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {faturaveis.length === 0 && (
            <p className="rounded-xl bg-cocoa-950 px-4 py-6 text-center text-sm text-cream-100/40">
              Nenhum pagamento aguardando nota. Quando uma conta é marcada como recebida, ela aparece aqui.
            </p>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Resumo icon={CheckCircle2} cor="text-emerald-300" label="Autorizadas" valor={autorizadas.length} />
        <Resumo icon={Clock} cor="text-amber-300" label="Pendentes / processando" valor={pendentes.length} />
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

      {/* Lista de notas geradas */}
      <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
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
            const st = STATUS_NF[n.status] || STATUS_NF.pendente
            const tp = TIPO_NF[n.tipo] || TIPO_NF.nfse
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
            <p className="mt-3 text-sm text-cream-100/50">Nenhuma nota gerada ainda. Gere a partir do bloco “Pronto para emitir”.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function GerarBotao({ faturavel, onGerar, ocupado }) {
  const [tp, setTp] = useState('nfse')
  return (
    <div className="flex items-center gap-1.5">
      <select value={tp} onChange={(e) => setTp(e.target.value)} className="appearance-none rounded-lg bg-cocoa-900 px-2 py-1.5 text-[11px] text-cream-100/70 outline-none ring-1 ring-cream-100/10">
        <option value="nfse">NFS-e</option>
        <option value="nfe">NF-e</option>
      </select>
      <button onClick={() => onGerar(faturavel, tp)} disabled={ocupado} className="btn-light !py-2 !px-3 text-xs disabled:opacity-50">
        {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Gerar nota
      </button>
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
function DetalheNota({ nota, onVoltar, onEmitir, onReverter, onCancelar, onExcluir }) {
  const st = STATUS_NF[nota.status] || STATUS_NF.pendente
  const tp = TIPO_NF[nota.tipo] || TIPO_NF.nfse
  const temArquivos = !!(nota.pdf || nota.xml)
  const gerada = nota.status === 'pendente' // gerada, aguardando emissão real
  const podeEmitir = ['pendente', 'processando', 'rejeitada'].includes(nota.status)
  const emitida = nota.status === 'autorizada'
  const podeExcluir = ['pendente', 'rejeitada', 'cancelada'].includes(nota.status)
  const [numero, setNumero] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const emitir = async () => { setOcupado(true); await onEmitir(nota.id, numero); setOcupado(false) }
  const reverter = async () => { setOcupado(true); await onReverter(nota.id); setOcupado(false) }
  const cancelar = async () => { if (!window.confirm('Cancelar esta nota (estorno/devolução)? O pagamento volta para a fila “Pronto para emitir”.')) return; setOcupado(true); await onCancelar(nota.id); setOcupado(false) }
  const excluir = async () => { if (!window.confirm('Excluir esta nota? Some de vez e o pagamento volta para “Pronto para emitir”.')) return; await onExcluir(nota.id) }

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

      {/* gerada, aguardando emissão real (sem Focus NFe ainda) */}
      {gerada && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-sky-500/10 p-4 ring-1 ring-sky-400/25">
          <Clock size={18} className="mt-0.5 shrink-0 text-sky-300" />
          <div>
            <p className="text-sm font-medium text-sky-200">Nota gerada — aguardando emissão</p>
            <p className="text-sm text-cream-100/70">Está vinculada ao pagamento, sem redigitar. A emissão fiscal real entra com a Focus NFe; por ora, registre o número manualmente em “Marcar como emitida”.</p>
          </div>
        </div>
      )}

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

      {/* emissão manual (rastreio até a Focus NFe conectar) */}
      {podeEmitir && (
        <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="text-sm font-medium text-cream-100">Registrar emissão (manual)</p>
          <p className="mt-1 text-xs text-cream-100/50">Enquanto a Focus NFe não está conectada, registre aqui o número da nota emitida no portal da prefeitura.</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº da nota (opcional)" className="flex-1 rounded-xl bg-cocoa-950 px-4 py-2.5 text-sm text-cream-100 outline-none ring-1 ring-cream-100/10 placeholder:text-cream-100/30 focus:ring-terracotta-400/40" />
            <button onClick={emitir} disabled={ocupado} className="btn-light !py-2.5 text-xs disabled:opacity-50">{ocupado ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Marcar como emitida</button>
          </div>
        </div>
      )}

      {/* ações */}
      <div className="mt-6 flex flex-wrap gap-3">
        {temArquivos && (
          <>
            {nota.pdf && <a href={nota.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100 ring-1 ring-cream-100/15 transition hover:bg-cocoa-950"><Download size={15} /> Baixar PDF</a>}
            {nota.xml && <a href={nota.xml} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100 ring-1 ring-cream-100/15 transition hover:bg-cocoa-950"><FileCode2 size={15} /> Baixar XML</a>}
          </>
        )}
        {emitida && <BotaoAcao icon={RotateCcw} onClick={reverter} ocupado={ocupado}>Desfazer emissão</BotaoAcao>}
        {emitida && <BotaoAcao icon={Ban} onClick={cancelar} ocupado={ocupado} perigo>Cancelar nota (estorno)</BotaoAcao>}
        {podeExcluir && <BotaoAcao icon={Trash2} onClick={excluir} perigo>Excluir nota</BotaoAcao>}
      </div>

      <p className="mt-6 rounded-xl bg-cocoa-900 p-4 text-xs text-cream-100/40 ring-1 ring-cream-100/10">
        Errou ou precisa estornar? <strong>Desfazer emissão</strong> volta a nota para “gerada”; <strong>Cancelar</strong> faz o estorno (o pagamento volta para “Pronto para emitir”). Os arquivos (PDF/XML) e a emissão automática entram com a <strong>Focus NFe</strong>.
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

function BotaoAcao({ icon: Icon, children, onClick, destaque, perigo, ocupado }) {
  const base = 'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs transition ring-1 disabled:opacity-50 '
  const cls = perigo
    ? 'bg-terracotta-500/10 text-terracotta-300 ring-terracotta-400/30 hover:bg-terracotta-500/20'
    : destaque
    ? 'bg-terracotta-500 text-cream-50 ring-transparent hover:bg-terracotta-600'
    : 'bg-cocoa-800 text-cream-100 ring-cream-100/15 hover:bg-cocoa-950'
  return (
    <button onClick={onClick} disabled={ocupado} className={base + cls}>
      {ocupado ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />} {children}
    </button>
  )
}
