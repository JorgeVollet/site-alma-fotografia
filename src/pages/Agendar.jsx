import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ArrowRight, ArrowLeft, Calendar, Clock, User, Mail, Phone,
  CreditCard, QrCode, ShieldCheck, PartyPopper, Camera, Copy,
} from 'lucide-react'
import PageHero from '../components/PageHero'
import { formatBRL } from '../components/Money'
import { PACOTES, SERVICOS } from '../data/studio'
import { useApp } from '../context/AppContext'

const STEPS = ['Pacote', 'Data & Hora', 'Seus dados', 'Reserva', 'Pronto']
const HORARIOS = ['09:00', '10:30', '14:00', '15:30', '17:00']

export default function Agendar() {
  const [params] = useSearchParams()
  const { adicionarAgendamento } = useApp()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    pacote: params.get('pacote') || 'memorias',
    servico: 'familia',
    dia: '',
    hora: '',
    nome: '',
    email: '',
    telefone: '',
    pagamento: 'pix',
  })

  const pacoteSel = PACOTES.find((p) => p.id === data.pacote) || PACOTES[1]
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }))

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const podeAvancar = () => {
    if (step === 0) return !!data.pacote && !!data.servico
    if (step === 1) return !!data.dia && !!data.hora
    if (step === 2) return data.nome.trim() && data.email.includes('@') && data.telefone.length >= 8
    return true
  }

  const finalizar = () => {
    adicionarAgendamento({
      ...data,
      pacoteNome: pacoteSel.nome,
      valorReserva: pacoteSel.reserva,
      valorTotal: pacoteSel.preco,
      status: 'reserva-paga',
    })
    next()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <PageHero
        n="05"
        eyebrow="Agendamento online"
        titulo="Garanta a sua"
        destaque="data agora"
        sub="Em poucos passos você escolhe o pacote, marca o melhor horário e reserva. Simples assim."
        gradient="ph-gradient-3"
      />

      <section className="bg-cream-100 py-16 md:py-24">
        <div className="container-c mx-auto max-w-3xl">
          {/* Stepper */}
          <div className="mb-12 flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-full text-sm font-medium transition-all duration-400 ${
                      i < step
                        ? 'bg-clay-400 text-cream-50'
                        : i === step
                        ? 'bg-cocoa-800 text-cream-50 ring-4 ring-cocoa-800/10'
                        : 'bg-cream-300 text-cocoa-500'
                    }`}
                  >
                    {i < step ? <Check size={17} /> : i + 1}
                  </div>
                  <span className={`hidden text-[11px] uppercase tracking-wide sm:block ${i === step ? 'text-cocoa-800' : 'text-cocoa-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 h-px flex-1 transition-colors duration-500 ${i < step ? 'bg-clay-400' : 'bg-cream-300'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-cream-50 p-7 shadow-sm ring-1 ring-cocoa-800/5 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && <StepPacote data={data} set={set} />}
                {step === 1 && <StepData data={data} set={set} />}
                {step === 2 && <StepDados data={data} set={set} />}
                {step === 3 && <StepReserva data={data} set={set} pacote={pacoteSel} />}
                {step === 4 && <StepPronto data={data} pacote={pacoteSel} />}
              </motion.div>
            </AnimatePresence>

            {/* Navegação */}
            {step < 4 && (
              <div className="mt-9 flex items-center justify-between border-t border-cocoa-800/5 pt-6">
                {step > 0 ? (
                  <button onClick={back} className="inline-flex items-center gap-2 text-sm text-cocoa-500 hover:text-cocoa-800">
                    <ArrowLeft size={16} /> Voltar
                  </button>
                ) : <span />}
                {step < 3 ? (
                  <button
                    onClick={next}
                    disabled={!podeAvancar()}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar <ArrowRight size={16} />
                  </button>
                ) : (
                  <button onClick={finalizar} className="btn-primary">
                    <ShieldCheck size={16} /> Confirmar reserva de {formatBRL(pacoteSel.reserva)}
                  </button>
                )}
              </div>
            )}
          </div>

          {step < 4 && (
            <p className="mt-5 text-center text-xs text-cocoa-400">
              🔒 Ambiente de demonstração — nenhum pagamento real é processado.
            </p>
          )}
        </div>
      </section>
    </motion.div>
  )
}

/* ---- Passo 1: Pacote + serviço ---- */
function StepPacote({ data, set }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-cocoa-800">Qual ensaio você deseja?</h2>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {SERVICOS.map((s) => (
          <button
            key={s.id}
            onClick={() => set('servico', s.id)}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
              data.servico === s.id
                ? 'border-cocoa-800 bg-cocoa-800 text-cream-50'
                : 'border-cocoa-800/10 bg-cream-100 text-cocoa-700 hover:border-clay-400'
            }`}
          >
            {s.nome}
          </button>
        ))}
      </div>

      <h2 className="mt-8 font-serif text-2xl text-cocoa-800">Escolha o pacote</h2>
      <div className="mt-5 space-y-3">
        {PACOTES.map((p) => (
          <button
            key={p.id}
            onClick={() => set('pacote', p.id)}
            className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
              data.pacote === p.id
                ? 'border-cocoa-800 bg-cocoa-800/5 ring-1 ring-cocoa-800'
                : 'border-cocoa-800/10 hover:border-clay-400'
            }`}
          >
            <div>
              <p className="font-serif text-lg text-cocoa-800">{p.nome}</p>
              <p className="text-xs text-clay-500">{p.ideal}</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-xl text-cocoa-800">{formatBRL(p.preco)}</p>
              <p className="text-xs text-cocoa-500">reserva {formatBRL(p.reserva)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---- Passo 2: Data e hora ---- */
function StepData({ data, set }) {
  const { horariosLivres, diasBloqueados } = useApp()
  // próximos dias (exceto domingos e dias bloqueados pelo estúdio)
  const dias = []
  const hoje = new Date()
  for (let i = 1; dias.length < 12 && i < 40; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    if (d.getDay() === 0) continue
    dias.push(d)
  }
  const fmt = (d) => d.toISOString().slice(0, 10)
  const label = (d) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

  const livres = data.dia ? horariosLivres(data.dia) : []

  return (
    <div>
      <h2 className="font-serif text-2xl text-cocoa-800">Escolha a melhor data</h2>
      <p className="mt-1 text-sm text-cocoa-500">Mostramos apenas as datas e horários realmente disponíveis na agenda do estúdio.</p>
      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {dias.map((d) => {
          const v = fmt(d)
          const bloqueado = diasBloqueados.includes(v)
          return (
            <button
              key={v}
              onClick={() => { if (!bloqueado) { set('dia', v); set('hora', '') } }}
              disabled={bloqueado}
              className={`rounded-xl border p-3 text-center text-sm capitalize transition-all ${
                bloqueado
                  ? 'cursor-not-allowed border-cocoa-800/5 text-cocoa-300 line-through'
                  : data.dia === v
                  ? 'border-cocoa-800 bg-cocoa-800 text-cream-50'
                  : 'border-cocoa-800/10 hover:border-clay-400'
              }`}
            >
              {label(d)}
            </button>
          )
        })}
      </div>

      {data.dia && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="mt-8 flex items-center gap-2 font-serif text-2xl text-cocoa-800">
            <Clock size={20} className="text-clay-400" /> Horário
          </h2>
          {livres.length === 0 ? (
            <p className="mt-4 rounded-xl bg-cream-200 p-4 text-sm text-cocoa-500">
              Nenhum horário livre neste dia. Escolha outra data ou fale com a gente.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {livres.map((h) => (
                <button
                  key={h}
                  onClick={() => set('hora', h)}
                  className={`rounded-full border px-5 py-2.5 text-sm transition-all ${
                    data.hora === h
                      ? 'border-cocoa-800 bg-cocoa-800 text-cream-50'
                      : 'border-cocoa-800/10 hover:border-clay-400'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

/* ---- Passo 3: Dados do cliente ---- */
function StepDados({ data, set }) {
  const field = 'mt-1.5 w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm text-cocoa-800 outline-none transition focus:border-cocoa-800 focus:ring-1 focus:ring-cocoa-800'
  return (
    <div>
      <h2 className="font-serif text-2xl text-cocoa-800">Seus dados de contato</h2>
      <p className="mt-1 text-sm text-cocoa-500">Para confirmarmos seu agendamento.</p>
      <div className="mt-6 space-y-5">
        <label className="block">
          <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700"><User size={15} /> Nome completo</span>
          <input className={field} value={data.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Como podemos te chamar?" />
        </label>
        <label className="block">
          <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700"><Mail size={15} /> E-mail</span>
          <input type="email" className={field} value={data.email} onChange={(e) => set('email', e.target.value)} placeholder="seu@email.com" />
        </label>
        <label className="block">
          <span className="flex items-center gap-2 text-sm font-medium text-cocoa-700"><Phone size={15} /> Telefone / WhatsApp</span>
          <input className={field} value={data.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(55) 9 9999-9999" />
        </label>
      </div>
    </div>
  )
}

/* ---- Passo 4: Reserva / pagamento ---- */
function StepReserva({ data, set, pacote }) {
  const dataFmt = data.dia ? new Date(data.dia + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''
  return (
    <div>
      <h2 className="font-serif text-2xl text-cocoa-800">Confirme e reserve</h2>

      {/* Resumo */}
      <div className="mt-5 rounded-2xl bg-cream-200 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-cocoa-500">Pacote</span>
          <span className="font-medium text-cocoa-800">{pacote.nome}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-cocoa-500">Data & hora</span>
          <span className="font-medium capitalize text-cocoa-800">{dataFmt} · {data.hora}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-cocoa-500">Valor total do pacote</span>
          <span className="font-medium text-cocoa-800">{formatBRL(pacote.preco)}</span>
        </div>
        <div className="my-3 border-t border-cocoa-800/10" />
        <div className="flex items-center justify-between">
          <span className="font-medium text-cocoa-800">Reserva a pagar agora</span>
          <span className="font-serif text-2xl text-terracotta-500">{formatBRL(pacote.reserva)}</span>
        </div>
        <p className="mt-1 text-xs text-cocoa-400">Restante de {formatBRL(pacote.preco - pacote.reserva)} no dia do ensaio.</p>
      </div>

      {/* Método */}
      <h3 className="mt-7 font-medium text-cocoa-700">Forma de pagamento da reserva</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          { id: 'pix', label: 'PIX', icon: QrCode },
          { id: 'cartao', label: 'Cartão', icon: CreditCard },
        ].map((m) => {
          const Icon = m.icon
          return (
            <button
              key={m.id}
              onClick={() => set('pagamento', m.id)}
              className={`flex items-center justify-center gap-2 rounded-xl border py-4 text-sm font-medium transition-all ${
                data.pagamento === m.id
                  ? 'border-cocoa-800 bg-cocoa-800 text-cream-50'
                  : 'border-cocoa-800/10 text-cocoa-700 hover:border-clay-400'
              }`}
            >
              <Icon size={18} /> {m.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {data.pagamento === 'pix' ? (
          <motion.div key="pix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 flex flex-col items-center rounded-2xl bg-cream-200 p-6">
            <div className="grid h-36 w-36 place-items-center rounded-xl bg-cream-50 p-3 ring-1 ring-cocoa-800/10">
              <QrFake />
            </div>
            <p className="mt-3 text-xs text-cocoa-500">Escaneie o QR Code (simulado)</p>
            <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-cream-50 px-4 py-2 text-xs text-cocoa-600 ring-1 ring-cocoa-800/10">
              <Copy size={13} /> Copiar código PIX
            </button>
          </motion.div>
        ) : (
          <motion.div key="cartao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 space-y-3">
            <input className="w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="Número do cartão" />
            <div className="grid grid-cols-2 gap-3">
              <input className="rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="MM/AA" />
              <input className="rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="CVV" />
            </div>
            <input className="w-full rounded-xl border border-cocoa-800/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-cocoa-800" placeholder="Nome impresso no cartão" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---- Passo 5: Sucesso ---- */
function StepPronto({ data, pacote }) {
  const dataFmt = data.dia ? new Date(data.dia + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''
  return (
    <div className="py-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 160 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-clay-400 text-cream-50"
      >
        <Check size={40} />
      </motion.div>
      <h2 className="mt-6 font-serif text-3xl text-cocoa-800">Reserva confirmada! 🎉</h2>
      <p className="mx-auto mt-3 max-w-md font-sans font-light text-cocoa-600">
        Obrigado, <strong className="font-medium">{data.nome.split(' ')[0]}</strong>! Sua data está garantida.
        Enviamos os detalhes para <strong className="font-medium">{data.email}</strong>.
      </p>
      <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-cream-200 p-5 text-left text-sm">
        <Row k="Ensaio" v={pacote.nome} />
        <Row k="Quando" v={`${dataFmt} · ${data.hora}`} />
        <Row k="Reserva paga" v={formatBRL(pacote.reserva)} />
        <Row k="A pagar no dia" v={formatBRL(pacote.preco - pacote.reserva)} />
      </div>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link to="/cliente" className="btn-primary"><Camera size={16} /> Ir para Área do Cliente</Link>
        <Link to="/" className="btn-outline">Voltar ao início</Link>
      </div>
      <p className="mt-6 text-xs text-cocoa-400">
        💡 No demo, este agendamento já aparece no <Link to="/admin" className="underline">Painel do Admin</Link>.
      </p>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between border-b border-cocoa-800/5 py-2 last:border-0">
      <span className="text-cocoa-500">{k}</span>
      <span className="font-medium capitalize text-cocoa-800">{v}</span>
    </div>
  )
}

// QR Code decorativo (fake)
function QrFake() {
  const cells = Array.from({ length: 121 }, (_, i) => (i * 7 + 3) % 3 === 0)
  return (
    <div className="grid grid-cols-11 gap-px">
      {cells.map((on, i) => (
        <div key={i} className={`h-2.5 w-2.5 ${on ? 'bg-cocoa-900' : 'bg-transparent'}`} />
      ))}
    </div>
  )
}
