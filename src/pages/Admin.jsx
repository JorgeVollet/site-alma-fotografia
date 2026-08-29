import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Image as ImageIcon, Calendar, Users, Lock, Eye,
  Columns3, Wallet, ListTodo, FolderOpen, Receipt, BarChart3,
  FileSignature, UserCog, Workflow as WfIcon, LineChart, BookOpen, BookText, Images, FileText, PanelLeftClose, PanelLeft, ChevronRight, LogOut,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
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
  const [session, setSession] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // sessão atual (se já estava logado) + escuta mudanças de auth
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <div className="painel-claro min-h-screen pt-20">
      {carregando ? (
        <div className="container-c grid min-h-[calc(100vh-5rem)] place-items-center">
          <p className="text-sm text-cream-100/50">Carregando…</p>
        </div>
      ) : !session ? (
        <AdminLogin />
      ) : (
        <Dashboard
          email={session.user?.email}
          onLogout={() => supabase.auth.signOut()}
        />
      )}
      <AssinaturaJV variant="dark" className="pb-6 pt-2" />
    </div>
  )
}

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    setEntrando(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })
    setEntrando(false)
    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar. Tente de novo.'
      )
    }
    // sucesso: o onAuthStateChange do componente Admin troca a tela sozinho.
  }

  return (
    <div className="container-c grid min-h-[calc(100vh-5rem)] place-items-center py-12">
      <motion.form
        onSubmit={entrar}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl bg-cocoa-900 p-8 ring-1 ring-cream-100/10 md:p-10"
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-terracotta-500 text-cream-50"><Lock size={24} /></div>
        <h1 className="mt-6 font-serif text-3xl">Painel Administrativo</h1>
        <p className="mt-2 text-sm text-cream-100/60">Acesso restrito à equipe da Alma Fotografia.</p>
        <div className="mt-7 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm outline-none focus:border-terracotta-400"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="w-full rounded-xl border border-cream-100/10 bg-cocoa-950 px-4 py-3 text-sm outline-none focus:border-terracotta-400"
          />
        </div>
        {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
        <button type="submit" disabled={entrando} className="btn-light mt-7 w-full disabled:opacity-60">
          {entrando ? 'Entrando…' : 'Entrar no painel'}
        </button>
      </motion.form>
    </div>
  )
}

// Nota fiscal ADIADA (decisão do Maurício, ago/2026): a reforma tributária de
// 2027 muda as regras, e por ora ele emite pela maquininha. O módulo continua
// pronto no código (NotasFiscais.jsx + migrations 12/14) — para religar, basta
// voltar esta flag para true.
const NF_ATIVA = false

const NAV = [
  { sep: true, label: 'Operação' },
  { id: 'visao', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'selecoes', label: 'Seleções', icon: ImageIcon },
  { id: 'galerias', label: 'Galerias', icon: FolderOpen },
  { id: 'portfolio', label: 'Portfólio', icon: Images },
  ...(NF_ATIVA ? [{ id: 'notas', label: 'Notas fiscais', icon: FileText }] : []),
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

function Dashboard({ email, onLogout }) {
  const [tab, setTab] = useState('visao')
  const [aberta, setAberta] = useState(true)
  const [hover, setHover] = useState(false)
  // 'exp' = expandida visualmente: aberta OU mouse em cima quando recolhida
  const exp = aberta || hover
  let sepCount = 0
  return (
    <div className="container-c py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside
          onMouseEnter={() => !aberta && setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={'lg:shrink-0 transition-all duration-300 ' + (exp ? 'lg:w-52' : 'lg:w-[62px]')}
        >
          {/* cabeçalho do estúdio + botão recolher */}
          <div className={'flex items-center rounded-2xl bg-cocoa-900 ring-1 ring-cream-100/10 ' + (exp ? 'gap-2 p-3' : 'flex-col gap-2 p-2')}>
            <div className="ph-gradient-3 grid h-9 w-9 shrink-0 place-items-center rounded-full font-serif text-base">S</div>
            {exp && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Alma Fotografia</p>
                <p className="truncate text-xs text-cream-100/50" title={email}>{email || 'Equipe'}</p>
              </div>
            )}
            <button
              onClick={() => { setAberta((v) => !v); setHover(false) }}
              className="shrink-0 rounded-lg p-1.5 text-cream-100/50 transition hover:bg-cocoa-800 hover:text-cream-100"
              title={aberta ? 'Recolher menu' : 'Fixar menu aberto'}
              aria-label={aberta ? 'Recolher menu' : 'Fixar menu aberto'}
            >
              {aberta ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
          </div>

          <nav className="mt-3 flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-0.5">
            {NAV.map((n) => {
              if (n.sep) {
                sepCount++
                return exp
                  ? <p key={'sep' + sepCount} className="mt-3 hidden px-3 text-[10px] uppercase tracking-widest text-cream-100/30 lg:block">{n.label}</p>
                  : <div key={'sep' + sepCount} className="mt-2 hidden h-px bg-cream-100/10 lg:block" />
              }
              const Icon = n.icon
              const ativo = tab === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  title={!exp ? n.label : undefined}
                  className={'flex shrink-0 items-center gap-3 rounded-xl text-sm transition-colors ' + (exp ? 'px-3 py-2' : 'justify-center px-0 py-2.5') + ' ' + (ativo ? 'bg-terracotta-500 text-cream-50' : 'text-cream-100/70 hover:bg-cocoa-900')}
                >
                  <Icon size={17} className="shrink-0" /> {exp && <span className="truncate">{n.label}</span>}
                </button>
              )
            })}
          </nav>

          <Link to="/cliente" title={!exp ? 'Ver como cliente' : undefined} className={'mt-3 flex items-center gap-3 rounded-xl text-sm text-cream-100/50 transition hover:bg-cocoa-900 ' + (exp ? 'px-3 py-2.5' : 'justify-center py-2.5')}>
            <Eye size={16} className="shrink-0" /> {exp && 'Ver como cliente'}
          </Link>
          <button onClick={onLogout} title={!exp ? 'Sair' : undefined} className={'mt-1 flex w-full items-center gap-3 rounded-xl text-sm text-cream-100/50 transition hover:bg-cocoa-900 hover:text-red-300 ' + (exp ? 'px-3 py-2.5' : 'justify-center py-2.5')}>
            <LogOut size={16} className="shrink-0" /> {exp && 'Sair'}
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {tab === 'visao' && <Visao setTab={setTab} />}
              {tab === 'selecoes' && <Selecoes />}
              {tab === 'galerias' && <Galerias />}
              {tab === 'portfolio' && <PortfolioAdmin />}
              {tab === 'notas' && NF_ATIVA && <NotasFiscais />}
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
