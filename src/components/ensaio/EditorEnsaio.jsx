// EDITOR DE ENSAIO — um só, usado em TODOS os lugares.
//
// Antes ele morava dentro de Clientes.jsx e só era alcançável pela ficha do
// cliente. Quem clicava num ensaio no Funil ou na Agenda só conseguia OLHAR —
// não dava para acertar o horário nem fechar o negócio de onde se estava.
// Agora é um componente próprio: a ficha, o card do funil e o calendário abrem
// exatamente a mesma tela, e ela mesma cuida de salvar.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Loader2 } from 'lucide-react'
import { formatBRL } from '../Money'
import { useApp } from '../../context/AppContext'
import { usePacotes } from '../../lib/catalogo'
import { SERVICOS } from '../../data/studio'
import { STATUS_ENSAIO } from '../../data/statusEnsaio'
import { fecharNegocio } from '../../lib/ensaios'

export default function EditorEnsaio({ ensaio, clienteId, onClose, onSalvo }) {
  const { adicionarEnsaioCliente, editarEnsaioCliente, recarregarCRM } = useApp()
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  // O proprio editor salva: assim ficha, funil e agenda se comportam igual,
  // sem cada tela reimplementar a regra de gerar as cobrancas.
  const onSalvar = async (campos) => {
    setSalvando(true)
    setErroSalvar('')
    let alvo = ensaio ? ensaio.id : null
    if (!alvo) {
      const novo = await adicionarEnsaioCliente(clienteId, campos)
      alvo = novo && novo.id
      if (!alvo) { setSalvando(false); setErroSalvar('Nao foi possivel criar o ensaio.'); return }
    } else {
      await editarEnsaioCliente(alvo, campos)
    }
    // Ensaio FECHADO com valor: gera a cobranca do sinal e a do saldo.
    const fechado = campos.status && !['solicitado', 'orcamento'].includes(campos.status)
    if (fechado && Number(campos.valor) > 0) {
      await fecharNegocio({
        ensaioId: alvo, valor: campos.valor, sinal: campos.sinal || 0,
        fotosInclusas: campos.fotosInclusas, fotoExtra: campos.fotoExtra,
      })
    }
    if (recarregarCRM) await recarregarCRM()
    setSalvando(false)
    if (onSalvo) onSalvo(alvo)
  }

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
        <button onClick={() => valido && onSalvar({ titulo: titulo.trim(), tipo, pacote, valor: Number(valor) || 0, data: data || null, hora: hora || null, local: local || null, duracaoMin: duracaoMin === '' ? null : Number(duracaoMin), status, observacoes, sinal: sinal === '' ? null : Number(sinal), fotosInclusas: fotosInclusas === '' ? null : Number(fotosInclusas), fotoExtra: fotoExtra === '' ? null : Number(fotoExtra) })} disabled={!valido || salvando} className="btn-light mt-7 w-full disabled:opacity-40">{salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {ensaio ? 'Salvar ensaio' : 'Adicionar ensaio'}</button>
        {erroSalvar && <p className="mt-3 rounded-xl bg-red-500/10 p-3 text-xs text-red-300 ring-1 ring-red-400/30">{erroSalvar}</p>}
      </motion.div>
    </motion.div>
  )
}
