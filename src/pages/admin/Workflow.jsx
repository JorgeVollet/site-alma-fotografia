import { useState, useEffect, useCallback } from 'react'
import { Workflow as WfIcon, Check, Clock, User, Wand2, Loader2, ImageOff, CalendarClock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { statusLabel, statusCor } from '../../data/statusEnsaio'
import { fetchEtapas, atualizarEtapa, criarEtapasPadrao } from '../../lib/producao'
import { fetchProfiles } from '../../lib/equipe'

const hoje = () => new Date().toISOString().slice(0, 10)

export default function Workflow() {
  const { galerias } = useApp()
  const [profiles, setProfiles] = useState([])
  useEffect(() => { fetchProfiles().then(setProfiles) }, [])

  // ensaios em produção = galerias com seleção recebida ou em edição
  const emProducao = galerias.filter((g) => ['enviado', 'editando'].includes(g.status))

  return (
    <div>
      <h1 className="font-serif text-3xl">Fluxo de trabalho</h1>
      <p className="mt-1 text-sm text-cream-100/60">Cada ensaio em produção com suas etapas (edição → cor → retoque), responsável e prazo.</p>

      {emProducao.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-cream-100/15 bg-cocoa-900/40 p-10 text-center">
          <ImageOff size={26} className="mx-auto text-cream-100/30" />
          <p className="mt-3 text-sm text-cream-100/60">Nenhum ensaio em produção.</p>
          <p className="mt-1 text-xs text-cream-100/40">Quando um cliente envia a seleção, o ensaio aparece aqui para você tocar a edição.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {emProducao.map((g) => <CardProducao key={g.id} galeria={g} profiles={profiles} />)}
        </div>
      )}
    </div>
  )
}

function CardProducao({ galeria, profiles }) {
  const { mudarStatusGaleria } = useApp()
  const [etapas, setEtapas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [iniciando, setIniciando] = useState(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setEtapas(await fetchEtapas(galeria.id))
    setCarregando(false)
  }, [galeria.id])
  useEffect(() => { recarregar() }, [recarregar, galeria.status])

  const iniciarEdicao = async () => {
    setIniciando(true)
    await mudarStatusGaleria(galeria.id, 'editando')
    await criarEtapasPadrao(galeria.id) // garante as etapas na hora (não depende só do trigger)
    await recarregar()
    setIniciando(false)
  }

  const criarEtapas = async () => {
    await criarEtapasPadrao(galeria.id)
    await recarregar()
  }

  const mudarEtapa = async (etapa, campos) => {
    const nova = await atualizarEtapa(etapa.id, campos)
    if (nova) setEtapas((l) => l.map((e) => (e.id === etapa.id ? nova : e)))
  }

  const concluidas = etapas.filter((e) => e.status === 'concluida').length
  const pct = etapas.length ? Math.round((concluidas / etapas.length) * 100) : 0

  return (
    <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{galeria.clienteNome || galeria.nome}</p>
          <p className="text-xs text-cream-100/50">{galeria.nome}</p>
        </div>
        <span className={'rounded-full px-3 py-1.5 text-xs ' + statusCor(galeria.status)}>{statusLabel(galeria.status)}</span>
      </div>

      {galeria.status === 'enviado' ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-cocoa-950 p-4">
          <p className="text-sm text-cream-100/60">Seleção recebida. Bora começar a edição?</p>
          <button onClick={iniciarEdicao} disabled={iniciando} className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-4 py-2 text-xs text-sky-300 ring-1 ring-sky-400/25 hover:bg-sky-500/25 disabled:opacity-50">
            {iniciando ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Iniciar edição
          </button>
        </div>
      ) : carregando ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-cream-100/40"><Loader2 size={14} className="animate-spin" /> Carregando etapas…</div>
      ) : etapas.length === 0 ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-cocoa-950 p-4">
          <p className="text-sm text-cream-100/60">Sem etapas ainda.</p>
          <button onClick={criarEtapas} className="inline-flex items-center gap-2 rounded-full bg-terracotta-500/20 px-4 py-2 text-xs text-terracotta-300 ring-1 ring-terracotta-400/30 hover:bg-terracotta-500/30"><Wand2 size={14} /> Criar etapas de produção</button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cocoa-950">
              <div className="h-full rounded-full bg-terracotta-500 transition-all" style={{ width: pct + '%' }} />
            </div>
            <span className="text-xs text-cream-100/40">{concluidas}/{etapas.length}</span>
          </div>
          <div className="mt-3 space-y-2">
            {etapas.map((e) => <LinhaEtapa key={e.id} etapa={e} profiles={profiles} onMudar={(campos) => mudarEtapa(e, campos)} />)}
          </div>
        </>
      )}
    </div>
  )
}

function LinhaEtapa({ etapa, profiles, onMudar }) {
  const atrasada = etapa.prazo && etapa.prazo < hoje() && etapa.status !== 'concluida'
  const cor = etapa.status === 'concluida' ? 'bg-emerald-500 text-cream-50' : etapa.status === 'em_andamento' ? 'bg-sky-500 text-cream-50' : 'bg-cocoa-800 text-cream-100/40'
  return (
    <div className="rounded-xl bg-cocoa-950 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={'grid h-7 w-7 place-items-center rounded-full text-xs ' + cor}>{etapa.status === 'concluida' ? <Check size={14} /> : etapa.ordem}</span>
          <span className="text-sm font-medium">{etapa.nome}</span>
        </div>
        {/* status: pendente -> em andamento -> concluída (reversível) */}
        <div className="flex gap-1">
          {[['pendente', 'Pendente'], ['em_andamento', 'Em andamento'], ['concluida', 'Concluída']].map(([id, label]) => (
            <button key={id} onClick={() => onMudar({ status: id })} className={'rounded-full px-2.5 py-1 text-[11px] transition ' + (etapa.status === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-800 text-cream-100/50 hover:text-cream-100')}>{label}</button>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-cream-100/50">
          <User size={12} /> Responsável
          <select value={etapa.responsavelId || ''} onChange={(e) => onMudar({ responsavelId: e.target.value || null })} className="rounded-lg border border-cream-100/10 bg-cocoa-900 px-2 py-1 text-xs text-cream-100 outline-none focus:border-terracotta-400">
            <option value="">—</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.nome || p.email}</option>)}
          </select>
        </label>
        <label className={'flex items-center gap-1.5 text-xs ' + (atrasada ? 'text-terracotta-400' : 'text-cream-100/50')}>
          {atrasada ? <CalendarClock size={12} /> : <Clock size={12} />} Prazo
          <input type="date" value={etapa.prazo || ''} onChange={(e) => onMudar({ prazo: e.target.value || null })} className="rounded-lg border border-cream-100/10 bg-cocoa-900 px-2 py-1 text-xs text-cream-100 outline-none focus:border-terracotta-400" />
        </label>
      </div>
    </div>
  )
}
