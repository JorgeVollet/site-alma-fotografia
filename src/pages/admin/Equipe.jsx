import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Check, X, Plus, Mail, Circle, UserCog, Power, Trash2 } from 'lucide-react'
import { EQUIPE_CRM, PAPEIS, MODULOS_PERM, PERMISSOES_PADRAO } from '../../data/crm'
import { useApp } from '../../context/AppContext'

export default function Equipe() {
  const { membrosCustom, membrosState, adicionarMembro, toggleMembroAtivo, removerMembro } = useApp()
  const [permDe, setPermDe] = useState(null)
  const [novo, setNovo] = useState(false)

  // Membros: custom + demo (com estado ativo sobrescrito)
  const membros = [
    ...membrosCustom.map((m) => ({ ...m, custom: true })),
    ...EQUIPE_CRM.map((m) => ({ ...m, custom: false, ativo: membrosState[m.id] ? membrosState[m.id].ativo : m.ativo })),
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Equipe & permissões</h1>
          <p className="mt-1 text-sm text-cream-100/60">Gerencie quem acessa o quê. Cada papel tem permissões próprias por módulo.</p>
        </div>
        <button onClick={() => setNovo(true)} className="btn-light !py-2.5 text-xs"><Plus size={15} /> Convidar membro</button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {membros.map((m) => {
          const papel = PAPEIS[m.papel]
          return (
            <div key={m.id} className={'rounded-2xl bg-cocoa-900 p-5 ring-1 transition ' + (m.ativo ? 'ring-cream-100/10' : 'ring-cream-100/5 opacity-60')}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={m.avatarGrad + ' grid h-12 w-12 place-items-center rounded-full font-serif text-lg text-cream-50'}>{m.nome.charAt(0)}</div>
                  <div>
                    <p className="font-medium">{m.nome}</p>
                    <p className="flex items-center gap-1.5 text-xs text-cream-100/50"><Mail size={11} /> {m.email}</p>
                  </div>
                </div>
                <span className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ' + (m.ativo ? 'bg-clay-400/15 text-clay-300' : 'bg-cream-100/10 text-cream-100/40')}>
                  <Circle size={6} className={m.ativo ? 'fill-clay-300' : 'fill-cream-100/40'} /> {m.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ' + (papel ? papel.cor : 'bg-cream-100/10 text-cream-100/60')}><Shield size={11} /> {papel ? papel.nome : m.papel}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPermDe(m)} className="grid h-8 w-8 place-items-center rounded-lg text-cream-100/50 hover:bg-cocoa-800 hover:text-cream-100" title="Permissões"><UserCog size={15} /></button>
                  <button onClick={() => toggleMembroAtivo(m.id, m.custom, m.ativo)} className="grid h-8 w-8 place-items-center rounded-lg text-cream-100/50 hover:bg-cocoa-800 hover:text-cream-100" title={m.ativo ? 'Desativar' : 'Ativar'}><Power size={15} /></button>
                  {m.custom && <button onClick={() => removerMembro(m.id)} className="grid h-8 w-8 place-items-center rounded-lg text-cream-100/50 hover:bg-terracotta-500/20 hover:text-terracotta-400" title="Remover"><Trash2 size={14} /></button>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <h3 className="mt-8 font-serif text-xl">Papéis disponíveis</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PAPEIS).map(([id, p]) => (
          <div key={id} className="rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
            <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ' + p.cor}><Shield size={11} /> {p.nome}</span>
            <p className="mt-2 text-xs text-cream-100/50">{p.desc}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {permDe && <ModalPermissoes membro={permDe} onClose={() => setPermDe(null)} />}
        {novo && <ConvidarMembro onClose={() => setNovo(false)} onConvidar={(m) => { adicionarMembro(m); setNovo(false) }} />}
      </AnimatePresence>
    </div>
  )
}

function ModalPermissoes({ membro, onClose }) {
  const perms = PERMISSOES_PADRAO[membro.papel] || {}
  const papel = PAPEIS[membro.papel]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-2xl">Permissões</h3>
            <p className="text-sm text-cream-100/50">{membro.nome} · <span className={(papel ? papel.cor : '') + ' rounded-full px-2 py-0.5 text-xs'}>{papel ? papel.nome : membro.papel}</span></p>
          </div>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-1.5">
          {MODULOS_PERM.map((mod) => {
            const ok = perms[mod]
            return (
              <div key={mod} className="flex items-center justify-between rounded-xl bg-cocoa-950 px-4 py-2.5">
                <span className="text-sm text-cream-100/80">{mod}</span>
                <span className={'grid h-6 w-6 place-items-center rounded-full ' + (ok ? 'bg-clay-400/20 text-clay-300' : 'bg-cream-100/5 text-cream-100/30')}>{ok ? <Check size={14} /> : <X size={14} />}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-center text-xs text-cream-100/40">As permissões podem ser personalizadas por membro na versão final.</p>
      </motion.div>
    </motion.div>
  )
}

function ConvidarMembro({ onClose, onConvidar }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [papel, setPapel] = useState('fotografo')
  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'
  const valido = nome.trim() && email.includes('@')
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Convidar membro</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">Nome</span><input className={inp} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do membro" /></label>
          <label className="block"><span className="text-sm text-cream-100/80">E-mail</span><input type="email" className={inp} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" /></label>
          <label className="block"><span className="text-sm text-cream-100/80">Papel</span><select className={inp} value={papel} onChange={(e) => setPapel(e.target.value)}>{Object.entries(PAPEIS).map(([id, p]) => <option key={id} value={id}>{p.nome}</option>)}</select></label>
        </div>
        <button onClick={() => valido && onConvidar({ nome: nome.trim(), email: email.trim(), papel })} disabled={!valido} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> Convidar membro</button>
        <p className="mt-2 text-center text-xs text-cream-100/40">Na versão final, envia convite por e-mail com acesso restrito ao papel.</p>
      </motion.div>
    </motion.div>
  )
}
