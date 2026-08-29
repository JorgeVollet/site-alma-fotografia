import { useState, useEffect } from 'react'
import { Target, Clock, Check, Plus, Loader2, MessageCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { listarAtualizacoes, criarAtualizacao } from '../../lib/clienteAtualizacoes'
import { waLink } from '../../lib/wa'

const inpLead = 'mt-1 w-full rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400'

function Secao({ icon: Icon, titulo, children }) {
  return (
    <div className="mt-5">
      <p className="flex items-center gap-2 text-sm font-medium text-cream-100"><Icon size={15} className="text-terracotta-400" /> {titulo}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

// Informações do lead + histórico de atualizações.
// CENTRALIZADO e reutilizável: aparece SEMPRE (qualquer etapa do funil) no
// ClienteModal e também na ficha de Clientes. Mesma fonte de dados (cliente.lead
// + cliente_atualizacoes), então editar num lugar reflete no outro.
export default function LeadInfo({ cliente, mostrarWhats = true }) {
  const { editarCliente } = useApp()
  const l = cliente.lead || {}
  const [origem, setOrigem] = useState(l.origem || '')
  const [primeiroContato, setPrimeiroContato] = useState(l.primeiroContato || '')
  const [interesse, setInteresse] = useState(l.interesse || '')
  const [urgencia, setUrgencia] = useState(l.urgencia || '')
  const [notas, setNotas] = useState(l.notas || '')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const [hist, setHist] = useState([])
  const [novaAtt, setNovaAtt] = useState('')
  const [addingAtt, setAddingAtt] = useState(false)
  useEffect(() => { let v = true; listarAtualizacoes(cliente.id).then((h) => v && setHist(h)); return () => { v = false } }, [cliente.id])

  const salvar = async () => {
    setSalvando(true)
    await editarCliente(cliente.id, { origem, primeiroContato: primeiroContato || null, interesse, urgencia, notas })
    setSalvando(false); setSalvo(true); setTimeout(() => setSalvo(false), 1600)
  }
  const addAtualizacao = async () => {
    const t = novaAtt.trim(); if (!t) return
    setAddingAtt(true)
    const nova = await criarAtualizacao(cliente.id, t)
    setAddingAtt(false)
    if (nova) { setHist((h) => [nova, ...h]); setNovaAtt('') }
  }
  const wa = waLink(cliente.telefone)

  return (
    <>
      <Secao icon={Target} titulo="Informações do lead">
        <div className="space-y-3 rounded-2xl bg-cocoa-950 p-4">
          <label className="block"><span className="text-xs text-cream-100/50">Origem</span>
            <input className={inpLead} value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="Ex: Instagram, indicação, site…" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs text-cream-100/50">Primeiro contato</span>
              <input type="date" className={inpLead} value={primeiroContato || ''} onChange={(e) => setPrimeiroContato(e.target.value)} /></label>
            <label className="block"><span className="text-xs text-cream-100/50">Urgência</span>
              <select className={inpLead} value={urgencia} onChange={(e) => setUrgencia(e.target.value)}>
                <option value="">—</option><option>Baixa</option><option>Média</option><option>Alta</option>
              </select></label>
          </div>
          <label className="block"><span className="text-xs text-cream-100/50">Interesse</span>
            <input className={inpLead} value={interesse} onChange={(e) => setInteresse(e.target.value)} placeholder="Ex: Ensaio gestante, corporativo…" /></label>
          <label className="block"><span className="text-xs text-cream-100/50">Notas</span>
            <textarea rows={2} className={inpLead + ' resize-none'} value={notas} onChange={(e) => setNotas(e.target.value)} /></label>
          <button onClick={salvar} disabled={salvando} className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-500 px-3 py-1.5 text-xs text-cream-50 transition hover:bg-terracotta-600 disabled:opacity-50">
            {salvando ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {salvo ? 'Salvo!' : 'Salvar informações'}
          </button>
        </div>
      </Secao>

      <Secao icon={Clock} titulo="Histórico de atualizações">
        <div className="rounded-2xl bg-cocoa-950 p-4">
          <div className="flex gap-2">
            <input className="flex-1 rounded-lg border border-cream-100/10 bg-cocoa-900 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400" value={novaAtt} onChange={(e) => setNovaAtt(e.target.value)} placeholder="O que foi conversado com o cliente?" onKeyDown={(e) => { if (e.key === 'Enter') addAtualizacao() }} />
            <button onClick={addAtualizacao} disabled={addingAtt || !novaAtt.trim()} className="grid w-10 shrink-0 place-items-center rounded-lg bg-terracotta-500 text-cream-50 transition hover:bg-terracotta-600 disabled:opacity-40">{addingAtt ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}</button>
          </div>
          {hist.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {hist.map((h) => (
                <li key={h.id} className="border-l-2 border-terracotta-400/40 pl-3">
                  <p className="text-sm leading-relaxed text-cream-100/85">{h.texto}</p>
                  <p className="text-[11px] text-cream-100/40">{new Date(h.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-xs text-cream-100/40">Sem atualizações ainda — registre o que foi conversado.</p>}
        </div>
      </Secao>

      {mostrarWhats && wa && (
        <div className="mt-5 flex gap-2.5">
          <a href={wa} target="_blank" rel="noreferrer" className="btn-light flex-1 !py-2.5 text-xs"><MessageCircle size={14} /> Chamar no WhatsApp</a>
        </div>
      )}
    </>
  )
}
