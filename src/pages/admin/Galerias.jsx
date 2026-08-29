import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, KeyRound, Check, X, Upload, Trash2, ImageOff, Loader2, MessageCircle, Download } from 'lucide-react'
import Photo from '../../components/Photo'
import MensagemModal from '../../components/MensagemModal'
import { useApp } from '../../context/AppContext'
import { usePacotes } from '../../lib/catalogo'
import { fetchGalerias, criarGaleria, atualizarGaleria, fetchFotos, excluirFoto, excluirFotos, adicionarFotos } from '../../lib/galerias'
import { urlGaleria } from '../../lib/storage'

function statusLabel(s) {
  return { selecionando: 'Cliente escolhendo', enviado: 'Seleção recebida', editando: 'Em edição', pronto: 'Entregue' }[s] || s
}

// Iniciais (do nome do cliente) + sigla do ensaio + data → capa "monograma".
function iniciais(nome, max = 3) {
  return (nome || '?').trim().split(/\s+/).slice(0, max).map((w) => w[0] || '').join('').toUpperCase()
}
function Monograma({ nome, ensaio, data, className = '' }) {
  const ini = iniciais(nome)
  const sig = iniciais(ensaio, 2)
  const d = data ? new Date(String(data).slice(0, 10) + 'T12:00') : null
  const dataFmt = d && !Number.isNaN(d.getTime()) ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : ''
  return (
    <div className={'relative overflow-hidden bg-gradient-to-br from-cocoa-700 via-cocoa-800 to-cocoa-950 ' + className}>
      {/* iniciais GIGANTES preenchendo a capa */}
      <span className="absolute inset-0 flex items-center justify-center whitespace-nowrap font-serif font-semibold uppercase leading-none tracking-tight text-cream-100 text-[5.5rem] sm:text-[7rem]">{ini || '—'}</span>
      {/* brilho diagonal sutil */}
      <span className="pointer-events-none absolute -left-10 -top-12 h-32 w-48 rotate-[-18deg] bg-cream-100/10 blur-2xl" />
      {/* sigla do ensaio + data (chip discreto no canto) */}
      {(sig || dataFmt) && (
        <span className="absolute bottom-2 right-2 rounded-full bg-cocoa-950/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cream-100/75 backdrop-blur-sm">
          {sig}{sig && dataFmt ? ' · ' : ''}{dataFmt}
        </span>
      )}
    </div>
  )
}

export default function Galerias() {
  const [galerias, setGalerias] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [aberta, setAberta] = useState(null)
  const [criando, setCriando] = useState(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setGalerias(await fetchGalerias())
    setCarregando(false)
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  if (aberta) return <Detalhe galeria={aberta} onVoltar={() => { setAberta(null); recarregar() }} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Galerias</h1>
          <p className="mt-1 text-sm text-cream-100/60">As galerias de cada cliente — fotos para seleção e entrega das finais.</p>
        </div>
        <button onClick={() => setCriando(true)} className="btn-light !py-2.5 text-xs"><Plus size={15} /> Nova galeria</button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => setCriando(true)} className="group flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-100/15 p-8 text-center transition hover:border-terracotta-400/50 hover:bg-cocoa-900/40">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-cocoa-900 text-terracotta-400 transition group-hover:scale-110"><Plus size={22} /></div>
          <p className="mt-3 text-sm text-cream-100/60">Criar nova galeria</p>
        </button>

        {carregando ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-cocoa-900/40 text-cream-100/40"><Loader2 size={20} className="animate-spin" /></div>
        ) : (
          galerias.map((g) => (
            <button key={g.id} onClick={() => setAberta(g)} className="group overflow-hidden rounded-2xl bg-cocoa-900 text-left ring-1 ring-cream-100/10 transition hover:-translate-y-1 hover:ring-terracotta-400/40">
              <div className="relative h-28">
                <Monograma nome={g.clienteNome || g.nome} ensaio={g.ensaioTitulo || g.nome} data={g.criadoEm} className="h-full w-full" />
                <span className="absolute bottom-2 left-2 rounded-full bg-cocoa-950/70 px-2 py-1 text-[11px] text-cream-100/80">{g.totalFotos} fotos</span>
                <span className="absolute right-2 top-2 rounded-full bg-terracotta-500/20 px-2 py-0.5 text-[10px] text-terracotta-300">{statusLabel(g.status)}</span>
              </div>
              <div className="p-5">
                <p className="font-medium">{g.nome}</p>
                <p className="text-xs text-cream-100/50">{g.clienteNome || g.ensaioTitulo || '—'}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {!carregando && galerias.length === 0 && (
        <p className="mt-4 text-sm text-cream-100/40">Nenhuma galeria ainda. Crie uma e suba as fotos do ensaio.</p>
      )}

      {criando && <NovaGaleria onClose={() => setCriando(false)} onCriado={() => { setCriando(false); recarregar() }} />}
    </div>
  )
}

function Detalhe({ galeria, onVoltar }) {
  const { clientes } = useApp()
  const [fotos, setFotos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState({ feitas: 0, total: 0 })
  const [senha, setSenha] = useState(galeria.senha || '')
  const [fotoExtra, setFotoExtra] = useState(galeria.fotoExtra ?? '')
  const [salvandoConf, setSalvandoConf] = useState(false)
  const [marcadas, setMarcadas] = useState(() => new Set())
  const [aba, setAba] = useState('selecao') // selecao | entrega
  const [avisar, setAvisar] = useState(false)
  const inputRef = useRef(null)

  const cliente = clientes.find((c) => c.id === galeria.clienteId)
  const fotosSelecao = fotos.filter((f) => f.tipo !== 'entrega')
  const fotosEntrega = fotos.filter((f) => f.tipo === 'entrega')
  const visiveis = aba === 'entrega' ? fotosEntrega : fotosSelecao
  const selecionadas = fotosSelecao.filter((f) => f.selecionada)
  const comObs = fotosSelecao.filter((f) => f.observacao)

  const toggleMarcada = (id) => setMarcadas((m) => { const n = new Set(m); n.has(id) ? n.delete(id) : n.add(id); return n })
  const trocarAba = (a) => { setAba(a); setMarcadas(new Set()) }

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setFotos(await fetchFotos(galeria.id))
    setCarregando(false)
  }, [galeria.id])
  useEffect(() => { recarregar() }, [recarregar])

  const aoEscolher = async (e) => {
    const files = e.target.files
    if (!files || !files.length) return
    setEnviando(true)
    setProgresso({ feitas: 0, total: files.length })
    await adicionarFotos(galeria.id, files, aba, visiveis.length, (feitas, total) => setProgresso({ feitas, total }))
    setEnviando(false)
    if (inputRef.current) inputRef.current.value = ''
    await recarregar()
  }

  const remover = async (id) => {
    if (!confirm('Excluir esta foto da galeria?')) return
    await excluirFoto(id)
    await recarregar()
  }

  const excluirMarcadas = async () => {
    if (!marcadas.size) return
    if (!confirm(`Excluir ${marcadas.size} foto(s) da galeria?`)) return
    await excluirFotos([...marcadas])
    setMarcadas(new Set())
    await recarregar()
  }

  const salvarConfig = async () => {
    setSalvandoConf(true)
    await atualizarGaleria(galeria.id, { senha, fotoExtra: fotoExtra === '' ? null : Number(fotoExtra) })
    setSalvandoConf(false)
  }

  const origem = typeof window !== 'undefined' ? window.location.origin : ''
  const presetsAviso = [
    `Olá${cliente?.contato ? ' ' + cliente.contato : ''}! 💛 Suas fotos do ensaio "${galeria.nome}" já estão prontas para você ESCOLHER!\n\nComo acessar:\n1) Entre em ${origem}/cliente\n2) Código: ${galeria.codigo}\n3) Senha: ${senha || '(defina a senha)'}\n\nÉ só clicar nas favoritas, deixar uma observação se quiser e enviar a seleção. Qualquer dúvida, é só chamar! — Alma Fotografia`,
    `Oi${cliente?.contato ? ' ' + cliente.contato : ''}! 🎉 Suas fotos FINAIS do ensaio "${galeria.nome}" estão prontas para baixar!\n\nEntre em ${origem}/cliente (código ${galeria.codigo}, senha ${senha || '(defina a senha)'}), vá na aba "Minhas fotos" e baixe em alta resolução. Esperamos que você ame cada uma! 💛 — Alma Fotografia`,
    `Olá${cliente?.contato ? ' ' + cliente.contato : ''}! 💛 Passando pra lembrar das suas fotos do ensaio "${galeria.nome}". Quando puder, acesse ${origem}/cliente (código ${galeria.codigo}, senha ${senha || '(defina a senha)'}). Estamos à disposição!`,
  ]

  return (
    <div>
      <button onClick={onVoltar} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100"><ArrowLeft size={16} /> Voltar para galerias</button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{galeria.nome}</h1>
          <p className="mt-1 text-sm text-cream-100/60">{galeria.clienteNome || '—'} · {fotosSelecao.length} p/ seleção · {fotosEntrega.length} entregues</p>
        </div>
        <span className="rounded-full bg-terracotta-500/15 px-3 py-1.5 text-xs text-terracotta-400">{statusLabel(galeria.status)}</span>
      </div>

      {/* Acesso do cliente + avisar */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="flex items-center gap-2 text-xs text-cream-100/50"><KeyRound size={13} /> Acesso do cliente <span className="text-cream-100/30">(mesmo login p/ seleção e entrega)</span></p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-cream-100/40">Código</span>
              <p className="font-mono text-lg">{galeria.codigo || '—'}</p>
            </div>
            <label className="block">
              <span className="text-xs text-cream-100/40">Senha</span>
              <input value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-0.5 w-full rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-1.5 font-mono text-sm outline-none focus:border-terracotta-400" />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs text-cream-100/40">Foto extra (R$)</span>
              <input type="number" value={fotoExtra} onChange={(e) => setFotoExtra(e.target.value)} placeholder="ex: 30" className="mt-0.5 w-28 rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-1.5 text-sm outline-none focus:border-terracotta-400" />
            </label>
            <button onClick={salvarConfig} disabled={salvandoConf} className="inline-flex items-center gap-1.5 rounded-lg bg-cocoa-800 px-3 py-1.5 text-xs text-cream-100 ring-1 ring-cream-100/15 hover:bg-cocoa-700 disabled:opacity-50">
              {salvandoConf ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvar
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="text-xs text-cream-100/50">Avisar o cliente</p>
          <p className="mt-1 text-xs text-cream-100/40">Pop-up com modelos prontos (escolher fotos / baixar finais). Você revisa e envia.</p>
          <button onClick={() => setAvisar(true)} disabled={!cliente} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366]/15 px-4 py-2.5 text-xs text-[#25D366] transition hover:bg-[#25D366]/25 disabled:pointer-events-none disabled:opacity-40">
            <MessageCircle size={14} /> Avisar cliente
          </button>
          {!cliente && <p className="mt-2 text-[11px] text-cream-100/30">Galeria sem cliente vinculado — sem contato para avisar.</p>}
        </div>
      </div>

      {/* Abas: seleção / entrega */}
      <div className="mt-7 flex gap-2">
        {[['selecao', `Fotos p/ seleção (${fotosSelecao.length})`], ['entrega', `Entrega das fotos (${fotosEntrega.length})`]].map(([id, lbl]) => (
          <button key={id} onClick={() => trocarAba(id)} className={'rounded-full px-4 py-2 text-xs transition ' + (aba === id ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-900 text-cream-100/60 ring-1 ring-cream-100/10 hover:text-cream-100')}>{lbl}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={aoEscolher} />
        <button onClick={() => inputRef.current?.click()} disabled={enviando} className="btn-light !py-2.5 text-xs disabled:opacity-50">
          {enviando ? <><Loader2 size={15} className="animate-spin" /> Enviando {progresso.feitas}/{progresso.total}…</> : <><Upload size={15} /> {aba === 'entrega' ? 'Enviar finais' : 'Enviar fotos p/ seleção'}</>}
        </button>
        <span className="text-xs text-cream-100/40">
          {aba === 'entrega'
            ? 'Finais SEM marca d\'água, no tamanho real. O cliente baixa na aba "Minhas fotos".'
            : 'Provas com marca d\'água, redimensionadas p/ 1024px (leves).'}
        </span>
      </div>

      {/* Observações do cliente (só seleção) */}
      {aba === 'selecao' && comObs.length > 0 && (
        <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <h3 className="font-serif text-lg">Observações do cliente</h3>
          <ul className="mt-3 space-y-2">
            {comObs.map((f) => (
              <li key={f.id} className="flex gap-3 text-sm">
                <span className="shrink-0 text-cream-100/40">Foto {fotosSelecao.indexOf(f) + 1}:</span>
                <span className="text-cream-100/80">{f.observacao}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-xl">{aba === 'entrega' ? 'Fotos finais' : 'Fotos da galeria'}</h3>
        {visiveis.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {marcadas.size === visiveis.length
              ? <button onClick={() => setMarcadas(new Set())} className="rounded-full bg-cocoa-800 px-3 py-1.5 text-cream-100/70 ring-1 ring-cream-100/15 hover:bg-cocoa-700">Limpar seleção</button>
              : <button onClick={() => setMarcadas(new Set(visiveis.map((f) => f.id)))} className="rounded-full bg-cocoa-800 px-3 py-1.5 text-cream-100/70 ring-1 ring-cream-100/15 hover:bg-cocoa-700">Selecionar todas</button>}
            <button onClick={excluirMarcadas} disabled={!marcadas.size} className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-red-300 ring-1 ring-red-400/25 transition hover:bg-red-500/25 disabled:opacity-40">
              <Trash2 size={13} /> Excluir selecionadas{marcadas.size ? ` (${marcadas.size})` : ''}
            </button>
          </div>
        )}
      </div>
      {carregando ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-cream-100/40"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : visiveis.length === 0 ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-cream-100/15 p-10 text-center">
          {aba === 'entrega' ? <Download size={28} className="mx-auto text-cream-100/30" /> : <ImageOff size={28} className="mx-auto text-cream-100/30" />}
          <p className="mt-3 text-sm text-cream-100/60">
            {aba === 'entrega' ? 'Nenhuma foto final ainda. Suba as fotos editadas para o cliente baixar.' : 'Galeria vazia. Clique em "Enviar fotos p/ seleção" para subir as provas.'}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {visiveis.map((f) => {
            const marcada = marcadas.has(f.id)
            return (
              <div key={f.id} className={'group relative overflow-hidden rounded-lg ring-2 transition ' + (marcada ? 'ring-red-400' : f.selecionada ? 'ring-terracotta-400/60' : 'ring-transparent')}>
                <button onClick={() => toggleMarcada(f.id)} className="block w-full" title="Marcar para excluir">
                  <Photo src={urlGaleria(f.tipo, f.thumbPath)} alt="" fallback="ph-gradient-2" className="aspect-square" />
                  <span className={'absolute inset-0 transition ' + (marcada ? 'bg-red-500/20' : 'bg-cocoa-950/0 group-hover:bg-cocoa-950/10')} />
                </button>
                <span onClick={() => toggleMarcada(f.id)} className={'absolute left-1.5 top-1.5 z-10 grid h-5 w-5 cursor-pointer place-items-center rounded-md border transition ' + (marcada ? 'border-red-400 bg-red-500 text-cream-50' : 'border-cream-100/50 bg-cocoa-950/50 text-transparent hover:border-cream-100')}>
                  <Check size={13} />
                </span>
                {f.selecionada && <span className="absolute bottom-1 left-1.5 rounded-full bg-terracotta-500/90 px-1.5 py-0.5 text-[9px] text-cream-50">escolhida</span>}
                {f.observacao && <span className="absolute inset-x-0 bottom-0 truncate bg-cocoa-950/80 px-1.5 py-1 text-[10px] text-cream-100/80" title={f.observacao}>💬 {f.observacao}</span>}
                <button onClick={() => remover(f.id)} className="absolute right-1 top-1 rounded-full bg-cocoa-950/70 p-1 text-cream-100/70 opacity-0 transition hover:text-red-300 group-hover:opacity-100" title="Excluir esta foto"><Trash2 size={12} /></button>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {avisar && (
          <MensagemModal
            titulo="Avisar o cliente"
            subtitulo={`Galeria "${galeria.nome}" · para ${cliente?.nome || 'o cliente'}`}
            presets={presetsAviso}
            presetKey="galeria"
            cliente={cliente}
            assunto={`Suas fotos — Alma Fotografia (${galeria.nome})`}
            onClose={() => setAvisar(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function NovaGaleria({ onClose, onCriado }) {
  const { clientes } = useApp()
  const PACOTES = usePacotes()
  const comEnsaio = clientes.filter((c) => c.ensaios && c.ensaios.length)
  const [clienteId, setClienteId] = useState('')
  const [ensaioId, setEnsaioId] = useState('')
  const [salvando, setSalvando] = useState(false)
  const cliente = comEnsaio.find((c) => c.id === clienteId)
  const ensaio = cliente?.ensaios.find((e) => e.id === ensaioId)
  const field = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  const criar = async () => {
    if (!cliente || !ensaio) return
    setSalvando(true)
    const pac = PACOTES.find((p) => p.id === ensaio.pacote)
    const prefixo = (cliente.nome.split(' ')[0] || 'GAL').toUpperCase().replace(/[^A-Z0-9]/g, '')
    const codigo = prefixo + Math.floor(1000 + Math.random() * 9000)
    const senha = String(Math.floor(1000 + Math.random() * 9000)) // senha 4 dígitos, editável depois
    const r = await criarGaleria({
      clienteId: cliente.id,
      ensaioId: ensaio.id,
      nome: ensaio.titulo || `${cliente.nome} — ensaio`,
      codigo,
      senha,
      fotosInclusas: pac?.fotosInclusas || 0,
      fotoExtra: ensaio.fotoExtra ?? pac?.fotoExtra ?? null,
      valorTotal: ensaio.valor || pac?.preco || 0,
      reserva: pac?.reserva || 0,
    })
    setSalvando(false)
    if (r) onCriado()
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/40 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Nova galeria</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/50">A galeria nasce de um ensaio de um cliente. Código e senha são gerados automaticamente.</p>

        {comEnsaio.length === 0 ? (
          <p className="mt-5 rounded-xl bg-cocoa-950 p-4 text-sm text-cream-100/50">Nenhum cliente com ensaio ainda. Crie um ensaio na ficha do cliente primeiro.</p>
        ) : (
          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-sm text-cream-100/80">Cliente</span>
              <select className={field} value={clienteId} onChange={(e) => { setClienteId(e.target.value); setEnsaioId('') }}>
                <option value="">Selecione...</option>
                {comEnsaio.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            {cliente && (
              <label className="block"><span className="text-sm text-cream-100/80">Ensaio</span>
                <select className={field} value={ensaioId} onChange={(e) => setEnsaioId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {cliente.ensaios.map((e) => <option key={e.id} value={e.id}>{e.titulo || 'Ensaio'} {e.data ? '· ' + e.data : ''}</option>)}
                </select>
              </label>
            )}
          </div>
        )}

        <button onClick={criar} disabled={!ensaio || salvando} className="btn-light mt-7 w-full disabled:opacity-40">
          {salvando ? <><Loader2 size={16} className="animate-spin" /> Criando…</> : <><Check size={16} /> Criar galeria</>}
        </button>
      </div>
    </div>
  )
}
