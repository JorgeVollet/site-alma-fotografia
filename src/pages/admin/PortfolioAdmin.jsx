import { useState } from 'react'
import { Plus, ArrowLeft, X, Check, Trash2, ImagePlus, Eye, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import Photo from '../../components/Photo'
import { useApp } from '../../context/AppContext'
import { CATEGORIAS_PORTFOLIO } from '../../data/studio'

// Categorias selecionáveis (sem "todos", que é só filtro)
const CATS = CATEGORIAS_PORTFOLIO.filter((c) => c.id !== 'todos')
const nomeCat = (id) => CATEGORIAS_PORTFOLIO.find((c) => c.id === id)?.nome || id
const field =
  'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

export default function PortfolioAdmin() {
  const { ensaios, criarEnsaio, editarEnsaio, excluirEnsaio } = useApp()
  const [abertoId, setAbertoId] = useState(null)
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState(null)

  const aberto = ensaios.find((e) => e.id === abertoId)
  if (aberto) return <GerenciarFotos ensaio={aberto} onVoltar={() => setAbertoId(null)} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Portfólio</h1>
          <p className="mt-1 text-sm text-cream-100/60">
            Crie ensaios e adicione as fotos. Cada ensaio vira um card no portfólio do site e abre uma página própria.
          </p>
        </div>
        <button onClick={() => setCriando(true)} className="btn-light !py-2.5 text-xs">
          <Plus size={15} /> Adicionar ensaio
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => setCriando(true)}
          className="group flex min-h-[210px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-100/15 p-8 text-center transition hover:border-terracotta-400/50 hover:bg-cocoa-900/40"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-cocoa-900 text-terracotta-400 transition group-hover:scale-110">
            <Plus size={22} />
          </div>
          <p className="mt-3 text-sm text-cream-100/60">Adicionar ensaio</p>
        </button>

        {ensaios.map((e) => (
          <div
            key={e.id}
            className="group overflow-hidden rounded-2xl bg-cocoa-900 text-left ring-1 ring-cream-100/10 transition hover:-translate-y-1 hover:ring-terracotta-400/40"
          >
            <button onClick={() => setAbertoId(e.id)} className="block w-full text-left">
              <div className="relative h-32">
                <Photo src={e.capa || e.fotos[0]?.src} alt={e.titulo} fallback="ph-gradient-2" className="h-32" />
                <div className="absolute inset-0 bg-cocoa-950/0 transition group-hover:bg-cocoa-950/20" />
                <span className="absolute bottom-2 left-2 rounded-full bg-cocoa-950/60 px-2 py-1 text-[11px] text-cream-100/80">
                  {nomeCat(e.categoria)}
                </span>
                <span className="absolute bottom-2 right-2 rounded-full bg-cocoa-950/60 px-2 py-1 text-[11px] text-cream-100/80">
                  {e.fotos.length} {e.fotos.length === 1 ? 'foto' : 'fotos'}
                </span>
              </div>
              <div className="p-5">
                <p className="font-medium leading-snug">{e.titulo}</p>
                {e.subtitulo && <p className="mt-0.5 text-xs text-cream-100/50">{e.subtitulo}</p>}
              </div>
            </button>
            <div className="flex items-center gap-1 border-t border-cream-100/10 px-3 py-2">
              <button onClick={() => setAbertoId(e.id)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-cream-100/70 hover:bg-cocoa-950">
                <ImagePlus size={13} /> Fotos
              </button>
              <button onClick={() => setEditando(e)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-cream-100/70 hover:bg-cocoa-950">
                <Pencil size={13} /> Editar
              </button>
              <button
                onClick={() => { if (confirm('Excluir este ensaio?')) excluirEnsaio(e.id) }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-cream-100/50 hover:bg-cocoa-950 hover:text-red-300"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {ensaios.length === 0 && (
        <p className="mt-4 text-center text-xs text-cream-100/40">
          Nenhum ensaio ainda. Clique em “Adicionar ensaio” para começar.
        </p>
      )}

      {criando && (
        <FormEnsaio
          onClose={() => setCriando(false)}
          onSalvar={(dados) => { criarEnsaio(dados); setCriando(false) }}
        />
      )}
      {editando && (
        <FormEnsaio
          inicial={editando}
          onClose={() => setEditando(null)}
          onSalvar={(dados) => { editarEnsaio(editando.id, dados); setEditando(null) }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------
//  Modal: criar / editar ensaio
// ---------------------------------------------------------------------
function FormEnsaio({ inicial, onClose, onSalvar }) {
  const [form, setForm] = useState({
    titulo: inicial?.titulo || '',
    subtitulo: inicial?.subtitulo || '',
    categoria: inicial?.categoria || CATS[0].id,
    capa: inicial?.capa || '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const valido = form.titulo.trim() && form.categoria

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">{inicial ? 'Editar ensaio' : 'Novo ensaio'}</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/50">Defina os dados que aparecem no card do portfólio.</p>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm text-cream-100/80">Título</span>
            <input className={field} value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ex: Ensaio Gestante · Patrícia" />
          </label>
          <label className="block">
            <span className="text-sm text-cream-100/80">Subtítulo <span className="text-cream-100/40">(opcional)</span></span>
            <input className={field} value={form.subtitulo} onChange={(e) => set('subtitulo', e.target.value)} placeholder="Ex: 32 semanas · luz natural" />
          </label>
          <label className="block">
            <span className="text-sm text-cream-100/80">Categoria</span>
            <select className={field} value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
              {CATS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-cream-100/80">Foto de capa <span className="text-cream-100/40">(URL — opcional)</span></span>
            <input className={field} value={form.capa} onChange={(e) => set('capa', e.target.value)} placeholder="https://…  (ou deixe vazio p/ usar a 1ª foto)" />
          </label>
          {form.capa && (
            <div className="overflow-hidden rounded-xl ring-1 ring-cream-100/10">
              <Photo src={form.capa} alt="Prévia da capa" className="aspect-[16/9]" />
            </div>
          )}
        </div>
        <button onClick={() => valido && onSalvar(form)} disabled={!valido} className="btn-light mt-7 w-full disabled:opacity-40">
          <Check size={16} /> {inicial ? 'Salvar alterações' : 'Criar ensaio'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
//  Tela: gerenciar fotos de um ensaio
// ---------------------------------------------------------------------
function GerenciarFotos({ ensaio, onVoltar }) {
  const { adicionarFotoEnsaio, removerFotoEnsaio } = useApp()
  const [urls, setUrls] = useState('')

  const adicionar = () => {
    const lista = urls.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean)
    if (lista.length) adicionarFotoEnsaio(ensaio.id, lista)
    setUrls('')
  }

  return (
    <div>
      <button onClick={onVoltar} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100">
        <ArrowLeft size={16} /> Voltar para o portfólio
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{ensaio.titulo}</h1>
          <p className="mt-1 text-sm text-cream-100/60">
            {nomeCat(ensaio.categoria)}{ensaio.subtitulo ? ' · ' + ensaio.subtitulo : ''} · {ensaio.fotos.length} fotos
          </p>
        </div>
        <Link to={`/ensaio/${ensaio.id}`} className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100 ring-1 ring-cream-100/15 transition hover:bg-cocoa-950">
          <Eye size={15} /> Ver página do ensaio
        </Link>
      </div>

      {/* Adicionar fotos */}
      <div className="mt-6 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
        <p className="flex items-center gap-2 text-sm font-medium"><ImagePlus size={16} className="text-terracotta-400" /> Adicionar fotos</p>
        <p className="mt-1 text-xs text-cream-100/50">Cole uma ou várias URLs de imagem (uma por linha ou separadas por vírgula).</p>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          rows={3}
          className="mt-3 w-full resize-y rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400"
          placeholder="https://…/foto1.jpg&#10;https://…/foto2.jpg"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-cream-100/40">Upload de arquivo direto entra na versão com Supabase.</p>
          <button onClick={adicionar} disabled={!urls.trim()} className="btn-light !py-2.5 text-xs disabled:opacity-40">
            <Plus size={15} /> Adicionar
          </button>
        </div>
      </div>

      {/* Grade de fotos */}
      <h3 className="mt-8 font-serif text-xl">Fotos do ensaio</h3>
      {ensaio.fotos.length === 0 ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-cream-100/15 p-10 text-center">
          <ImagePlus size={28} className="mx-auto text-cream-100/30" />
          <p className="mt-3 text-sm text-cream-100/60">Nenhuma foto ainda. Adicione acima para montar a galeria.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {ensaio.fotos.map((f) => (
            <div key={f.id} className="group relative overflow-hidden rounded-lg ring-1 ring-cream-100/10">
              <Photo src={f.src} alt="Foto do ensaio" className="aspect-square" />
              <button
                onClick={() => removerFotoEnsaio(ensaio.id, f.id)}
                className="absolute right-1 top-1 rounded-full bg-cocoa-950/70 p-1.5 text-cream-100/80 opacity-0 transition group-hover:opacity-100 hover:bg-red-500 hover:text-cream-50"
                title="Remover foto"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
