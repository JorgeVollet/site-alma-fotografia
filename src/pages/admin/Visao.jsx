import { CircleDollarSign, CalendarCheck, Image as ImageIcon, TrendingUp, AlertTriangle, Clock, FileSignature, Wand2, ChevronRight, MessageCircle, CalendarClock, CheckCircle2, Wallet, Sparkles } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { useApp } from '../../context/AppContext'
import { CLIENTES, getGaleriaData, FINANCEIRO_DEMO, CONTAS_DEMO, TAREFAS_DEMO, CONTRATOS_DEMO } from '../../data/crm'
import { favoritasFinais, GALERIA_CLIENTE_DEMO, GALERIA_PRONTA_DEMO } from '../../data/galleries'

function statusLabel(s) {
  return { selecionando: 'Cliente escolhendo', enviado: 'Seleção recebida', editando: 'Em edição', pronto: 'Entregue' }[s] || s
}
const COM_ENSAIO = CLIENTES.filter((c) => c.galeriaId)
const HOJE = '2026-06-10'

export default function Visao({ setTab }) {
  const app = useApp()
  const pag = app.pagamento || {}
  const prazoFmt = pag.prazoPagamento
    ? new Date(pag.prazoPagamento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : ''

  const selCount = (c) => c.galeriaId === 'demo' ? (app.selecoes['demo'] || []).length : (getGaleriaData(c.galeriaId).selecionadas || []).length
  const statusDe = (c) => (c.galeriaId === 'demo' ? app.statusEnsaio : c.ensaios[0].status)

  const totalSelecionadas = COM_ENSAIO.reduce((s, c) => s + selCount(c), 0)
  const receitaDemo = FINANCEIRO_DEMO.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const receitaSite = app.agendamentos.reduce((s, a) => s + (a.valorReserva || 0), 0)
  const aguardando = COM_ENSAIO.filter((c) => statusDe(c) === 'enviado').length

  // --- Central de pendências (precisa de atenção) ---
  const contas = [...app.contasCustom, ...CONTAS_DEMO.filter((c) => !app.contasExcluida[c.id]).map((c) => ({ ...c, ...(app.contasEdit[c.id] || {}) }))]
  const contasVencidas = contas.filter((c) => (c.status === 'pendente' || c.status === 'vencido') && c.vencimento < HOJE && !['pago', 'recebido'].includes(c.status)).length
  const tarefasAtrasadas = TAREFAS_DEMO.filter((t) => {
    const feita = app.tarefasFeitas[t.id] !== undefined ? app.tarefasFeitas[t.id] : t.feita
    return !feita && t.prazo < HOJE && !app.tarefasExcluidas[t.id]
  }).length + app.tarefasCustom.filter((t) => !app.tarefasFeitas[t.id] && t.prazo < HOJE).length
  const contratosPend = CONTRATOS_DEMO.filter((c) => { const st = (app.contratosEdit[c.id] || {}).status || c.status; return st === 'enviado' }).length + app.contratosCustom.filter((c) => c.status === 'enviado').length
  const ensaiosEditar = aguardando
  // Favoritas (já editadas) prontas para virar portfólio — só o ensaio ao vivo.
  const favParaPortfolio = app.statusEnsaio === 'pronto'
    ? favoritasFinais(app.selecoes['demo'] || [], GALERIA_CLIENTE_DEMO, GALERIA_PRONTA_DEMO).length
    : 0

  const pendencias = [
    { n: contasVencidas, label: 'conta(s) vencida(s)', icon: AlertTriangle, tab: 'contas', cor: 'text-terracotta-400' },
    { n: tarefasAtrasadas, label: 'tarefa(s) atrasada(s)', icon: Clock, tab: 'tarefas', cor: 'text-amber-300' },
    { n: contratosPend, label: 'contrato(s) aguardando assinatura', icon: FileSignature, tab: 'contratos', cor: 'text-amber-300' },
    { n: ensaiosEditar, label: 'seleção(ões) p/ iniciar edição', icon: Wand2, tab: 'selecoes', cor: 'text-clay-300' },
    { n: favParaPortfolio, label: 'favorita(s) prontas p/ o portfólio', icon: Sparkles, tab: 'selecoes', cor: 'text-terracotta-400' },
  ].filter((p) => p.n > 0)

  const cards = [
    { label: 'Receita do mês', valor: formatBRL(receitaDemo + receitaSite), icon: CircleDollarSign, trend: 'entradas' },
    { label: 'Agendamentos (site)', valor: app.agendamentos.length, icon: CalendarCheck, trend: 'novos' },
    { label: 'Fotos selecionadas', valor: totalSelecionadas, icon: ImageIcon, trend: 'todos ensaios' },
    { label: 'Ensaios ativos', valor: COM_ENSAIO.length, icon: TrendingUp, trend: aguardando + ' p/ editar' },
  ]

  return (
    <div>
      <h1 className="font-serif text-3xl">Olá, equipe 👋</h1>
      <p className="mt-1 text-sm text-cream-100/60">Resumo do que está acontecendo no estúdio hoje.</p>

      {/* Central de pendências */}
      {pendencias.length > 0 && (
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-terracotta-500/15 to-cocoa-900 p-5 ring-1 ring-terracotta-400/25">
          <p className="flex items-center gap-2 font-medium text-cream-100"><AlertTriangle size={16} className="text-terracotta-400" /> Precisa da sua atenção</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {pendencias.map((p) => {
              const Icon = p.icon
              return (
                <button key={p.label} onClick={() => setTab(p.tab)} className="flex items-center justify-between gap-3 rounded-xl bg-cocoa-950/40 px-4 py-3 text-left transition hover:bg-cocoa-950/70">
                  <span className="flex items-center gap-2.5 text-sm text-cream-100/80"><Icon size={15} className={p.cor} /> <strong className={p.cor}>{p.n}</strong> {p.label}</span>
                  <ChevronRight size={15} className="text-cream-100/30" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Status de pagamento do cliente ao vivo (Sphor) */}
      {pag.statusPagamento === 'pendente' && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-cocoa-900 p-5 ring-1 ring-amber-400/30">
          <p className="flex items-center gap-2 font-medium text-cream-100">
            <CalendarClock size={16} className="text-amber-300" /> Pagamento pendente — Família Sphor
          </p>
          <p className="mt-2 text-sm text-cream-100/75">
            O cliente enviou a seleção, mas ainda não acertou o valor restante de{' '}
            <strong className="text-amber-200">{formatBRL(pag.valorPendente)}</strong>. Prazo combinado:{' '}
            <strong className="text-amber-200">{prazoFmt}</strong> (3 dias úteis).
          </p>
          <p className="mt-2 text-xs text-cream-100/55">
            Você decide: pode priorizar outro trabalho até a confirmação do pagamento, ou seguir com a edição mesmo assim.
          </p>
          <button onClick={() => setTab('selecoes')} className="mt-3 inline-flex items-center gap-2 rounded-full bg-cocoa-950/40 px-4 py-2 text-xs text-cream-100/80 transition hover:bg-cocoa-950/70">
            <Wallet size={14} /> Ver seleção do cliente <ChevronRight size={14} />
          </button>
        </div>
      )}
      {pag.statusPagamento === 'pago' && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-400/25">
          <CheckCircle2 size={18} className="text-emerald-300" />
          <p className="text-sm text-cream-100/85">
            <strong className="text-emerald-300">Pagamento confirmado</strong> — Família Sphor acertou o valor restante. Pode seguir com a edição tranquilo. 💛
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
              <div className="flex items-center justify-between">
                <Icon size={20} className="text-terracotta-400" />
                <span className="text-[10px] uppercase tracking-wide text-cream-100/40">{c.trend}</span>
              </div>
              <p className="mt-4 font-serif text-3xl">{c.valor}</p>
              <p className="text-xs text-cream-100/50">{c.label}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-serif text-xl">Ensaios em andamento</h2>
        <button onClick={() => setTab('selecoes')} className="text-xs text-terracotta-400 hover:underline">Gerenciar seleções →</button>
      </div>
      <div className="mt-4 space-y-3">
        {COM_ENSAIO.map((c) => {
          const aoVivo = c.galeriaId === 'demo'
          return (
            <button key={c.id} onClick={() => setTab('selecoes')} className={'flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-left ring-1 transition hover:ring-terracotta-400/30 ' + (aoVivo ? 'bg-gradient-to-br from-cocoa-900 to-cocoa-950 ring-terracotta-400/20' : 'bg-cocoa-900 ring-cream-100/10')}>
              <div className="flex items-center gap-4">
                <div className={c.avatarGrad + ' grid h-12 w-12 place-items-center rounded-xl font-serif text-lg text-cream-50'}>{c.nome.charAt(0)}</div>
                <div>
                  <p className="font-medium">{c.ensaios[0].titulo} {aoVivo && <span className="ml-1 rounded-full bg-terracotta-500/20 px-2 py-0.5 text-[10px] text-terracotta-400">AO VIVO</span>}</p>
                  <p className="text-sm text-cream-100/60">{c.nome} · {selCount(c)} fotos · {statusLabel(statusDe(c))}</p>
                </div>
              </div>
              <span className="rounded-full bg-cream-100/10 px-3 py-1.5 text-xs text-cream-100/70">{statusLabel(statusDe(c))}</span>
            </button>
          )
        })}
      </div>

      {/* Histórico de notificações enviadas */}
      {app.notificacoes && app.notificacoes.length > 0 && (
        <>
          <h2 className="mt-8 font-serif text-xl">Últimas notificações enviadas</h2>
          <div className="mt-3 space-y-2">
            {app.notificacoes.slice(0, 5).map((n, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]"><MessageCircle size={15} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-cream-100/50">Para {n.cliente} · {n.em ? new Date(n.em).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  <p className="mt-0.5 truncate text-sm text-cream-100/80">{n.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
