import { Trash2, ArrowUp, ArrowDown, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Copy } from 'lucide-react'
import { FONTES, CORES_PALETA } from '../../../data/album'

// Painel lateral que edita o elemento selecionado.
export default function PainelPropriedadesEl({ el, onChange, onDelete, onDuplicar, onCamada }) {
  if (!el) {
    return (
      <div className="rounded-2xl bg-cocoa-900 p-5 text-center text-sm text-cream-100/40 ring-1 ring-cream-100/10">
        Selecione um elemento no álbum para editar suas propriedades.
      </div>
    )
  }
  const set = (campos) => onChange(el.id, campos)
  const ehTexto = el.tipo === 'texto' || el.tipo === 'titulo'

  return (
    <div className="space-y-4 rounded-2xl bg-cocoa-900 p-5 ring-1 ring-cream-100/10">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-cream-100/40">{rotuloTipo(el.tipo)}</p>
        <div className="flex gap-1">
          <button onClick={() => onCamada(el.id, 1)} title="Trazer p/ frente" className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/50 hover:bg-cocoa-800 hover:text-cream-100"><ArrowUp size={14} /></button>
          <button onClick={() => onCamada(el.id, -1)} title="Enviar p/ trás" className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/50 hover:bg-cocoa-800 hover:text-cream-100"><ArrowDown size={14} /></button>
          <button onClick={() => onDuplicar(el.id)} title="Duplicar" className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/50 hover:bg-cocoa-800 hover:text-cream-100"><Copy size={13} /></button>
          <button onClick={() => onDelete(el.id)} title="Excluir" className="grid h-7 w-7 place-items-center rounded-lg text-cream-100/50 hover:bg-terracotta-500/20 hover:text-terracotta-400"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* TEXTO / TÍTULO */}
      {ehTexto && (
        <>
          <label className="block">
            <span className="text-xs text-cream-100/60">Texto</span>
            <textarea rows={2} value={el.texto} onChange={(e) => set({ texto: e.target.value })} className="mt-1 w-full resize-none rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400" />
          </label>
          <label className="block">
            <span className="text-xs text-cream-100/60">Fonte</span>
            <select value={el.fonte} onChange={(e) => set({ fonte: e.target.value })} className="mt-1 w-full rounded-lg border border-cream-100/10 bg-cocoa-950 px-3 py-2 text-sm text-cream-100 outline-none focus:border-terracotta-400">
              {FONTES.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1">
              <span className="text-xs text-cream-100/60">Tamanho: {el.tamanho}px</span>
              <input type="range" min="8" max="96" value={el.tamanho} onChange={(e) => set({ tamanho: +e.target.value })} className="mt-1 w-full accent-terracotta-500" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => set({ peso: el.peso >= 600 ? 400 : 700 })} className={'grid h-9 w-9 place-items-center rounded-lg transition ' + (el.peso >= 600 ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-950 text-cream-100/60')}><Bold size={15} /></button>
            <button onClick={() => set({ italico: !el.italico })} className={'grid h-9 w-9 place-items-center rounded-lg transition ' + (el.italico ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-950 text-cream-100/60')}><Italic size={15} /></button>
            <div className="mx-1 h-6 w-px bg-cream-100/10" />
            {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([a, Ic]) => (
              <button key={a} onClick={() => set({ align: a })} className={'grid h-9 w-9 place-items-center rounded-lg transition ' + (el.align === a ? 'bg-terracotta-500 text-cream-50' : 'bg-cocoa-950 text-cream-100/60')}><Ic size={15} /></button>
            ))}
          </div>
          <Cores label="Cor do texto" valor={el.cor} onPick={(c) => set({ cor: c })} />
        </>
      )}

      {/* FORMA */}
      {el.tipo === 'forma' && (
        <>
          <Cores label="Preenchimento" valor={el.cor} onPick={(c) => set({ cor: c })} />
          {el.forma !== 'linha' && (
            <label className="block">
              <span className="text-xs text-cream-100/60">Cantos arredondados: {el.raio || 0}px</span>
              <input type="range" min="0" max="80" value={el.raio || 0} onChange={(e) => set({ raio: +e.target.value })} className="mt-1 w-full accent-terracotta-500" />
            </label>
          )}
          <label className="block">
            <span className="text-xs text-cream-100/60">Borda: {el.borda || 0}px</span>
            <input type="range" min="0" max="12" value={el.borda || 0} onChange={(e) => set({ borda: +e.target.value })} className="mt-1 w-full accent-terracotta-500" />
          </label>
          {el.borda > 0 && <Cores label="Cor da borda" valor={el.bordaCor} onPick={(c) => set({ bordaCor: c })} />}
        </>
      )}

      {/* FOTO */}
      {el.tipo === 'foto' && (
        <label className="block">
          <span className="text-xs text-cream-100/60">Cantos arredondados: {el.raio || 0}px</span>
          <input type="range" min="0" max="80" value={el.raio || 0} onChange={(e) => set({ raio: +e.target.value })} className="mt-1 w-full accent-terracotta-500" />
        </label>
      )}

      {/* Comum: rotação + opacidade */}
      <div className="border-t border-cream-100/10 pt-3">
        <label className="block">
          <span className="text-xs text-cream-100/60">Rotação: {el.rot || 0}°</span>
          <input type="range" min="-180" max="180" value={el.rot || 0} onChange={(e) => set({ rot: +e.target.value })} className="mt-1 w-full accent-terracotta-500" />
        </label>
        <label className="mt-2 block">
          <span className="text-xs text-cream-100/60">Opacidade: {Math.round((el.opacidade != null ? el.opacidade : 1) * 100)}%</span>
          <input type="range" min="0.1" max="1" step="0.05" value={el.opacidade != null ? el.opacidade : 1} onChange={(e) => set({ opacidade: +e.target.value })} className="mt-1 w-full accent-terracotta-500" />
        </label>
      </div>
    </div>
  )
}

function Cores({ label, valor, onPick }) {
  return (
    <div>
      <span className="text-xs text-cream-100/60">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {CORES_PALETA.map((c) => (
          <button key={c} onClick={() => onPick(c)} className={'h-7 w-7 rounded-full ring-2 transition ' + (valor === c ? 'ring-terracotta-400' : 'ring-cream-100/10 hover:ring-cream-100/40')} style={{ background: c }} />
        ))}
        <label className="grid h-7 w-7 cursor-pointer place-items-center rounded-full ring-2 ring-cream-100/10" style={{ background: valor }}>
          <input type="color" value={valor} onChange={(e) => onPick(e.target.value)} className="h-0 w-0 opacity-0" />
        </label>
      </div>
    </div>
  )
}

function rotuloTipo(t) {
  return { foto: 'Foto', texto: 'Texto', titulo: 'Título', forma: 'Forma' }[t] || t
}
