import { useState } from 'react'
import { Plus, ArrowLeft, KeyRound, Eye, Check, Download, X } from 'lucide-react'
import Photo from '../../components/Photo'
import { useApp } from '../../context/AppContext'
import { CLIENTES, getGaleriaData } from '../../data/crm'
import { unsplashUrl } from '../../data/unsplash'

function statusLabel(s) {
  return { selecionando: 'Cliente escolhendo', enviado: 'Seleção recebida', editando: 'Em edição', pronto: 'Entregue' }[s] || s
}

const CAPAS = {
  demo: unsplashUrl('photo-1492725764893-90b379c2b6e7', 600),
  eduardo: unsplashUrl('photo-1519741497674-611481863552', 600),
  joana: unsplashUrl('photo-1511895426328-dc8714191300', 600),
  patricia: unsplashUrl('photo-1530103862676-de8c9debad1d', 600),
}

const GALERIAS_DEMO = CLIENTES.filter((c) => c.galeriaId).map((c) => ({
  id: c.galeriaId,
  cliente: c,
  nome: c.nome,
  ensaio: c.ensaios[0].titulo,
  codigo: c.galeriaId === 'demo' ? 'SPHOR2026' : c.id.toUpperCase() + '2026',
  capa: CAPAS[c.galeriaId],
  grad: c.avatarGrad,
}))

export default function Galerias() {
  const { galeriasCustom, criarGaleria } = useApp()
  const [aberta, setAberta] = useState(null)
  const [criando, setCriando] = useState(false)
  const GALERIAS = [...galeriasCustom.map((g) => ({ id: g.id, cliente: { id: g.id, nome: g.nome, ensaios: [{ titulo: g.ensaio }], avatarGrad: 'ph-gradient-2' }, nome: g.nome, ensaio: g.ensaio, codigo: g.codigo, capa: null, grad: 'ph-gradient-2', custom: true, fotosInclusas: g.inclusas || 0, totalFotos: g.fotos || 0 })), ...GALERIAS_DEMO]

  if (aberta) return <Detalhe g={aberta} onVoltar={() => setAberta(null)} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Galerias</h1>
          <p className="mt-1 text-sm text-cream-100/60">As galerias de seleção de cada cliente. Clique para gerenciar e exportar.</p>
        </div>
        <button onClick={() => setCriando(true)} className="btn-light !py-2.5 text-xs"><Plus size={15} /> Nova galeria</button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => setCriando(true)} className="group flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-100/15 p-8 text-center transition hover:border-terracotta-400/50 hover:bg-cocoa-900/40">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-cocoa-900 text-terracotta-400 transition group-hover:scale-110"><Plus size={22} /></div>
          <p className="mt-3 text-sm text-cream-100/60">Criar nova galeria</p>
        </button>

        {GALERIAS.map((g) => (
          <button key={g.id} onClick={() => setAberta(g)} className="group overflow-hidden rounded-2xl bg-cocoa-900 text-left ring-1 ring-cream-100/10 transition hover:-translate-y-1 hover:ring-terracotta-400/40">
            <div className="relative h-28">
              <Photo src={g.capa} alt={g.nome} fallback={g.grad} className="h-28" />
              <div className="absolute inset-0 bg-cocoa-950/0 transition group-hover:bg-cocoa-950/20" />
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-cocoa-950/60 px-2 py-1 text-[11px] text-cream-100/80"><Eye size={11} /> Abrir</div>
            </div>
            <div className="p-5">
              <p className="font-medium">{g.nome}</p>
              <p className="text-xs text-cream-100/50">{g.ensaio}</p>
            </div>
          </button>
        ))}
      </div>

      {criando && <NovaGaleria onClose={() => setCriando(false)} onCriar={(g) => { criarGaleria(g); setCriando(false) }} />}
    </div>
  )
}

function Detalhe({ g, onVoltar }) {
  const app = useApp()
  const ehDemo = g.id === 'demo'
  const gdata = getGaleriaData(g.id)
  // Galeria custom recém-criada ainda não tem fotos
  if (!gdata) {
    return (
      <div>
        <button onClick={onVoltar} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100"><ArrowLeft size={16} /> Voltar para galerias</button>
        <h1 className="mt-4 font-serif text-3xl">{g.nome}</h1>
        <p className="mt-1 text-sm text-cream-100/60">{g.ensaio}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10"><p className="flex items-center gap-2 text-xs text-cream-100/50"><KeyRound size={13} /> Código de acesso</p><p className="mt-1 font-mono text-lg">{g.codigo}</p></div>
          <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10"><p className="text-xs text-cream-100/50">Fotos inclusas</p><p className="mt-1 font-serif text-2xl">{g.fotosInclusas || 0}</p></div>
        </div>
        <div className="mt-6 rounded-2xl border-2 border-dashed border-cream-100/15 p-10 text-center">
          <Eye size={28} className="mx-auto text-cream-100/30" />
          <p className="mt-3 text-sm text-cream-100/60">Galeria criada! Faça o upload das fotos do ensaio para o cliente selecionar.</p>
          <p className="mt-1 text-xs text-cream-100/40">No demo, o upload de fotos entra na versão com Supabase.</p>
        </div>
      </div>
    )
  }
  const sel = ehDemo ? (app.selecoes['demo'] || []) : (gdata.selecionadas || [])
  const status = ehDemo ? app.statusEnsaio : g.cliente.ensaios[0].status
  const fotosSel = gdata.fotos.filter((f) => sel.includes(f.id))

  const exportar = () => {
    const linhas = fotosSel.map((f) => f.id + '.jpg')
    const conteudo = '# Seleção — ' + g.nome + '\n# ' + g.ensaio + '\n# ' + fotosSel.length + ' fotos\n\n' + linhas.join('\n')
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'selecao-' + g.nome.toLowerCase().replace(/\s+/g, '-') + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <button onClick={onVoltar} className="inline-flex items-center gap-2 text-sm text-cream-100/60 hover:text-cream-100"><ArrowLeft size={16} /> Voltar para galerias</button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{g.nome}</h1>
          <p className="mt-1 text-sm text-cream-100/60">{g.ensaio} · {gdata.fotos.length} fotos na galeria</p>
        </div>
        <span className="rounded-full bg-terracotta-500/15 px-3 py-1.5 text-xs text-terracotta-400">{statusLabel(status)}</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="flex items-center gap-2 text-xs text-cream-100/50"><KeyRound size={13} /> Código de acesso</p>
          <p className="mt-1 font-mono text-lg">{g.codigo}</p>
        </div>
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="text-xs text-cream-100/50">Fotos inclusas</p>
          <p className="mt-1 font-serif text-2xl">{gdata.fotosInclusas}</p>
        </div>
        <div className="rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
          <p className="text-xs text-cream-100/50">Selecionadas</p>
          <p className="mt-1 font-serif text-2xl text-terracotta-400">{sel.length}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {fotosSel.length > 0 && (
          <button onClick={exportar} className="inline-flex items-center gap-2 rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100 ring-1 ring-cream-100/15 transition hover:bg-cocoa-950"><Download size={15} /> Exportar lista p/ Lightroom</button>
        )}
        {ehDemo && sel.length === 0 && (
          <span className="rounded-full bg-cocoa-800 px-4 py-2.5 text-xs text-cream-100/50">Aguardando seleção do cliente</span>
        )}
      </div>

      <h3 className="mt-8 font-serif text-xl">{fotosSel.length > 0 ? 'Fotos selecionadas' : 'Fotos da galeria'}</h3>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {(fotosSel.length > 0 ? fotosSel : gdata.fotos.slice(0, 12)).map((f) => (
          <div key={f.id} className="group relative overflow-hidden rounded-lg ring-2 ring-terracotta-400/60">
            <Photo src={f.src} alt={f.alt} className="aspect-square" />
            {fotosSel.length > 0 && <div className="absolute right-1 top-1 rounded-full bg-terracotta-500 p-1 text-cream-50"><Check size={11} /></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function NovaGaleria({ onClose, onCriar }) {
  const [form, setForm] = useState({ nome: '', ensaio: '', codigo: '', inclusas: 15, fotos: 30 })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const valido = form.nome.trim() && form.ensaio.trim() && form.codigo.trim()
  const field = 'mt-1.5 w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm text-cream-100 outline-none focus:border-terracotta-400'

  return (
    <div onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa-950/70 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-cocoa-900 p-7 ring-1 ring-cream-100/10">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl">Nova galeria</h3>
          <button onClick={onClose} className="text-cream-100/40 hover:text-cream-100"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-cream-100/50">Crie o espaço de seleção para um cliente.</p>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm text-cream-100/80">Nome do cliente</span><input className={field} value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Família Silva" /></label>
          <label className="block"><span className="text-sm text-cream-100/80">Ensaio</span><input className={field} value={form.ensaio} onChange={(e) => set('ensaio', e.target.value)} placeholder="Ex: Newborn · Theo" /></label>
          <label className="block"><span className="text-sm text-cream-100/80">Código de acesso</span><input className={field + ' font-mono uppercase'} value={form.codigo} onChange={(e) => set('codigo', e.target.value.toUpperCase())} placeholder="Ex: SILVA2026" /></label>
        </div>
        <button onClick={() => valido && onCriar(form)} disabled={!valido} className="btn-light mt-7 w-full disabled:opacity-40"><Check size={16} /> Criar galeria</button>
        <p className="mt-3 text-center text-xs text-cream-100/40">A galeria é criada e aparece na lista.</p>
      </div>
    </div>
  )
}
