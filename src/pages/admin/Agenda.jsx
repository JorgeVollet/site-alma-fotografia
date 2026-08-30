// AGENDA (Bloco 22) — uma agenda só, para tudo que tem data.
//
// A anterior lia apenas `agendamentos` (as reservas do site). Como o site
// deixou de marcar horário, ela vivia vazia — o estúdio marcava o ensaio na
// ficha do cliente e o calendário não sabia de nada.
//
// Agora junta quatro fontes num calendário estilo Google Calendar:
//   • ENSAIOS marcados (mês/semana/dia, com a duração real)
//   • COMPROMISSOS livres criados aqui (reunião, entrega, bloqueio, pessoal)
//   • ANIVERSÁRIOS dos clientes (oportunidade de venda que o Maurício valoriza)
//   • CONTAS a vencer
//
// Arrastar move a data DE VERDADE (grava no banco). Clicar abre o que aquele
// item controla — é a costura: o calendário não é uma tela morta de consulta.
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import ptBr from '@fullcalendar/core/locales/pt-br'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Check, Plus, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatBRL } from '../../components/Money'
import { fetchEventos, criarEvento, atualizarEvento, excluirEvento, CORES_EVENTO, corDoTipo } from '../../lib/eventos'
import { fetchContasReceber } from '../../lib/galerias'
import { atualizarEnsaio } from '../../lib/ensaios'

const TIPOS = ['reuniao', 'entrega', 'bloqueio', 'pessoal', 'evento']

// junta 'YYYY-MM-DD' + 'HH:MM' num Date local (sem susto de fuso)
function juntar(data, hora) {
  const d = String(data).slice(0, 10)
  const h = hora && /^\d{2}:\d{2}/.test(hora) ? hora.slice(0, 5) : '09:00'
  return new Date(d + 'T' + h + ':00')
}
const paraISO = (d) => new Date(d).toISOString()
const dp = (n) => String(n).padStart(2, '0')

export default function Agenda() {
  const { clientes, recarregarCRM } = useApp()
  const calRef = useRef(null)
  const [eventos, setEventos] = useState([])
  const [contas, setContas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [editor, setEditor] = useState(null)   // compromisso em edição, ou {novo:true}
  const [detalhe, setDetalhe] = useState(null) // ensaio / aniversário / conta clicado
  const [mostrar, setMostrar] = useState({ ensaio: true, compromisso: true, aniversario: true, conta: true })

  const recarregar = useCallback(async () => {
    setCarregando(true)
    const [evs, cts] = await Promise.all([fetchEventos(), fetchContasReceber()])
    setEventos(evs)
    setContas(cts)
    setCarregando(false)
  }, [])
  useEffect(() => { recarregar() }, [recarregar])

  // ── as quatro fontes viram eventos do calendário ──
  const items = useMemo(() => {
    const out = []

    if (mostrar.ensaio) {
      for (const c of clientes) {
        for (const e of c.ensaios || []) {
          if (!e.data || ['solicitado', 'orcamento', 'cancelado'].includes(e.status)) continue
          const ini = juntar(e.data, e.hora)
          const dur = Number(e.duracaoMin) > 0 ? Number(e.duracaoMin) : 120
          out.push({
            id: 'ensaio:' + e.id,
            title: c.nome + ' · ' + (e.titulo || 'Ensaio'),
            start: ini,
            end: new Date(ini.getTime() + dur * 60000),
            allDay: !e.hora,
            backgroundColor: e.cor || corDoTipo('ensaio'),
            borderColor: e.cor || corDoTipo('ensaio'),
            extendedProps: { fonte: 'ensaio', ensaio: e, cliente: c },
          })
        }
      }
    }

    if (mostrar.compromisso) {
      for (const ev of eventos) {
        out.push({
          id: 'evento:' + ev.id,
          title: ev.titulo,
          start: ev.inicio,
          end: ev.fim || undefined,
          allDay: ev.diaInteiro,
          backgroundColor: ev.cor,
          borderColor: ev.cor,
          extendedProps: { fonte: 'evento', evento: ev },
        })
      }
    }

    // aniversários deste ano e do próximo (o calendário navega adiante)
    if (mostrar.aniversario) {
      const anoBase = new Date().getFullYear()
      for (const c of clientes) {
        if (!c.dataNascimento) continue
        const n = new Date(String(c.dataNascimento).slice(0, 10) + 'T12:00')
        if (Number.isNaN(n.getTime())) continue
        for (const ano of [anoBase, anoBase + 1]) {
          out.push({
            id: 'aniv:' + c.id + ':' + ano,
            title: '🎂 ' + c.nome,
            start: new Date(ano, n.getMonth(), n.getDate()),
            allDay: true,
            backgroundColor: corDoTipo('aniversario'),
            borderColor: corDoTipo('aniversario'),
            editable: false,           // aniversário não se arrasta
            extendedProps: { fonte: 'aniversario', cliente: c },
          })
        }
      }
    }

    if (mostrar.conta) {
      for (const ct of contas) {
        if (!ct.vencimento || ct.status === 'pago') continue
        out.push({
          id: 'conta:' + ct.id,
          title: '💰 ' + formatBRL(ct.valor) + ' · ' + (ct.descricao || 'a receber'),
          start: new Date(String(ct.vencimento).slice(0, 10) + 'T12:00'),
          allDay: true,
          backgroundColor: corDoTipo('conta'),
          borderColor: corDoTipo('conta'),
          editable: false,
          extendedProps: { fonte: 'conta', conta: ct },
        })
      }
    }

    return out
  }, [clientes, eventos, contas, mostrar])

  // ── arrastar/redimensionar: grava a data nova na FONTE certa ──
  const aoMover = async (info) => {
    const { fonte, ensaio, evento } = info.event.extendedProps
    const d = info.event.start
    if (fonte === 'ensaio') {
      const data = d.getFullYear() + '-' + dp(d.getMonth() + 1) + '-' + dp(d.getDate())
      const hora = info.event.allDay ? ensaio.hora : dp(d.getHours()) + ':' + dp(d.getMinutes())
      let duracaoMin = ensaio.duracaoMin
      if (info.event.end && !info.event.allDay) {
        duracaoMin = Math.max(15, Math.round((info.event.end - d) / 60000))
      }
      const r = await atualizarEnsaio(ensaio.id, { data, hora: hora || null, duracaoMin })
      if (!r) { info.revert(); return }
      if (recarregarCRM) recarregarCRM()
    } else if (fonte === 'evento') {
      const r = await atualizarEvento(evento.id, {
        inicio: paraISO(d),
        fim: info.event.end ? paraISO(info.event.end) : null,
        diaInteiro: info.event.allDay,
      })
      if (!r || r.erro) { info.revert(); return }
      await recarregar()
    } else {
      info.revert()   // aniversário e conta não se movem por aqui
    }
  }

  const aoClicar = (info) => {
    const p = info.event.extendedProps
    if (p.fonte === 'evento') setEditor(p.evento)
    else setDetalhe({ ...p, titulo: info.event.title, inicio: info.event.start })
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Agenda</h1>
          <p className="mt-1 text-sm text-cream-100/60">
            Tudo do estúdio num lugar só. Arraste para remarcar, clique para abrir.
          </p>
        </div>
        <button onClick={() => setEditor({ novo: true, inicio: new Date() })} className="btn-light !py-2.5 text-xs">
          <Plus size={15} /> Novo compromisso
        </button>
      </div>

      {/* Legenda que também filtra */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[
          ['ensaio', 'Ensaios', corDoTipo('ensaio')],
          ['compromisso', 'Compromissos', corDoTipo('evento')],
          ['aniversario', 'Aniversários', corDoTipo('aniversario')],
          ['conta', 'Contas a vencer', corDoTipo('conta')],
        ].map(([k, label, cor]) => (
          <button
            key={k}
            onClick={() => setMostrar((m) => ({ ...m, [k]: !m[k] }))}
            className={'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1 transition ' +
              (mostrar[k] ? 'bg-cocoa-800 text-cream-100 ring-cream-100/20' : 'bg-cocoa-950 text-cream-100/35 ring-cream-100/10')}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: mostrar[k] ? cor : 'transparent', border: '1px solid ' + cor }} />
            {label}
          </button>
        ))}
        {carregando && <span className="inline-flex items-center gap-1.5 text-xs text-cream-100/40"><Loader2 size={13} className="animate-spin" /> carregando…</span>}
      </div>

      <div className="agenda-fc mt-5 rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBr}
          headerToolbar={{
            left: 'prev,next hoje',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
          }}
          customButtons={{ hoje: { text: 'hoje', click: () => calRef.current && calRef.current.getApi().today() } }}
          buttonText={{ month: 'Mês', week: 'Semana', day: 'Dia', list: 'Lista' }}
          events={items}
          editable
          eventDrop={aoMover}
          eventResize={aoMover}
          eventClick={aoClicar}
          dateClick={(info) => setEditor({ novo: true, inicio: info.date, diaInteiro: info.allDay })}
          height="auto"
          nowIndicator
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          dayMaxEvents={4}
          noEventsText="Nada marcado neste período"
        />
      </div>

      <AnimatePresence>
        {editor && (
          <EditorEvento
            key="editor"
            evento={editor.novo ? null : editor}
            inicioSugerido={editor.inicio}
            diaInteiroSugerido={editor.diaInteiro}
            clientes={clientes}
            onClose={() => setEditor(null)}
            onSalvo={async () => { setEditor(null); await recarregar() }}
          />
        )}
        {detalhe && <DetalheItem key="detalhe" item={detalhe} onClose={() => setDetalhe(null)} />}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- Editor de compromisso ---------------- */
function EditorEvento({ evento, inicioSugerido, diaInteiroSugerido, clientes, onClose, onSalvo }) {
  const paraInput = (d) => {
    const x = new Date(d)
    return x.getFullYear() + '-' + dp(x.getMonth() + 1) + '-' + dp(x.getDate()) + 'T' + dp(x.getHours()) + ':' + dp(x.getMinutes())
  }
  const [titulo, setTitulo] = useState(evento ? evento.titulo : '')
  const [descricao, setDescricao] = useState(evento ? evento.descricao : '')
  const [tipo, setTipo] = useState(evento ? evento.tipo : 'reuniao')
  const [inicio, setInicio] = useState(paraInput(evento ? evento.inicio : (inicioSugerido || new Date())))
  const [fim, setFim] = useState(evento && evento.fim ? paraInput(evento.fim) : '')
  const [diaInteiro, setDiaInteiro] = useState(evento ? evento.diaInteiro : !!diaInteiroSugerido)
  const [clienteId, setClienteId] = useState(evento ? evento.clienteId || '' : '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'
  const valido = titulo.trim() && inicio

  const salvar = async () => {
    if (!valido || salvando) return
    setSalvando(true)
    setErro('')
    const campos = {
      titulo: titulo.trim(), descricao, tipo,
      inicio: new Date(inicio).toISOString(),
      fim: fim ? new Date(fim).toISOString() : null,
      diaInteiro, clienteId: clienteId || null,
      cor: corDoTipo(tipo),
    }
    const r = evento ? await atualizarEvento(evento.id, campos) : await criarEvento(campos)
    setSalvando(false)
    if (!r || r.erro) { setErro((r && r.erro) || 'Não foi possível salvar.'); return }
    onSalvo()
  }

  const remover = async () => {
    if (!evento) return
    if (!window.confirm('Excluir este compromisso da agenda?')) return
    await excluirEvento(evento.id)
    onSalvo()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{evento ? 'Editar compromisso' : 'Novo compromisso'}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">O que é</span>
            <input className={inp} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Reunião com a gráfica" />
          </label>

          <label className="block"><span className="text-sm text-cream-100/80">Tipo (define a cor)</span>
            <select className={inp} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => <option key={t} value={t}>{CORES_EVENTO[t].nome}</option>)}
            </select>
            <span className="mt-2 flex items-center gap-2 text-xs text-cream-100/45">
              <span className="h-3 w-3 rounded-full" style={{ background: corDoTipo(tipo) }} /> aparece assim no calendário
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-cream-100/80">
            <input type="checkbox" checked={diaInteiro} onChange={(e) => setDiaInteiro(e.target.checked)} className="h-4 w-4 accent-terracotta-500" />
            Dia inteiro
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Começa</span>
              <input type="datetime-local" className={inp} value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </label>
            <label className="block"><span className="text-sm text-cream-100/80">Termina <span className="text-cream-100/40">(opcional)</span></span>
              <input type="datetime-local" className={inp} value={fim} onChange={(e) => setFim(e.target.value)} />
            </label>
          </div>

          <label className="block"><span className="text-sm text-cream-100/80">Cliente <span className="text-cream-100/40">(opcional)</span></span>
            <select className={inp} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Nenhum</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>

          <label className="block"><span className="text-sm text-cream-100/80">Detalhes</span>
            <textarea rows={2} className={inp} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Anotações..." />
          </label>
        </div>

        {erro && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-300 ring-1 ring-red-400/30">{erro}</p>}

        <div className="mt-6 flex gap-2">
          {evento && (
            <button onClick={remover} className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-4 py-2.5 text-xs text-red-300 ring-1 ring-red-400/25 hover:bg-red-500/25">
              <Trash2 size={14} /> Excluir
            </button>
          )}
          <button onClick={salvar} disabled={!valido || salvando} className="btn-light flex-1 !py-2.5 text-xs disabled:opacity-40">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------------- Detalhe de ensaio / aniversário / conta ---------------- */
function DetalheItem({ item, onClose }) {
  const { fonte, ensaio, cliente, conta } = item
  const quando = item.inicio
    ? new Date(item.inicio).toLocaleString('pt-BR',
        fonte === 'ensaio' && ensaio && ensaio.hora
          ? { dateStyle: 'full', timeStyle: 'short' }
          : { dateStyle: 'full' })
    : '—'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-cream-100/40">
              {fonte === 'ensaio' ? 'Ensaio' : fonte === 'aniversario' ? 'Aniversário' : 'Conta a receber'}
            </p>
            <h3 className="font-serif text-2xl">{item.titulo}</h3>
          </div>
          <button onClick={onClose} className="shrink-0 text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        <div className="mt-4 rounded-2xl bg-cocoa-950 p-4 text-sm">
          <Linha k="Quando" v={quando} />
          {fonte === 'ensaio' && (
            <>
              <Linha k="Cliente" v={cliente && cliente.nome} />
              {ensaio && ensaio.hora && <Linha k="Horário" v={ensaio.hora} />}
              {ensaio && ensaio.duracaoMin && <Linha k="Duração" v={ensaio.duracaoMin + ' min'} />}
              {ensaio && ensaio.local && <Linha k="Local" v={ensaio.local} />}
              <Linha k="Valor" v={formatBRL((ensaio && ensaio.valor) || 0)} />
            </>
          )}
          {fonte === 'aniversario' && <Linha k="Cliente" v={cliente && cliente.nome} />}
          {fonte === 'conta' && (
            <>
              <Linha k="Valor" v={formatBRL((conta && conta.valor) || 0)} />
              <Linha k="Situação" v={conta && conta.status === 'pago' ? 'Recebido' : 'A receber'} />
            </>
          )}
        </div>

        <p className="mt-4 text-[11px] text-cream-100/40">
          {fonte === 'ensaio' && 'Arraste no calendário para remarcar. Para editar valor, situação e cobranças, abra este ensaio na ficha do cliente.'}
          {fonte === 'aniversario' && 'As mensagens de aniversário ficam na Visão geral, com modelos prontos.'}
          {fonte === 'conta' && 'Para receber ou reabrir, vá em Contas a pagar/receber.'}
        </p>
      </motion.div>
    </motion.div>
  )
}

function Linha({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-cream-100/5 py-1.5 last:border-0">
      <span className="shrink-0 text-cream-100/45">{k}</span>
      <span className="text-right text-cream-100/85">{v || '—'}</span>
    </div>
  )
}
