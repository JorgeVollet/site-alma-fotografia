import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Calendar, Camera, ArrowLeft, Image as ImageIcon, DollarSign, Plus, Pencil, X, Check, Search, MessageCircle, Trash2 } from 'lucide-react'
import { formatBRL } from '../../components/Money'
import { fecharNegocio } from '../../lib/ensaios'
import { FUNIL_ETAPAS } from '../../data/crm'
import { SERVICOS } from '../../data/studio'
import { usePacotes } from '../../lib/catalogo'
import { useApp } from '../../context/AppContext'
import LeadInfo from './_LeadInfo'
import { waLink } from '../../lib/wa'

// Status possíveis de um ensaio (sessão)
const STATUS_ENSAIO = [
  { id: 'solicitado', nome: 'Solicitado (a orçar)' },
  { id: 'orcamento', nome: 'Orçamento enviado' },
  { id: 'agendado', nome: 'Agendado (fechado)' },
  { id: 'selecionando', nome: 'Cliente escolhendo' },
  { id: 'enviado', nome: 'Seleção recebida' },
  { id: 'editando', nome: 'Em edição' },
  { id: 'pronto', nome: 'Pronto' },
  { id: 'entregue', nome: 'Entregue' },
]

export default function Clientes() {
  const { clientes, selecoes, adicionarCliente, editarCliente } = useApp()
  const [aberto, setAberto] = useState(null)
  const [editando, setEditando] = useState(null)
  const [novo, setNovo] = useState(false)
  const [busca, setBusca] = useState('')

  // Lista: custom + demo (com edições)
  const todos = clientes
  const etapaDe = (c) => c.etapa || c.funil
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
        {editando && <EditorCliente cliente={editando} onClose={() => setEditando(null)} onSalvar={(campos) => { editarCliente(editando.id, campos); setEditando(null) }} />}
      </AnimatePresence>
    </div>
  )
}

function Ficha({ cliente, onVoltar, onEditar, selecoes }) {
  const { adicionarEnsaioCliente, editarEnsaioCliente, excluirEnsaioCliente, recarregarCRM } = useApp()
  const [editorEnsaio, setEditorEnsaio] = useState(null) // {novo:true} | ensaio | null
  const gasto = cliente.ensaios.reduce((s, e) => s + (e.valor || 0), 0)
  const wa = waLink(cliente.telefone) || ''
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
        <Info icon={Calendar} label="Nascimento" valor={cliente.dataNascimento ? new Date(cliente.dataNascimento + 'T12:00').toLocaleDateString('pt-BR') : '—'} />
        <Info icon={DollarSign} label="Total investido" valor={formatBRL(gasto)} destaque />
      </div>

      {/* Informações do lead + histórico de atualizações — centralizado aqui também */}
      <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
        <LeadInfo cliente={cliente} mostrarWhats={false} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-serif text-xl">Histórico de ensaios</h3>
        <button onClick={() => setEditorEnsaio({ novo: true })} className="btn-light !py-2 text-xs"><Plus size={14} /> Novo ensaio</button>
      </div>
      {cliente.ensaios.length === 0 ? (
        <p className="mt-3 rounded-xl bg-cocoa-900 p-5 text-sm text-cream-100/50 ring-1 ring-cream-100/10">
          {cliente.interesse ? <>Lead — interesse em <strong className="text-cream-100/80">{cliente.interesse}</strong>. Nenhum ensaio ainda.</> : 'Nenhum ensaio registrado ainda. Clique em "Novo ensaio" para lançar o primeiro.'}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {cliente.ensaios.map((e) => {
            const sel = (selecoes[cliente.galeriaId] || []).length
            const statusNome = (STATUS_ENSAIO.find((s) => s.id === e.status) || {}).nome || e.status
            return (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
                <div className="flex items-center gap-3">
                  <Camera size={20} className="text-terracotta-400" />
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      {e.titulo || 'Ensaio'}
                      {e.origem === 'site' && <span className="rounded-full bg-terracotta-500/20 px-2 py-0.5 text-[10px] font-normal text-terracotta-300">agendamento pelo site</span>}
                    </p>
                    <p className="text-xs text-cream-100/50">{e.data ? new Date(e.data + 'T12:00').toLocaleDateString('pt-BR') : 'Sem data'} · {formatBRL(e.valor)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-cream-100/60">
                  {cliente.galeriaId && <span className="flex items-center gap-1"><ImageIcon size={13} /> {sel} selecionadas</span>}
                  <span className="rounded-full bg-cream-100/10 px-2.5 py-1">{statusNome}</span>
                  <button onClick={() => setEditorEnsaio(e)} className="rounded-lg p-1.5 text-cream-100/50 transition hover:bg-cocoa-800 hover:text-cream-100" title="Editar ensaio"><Pencil size={14} /></button>
                  <button onClick={() => { if (confirm('Excluir este ensaio?')) excluirEnsaioCliente(e.id) }} className="rounded-lg p-1.5 text-cream-100/50 transition hover:bg-cocoa-800 hover:text-red-300" title="Excluir ensaio"><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {editorEnsaio && (
          <EditorEnsaio
            ensaio={editorEnsaio.novo ? null : editorEnsaio}
            onClose={() => setEditorEnsaio(null)}
            onSalvar={async (campos) => {
              let alvo = editorEnsaio.novo ? null : editorEnsaio.id
              if (editorEnsaio.novo) {
                const novo = await adicionarEnsaioCliente(cliente.id, campos)
                alvo = novo && novo.id
              } else {
                await editarEnsaioCliente(editorEnsaio.id, campos)
              }
              // Ensaio FECHADO com valor: gera a cobranca do sinal e a do saldo.
              // Sem isto, o sinal era descontado do saldo mas nunca virava
              // receita — o ensaio de 1200 com sinal de 100 aparecia como 1100.
              const fechado = campos.status && !['solicitado', 'orcamento'].includes(campos.status)
              if (alvo && fechado && Number(campos.valor) > 0) {
                await fecharNegocio({
                  ensaioId: alvo,
                  valor: campos.valor,
                  sinal: campos.sinal || 0,
                  fotosInclusas: campos.fotosInclusas,
                  fotoExtra: campos.fotoExtra,
                })
                if (recarregarCRM) recarregarCRM()
              }
              setEditorEnsaio(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EditorEnsaio({ ensaio, onClose, onSalvar }) {
  const PACOTES = usePacotes()
  const [tipo, setTipo] = useState(ensaio ? ensaio.tipo || '' : '')
  const [pacote, setPacote] = useState(ensaio ? ensaio.pacote || '' : '')
  const [titulo, setTitulo] = useState(ensaio ? ensaio.titulo || '' : '')
  const [valor, setValor] = useState(ensaio ? ensaio.valor || '' : '')
  const [data, setData] = useState(ensaio ? ensaio.data || '' : '')
  const [hora, setHora] = useState(ensaio ? ensaio.hora || '' : '')
  const [local, setLocal] = useState(ensaio ? ensaio.local || '' : '')
  const [duracaoMin, setDuracaoMin] = useState(ensaio && ensaio.duracaoMin ? ensaio.duracaoMin : '')
  const [status, setStatus] = useState(ensaio ? ensaio.status || 'agendado' : 'orcamento')
  const [observacoes, setObservacoes] = useState(ensaio ? ensaio.observacoes || '' : '')
  // O que foi COMBINADO fica no ensaio: e daqui que saem a cobranca do sinal e
  // a do saldo, e e daqui que a galeria herda os numeros depois.
  const [sinal, setSinal] = useState(ensaio && ensaio.sinal != null ? ensaio.sinal : '')
  const [fotosInclusas, setFotosInclusas] = useState(ensaio && ensaio.fotosInclusas != null ? ensaio.fotosInclusas : '')
  const [fotoExtra, setFotoExtra] = useState(ensaio && ensaio.fotoExtra != null ? ensaio.fotoExtra : '')
  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  // Ao escolher um tipo/pacote, sugere título e valor (se ainda vazios).
  const escolherTipo = (id) => {
    setTipo(id)
    const s = SERVICOS.find((x) => x.id === id)
    if (s && !titulo.trim()) setTitulo('Ensaio ' + s.nome)
  }
  const escolherPacote = (slug) => {
    setPacote(slug)
    const p = PACOTES.find((x) => x.id === slug)
    if (p && !valor) setValor(p.preco)
    if (p && sinal === '' && p.reserva) setSinal(p.reserva)
    if (p && fotosInclusas === '' && p.fotosInclusas) setFotosInclusas(p.fotosInclusas)
    if (p && fotoExtra === '' && p.fotoExtra) setFotoExtra(p.fotoExtra)
  }

  const valido = titulo.trim() || tipo || pacote
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4">
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{ensaio ? 'Editar ensaio' : 'Novo ensaio'}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Tipo de ensaio</span>
              <select className={inp} value={tipo} onChange={(e) => escolherTipo(e.target.value)}>
                <option value="">Selecione...</option>
                {SERVICOS.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-sm text-cream-100/80">Pacote</span>
              <select className={inp} value={pacote} onChange={(e) => escolherPacote(e.target.value)}>
                <option value="">Selecione...</option>
                {PACOTES.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><span className="text-sm text-cream-100/80">Título</span><input className={inp} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Ensaio Newborn · Antônio" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Valor (R$)</span><input type="number" className={inp} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="890" /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Data</span><input type="date" className={inp} value={data || ''} onChange={(e) => setData(e.target.value)} /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Horário</span><input type="time" className={inp} value={hora || ''} onChange={(e) => setHora(e.target.value)} /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Duração (min)</span><input type="number" step="15" className={inp} value={duracaoMin} onChange={(e) => setDuracaoMin(e.target.value)} placeholder="120" /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Local</span><input className={inp} value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Estúdio" /></label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="text-sm text-cream-100/80">Sinal / entrada</span><input type="number" className={inp} value={sinal} onChange={(e) => setSinal(e.target.value)} placeholder="100" /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Fotos inclusas</span><input type="number" className={inp} value={fotosInclusas} onChange={(e) => setFotosInclusas(e.target.value)} placeholder="10" /></label>
            <label className="block"><span className="text-sm text-cream-100/80">Foto extra (R$)</span><input type="number" className={inp} value={fotoExtra} onChange={(e) => setFotoExtra(e.target.value)} placeholder="30" /></label>
          </div>
          {Number(valor) > 0 && (
            <p className="rounded-xl bg-cocoa-950 p-3 text-xs text-cream-100/60">
              Entrada de <strong className="text-cream-100/85">{formatBRL(Number(sinal) || 0)}</strong> + saldo de <strong className="text-cream-100/85">{formatBRL(Math.max(0, (Number(valor) || 0) - (Number(sinal) || 0)))}</strong>.
              {' '}Ao salvar como <strong className="text-cream-100/85">Agendado</strong>, as duas cobranças entram em “A receber”.
            </p>
          )}
          <label className="block"><span className="text-sm text-cream-100/80">Situação</span>
            <select className={inp} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_ENSAIO.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            <span className="mt-1 block text-xs text-cream-100/40">Solicitado / Orçamento = ainda negociando (não fecha conta nem agenda). Agendado = fechado.</span>
          </label>
          <label className="block"><span className="text-sm text-cream-100/80">Observações</span><textarea className={inp} rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Detalhes do ensaio..." /></label>
        </div>
        <button onClick={() => valido && onSalvar({ titulo: titulo.trim(), tipo, pacote, valor: Number(valor) || 0, data: data || null, hora: hora || null, local: local || null, duracaoMin: duracaoMin === '' ? null : Number(duracaoMin), status, observacoes, sinal: sinal === '' ? null : Number(sinal), fotosInclusas: fotosInclusas === '' ? null : Number(fotosInclusas), fotoExtra: fotoExtra === '' ? null : Number(fotoExtra) })} disabled={!valido} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> {ensaio ? 'Salvar ensaio' : 'Adicionar ensaio'}</button>
      </motion.div>
    </motion.div>
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
  const [dataNascimento, setDataNascimento] = useState(cliente ? cliente.dataNascimento || '' : '')
  const [interesse, setInteresse] = useState(cliente ? cliente.interesse || '' : '')
  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'
  const valido = nome.trim()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4">
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
          <label className="block"><span className="text-sm text-cream-100/80">Data de nascimento</span><input type="date" className={inp} value={dataNascimento || ''} onChange={(e) => setDataNascimento(e.target.value)} /><span className="mt-1 block text-xs text-cream-100/40">Usada para o alerta de aniversariantes.</span></label>
          <label className="block"><span className="text-sm text-cream-100/80">Interesse</span><input className={inp} value={interesse} onChange={(e) => setInteresse(e.target.value)} placeholder="Ex: Ensaio gestante" /></label>
        </div>
        <button onClick={() => valido && onSalvar({ nome: nome.trim(), contato, email, telefone, dataNascimento: dataNascimento || null, interesse })} disabled={!valido} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> {novo ? 'Adicionar cliente' : 'Salvar alterações'}</button>
      </motion.div>
    </motion.div>
  )
}
