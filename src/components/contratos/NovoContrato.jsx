import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, LayoutTemplate, FilePlus, FileUp, Plus, Trash2, Check, MessageCircle, Copy, Eye } from 'lucide-react'
import { formatBRL } from '../Money'
import { MODELOS_CONTRATO } from '../../data/crm'
import { useApp } from '../../context/AppContext'
import { waLink } from '../../lib/wa'

const LINK_BASE = 'almafotografia.com.br/assinar/'

// NOVO contrato — 3 modos (modelo | zero | PDF). REUTILIZÁVEL:
// • a aba Contratos usa sem props (cliente/ensaio escolhidos no form).
// • o EnsaioModal/ClienteModal passa clientePre + ensaioPre p/ já vir preenchido
//   e bloquearCliente, e zClass='z-[90]' p/ ficar acima do modal que o abriu.
export default function NovoContrato({ onClose, onCriar, onCriado, clientePre, ensaioPre, bloquearCliente = false, modoInicial = 'template', zClass = 'z-[70]' }) {
  const { clientes } = useApp()
  const [modo, setModo] = useState(modoInicial) // template | zero | pdf
  const [cliente, setCliente] = useState(clientePre || '')
  const { adicionarEnsaioCliente } = useApp()
  const [ensaioId, setEnsaioId] = useState(ensaioPre?.id || '')

  // Contrato SEM ensaio vinculado cobra o mesmo dinheiro duas vezes: a checagem
  // anti-duplicidade pergunta "esse ensaio já tem cobrança?" e, sem ensaio, não
  // há o que perguntar — então cria uma conta; depois o ensaio cria outra.
  // Por isso o vínculo deixou de ser opcional quando existe ensaio: se houver
  // um só, ele já vem escolhido.
  useEffect(() => {
    if (ensaioId || ensaioPre) return
    const lista = (clienteObj && clienteObj.ensaios) || []
    if (lista.length > 0) {
      setEnsaioId(lista[0].id)
      if (lista[0].valor) setValor(String(lista[0].valor))
    }
  }, [clienteObj, ensaioId, ensaioPre])
  const [valor, setValor] = useState(ensaioPre?.valor ? String(ensaioPre.valor) : '')
  const [ensaio, setEnsaio] = useState(ensaioPre?.tipo || ensaioPre?.titulo || '')
  const [modeloId, setModeloId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [clausulas, setClausulas] = useState([''])
  const [pdf, setPdf] = useState(null)
  const [pdfNome, setPdfNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const fileRef = useRef(null)

  const inp = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'
  const clienteObj = clientes.find((c) => c.id === cliente)

  const onPdf = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setPdfNome(f.name); setPdf(f) // guarda o File; o upload ao bucket privado acontece no criarContrato
  }
  const setCl = (i, v) => setClausulas((a) => a.map((c, idx) => (idx === i ? v : c)))
  const podeColar = cliente && (
    (modo === 'template' && modeloId) ||
    (modo === 'zero' && titulo.trim() && clausulas.some((c) => c.trim())) ||
    (modo === 'pdf' && pdf)
  )

  const criar = async () => {
    setSalvando(true)
    setErro('')

    // O contrato NUNCA nasce solto: sem vinculo, ele cria uma conta a receber e
    // o ensaio cria outra depois — cobrando o cliente duas vezes. Se o cliente
    // ainda nao tem ensaio, criamos um aqui e vinculamos.
    let vinculo = ensaioId
    if (!vinculo) {
      const clienteId = clienteObj?.id || (typeof cliente === 'object' ? cliente.id : null)
      if (!clienteId) {
        setSalvando(false)
        setErro('Escolha um cliente para o contrato.')
        return
      }
      const novoEnsaio = await adicionarEnsaioCliente(clienteId, {
        titulo: (ensaio || titulo || 'Ensaio').trim(),
        tipoEnsaio: null,
        valor: +valor || 0,
        status: 'orcamento',
        observacoes: 'Criado junto com o contrato.',
      })
      if (!novoEnsaio) {
        setSalvando(false)
        setErro('Não foi possível criar o ensaio deste contrato. Tente de novo.')
        return
      }
      vinculo = novoEnsaio.id
      setEnsaioId(vinculo)
    }

    const base = { cliente, ensaioId: vinculo, valor: +valor || 0, ensaio }
    let payload
    if (modo === 'template') {
      const m = MODELOS_CONTRATO.find((x) => x.id === modeloId)
      payload = { ...base, modelo: m.nome, titulo: m.nome, clausulas: [...m.clausulas] }
    } else if (modo === 'zero') {
      payload = { ...base, modelo: titulo, titulo, clausulas: clausulas.filter((c) => c.trim()) }
    } else {
      payload = { ...base, modelo: pdfNome.replace('.pdf', ''), titulo: pdfNome, pdfFile: pdf, pdfNome }
    }
    const novo = await onCriar(payload)
    setSalvando(false)
    if (!novo || novo.erro) {
      setErro((novo && novo.erro) || 'Não foi possível criar o contrato. Tente de novo.')
      return
    }
    if (onCriado) onCriado(novo)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className={'fixed inset-0 ' + zClass + ' flex items-center justify-center bg-cocoa-950/40 p-4'}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Novo contrato</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>

        {/* Seletor de modo */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[['template', 'De modelo', LayoutTemplate], ['zero', 'Do zero', FilePlus], ['pdf', 'Upload PDF', FileUp]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setModo(id)} className={'flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs transition ' + (modo === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-950 text-cream-100/60 hover:text-cream-100')}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        {/* Cliente (comum) */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {bloquearCliente ? (
            <label className="block"><span className="text-sm text-cream-100/80">Cliente</span>
              <div className={inp + ' flex items-center text-cream-100/80'}>{clienteObj?.nome || '—'}</div></label>
          ) : (
            <label className="block"><span className="text-sm text-cream-100/80">Cliente</span><select className={inp} value={cliente} onChange={(e) => { setCliente(e.target.value); setEnsaioId('') }}><option value="">Selecione...</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          )}
          <label className="block"><span className="text-sm text-cream-100/80">Valor (R$)</span><input type="number" className={inp} value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></label>
        </div>

        {/* Vínculo do ensaio: fixo (vindo do contexto) OU seletor opcional */}
        {ensaioPre ? (
          <p className="mt-3 rounded-xl bg-cocoa-950 p-3 text-xs text-cream-100/50">Vinculado ao ensaio <strong className="text-cream-100/80">{ensaioPre.titulo || ensaioPre.tipo || 'selecionado'}</strong>. O valor e o objeto vêm dele — a cobrança fica no ensaio (o contrato não gera outra conta a receber).</p>
        ) : (clienteObj && Array.isArray(clienteObj.ensaios) && clienteObj.ensaios.length > 0 && (
          <label className="mt-3 block">
            <span className="text-sm text-cream-100/80">Ensaio deste contrato</span>
            <select className={inp} value={ensaioId} onChange={(e) => {
              const id = e.target.value
              setEnsaioId(id)
              const en = clienteObj.ensaios.find((x) => x.id === id)
              if (en) {
                if (en.valor) setValor(String(en.valor))
                if (!ensaio) setEnsaio(en.tipo || en.titulo || '')
              }
            }}>
              {clienteObj.ensaios.map((en) => <option key={en.id} value={en.id}>{en.titulo}{en.valor ? ` — ${formatBRL(en.valor)}` : ''}</option>)}
            </select>
            <span className="mt-1 block text-xs text-cream-100/40">O valor e o objeto vêm do ensaio, e a cobrança fica nele — o contrato não gera uma segunda conta a receber.</span>

          </label>
        ))}

        {/* Conteúdo por modo */}
        {modo === 'template' && (
          <div className="mt-4 space-y-4">
            <label className="block"><span className="text-sm text-cream-100/80">Modelo</span><select className={inp} value={modeloId} onChange={(e) => setModeloId(e.target.value)}><option value="">Selecione...</option>{MODELOS_CONTRATO.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>
            <label className="block"><span className="text-sm text-cream-100/80">Ensaio / objeto</span><input className={inp} value={ensaio} onChange={(e) => setEnsaio(e.target.value)} placeholder="Ex: Casamento" /></label>
            {modeloId && <p className="rounded-xl bg-cocoa-950 p-3 text-xs text-cream-100/50">As cláusulas do modelo serão preenchidas com os dados do cliente. Você pode editá-las depois.</p>}
          </div>
        )}

        {modo === 'zero' && (
          <div className="mt-4 space-y-4">
            <label className="block"><span className="text-sm text-cream-100/80">Título do contrato</span><input className={inp} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato de Ensaio Personalizado" /></label>
            <div>
              <div className="flex items-center justify-between"><span className="text-sm text-cream-100/80">Cláusulas</span><button onClick={() => setClausulas((a) => [...a, ''])} className="inline-flex items-center gap-1 text-xs text-terracotta-400 hover:underline"><Plus size={12} /> Adicionar cláusula</button></div>
              <div className="mt-2 space-y-2">
                {clausulas.map((cl, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="mt-3 text-xs text-cream-100/40">{i + 1}ª</span>
                    <textarea rows={2} className="flex-1 resize-none rounded-xl border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400" value={cl} onChange={(e) => setCl(i, e.target.value)} placeholder="Texto da cláusula..." />
                    {clausulas.length > 1 && <button onClick={() => setClausulas((a) => a.filter((_, idx) => idx !== i))} className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-cream-100/40 hover:bg-terracotta-500/20 hover:text-terracotta-400"><Trash2 size={13} /></button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {modo === 'pdf' && (
          <div className="mt-4">
            <input ref={fileRef} type="file" accept="application/pdf" onChange={onPdf} className="hidden" />
            <button onClick={() => fileRef.current && fileRef.current.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-cream-100/15 p-8 text-center transition hover:border-terracotta-400/50">
              <FileUp size={28} className="text-terracotta-400" />
              <span className="text-sm text-cream-100/70">{pdfNome || 'Clique para selecionar um PDF'}</span>
              {pdf && <span className="text-xs text-clay-300">✓ PDF carregado</span>}
            </button>
          </div>
        )}

        {erro && <p className="mt-5 rounded-xl bg-red-500/10 p-3 text-xs text-red-300 ring-1 ring-red-400/30">{erro}</p>}
        <button onClick={criar} disabled={!podeColar || salvando} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> {salvando ? 'Criando...' : 'Criar contrato'}</button>
      </motion.div>
    </motion.div>
  )
}

// Envio p/ assinatura — link público + mensagem WhatsApp pronta.
export function ModalEnviar({ contrato, onClose, onConfirmar, onAssinarAgora, zClass = 'z-[70]' }) {
  const link = LINK_BASE + contrato.token
  const primeiroNome = (contrato.clienteNome || '').split(' ')[0] || contrato.clienteNome
  const msg = 'Olá, ' + primeiroNome + '! 💛 Aqui é da Alma Fotografia. Preparamos o seu contrato (' + (contrato.modelo || contrato.titulo) + '). É rapidinho: abra o link, leia e assine pelo celular: ' + link + ' — qualquer dúvida estamos à disposição!'
  const wa = waLink(contrato.telefone, msg)
  const [copiado, setCopiado] = useState(false)
  const enviar = () => { onConfirmar({ tipo: 'contrato', cliente: contrato.clienteNome, texto: msg }); if (wa) window.open(wa, '_blank', 'noopener') }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className={'fixed inset-0 ' + zClass + ' flex items-center justify-center bg-cocoa-950/40 p-4'}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-serif text-2xl"><MessageCircle size={22} className="text-[#25D366]" /> Enviar p/ assinatura</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/50">Para {contrato.clienteNome} · {contrato.telefone || 'sem telefone'}</p>
        <div className="mt-4 rounded-2xl rounded-bl-sm bg-[#25D366]/10 p-4 ring-1 ring-[#25D366]/20"><p className="text-sm leading-relaxed text-cream-100/90">{msg}</p></div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-cocoa-950 p-3">
          <span className="flex-1 truncate font-mono text-xs text-cream-100/60">{link}</span>
          <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 1500) }} className="inline-flex items-center gap-1 rounded-lg bg-cocoa-800 px-2.5 py-1.5 text-xs text-cream-100/70 hover:text-cream-100"><Copy size={12} /> {copiado ? 'Copiado!' : 'Copiar'}</button>
        </div>
        <div className="mt-5 space-y-2.5">
          <button onClick={enviar} className="btn-light flex w-full items-center justify-center gap-2"><MessageCircle size={16} /> {wa ? 'Marcar enviado e abrir WhatsApp' : 'Marcar como enviado'}</button>
          {!wa && <p className="text-center text-[11px] text-amber-300/80">Cliente sem telefone — copie o link acima e envie por onde preferir. O contrato já fica liberado para assinatura.</p>}
          {onAssinarAgora && <button onClick={onAssinarAgora} className="flex w-full items-center justify-center gap-2 rounded-full bg-cocoa-800 py-2.5 text-xs text-cream-100/60 transition hover:bg-cocoa-700"><Eye size={14} /> Ver o contrato</button>}
        </div>
      </motion.div>
    </motion.div>
  )
}
