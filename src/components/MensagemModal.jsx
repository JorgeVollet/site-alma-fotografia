import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, X, MessageCircle, Mail, Copy, Plus, Trash2 } from 'lucide-react'
import useBackToClose from '../hooks/useBackToClose'
import { waLink } from '../lib/wa'

// Pop-up reutilizável de mensagem ao cliente (WhatsApp/e-mail/copiar), semi-automático:
// o estúdio escolhe um modelo, edita, salva os seus, e decide se envia ou pula.
// Nada dispara sozinho. Usado em Seleções (status) e Visão geral (aniversário).
//
// props: titulo, subtitulo, presets[] (já com o nome aplicado), presetKey (namespace
// dos modelos próprios), cliente {nome, telefone, email}, assunto (e-mail), onClose.

const PRESETS_KEY = 'alma_msg_presets_v1'
function lerCustom(key) {
  try { const all = JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}'); return Array.isArray(all[key]) ? all[key] : [] } catch (e) { return [] }
}
function salvarCustom(key, texto) {
  const t = (texto || '').trim(); if (!t) return lerCustom(key)
  try {
    const all = JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}')
    const l = Array.isArray(all[key]) ? all[key] : []
    if (!l.includes(t)) l.push(t); all[key] = l
    localStorage.setItem(PRESETS_KEY, JSON.stringify(all)); return l
  } catch (e) { return lerCustom(key) }
}
function removerCustom(key, texto) {
  try {
    const all = JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}')
    all[key] = (Array.isArray(all[key]) ? all[key] : []).filter((t) => t !== texto)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(all)); return all[key]
  } catch (e) { return lerCustom(key) }
}

export default function MensagemModal({ titulo = 'Enviar mensagem', subtitulo, presets = [], presetKey = 'geral', cliente, assunto = 'Alma Fotografia', onClose }) {
  useBackToClose(onClose)
  const builtins = (presets || []).filter(Boolean)
  const [custom, setCustom] = useState(() => lerCustom(presetKey))
  const opcoes = [...builtins, ...custom]
  const [msg, setMsg] = useState(opcoes[0] || '')
  const [copiado, setCopiado] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const wa = waLink(cliente?.telefone, msg)
  const mail = cliente?.email ? `mailto:${cliente.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(msg)}` : null
  const ehCustom = custom.includes(msg)

  const copiar = () => { if (navigator.clipboard) navigator.clipboard.writeText(msg); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }
  const salvarModelo = () => { salvarCustom(presetKey, msg); setCustom(lerCustom(presetKey)); setSalvo(true); setTimeout(() => setSalvo(false), 1500) }
  const removerModelo = (t) => { removerCustom(presetKey, t); setCustom(lerCustom(presetKey)) }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[80] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-2xl"><Sparkles size={20} className="text-terracotta-400" /> {titulo}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        {subtitulo && <p className="mt-1 text-sm text-cream-100/50">{subtitulo}</p>}

        {/* Modelos (prontos + os seus) */}
        <p className="mt-4 text-xs uppercase tracking-wide text-cream-100/40">Escolha um modelo</p>
        <div className="mt-2 grid gap-2">
          {opcoes.map((texto, i) => {
            const ativo = texto === msg
            const meu = i >= builtins.length
            return (
              <div key={i} className={'group flex items-start gap-2 rounded-xl p-3 text-left text-xs leading-relaxed ring-1 transition ' + (ativo ? 'bg-terracotta-500/15 text-cream-100 ring-terracotta-400/40' : 'bg-cocoa-950 text-cream-100/70 ring-cream-100/10 hover:text-cream-100')}>
                <button onClick={() => setMsg(texto)} className="flex-1 text-left">
                  <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-cream-100/40">{meu ? 'Meu modelo' : 'Modelo ' + (i + 1)}</span>
                  {texto}
                </button>
                {meu && <button onClick={() => removerModelo(texto)} title="Remover modelo" className="mt-0.5 shrink-0 text-cream-100/30 opacity-0 transition hover:text-terracotta-400 group-hover:opacity-100"><Trash2 size={13} /></button>}
              </div>
            )
          })}
        </div>

        {/* Editar */}
        <p className="mt-4 text-xs uppercase tracking-wide text-cream-100/40">Mensagem (edite à vontade)</p>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} className="mt-2 w-full resize-none rounded-2xl bg-cocoa-950 p-4 text-sm leading-relaxed text-cream-100 outline-none ring-1 ring-cream-100/10 focus:ring-terracotta-400/40" />
        {!ehCustom && msg.trim() && (
          <button onClick={salvarModelo} className="mt-2 inline-flex items-center gap-1.5 text-xs text-cream-100/50 hover:text-terracotta-300"><Plus size={13} /> {salvo ? 'Salvo nos meus modelos!' : 'Salvar como meu modelo'}</button>
        )}

        {/* Enviar ou pular */}
        <div className="mt-5 grid gap-2.5">
          {wa
            ? <a href={wa} target="_blank" rel="noreferrer" className="btn-light flex w-full items-center justify-center gap-2"><MessageCircle size={16} /> Enviar no WhatsApp</a>
            : <p className="rounded-xl bg-cocoa-950 px-3 py-2 text-center text-xs text-cream-100/40">Cliente sem telefone cadastrado — use e-mail ou copie a mensagem.</p>}
          <div className="flex gap-2.5">
            {mail && <a href={mail} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cocoa-800 py-2.5 text-xs text-cream-100/80 ring-1 ring-cream-100/15 hover:text-cream-100"><Mail size={14} /> E-mail</a>}
            <button onClick={copiar} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cocoa-800 py-2.5 text-xs text-cream-100/80 ring-1 ring-cream-100/15 hover:text-cream-100"><Copy size={14} /> {copiado ? 'Copiado!' : 'Copiar'}</button>
          </div>
          <button onClick={onClose} className="w-full rounded-full py-2 text-xs text-cream-100/40 hover:text-cream-100/70">Agora não — pular</button>
        </div>
        <p className="mt-1 text-center text-[11px] text-cream-100/30">Nada é enviado sozinho — você revisa e escolhe enviar.</p>
      </motion.div>
    </motion.div>
  )
}
