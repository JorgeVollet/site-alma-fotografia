import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import ClienteModal from './ClienteModal'
import { formatBRL } from '../../components/Money'
import { CLIENTES, FUNIL_ETAPAS } from '../../data/crm'
import { useApp } from '../../context/AppContext'

export default function Funil() {
  const { funilOverride, moverFunil } = useApp()
  const [arrastando, setArrastando] = useState(null)
  const [sobre, setSobre] = useState(null)
  const [aberto, setAberto] = useState(null) // cliente no modal

  // etapa efetiva de cada cliente (override do estado tem prioridade)
  const etapaDe = (c) => funilOverride[c.id] || c.funil

  const onDrop = (etapaId) => {
    if (arrastando) moverFunil(arrastando, etapaId)
    setArrastando(null)
    setSobre(null)
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">Funil de vendas</h1>
      <p className="mt-1 text-sm text-cream-100/60">Arraste os clientes entre as etapas para acompanhar cada negócio.</p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {FUNIL_ETAPAS.map((etapa) => {
          const clientes = CLIENTES.filter((c) => etapaDe(c) === etapa.id)
          const total = clientes.reduce((s, c) => s + c.ensaios.reduce((x, e) => x + (e.valor || 0), 0), 0)
          return (
            <div
              key={etapa.id}
              onDragOver={(e) => { e.preventDefault(); setSobre(etapa.id) }}
              onDragLeave={() => setSobre((s) => (s === etapa.id ? null : s))}
              onDrop={() => onDrop(etapa.id)}
              className={'flex w-64 shrink-0 flex-col rounded-2xl p-3 ring-1 transition ' + (sobre === etapa.id ? 'bg-cocoa-800 ring-terracotta-400/50' : 'bg-cocoa-900/50 ring-cream-100/10')}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={'h-2.5 w-2.5 rounded-full ' + etapa.cor} />
                  <h3 className="text-sm font-medium">{etapa.nome}</h3>
                </div>
                <span className="rounded-full bg-cream-100/10 px-2 py-0.5 text-xs text-cream-100/60">{clientes.length}</span>
              </div>

              <div className="flex-1 space-y-2.5">
                {clientes.map((c) => {
                  const valor = c.ensaios.reduce((x, e) => x + (e.valor || 0), 0)
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setArrastando(c.id)}
                      onDragEnd={() => setArrastando(null)}
                      onClick={() => setAberto(c)}
                      className={'group cursor-pointer rounded-xl bg-cocoa-900 p-3 ring-1 ring-cream-100/10 transition active:cursor-grabbing ' + (arrastando === c.id ? 'opacity-40' : 'hover:ring-terracotta-400/40 hover:-translate-y-0.5')}
                    >
                      <div className="flex items-start gap-2">
                        <div className={c.avatarGrad + ' grid h-8 w-8 shrink-0 place-items-center rounded-full font-serif text-xs text-cream-50'}>{c.nome.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.nome}</p>
                          <p className="truncate text-xs text-cream-100/50">{c.interesse || (c.ensaios[0] && c.ensaios[0].titulo)}</p>
                        </div>
                        <GripVertical size={14} className="mt-0.5 shrink-0 text-cream-100/20 group-hover:text-cream-100/40" />
                      </div>
                      {valor > 0 && <p className="mt-2 text-right text-xs font-medium text-terracotta-400">{formatBRL(valor)}</p>}
                    </div>
                  )
                })}
                {clientes.length === 0 && (
                  <div className="rounded-xl border border-dashed border-cream-100/10 p-4 text-center text-xs text-cream-100/30">Solte aqui</div>
                )}
              </div>

              {total > 0 && (
                <div className="mt-3 border-t border-cream-100/10 px-1 pt-2 text-right text-xs text-cream-100/50">
                  {formatBRL(total)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-cream-100/40">💡 Clique num card para ver os detalhes, ou arraste para outra etapa.</p>

      <AnimatePresence>
        {aberto && (
          <ClienteModal
            cliente={aberto}
            etapaAtual={etapaDe(aberto)}
            onClose={() => setAberto(null)}
            onMover={(id, etapaId) => { moverFunil(id, etapaId); setAberto(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
