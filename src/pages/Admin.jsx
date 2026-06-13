import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Image as ImageIcon, Calendar, Users, Lock, Eye,
  Columns3, Wallet, ListTodo, FolderOpen, Receipt, BarChart3,
  FileSignature, UserCog, Workflow as WfIcon, LineChart, BookOpen, BookText, Images, FileText,
} from 'lucide-react'
import AssinaturaJV from '../components/AssinaturaJV'
import Visao from './admin/Visao'
import Selecoes from './admin/Selecoes'
import Galerias from './admin/Galerias'
import Agenda from './admin/Agenda'
import Clientes from './admin/Clientes'
import Funil from './admin/Funil'
import Financeiro from './admin/Financeiro'
import Tarefas from './admin/Tarefas'
import Contas from './admin/Contas'
import FluxoCaixa from './admin/FluxoCaixa'
import Contratos from './admin/Contratos'
import Equipe from './admin/Equipe'
import Workflow from './admin/Workflow'
import Relatorios from './admin/Relatorios'
import Diagramador from './admin/Diagramador'
import PortfolioAdmin from './admin/PortfolioAdmin'
import NotasFiscais from './admin/NotasFiscais'
import Manual from './admin/Manual'

export default function Admin() {
  const [logged, setLogged] = useState(false)
  return (
    <div className="min-h-screen bg-cocoa-950 pt-20 text-cream-100">
      {!logged ? <AdminLogin onLogin={() => setLogged(true)} /> : <Dashboard />}
      <AssinaturaJV variant="light" className="pb-6 pt-2" />
    </div>
  )
}

function AdminLogin({ onLogin }) {
  return (
    <div className="container-c grid min-h-[calc(100vh-5rem)] place-items-center py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-3xl bg-cocoa-900 p-8 ring-1 ring-cream-100/10 md:p-10">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-terracotta-500 text-cream-50"><Lock size={24} /></div>
        <h1 className="mt-6 font-serif text-3xl">Painel Administrativo</h1>
        <p className="mt-2 text-sm text-cream-100/60">Acesso restrito à equipe da Alma Fotografia.</p>
        <div className="mt-7 space-y-4">
          <input defaultValue="admin@almafotografia.com.br" className="w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm outline-none focus:border-terracotta-400" />
          <input type="password" defaultValue="admin123" className="w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm outline-none focus:border-terracotta-400" />
        </div>
        <button onClick={onLogin} className="btn-light mt-7 w-full">Entrar no painel</button>
        <p className="mt-4 text-center text-xs text-cream-100/40">Demo — clique para entrar.</p>
      </motion.div>
    </div>
  )
}

const NAV = [
  { sep: true, label: 'Operação' },
  { id: 'visao', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'selecoes', label: 'Seleções', icon: ImageIcon },
  { id: 'galerias', label: 'Galerias', icon: FolderOpen },
  { id: 'portfolio', label: 'Portfólio', icon: Images },
  { id: 'notas', label: 'Notas fiscais', icon: FileText },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'workflow', label: 'Fluxo de trabalho', icon: WfIcon },
  { id: 'diagramador', label: 'Diagramador de álbuns', icon: BookOpen },
  { sep: true, label: 'Vendas & CRM' },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'funil', label: 'Funil de vendas', icon: Columns3 },
  { id: 'contratos', label: 'Contratos', icon: FileSignature },
  { id: 'tarefas', label: 'Tarefas', icon: ListTodo },
  { sep: true, label: 'Financeiro' },
  { id: 'financeiro', label: 'Lançamentos', icon: Wallet },
  { id: 'contas', label: 'Contas a pagar/receber', icon: Receipt },
  { id: 'fluxo', label: 'Fluxo de caixa & DRE', icon: LineChart },
  { sep: true, label: 'Gestão' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'equipe', label: 'Equipe & permissões', icon: UserCog },
  { id: 'manual', label: 'Manual do painel', icon: BookText },
]

function Dashboard() {
  const [tab, setTab] = useState('visao')
  let sepCount = 0
  return (
    <div className="container-c py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-60 lg:shrink-0">
          <div className="flex items-center gap-3 rounded-2xl bg-cocoa-900 p-4 ring-1 ring-cream-100/10">
            <div className="ph-gradient-3 grid h-10 w-10 place-items-center rounded-full font-serif text-lg">S</div>
            <div>
              <p className="text-sm font-medium">Alma Fotografia</p>
              <p className="text-xs text-cream-100/50">Administrador</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {NAV.map((n) => {
              if (n.sep) { sepCount++; return <p key={'sep' + sepCount} className="mt-3 hidden px-4 text-[10px] uppercase tracking-widest text-cream-100/30 lg:block">{n.label}</p> }
              const Icon = n.icon
              return (
                <button key={n.id} onClick={() => setTab(n.id)} className={'flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ' + (tab === n.id ? 'bg-terracotta-500 text-cream-50' : 'text-cream-100/70 hover:bg-cocoa-900')}>
                  <Icon size={16} /> {n.label}
                </button>
              )
            })}
          </nav>
          <Link to="/cliente" className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-cream-100/50 hover:bg-cocoa-900"><Eye size={16} /> Ver como cliente</Link>
        </aside>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {tab === 'visao' && <Visao setTab={setTab} />}
              {tab === 'selecoes' && <Selecoes />}
              {tab === 'galerias' && <Galerias />}
              {tab === 'portfolio' && <PortfolioAdmin />}
              {tab === 'notas' && <NotasFiscais />}
              {tab === 'agenda' && <Agenda />}
              {tab === 'workflow' && <Workflow />}
              {tab === 'diagramador' && <Diagramador />}
              {tab === 'clientes' && <Clientes />}
              {tab === 'funil' && <Funil />}
              {tab === 'contratos' && <Contratos />}
              {tab === 'tarefas' && <Tarefas />}
              {tab === 'financeiro' && <Financeiro />}
              {tab === 'contas' && <Contas />}
              {tab === 'fluxo' && <FluxoCaixa />}
              {tab === 'relatorios' && <Relatorios />}
              {tab === 'equipe' && <Equipe />}
              {tab === 'manual' && <Manual />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
