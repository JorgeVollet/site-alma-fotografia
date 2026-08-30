import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CircleDollarSign, CalendarCheck, TrendingUp, AlertTriangle, Wand2, ChevronRight, Wallet, Cake, Camera, Loader2, MessageCircle, FileSignature, Gift } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import MensagemModal from '../../components/MensagemModal'
import { useApp } from '../../context/AppContext'
import { statusLabel, statusCor } from '../../data/statusEnsaio'
import { fetchContasReceber } from '../../lib/galerias'
import { fetchLancamentos } from '../../lib/financeiro'
import { waLink } from '../../lib/wa'
import { hojeISO } from '../../lib/datas'

// Mensagens de PARABÉNS — só liberadas NO DIA exato do aniversário.
const ANIVERSARIO_HOJE = [
  (n) => `Feliz aniversário, ${n}! 🎂 Que seu dia seja repleto de luz, amor e momentos lindos — daqueles que dá vontade de eternizar numa foto. Com carinho, Alma Fotografia 💛`,
  (n) => `${n}, hoje é o seu dia! 🎉 A Alma Fotografia te deseja um aniversário cheio de alegria, abraços e boas memórias. Que venha um novo ano maravilhoso!`,
  (n) => `Parabéns, ${n}! 💛 Desejamos saúde, paz e muitos sorrisos. Foi um prazer fazer parte da sua história — e que venham muitos momentos especiais pela frente! 🎂`,
  (n) => `Feliz aniversário, ${n}! ✨ Que este novo ciclo traga realizações e instantes inesquecíveis. A gente adora registrar histórias como a sua. Um abraço da Alma! 💛`,
  (n) => `${n}, muitas felicidades! 🥳 Que seu dia seja tão especial quanto você. A Alma Fotografia te deseja um aniversário lindo e cheio de amor!`,
  (n) => `Parabéns pelo seu dia, ${n}! 🎈 Saúde, sorrisos e muito carinho hoje e sempre. E se quiser eternizar essa fase, você sabe onde a gente está 😉💛 — Alma Fotografia`,
]

// Mensagens de CONVITE/VENDA — para quem AINDA VAI fazer aniversário (data chegando).
const ANIVERSARIO_VENDA = [
  (n) => `Oi, ${n}! 💛 Seu aniversário está chegando, e essa data merece ser celebrada à altura! Que tal se presentear com um ensaio pra eternizar essa nova fase? A Alma adoraria te fotografar 📸✨`,
  (n) => `${n}, vem aí um dia muito especial! 🎂 Aniversário é o momento perfeito pra registrar quem você é hoje. Bora marcar um ensaio comemorativo? A gente cuida de tudo com carinho 💛`,
  (n) => `Olá, ${n}! ✨ Faltam poucos dias pro seu aniversário! Que tal renovar as suas fotos e ganhar de presente memórias lindas dessa fase? Me chama que montamos algo especial pra você 📸`,
  (n) => `${n}, seu niver tá logo ali! 🎉 Já pensou em comemorar com um ensaio só seu? É um presente que dura pra sempre. A Alma tem horários — quer dar uma olhada nas datas? 💛`,
  (n) => `Oi, ${n}! 🥳 Aproveita que seu aniversário está chegando pra se presentear com algo único: um ensaio pra celebrar você. Bora agendar e deixar essa data ainda mais especial? 📸💛`,
  (n) => `${n}, contagem regressiva pro seu dia! 🎈 Que tal marcar a passagem dessa fase com fotos incríveis? Ensaio de aniversário é puro amor-próprio. A Alma te espera de braços abertos 💛`,
]

// Dias até o PRÓXIMO aniversário (ignora o ano, vira mês/ano corretamente).
function diasAteAniversario(dataNasc, base) {
  const d = new Date(String(dataNasc).slice(0, 10) + 'T12:00')
  if (Number.isNaN(d.getTime())) return Infinity
  const hoje0 = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12)
  let prox = new Date(base.getFullYear(), d.getMonth(), d.getDate(), 12)
  if (prox < hoje0) prox = new Date(base.getFullYear() + 1, d.getMonth(), d.getDate(), 12)
  return Math.round((prox - hoje0) / 86400000)
}
const quando = (dias) => (dias === 0 ? 'Hoje! 🎉' : dias === 1 ? 'Amanhã' : `em ${dias} dias`)

export default function Visao({ setTab }) {
  const { clientes, galerias, agendamentos, contratos } = useApp()
  const [contas, setContas] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtroAniv, setFiltroAniv] = useState('15') // 7 | 15 | mes
  const [aniversarioCliente, setAniversarioCliente] = useState(null)

  useEffect(() => {
    let vivo = true
    Promise.all([fetchContasReceber(), fetchLancamentos()]).then(([cts, ls]) => {
      if (!vivo) return
      setContas(cts); setLancamentos(ls); setCarregando(false)
    })
    return () => { vivo = false }
  }, [galerias, agendamentos])

  const hoje = hojeISO()
  const agora = new Date()
  const noMes = (iso) => { if (!iso) return false; const d = new Date(String(iso).slice(0, 10) + 'T12:00'); return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear() }

  const galeriasAtivas = galerias.filter((g) => g.status !== 'pronto')
  const recebidoMes = lancamentos.filter((l) => l.tipo === 'entrada' && noMes(l.data)).reduce((s, l) => s + l.valor, 0)
  const aReceber = contas.filter((c) => c.status !== 'pago').reduce((s, c) => s + c.valor, 0)
  const reservasAConfirmar = agendamentos.filter((a) => a.status === 'a-confirmar' && (!a.dia || a.dia >= hoje)).length
  // O site não marca mais horário: quem pede contato por lá vira um ensaio
  // 'solicitado'. É ESSE o novo "me responde" — o que antes era reserva.
  const leadsDoSite = clientes.filter((c) =>
    (c.ensaios || []).some((e) => e.status === 'solicitado' && e.origem === 'site')
  )
  const contasVencidas = contas.filter((c) => c.status !== 'pago' && c.vencimento && c.vencimento < hoje)
  const selParaEditar = galerias.filter((g) => g.status === 'enviado')

  // Clientes COM ensaio e ainda SEM contrato ativo → criar/enviar contrato.
  const clientesSemContrato = clientes.filter((c) =>
    (c.ensaios || []).length > 0 &&
    !(contratos || []).some((ct) => ct.clienteId === c.id && ct.status !== 'cancelado')
  )

  // Aniversariantes — por dias até o próximo aniversário (vira mês/ano).
  const aniversariantes = clientes
    .filter((c) => c.dataNascimento)
    .map((c) => {
      const dias = diasAteAniversario(c.dataNascimento, agora)
      const d = new Date(c.dataNascimento + 'T12:00')
      return { ...c, _dias: dias, _dia: d.getDate(), _mes: d.getMonth() }
    })
    .sort((a, b) => a._dias - b._dias)
  const anivFiltrados = aniversariantes.filter((c) =>
    filtroAniv === 'mes' ? c._mes === agora.getMonth() : c._dias <= Number(filtroAniv)
  )

  const pendencias = [
    { n: contasVencidas.length, label: 'conta(s) vencida(s)', icon: AlertTriangle, tab: 'contas', cor: 'text-terracotta-400' },
    { n: selParaEditar.length, label: 'seleção(ões) p/ iniciar edição', icon: Wand2, tab: 'selecoes', cor: 'text-clay-300' },
    { n: reservasAConfirmar, label: 'reserva(s) p/ confirmar', icon: CalendarCheck, tab: 'agenda', cor: 'text-amber-300' },
    { n: leadsDoSite.length, label: 'pedido(s) de contato pelo site', icon: MessageCircle, tab: 'clientes', cor: 'text-emerald-300' },
  ].filter((p) => p.n > 0)

  const cards = [
    { label: 'Recebido no mês', valor: formatBRL(recebidoMes), icon: CircleDollarSign, trend: 'entradas' },
    { label: 'A receber', valor: formatBRL(aReceber), icon: Wallet, trend: 'pendente' },
    { label: 'Pedidos de contato', valor: leadsDoSite.length, icon: MessageCircle, trend: 'do site' },
    { label: 'Ensaios ativos', valor: galeriasAtivas.length, icon: TrendingUp, trend: selParaEditar.length + ' p/ editar' },
  ]

  return (
    <div>
      <h1 className="font-serif text-3xl">Olá, equipe 👋</h1>
      <p className="mt-1 text-sm text-cream-100/60">Resumo do que está acontecendo no estúdio.</p>

      {carregando && <div className="mt-4 flex items-center gap-2 text-xs text-cream-100/40"><Loader2 size={14} className="animate-spin" /> Atualizando dados…</div>}

      {/* Central de pendências */}
      {pendencias.length > 0 && (
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-terracotta-500/15 to-cocoa-900 p-5 ring-1 ring-terracotta-400/25">
          <p className="flex items-center gap-2 font-medium text-cream-100"><AlertTriangle size={16} className="text-terracotta-400" /> Precisa da sua atenção</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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

      {/* Ensaio sem contrato — criar/enviar contrato */}
      {clientesSemContrato.length > 0 && (
        <div className="mt-4 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-clay-400/30">
          <p className="flex items-center gap-2 font-medium text-cream-100"><FileSignature size={16} className="text-clay-300" /> Ensaio sem contrato — falar e contratar</p>
          <p className="mt-1 text-xs text-cream-100/50">Estes clientes têm ensaio mas ainda sem contrato 💛 Entre em contato e crie/envie o contrato.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {clientesSemContrato.map((c) => {
              const ens = (c.ensaios || [])[0] || {}
              const wa = waLink(c.telefone)
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-cocoa-950/50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-cream-100">{c.nome}</p>
                    <p className="truncate text-xs text-cream-100/50">{ens.titulo || 'Ensaio pelo site'}{ens.data ? ' · ' + new Date(ens.data + 'T12:00').toLocaleDateString('pt-BR') : ''}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {wa && <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp" className="grid h-8 w-8 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25"><MessageCircle size={15} /></a>}
                    <button onClick={() => setTab('contratos')} title="Criar contrato" className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-500/20 px-3 py-1.5 text-xs text-terracotta-300 ring-1 ring-terracotta-400/30 hover:bg-terracotta-500/30"><FileSignature size={13} /> Contrato</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
              <div className="flex items-center justify-between">
                <Icon size={17} className="text-terracotta-400" />
                <span className="text-[10px] uppercase tracking-wide text-cream-100/40">{c.trend}</span>
              </div>
              <p className="mt-2.5 font-serif text-2xl leading-none">{c.valor}</p>
              <p className="mt-1 text-xs text-cream-100/50">{c.label}</p>
            </div>
          )
        })}
      </div>

      {/* Aniversariantes (7 / 15 dias / mês) — clique p/ enviar carinho */}
      <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-medium text-cream-100"><Cake size={16} className="text-clay-300" /> Aniversariantes</p>
          <div className="flex gap-1.5">
            {[['7', 'Próx. 7 dias'], ['15', 'Próx. 15 dias'], ['mes', 'Do mês']].map(([id, lbl]) => (
              <button key={id} onClick={() => setFiltroAniv(id)} className={'rounded-full px-3 py-1.5 text-xs transition ' + (filtroAniv === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-950 text-cream-100/60 hover:text-cream-100')}>{lbl}</button>
            ))}
          </div>
        </div>
        {anivFiltrados.length === 0 ? (
          <p className="mt-3 text-sm text-cream-100/40">Ninguém faz aniversário {filtroAniv === 'mes' ? 'neste mês' : `nos próximos ${filtroAniv} dias`}.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {anivFiltrados.map((c) => (
              <button key={c.id} onClick={() => setAniversarioCliente(c)} className="flex items-center justify-between gap-3 rounded-xl bg-cocoa-950/50 px-4 py-3 text-left transition hover:bg-cocoa-950">
                <span className="flex min-w-0 items-center gap-3">
                  <span className={c.avatarGrad + ' grid h-8 w-8 shrink-0 place-items-center rounded-full font-serif text-xs text-cream-50'}>{c.nome.charAt(0)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-cream-100">{c.nome}</span>
                    <span className="block text-xs text-cream-100/50">{String(c._dia).padStart(2, '0')}/{String(c._mes + 1).padStart(2, '0')} · {quando(c._dias)}</span>
                  </span>
                </span>
                <span className={'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ' + (c._dias <= 7 ? 'bg-clay-500/20 text-clay-200' : 'bg-cocoa-800 text-cream-100/60')}><Gift size={12} /> {c._dias === 0 ? 'Parabéns' : 'Convidar'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ensaios em andamento (galerias reais) */}
      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-serif text-xl">Ensaios em andamento</h2>
        <button onClick={() => setTab('selecoes')} className="text-xs text-terracotta-400 hover:underline">Gerenciar seleções →</button>
      </div>
      {galeriasAtivas.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cocoa-900 p-5 text-sm text-cream-100/40 ring-1 ring-cream-100/10">Nenhum ensaio em andamento. Crie uma galeria em Galerias para começar.</p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {galeriasAtivas.map((g) => (
            <button key={g.id} onClick={() => setTab('selecoes')} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl bg-cocoa-900 p-4 text-left ring-1 ring-cream-100/10 transition hover:ring-terracotta-400/30">
              <div className="flex items-center gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-cocoa-950 text-terracotta-400"><Camera size={18} /></div>
                <div>
                  <p className="font-medium">{g.clienteNome || g.nome}</p>
                  <p className="text-sm text-cream-100/60">{g.nome} · {g.totalFotos} fotos</p>
                </div>
              </div>
              <span className={'rounded-full px-3 py-1.5 text-xs ' + statusCor(g.status)}>{statusLabel(g.status)}</span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {aniversarioCliente && (
          <MensagemModal
            titulo={aniversarioCliente._dias === 0 ? 'Feliz aniversário 🎂' : 'Convidar para um ensaio 🎂'}
            subtitulo={aniversarioCliente._dias === 0
              ? `Hoje é aniversário de ${aniversarioCliente.nome}! 🎉`
              : `${aniversarioCliente.nome} faz aniversário ${quando(aniversarioCliente._dias).toLowerCase()} — ótimo momento pra convidar para um ensaio.`}
            presets={(aniversarioCliente._dias === 0 ? ANIVERSARIO_HOJE : ANIVERSARIO_VENDA).map((fn) => fn(aniversarioCliente.nome.split(' ')[0]))}
            presetKey={aniversarioCliente._dias === 0 ? 'aniversario_hoje' : 'aniversario_venda'}
            cliente={aniversarioCliente}
            assunto={aniversarioCliente._dias === 0 ? 'Feliz aniversário! 🎂 — Alma Fotografia' : 'Seu aniversário está chegando! 🎂 — Alma Fotografia'}
            onClose={() => setAniversarioCliente(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
