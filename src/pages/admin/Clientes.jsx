import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Calendar, Camera, ArrowLeft, Image as ImageIcon, DollarSign, Plus, Pencil, X, Check, Search, MessageCircle } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { CLIENTES, FUNIL_ETAPAS } from '../../data/crm'
import { useApp } from '../../context/AppContext'

export default function Clientes() {
  const { selecoes, clientesCustom, clientesEdit, funilOverride, adicionarCliente, editarCliente } = useApp()
  const [aberto, setAberto] = useState(null)
  const [editando, setEditando] = useState(null)
  const [novo, setNovo] = useState(false)
  const [busca, setBusca] = useState('')

  // Lista: custom + demo (com edições)
  const todos = [
    ...clientesCustom.map((c) => ({ ...c, custom: true })),
    ...CLIENTES.map((c) => ({ ...c, ...(clientesEdit[c.id] || {}), custom: false })),
  ]
  const etapaDe = (c) => funilOverride[c.id] || c.funil
  const filtrados = busca.trim()
    ? todos.filter((c) => (c.nome + ' ' + (c.contato || '') + ' ' + (c.email || '') + ' ' + (c.interesse || '')).toLowerCase().includes(busca.toLowerCase()))
    : todos

  if (aberto) {
    const c = todos.find((x) => x.id === aberto)
    return <Ficha cliente={c} onVoltar={() => setAberto(null)} onEditar={() => { setEditando(c); setAberto(null) }} selecoes={selecoes} />
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Clientes</h1>
          <p className="mt-1 text-sm text-cream-100/60">{todos.length} no total. Clique para ver a ficha completa.</p>
        </div>
        <button onClick={() => setNovo(true)} className="btn-light !py-2.5 text-xs"><Plus size={15} /> Novo cliente</button>
      </div>

      {/* Busca */}
      <div className="mt-5 flex items-center gap-2 rounded-xl bg-cocoa-900 px-4 py-2.5 ring-1 ring-cream-100/10">
        <Search size={16} className="text-cream-100/40" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail, interesse..." className="flex-1 bg-transparent text-sm text-cream-100 outline-none placeholder:text-cream-100/30" />
        {busca && <button onClick={() => setBusca('')} className="text-cream-100/40 hover:text-cream-100"><X size={15} /></button>}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-cream-100/10">
        <table className="w-full text-sm">
          <thead className="bg-cocoa-900 text-left text-xs uppercase tracking-wide text-cream-100/40">
            <tr><th className="px-5 py-3">Cliente</th><th className="hidden px-5 py-3 md:table-cell">Contato</th><th className="hidden px-5 py-3 sm:table-cell">Ensaios</th><th className="px-5 py-3">Etapa</th></tr>
          </thead>
          <tbody className="divide-y divide-cream-100/5">
            {filtrados.map((c) => {
              const etapa = FUNIL_ETAPAS.find((e) => e.id === etapaDe(c))
              return (
                <tr key={c.id} onClick={() => setAberto(c.id)} className="cursor-pointer bg-cocoa-900/40 transition hover:bg-cocoa-900">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={c.avatarGrad + ' grid h-9 w-9 place-items-center rounded-full font-serif text-sm text-cream-50'}>{c.nome.charAt(0)}</div>
                      <div>
                        <p className="font-medium">{c.nome}</p>
                        <p className="text-xs text-cream-100/40">{c.interesse || (c.ensaios[0] && c.ensaios[0].titulo) || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 text-cream-100/60 md:table-cell">{c.telefone}</td>
                  <td className="hidden px-5 py-4 sm:table-cell">{c.ensaios.length}</td>
                  <td className="px-5 py-4"><span className="inline-block rounded-full bg-cream-100/10 px-2.5 py-1 text-xs text-cream-100/70">{etapa ? etapa.nome : etapaDe(c)}</span></td>
                </tr>
              )
            })}
            {filtrados.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-cream-100/40">Nenhum cliente encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {novo && <EditorCliente novo onClose={() => setNovo(false)} onSalvar={(c) => { adicionarCliente(c); setNovo(false) }} />}
        {editando && <EditorCliente cliente={editando} onClose={() => setEditando(null)} onSalvar={(campos) => { editarCliente(editando.id, campos, editando.custom); setEditando(null) }} />}
      </AnimatePresence>
    </div>
  )
}

function Ficha({ cliente, onVoltar, onEditar, selecoes }) {
  const gasto = cliente.ensaios.reduce((s, e) => s + (e.valor || 0), 0)
  const wa = 'https://wa.me/55' + (cliente.telefone || '').replace(/\D/g, '')
  return (
    <div>
      <button onClick={onVoltar} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100"><ArrowLeft size={16} /> Voltar para clientes</button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cliente.avatarGrad + ' grid h-16 w-16 place-items-center rounded-2xl font-serif text-2xl text-cream-50'}>{cliente.nome.charAt(0)}</div>
          <div>
            <h1 className="font-serif text-3xl">{cliente.nome}</h1>
            <p className="text-sm text-cream-100/60">{cliente.contato}</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/15 px-4 py-2.5 text-xs text-[#25D366] transition hover:bg-[#25D366]/25"><MessageCircle size={14} /> WhatsApp</a>
          <button onClick={onEditar} className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100/70 transition hover:bg-cocoa-700"><Pencil size={14} /> Editar</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info icon={Mail} label="E-mail" valor={cliente.email} />
        <Info icon={Phone} label="Telefone" valor={cliente.telefone} />
        <Info icon={Calendar} label="Cliente desde" valor={cliente.desde ? new Date(cliente.desde + 'T12:00').toLocaleDateString('pt-BR') : '—'} />
        <Info icon={DollarSign} label="Total investido" valor={formatBRL(gasto)} destaque />
      </div>

      <h3 className="mt-8 font-serif text-xl">Histórico de ensaios</h3>
      {cliente.ensaios.length === 0 ? (
        <p className="mt-3 rounded-xl bg-cocoa-900 p-5 text-sm text-cream-100/50 ring-1 ring-cream-100/10">
          {cliente.interesse ? <>Lead — interesse em <strong className="text-cream-100/80">{cliente.interesse}</strong>. Nenhum ensaio ainda.</> : 'Nenhum ensaio registrado ainda.'}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {cliente.ensaios.map((e) => {
            const sel = (selecoes[cliente.galeriaId] || []).length
            return (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
                <div className="flex items-center gap-3">
                  <Camera size={20} className="text-terracotta-400" />
                  <div>
                    <p className="font-medium">{e.titulo}</p>
                    <p className="text-xs text-cream-100/50">{new Date(e.data + 'T12:00').toLocaleDateString('pt-BR')} · {formatBRL(e.valor)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-cream-100/60">
                  <span className="flex items-center gap-1"><ImageIcon size={13} /> {sel} selecionadas</span>
                  <span className="rounded-full bg-cream-100/10 px-2.5 py-1">{e.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Info({ icon: Icon, label, valor, destaque }) {
  return (
    <div className={'rounded-2xl p-5 ring-1 ' + (destaque ? 'bg-terracotta-500/15 ring-terracotta-400/30' : 'bg-cocoa-900 ring-cream-100/10')}>
      <p className="flex items-center gap-2 text-xs text-cream-100/50"><Icon size={13} /> {label}</p>
      <p className={'mt-1 ' + (destaque ? 'font-serif text-2xl text-terracotta-400' : 'text-sm')}>{valor}</p>
    </div>
  )
}

function EditorCliente({ cliente, novo, onClose, onSalvar }) {
  const [nome, setNome] = useState(cliente ? cliente.nome : '')
  const [contato, setContato] = useState(cliente ? cliente.contato || '' : '')
  const [email, setEmail] = useState(cliente ? cliente.email || '' : '')
  const [telefone, setTelefone] = useState(cliente ? cliente.telefone || '' : '')
  const [interesse, setInteresse] = useState(cliente ? cliente.interesse || '' : '')
  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'
  const valido = nome.trim()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{novo ? 'Novo cliente' : 'Editar cliente'}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">Nome</span><input className={inp} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Família Silva" /></label>
          <label className="block"><span className="text-sm text-cream-100/80">Contato (pessoa)</span><input className={inp} value={contato} onChange={(e) => setContato(e.target.value)} placeholder="Ex: Maria Silva" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">E-mail</span><input type="email" className={inp} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Telefone</span><input className={inp} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(55) 9..." /></label>
          </div>
          <label className="block"><span className="text-sm text-cream-100/80">Interesse</span><input className={inp} value={interesse} onChange={(e) => setInteresse(e.target.value)} placeholder="Ex: Ensaio gestante" /></label>
        </div>
        <button onClick={() => valido && onSalvar({ nome: nome.trim(), contato, email, telefone, interesse })} disabled={!valido} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> {novo ? 'Adicionar cliente' : 'Salvar alterações'}</button>
      </motion.div>
    </motion.div>
  )
}
