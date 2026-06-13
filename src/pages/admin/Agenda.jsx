import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronLeft, ChevronRight, Ban, Clock, Plus, Trash2, Check } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { useApp } from '../../context/AppContext'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Agenda() {
  const { agendamentos, diasBloqueados, horariosBloqueados, toggleDiaBloqueado, toggleHorarioBloqueado, horariosDoDia, adicionarHorario, editarHorario, removerHorario, bufferAntes, bufferDepois, setBuffer } = useApp()
  const [ref, setRef] = useState(new Date('2026-06-10T12:00'))
  const [diaSel, setDiaSel] = useState(null)

  const ano = ref.getFullYear()
  const mes = ref.getMonth()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()
  const hojeStr = '2026-06-10'

  const fmt = (d) => ano + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
  const agsDoDia = (ds) => agendamentos.filter((a) => a.dia === ds)

  const celulas = []
  for (let i = 0; i < primeiroDia; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d)

  return (
    <div>
      <h1 className="font-serif text-3xl">Agendamentos & disponibilidade</h1>
      <p className="mt-1 text-sm text-cream-100/60">Clique num dia para gerenciar horários. Bloqueie datas e o site esconde os horários ocupados automaticamente.</p>

      {/* BUFFER — bloqueio automático antes/depois de cada ensaio */}
      <div className="mt-5 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
        <h3 className="font-serif text-lg">Intervalo entre ensaios</h3>
        <p className="mt-1 max-w-2xl text-sm text-cream-100/55">
          Defina quantas horas bloquear <strong>antes</strong> e <strong>depois</strong> de cada reserva. Assim, ao reservar um horário, os horários vizinhos somem automaticamente do site — sem ensaios colados.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-cream-100/50">Bloquear antes</span>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" max="6" step="0.5"
                value={bufferAntes}
                onChange={(e) => setBuffer(e.target.value, bufferDepois)}
                className="w-20 rounded-lg bg-cocoa-950 px-3 py-2 text-cream-100 ring-1 ring-cream-100/15 focus:ring-clay-400 focus:outline-none"
              />
              <span className="text-sm text-cream-100/60">horas</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wide text-cream-100/50">Bloquear depois</span>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" max="6" step="0.5"
                value={bufferDepois}
                onChange={(e) => setBuffer(bufferAntes, e.target.value)}
                className="w-20 rounded-lg bg-cocoa-950 px-3 py-2 text-cream-100 ring-1 ring-cream-100/15 focus:ring-clay-400 focus:outline-none"
              />
              <span className="text-sm text-cream-100/60">horas</span>
            </div>
          </label>
          <p className="text-sm text-clay-300">
            Ex: reserva às 09:00 → bloqueia {bufferAntes}h antes e {bufferDepois}h depois.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Calendário */}
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-xl">{MESES[mes]} {ano}</h3>
            <div className="flex gap-1">
              <button onClick={() => setRef(new Date(ano, mes - 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-cocoa-950 text-cream-100/70 hover:text-cream-100"><ChevronLeft size={16} /></button>
              <button onClick={() => setRef(new Date(ano, mes + 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg bg-cocoa-950 text-cream-100/70 hover:text-cream-100"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d, i) => <div key={i} className="py-1 text-xs text-cream-100/40">{d}</div>)}
            {celulas.map((d, i) => {
              if (!d) return <div key={i} />
              const ds = fmt(d)
              const bloqueado = diasBloqueados.includes(ds)
              const temAg = agsDoDia(ds).length > 0
              const ehHoje = ds === hojeStr
              const dom = new Date(ano, mes, d).getDay() === 0
              return (
                <button
                  key={i}
                  onClick={() => setDiaSel(ds)}
                  className={'relative aspect-square rounded-lg text-sm transition ' +
                    (diaSel === ds ? 'ring-2 ring-terracotta-400 ' : '') +
                    (bloqueado ? 'bg-cocoa-950 text-cream-100/25 line-through' : dom ? 'bg-cocoa-950/50 text-cream-100/40' : 'bg-cocoa-800 text-cream-100 hover:bg-cocoa-700') +
                    (ehHoje ? ' font-bold text-terracotta-400' : '')}
                >
                  {d}
                  {temAg && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-terracotta-400" />}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-cream-100/10 pt-3 text-xs text-cream-100/50">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-terracotta-400" /> com agendamento</span>
            <span className="flex items-center gap-1.5"><Ban size={11} /> dia bloqueado</span>
          </div>
        </div>

        {/* Painel do dia selecionado */}
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          {!diaSel ? (
            <div className="grid h-full min-h-[200px] place-items-center text-center text-sm text-cream-100/40">
              <div><Calendar size={28} className="mx-auto mb-3 text-cream-100/30" /> Selecione um dia no calendário</div>
            </div>
          ) : (
            <DiaPainel
              ds={diaSel}
              bloqueado={diasBloqueados.includes(diaSel)}
              horariosBloq={horariosBloqueados[diaSel] || []}
              ags={agsDoDia(diaSel)}
              horarios={horariosDoDia(diaSel)}
              onToggleDia={() => toggleDiaBloqueado(diaSel)}
              onToggleHora={(h) => toggleHorarioBloqueado(diaSel, h)}
              onEditarHora={(antiga, nova) => editarHorario(diaSel, antiga, nova)}
              onAdicionarHora={(h) => adicionarHorario(diaSel, h)}
              onRemoverHora={(h) => removerHorario(diaSel, h)}
            />
          )}
        </div>
      </div>

      {/* Lista de agendamentos do site */}
      <h3 className="mt-8 font-serif text-xl">Reservas feitas no site</h3>
      {agendamentos.length === 0 ? (
        <div className="mt-3 rounded-2xl bg-cocoa-900 p-8 text-center ring-1 ring-cream-100/10">
          <Calendar size={28} className="mx-auto text-cream-100/30" />
          <p className="mt-3 text-sm text-cream-100/60">Nenhuma reserva ainda. Faça um teste em <Link to="/agendar" className="text-terracotta-400 underline">Agendar</Link>.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
          <table className="w-full text-sm">
            <thead className="bg-cocoa-900 text-left text-xs uppercase tracking-wide text-cream-100/40">
              <tr><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Ensaio</th><th className="hidden px-5 py-3 md:table-cell">Data</th><th className="px-5 py-3">Reserva</th></tr>
            </thead>
            <tbody className="divide-y divide-cream-100/5">
              {agendamentos.map((a) => (
                <tr key={a.id} className="bg-cocoa-900/40 hover:bg-cocoa-900">
                  <td className="px-5 py-4"><p className="font-medium">{a.nome}</p><p className="text-xs text-cream-100/40">{a.telefone}</p></td>
                  <td className="px-5 py-4">{a.pacoteNome}</td>
                  <td className="hidden px-5 py-4 capitalize md:table-cell">{a.dia ? new Date(a.dia + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'} · {a.hora}</td>
                  <td className="px-5 py-4 text-terracotta-400">{formatBRL(a.valorReserva)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DiaPainel({ ds, bloqueado, horariosBloq, ags, horarios, onToggleDia, onToggleHora, onEditarHora, onAdicionarHora, onRemoverHora }) {
  const data = new Date(ds + 'T12:00')
  const [aberto, setAberto] = useState(null)
  const [editando, setEditando] = useState('')
  const [novoHora, setNovoHora] = useState('')

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-serif text-xl capitalize">{data.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
          <p className="text-sm text-cream-100/50">{data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
        </div>
        <button onClick={onToggleDia} className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ' + (bloqueado ? 'bg-terracotta-500/20 text-terracotta-400' : 'bg-cocoa-950 text-cream-100/60 hover:text-cream-100')}>
          <Ban size={12} /> {bloqueado ? 'Desbloquear dia' : 'Bloquear dia'}
        </button>
      </div>

      {ags.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-cream-100/40">Agendado neste dia</p>
          {ags.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg bg-terracotta-500/10 px-3 py-2 text-sm text-terracotta-300">
              <Clock size={13} /> {a.hora} · {a.nome}
            </div>
          ))}
        </div>
      )}

      {!bloqueado && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-cream-100/40">Horários (clique para editar, bloquear ou remover)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {horarios.map((h) => {
              const bloq = horariosBloq.includes(h)
              const ocupado = ags.some((a) => a.hora === h)
              return (
                <div key={h} className="relative">
                  <button
                    onClick={() => { if (!ocupado) { setAberto(aberto === h ? null : h); setEditando(h) } }}
                    disabled={ocupado}
                    className={'rounded-full px-3 py-1.5 text-xs transition ' +
                      (ocupado ? 'bg-terracotta-500/20 text-terracotta-400 cursor-not-allowed' : bloq ? 'bg-cocoa-950 text-cream-100/30 line-through' : aberto === h ? 'bg-clay-500 text-cream-50' : 'bg-cocoa-800 text-cream-100 hover:bg-cocoa-700')}
                  >
                    {h} {ocupado && '· ocupado'}
                  </button>

                  {aberto === h && !ocupado && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl bg-cocoa-950 p-3 shadow-2xl ring-1 ring-cream-100/15">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={editando}
                          onChange={(e) => setEditando(e.target.value)}
                          className="flex-1 rounded-lg bg-cocoa-900 px-2 py-1.5 text-sm text-cream-100 ring-1 ring-cream-100/15 focus:ring-clay-400 focus:outline-none"
                        />
                        <button
                          onClick={() => { onEditarHora(h, editando); setAberto(null) }}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-clay-500 text-cream-50 hover:bg-clay-600"
                          title="Salvar novo horário"
                        ><Check size={15} /></button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => { onToggleHora(h); setAberto(null) }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cocoa-900 py-1.5 text-xs text-cream-100/80 hover:text-cream-100"
                        ><Ban size={12} /> {bloq ? 'Desbloquear' : 'Bloquear'}</button>
                        <button
                          onClick={() => { onRemoverHora(h); setAberto(null) }}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-terracotta-500/15 py-1.5 text-xs text-terracotta-300 hover:bg-terracotta-500/25"
                        ><Trash2 size={12} /> Remover</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="time"
              value={novoHora}
              onChange={(e) => setNovoHora(e.target.value)}
              className="rounded-lg bg-cocoa-950 px-3 py-2 text-sm text-cream-100 ring-1 ring-cream-100/15 focus:ring-clay-400 focus:outline-none"
            />
            <button
              onClick={() => { if (novoHora) { onAdicionarHora(novoHora); setNovoHora('') } }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cocoa-800 px-3 py-2 text-xs text-cream-100 hover:bg-cocoa-700"
            ><Plus size={13} /> Adicionar horário</button>
          </div>
        </div>
      )}
    </div>
  )
}
