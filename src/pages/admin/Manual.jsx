import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookText } from 'lucide-react'
import { SecaoIntro, SecaoVisao, SecaoFotos, SecaoSelecoes, SecaoGalerias, SecaoPortfolio, SecaoNotasFiscais, SecaoAgenda, SecaoWorkflow } from './manual/secoesA'
import { SecaoClientesFunil, SecaoContratos, SecaoTarefas, SecaoFinanceiro, SecaoContas, SecaoFluxoDRE, SecaoRelatorios, SecaoWhatsApp, SecaoCosturas } from './manual/secoesB'

const INDICE = [
  { id: 'intro', label: '1. Introdução' },
  { id: 'visao', label: '2. Visão geral' },
  { id: 'fotos', label: '3. Recebimento e envio de fotos' },
  { id: 'selecoes', label: '4. Seleções e pagamento' },
  { id: 'galerias', label: '5. Galerias' },
  { id: 'portfolio', label: '6. Portfólio' },
  { id: 'notas', label: '7. Notas fiscais' },
  { id: 'agenda', label: '8. Agenda' },
  { id: 'workflow', label: '9. Fluxo de trabalho' },
  { id: 'clientes', label: '10. Clientes e Funil' },
  { id: 'contratos', label: '11. Contratos' },
  { id: 'tarefas', label: '12. Tarefas' },
  { id: 'financeiro', label: '13. Lançamentos' },
  { id: 'contas', label: '14. Contas a pagar/receber' },
  { id: 'fluxo', label: '15. Fluxo de caixa e DRE' },
  { id: 'relatorios', label: '16. Relatórios' },
  { id: 'whatsapp', label: '17. Integrações e WhatsApp' },
  { id: 'costuras', label: '18. Conexões entre módulos' },
]

export default function Manual() {
  const [ativo, setAtivo] = useState('intro')

  const irPara = (id) => {
    setAtivo(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-terracotta-500 text-cream-50"><BookText size={24} /></div>
        <div>
          <h1 className="font-serif text-3xl">Manual do painel</h1>
          <p className="text-sm text-cream-100/60">Guia completo de todas as funcionalidades e como elas se conectam.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Índice lateral */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="flex gap-1.5 overflow-x-auto rounded-2xl bg-cocoa-900 p-2 ring-1 ring-cream-100/10 lg:flex-col lg:overflow-visible">
            {INDICE.map((s) => (
              <button key={s.id} onClick={() => irPara(s.id)} className={'shrink-0 rounded-xl px-3 py-2 text-left text-xs transition ' + (ativo === s.id ? 'bg-terracotta-500 text-cream-50' : 'text-cream-100/60 hover:bg-cocoa-800 hover:text-cream-100')}>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Conteúdo */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-12 pb-12">
          <SecaoIntro />
          <SecaoVisao />
          <SecaoFotos />
          <SecaoSelecoes />
          <SecaoGalerias />
          <SecaoPortfolio />
          <SecaoNotasFiscais />
          <SecaoAgenda />
          <SecaoWorkflow />
          <SecaoClientesFunil />
          <SecaoContratos />
          <SecaoTarefas />
          <SecaoFinanceiro />
          <SecaoContas />
          <SecaoFluxoDRE />
          <SecaoRelatorios />
          <SecaoWhatsApp />
          <SecaoCosturas />
        </motion.div>
      </div>
    </div>
  )
}
