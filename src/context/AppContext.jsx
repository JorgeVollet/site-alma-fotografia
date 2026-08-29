import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { ensaiosDemo } from '../data/galleries'
import { supabase } from '../lib/supabase'
import { FUNIL_ETAPAS } from '../data/crm'
import { etapaFunilDeGaleria } from '../data/statusEnsaio'
import { fetchClientes, criarCliente, atualizarCliente, moverClienteFunil } from '../lib/clientes'
import { fetchEnsaios, criarEnsaio as dbCriarEnsaio, atualizarEnsaio as dbAtualizarEnsaio, removerEnsaio as dbRemoverEnsaio } from '../lib/ensaios'
import { criarAgendamento, fetchAgendamentos, atualizarAgendamentoStatus, confirmarAgendamentoDB } from '../lib/agendamentos'
import { fetchGalerias, atualizarGaleria } from '../lib/galerias'
import {
  fetchContratos,
  criarContrato as dbCriarContrato,
  atualizarContrato as dbAtualizarContrato,
  assinarContrato as dbAssinarContrato,
  enviarContrato as dbEnviarContrato,
  excluirContrato as dbExcluirContrato,
} from '../lib/contratos'
import { fetchNotas, fetchFaturaveis, gerarNota as dbGerarNota, marcarNotaEmitida as dbMarcarNotaEmitida, cancelarNota as dbCancelarNota, reverterEmissao as dbReverterEmissao, excluirNota as dbExcluirNota } from '../lib/notas'

// ordem das etapas do funil (p/ nunca regredir uma etapa já avançada)
const ORDEM_FUNIL = FUNIL_ETAPAS.reduce((acc, e, i) => { acc[e.id] = i; return acc }, {})
const etapaMax = (a, b) => {
  if (!a) return b
  if (!b) return a
  return (ORDEM_FUNIL[a] ?? 0) >= (ORDEM_FUNIL[b] ?? 0) ? a : b
}

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const STORAGE_KEY = 'alma_fotografia_demo_v1'

// Ensaios iniciais já populados (derivados das fotos da pasta /fotos),
// para o admin já abrir com galerias prontas para editar/adicionar fotos.
function ensaiosIniciais() {
  return ensaiosDemo().map((e) => ({ ...e, demo: false, criadoEm: new Date().toISOString() }))
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      // mescla com DEFAULT_STATE para garantir que campos novos sempre existam
      const parsed = JSON.parse(raw)
      const merged = { ...DEFAULT_STATE, ...parsed }
      // semeia os ensaios se ainda não existirem no state salvo
      if (!Array.isArray(parsed.ensaios) || parsed.ensaios.length === 0) {
        merged.ensaios = ensaiosIniciais()
      }
      return merged
    }
  } catch (e) {
    /* ignore */
  }
  return null
}

// Datas/horários bloqueados de exemplo (admin define disponibilidade)
const HORARIOS_PADRAO = ['09:00', '10:30', '14:00', '15:30', '17:00']

// Retorna a data daqui a 3 dias ÚTEIS (pula sábado e domingo).
function prazoTresDiasUteis(base = new Date()) {
  const d = new Date(base)
  let uteis = 0
  while (uteis < 3) {
    d.setDate(d.getDate() + 1)
    const dia = d.getDay() // 0=dom, 6=sáb
    if (dia !== 0 && dia !== 6) uteis++
  }
  d.setHours(23, 59, 59, 999)
  return d
}

const DEFAULT_STATE = {
  // seleção de fotos por galeria { galeriaId: [fotoId, ...] }
  selecoes: { demo: [] },
  // agendamentos feitos no site
  agendamentos: [],
  // status do ensaio da Helena (demo ao vivo): selecionando|enviado|editando|pronto
  statusEnsaio: 'selecionando',
  // PAGAMENTO do valor restante (após a reserva do agendamento).
  // statusPagamento: 'aguardando' (ainda não enviou seleção) | 'pendente' | 'pago'
  // valorPendente: R$ a acertar | prazoPagamento: ISO date (+3 dias úteis) | pagoEm: ISO
  pagamento: { statusPagamento: 'aguardando', valorPendente: 0, prazoPagamento: null, pagoEm: null, metodo: null },
  // calendário: dias bloqueados (indisponíveis) e horários bloqueados por dia
  diasBloqueados: [],
  horariosBloqueados: {}, // { 'YYYY-MM-DD': ['09:00', ...] }
  // horários PERSONALIZADOS por dia. Se um dia tem entrada aqui, usa essa
  // lista no lugar do padrão. { 'YYYY-MM-DD': ['08:30', '11:00', ...] }
  horariosCustom: {},
  // buffer (em horas) bloqueado ANTES e DEPOIS de cada ensaio agendado.
  // Ex: 1 antes + 2 depois -> ao reservar 09:00, some 08:00, 10:00 e 11:00.
  bufferAntes: 1,
  bufferDepois: 2,
  // funil: { clienteId: etapaId } — sobrescreve o padrão do crm.js
  funilOverride: {},
  // status de ensaio por cliente { clienteId: 'selecionando'|'enviado'|'editando'|'pronto' }
  // (FASE 1 — status real por cliente, generaliza o statusEnsaio global)
  statusEnsaioOverride: {},
  // tarefas concluídas extras { id: true }
  tarefasFeitas: {},
  // log de notificações enviadas (demo)
  notificacoes: [],
  // tarefas customizadas criadas pelo usuário (além das costuradas)
  tarefasCustom: [],
  // edições de tarefas pré-existentes { id: {campos...} }
  tarefasEdit: {},
  // tarefas pré-existentes excluídas { id: true }
  tarefasExcluidas: {},
  // progresso de edição por cliente { clienteId: { editadas: n } }
  producaoOverride: {},
  // lançamentos financeiros customizados (além dos demo)
  financeiroCustom: [],
  // edições de lançamentos demo { id: {campos} }
  financeiroEdit: {},
  // lançamentos demo excluídos { id: true }
  financeiroExcluido: {},
  // contas a pagar/receber: edições e marcações
  contasEdit: {}, // { id: { status } }
  contasCustom: [],
  contasExcluida: {},
  // (contratos agora vêm do banco — ver contratosDB)
  // workflow: { projetoId: { etapa, responsavel } }
  workflowOverride: {},
  // clientes adicionados pelo admin + edições dos demo
  clientesCustom: [],
  clientesEdit: {},
  // equipe: membros adicionados + estado (ativo) dos demo
  membrosCustom: [],
  membrosState: {}, // { id: { ativo } }
  // galerias criadas pelo admin
  galeriasCustom: [],
  // álbuns do diagramador { id, nome, clienteId, formato, spreads:[...] }
  albuns: [],
  // ENSAIOS do portfólio criados pelo admin. Cada ensaio vira um card no
  // portfólio público e abre uma página própria com a galeria completa.
  // { id, titulo, subtitulo, categoria, capa, fotos:[{id, src}], criadoEm }
  // (modelo espelha futuras tabelas Supabase: ensaios + ensaio_fotos)
  // Já vem populado com os ensaios das fotos da pasta /fotos.
  ensaios: ensaiosIniciais(),
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => load() || DEFAULT_STATE)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (e) {
      /* ignore */
    }
  }, [state])

  // === BLOCO 2/3 — DADOS NO BANCO ==================================
  // clientes + ensaios + agendamentos vêm do Supabase. Carregam só quando
  // há sessão (equipe logada); no site público ficam vazios (RLS bloqueia).
  const [clientesDB, setClientesDB] = useState([])
  const [ensaiosDB, setEnsaiosDB] = useState([])
  const [agendamentosDB, setAgendamentosDB] = useState([])
  const [galeriasDB, setGaleriasDB] = useState([])
  const [contratosDB, setContratosDB] = useState([])
  const [notasDB, setNotasDB] = useState([])
  const [faturaveisDB, setFaturaveisDB] = useState([])
  useEffect(() => {
    let vivo = true
    const carregar = async (session) => {
      if (!session) {
        if (vivo) { setClientesDB([]); setEnsaiosDB([]); setAgendamentosDB([]); setGaleriasDB([]); setContratosDB([]); setNotasDB([]); setFaturaveisDB([]) }
        return
      }
      const [cli, ens, ags, gal, ctr, nfs, fat] = await Promise.all([
        fetchClientes(), fetchEnsaios(), fetchAgendamentos(), fetchGalerias(), fetchContratos(), fetchNotas(), fetchFaturaveis(),
      ])
      if (vivo) { setClientesDB(cli); setEnsaiosDB(ens); setAgendamentosDB(ags); setGaleriasDB(gal); setContratosDB(ctr); setNotasDB(nfs); setFaturaveisDB(fat) }
    }
    supabase.auth.getSession().then(({ data }) => carregar(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => carregar(session))
    return () => { vivo = false; sub.subscription.unsubscribe() }
  }, [])

  // === CLIENTE UNIFICADO ===========================================
  // Lista efetiva de clientes: vem do BANCO (clientesDB), com as camadas
  // de override ainda aplicadas por cima (funilOverride/statusEnsaioOverride
  // são usadas pelas costuras de contrato/workflow). Qualquer módulo deve
  // ler ESTA lista.
  const clientes = useMemo(() => {
    return clientesDB.map((c) => {
      const base = { ...c, ...(state.clientesEdit[c.id] || {}) }
      // ensaios do cliente, com STATUS derivado da galeria ligada (se houver)
      const ensaios = ensaiosDB
        .filter((e) => e.clienteId === c.id)
        .map((e) => {
          const g = galeriasDB.find((gg) => gg.ensaioId === e.id)
          return { ...e, status: g ? g.status : e.status, galeriaId: g ? g.id : null }
        })
      // etapa do funil = posição MANUAL (override do workflow) ou a guardada no
      // banco. NÃO é mais "puxada pra frente" pela galeria a cada render — isso
      // travava mover o card pra trás depois que o cliente recebia uma seleção
      // (pior ainda com vários ensaios no mesmo cliente: um ensaio entregue
      // prendia o cliente inteiro). O avanço automático ao mudar o status da
      // galeria continua existindo, mas PERSISTIDO (em mudarStatusGaleria) — então
      // você pode mover o cliente livremente pra qualquer etapa quando quiser.
      const etapa = state.funilOverride[c.id] || base.funil
      return { ...base, funil: etapa, etapa, ensaios }
    })
  }, [clientesDB, ensaiosDB, galeriasDB, state.clientesEdit, state.funilOverride])

  const getCliente = useCallback((id) => clientes.find((c) => c.id === id), [clientes])
  const getClienteNome = useCallback((id) => (clientes.find((c) => c.id === id) || {}).nome || id, [clientes])
  const getClienteEtapa = useCallback((id) => (clientes.find((c) => c.id === id) || {}).etapa, [clientes])

  // --- Seleção de fotos ---------------------------------------------
  const toggleFoto = useCallback((galeriaId, fotoId) => {
    setState((s) => {
      const atual = s.selecoes[galeriaId] || []
      const existe = atual.includes(fotoId)
      const nova = existe ? atual.filter((id) => id !== fotoId) : [...atual, fotoId]
      return { ...s, selecoes: { ...s.selecoes, [galeriaId]: nova } }
    })
  }, [])

  const limparSelecao = useCallback((galeriaId) => {
    setState((s) => ({ ...s, selecoes: { ...s.selecoes, [galeriaId]: [] } }))
  }, [])

  const enviarSelecao = useCallback(() => {
    setState((s) => ({ ...s, statusEnsaio: 'enviado' }))
  }, [])

  // --- Pagamento do valor restante ----------------------------------
  // Marca o valor como pendente, com prazo de 3 dias úteis a partir de agora.
  const definirPendencia = useCallback((valor) => {
    setState((s) => ({
      ...s,
      pagamento: {
        statusPagamento: 'pendente',
        valorPendente: valor,
        prazoPagamento: prazoTresDiasUteis().toISOString(),
        pagoEm: null,
        metodo: null,
      },
    }))
  }, [])

  // Registra o pagamento (agora, no popup ou na área do cliente).
  const registrarPagamento = useCallback((metodo) => {
    setState((s) => ({
      ...s,
      pagamento: { ...s.pagamento, statusPagamento: 'pago', pagoEm: new Date().toISOString(), metodo: metodo || 'pix' },
    }))
  }, [])

  // --- Admin: status do ensaio + notificações -----------------------
  const marcarEditando = useCallback((notif) => {
    setState((s) => ({
      ...s,
      statusEnsaio: 'editando',
      notificacoes: notif ? [{ ...notif, em: new Date().toISOString() }, ...s.notificacoes] : s.notificacoes,
    }))
  }, [])

  const liberarDownload = useCallback((notif) => {
    // A costura "entrega -> entregue no funil" agora vem do status real da
    // galeria (status 'pronto' => etapa 'entregue', derivado no memo `clientes`).
    setState((s) => ({
      ...s,
      statusEnsaio: 'pronto',
      notificacoes: notif ? [{ ...notif, em: new Date().toISOString() }, ...s.notificacoes] : s.notificacoes,
    }))
  }, [])

  const registrarNotificacao = useCallback((notif) => {
    setState((s) => ({ ...s, notificacoes: [{ ...notif, em: new Date().toISOString() }, ...s.notificacoes] }))
  }, [])

  const resetDemo = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  // Recarrega clientes+ensaios+agendamentos+galerias do banco (se houver sessão).
  const recarregarCRM = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    const [cli, ens, ags, gal, ctr, nfs, fat] = await Promise.all([
      fetchClientes(), fetchEnsaios(), fetchAgendamentos(), fetchGalerias(), fetchContratos(), fetchNotas(), fetchFaturaveis(),
    ])
    setClientesDB(cli); setEnsaiosDB(ens); setAgendamentosDB(ags); setGaleriasDB(gal); setContratosDB(ctr); setNotasDB(nfs); setFaturaveisDB(fat)
  }, [])

  // Recarrega só contratos + notas + fila de faturáveis (mais leve).
  const recarregarFiscal = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return
    const [ctr, nfs, fat] = await Promise.all([fetchContratos(), fetchNotas(), fetchFaturaveis()])
    setContratosDB(ctr); setNotasDB(nfs); setFaturaveisDB(fat)
  }, [])

  // --- Galeria: mudar status (com costura p/ o funil do cliente) ----
  const mudarStatusGaleria = useCallback(async (galeriaId, novoStatus) => {
    const g = await atualizarGaleria(galeriaId, { status: novoStatus })
    if (!g) return null
    setGaleriasDB((l) => l.map((x) => (x.id === galeriaId ? { ...x, status: novoStatus } : x)))
    // costura: avança o cliente no funil (forward-only), persistindo no banco
    if (g.clienteId) {
      const etapa = etapaFunilDeGaleria(novoStatus)
      const atual = clientesDB.find((c) => c.id === g.clienteId)
      const etapaAtual = atual?.funil_etapa || atual?.funil
      if (etapaMax(etapaAtual, etapa) === etapa && etapa !== etapaAtual) {
        moverClienteFunil(g.clienteId, etapa)
        setClientesDB((l) => l.map((c) => (c.id === g.clienteId ? { ...c, funil: etapa, etapa } : c)))
      }
    }
    return g
  }, [clientesDB])

  // --- Agendamentos: confirmar (com duração real) / cancelar --------
  const confirmarAgendamento = useCallback(async (id, duracaoMin) => {
    await confirmarAgendamentoDB(id, duracaoMin)
    setAgendamentosDB((l) => l.map((a) => (a.id === id ? { ...a, status: 'confirmado', duracaoMin: duracaoMin || null } : a)))
  }, [])
  const cancelarAgendamento = useCallback(async (id) => {
    await atualizarAgendamentoStatus(id, 'cancelado')
    setAgendamentosDB((l) => l.map((a) => (a.id === id ? { ...a, status: 'cancelado' } : a)))
  }, [])

  // --- Agendamentos (banco) -----------------------------------------
  // Reserva do site: grava no Supabase (anon insert, status "a-confirmar").
  // O trigger no banco pode ter criado/ligado um cliente + ensaio (costura),
  // então recarregamos o CRM para refletir isso na hora (se logado).
  const adicionarAgendamento = useCallback(async (ag) => {
    const novo = await criarAgendamento(ag)
    await recarregarCRM()
    return novo
  }, [recarregarCRM])

  // --- Calendário de disponibilidade --------------------------------
  const toggleDiaBloqueado = useCallback((dia) => {
    setState((s) => {
      const existe = s.diasBloqueados.includes(dia)
      return {
        ...s,
        diasBloqueados: existe ? s.diasBloqueados.filter((d) => d !== dia) : [...s.diasBloqueados, dia],
      }
    })
  }, [])

  const toggleHorarioBloqueado = useCallback((dia, hora) => {
    setState((s) => {
      const atual = s.horariosBloqueados[dia] || []
      const existe = atual.includes(hora)
      const nova = existe ? atual.filter((h) => h !== hora) : [...atual, hora]
      return { ...s, horariosBloqueados: { ...s.horariosBloqueados, [dia]: nova } }
    })
  }, [])

  // lista de horários de um dia: usa os custom se existirem, senão o padrão.
  const horariosDoDia = useCallback(
    (dia) => {
      const custom = state.horariosCustom[dia]
      const base = custom && custom.length ? custom : HORARIOS_PADRAO
      return [...base].sort()
    },
    [state.horariosCustom]
  )

  // garante que o dia tenha uma lista própria (copia o padrão na 1ª edição)
  const baseDia = (s, dia) => {
    const c = s.horariosCustom[dia]
    return c && c.length ? c : [...HORARIOS_PADRAO]
  }

  // adiciona um horário novo ao dia
  const adicionarHorario = useCallback((dia, hora) => {
    if (!hora) return
    setState((s) => {
      const lista = baseDia(s, dia)
      if (lista.includes(hora)) return s
      const nova = [...lista, hora].sort()
      return { ...s, horariosCustom: { ...s.horariosCustom, [dia]: nova } }
    })
  }, [])

  // edita um horário existente (troca o valor) no dia
  const editarHorario = useCallback((dia, horaAntiga, horaNova) => {
    if (!horaNova || horaNova === horaAntiga) return
    setState((s) => {
      const lista = baseDia(s, dia)
      const nova = lista.map((h) => (h === horaAntiga ? horaNova : h)).filter((h, i, arr) => arr.indexOf(h) === i).sort()
      // se o antigo estava bloqueado, mantém o bloqueio no novo
      const bloq = s.horariosBloqueados[dia] || []
      const novoBloq = bloq.includes(horaAntiga) ? [...bloq.filter((h) => h !== horaAntiga), horaNova] : bloq
      return {
        ...s,
        horariosCustom: { ...s.horariosCustom, [dia]: nova },
        horariosBloqueados: { ...s.horariosBloqueados, [dia]: novoBloq },
      }
    })
  }, [])

  // remove um horário do dia
  const removerHorario = useCallback((dia, hora) => {
    setState((s) => {
      const lista = baseDia(s, dia)
      const nova = lista.filter((h) => h !== hora)
      const bloq = (s.horariosBloqueados[dia] || []).filter((h) => h !== hora)
      return {
        ...s,
        horariosCustom: { ...s.horariosCustom, [dia]: nova },
        horariosBloqueados: { ...s.horariosBloqueados, [dia]: bloq },
      }
    })
  }, [])

  // converte 'HH:MM' em minutos desde 00:00 (pra calcular janelas de buffer)
  const paraMin = (h) => {
    const [hh, mm] = h.split(':').map(Number)
    return hh * 60 + mm
  }

  // horários livres para um dia (considerando bloqueios + agendamentos +
  // BUFFER antes/depois de cada ensaio ocupado, definido pelo admin).
  const horariosLivres = useCallback(
    (dia) => {
      if (state.diasBloqueados.includes(dia)) return []
      const bloq = state.horariosBloqueados[dia] || []
      // reservas do dia (não canceladas). Cada uma bloqueia a janela
      // [hora − bufferAntes, hora + DURAÇÃO + bufferDepois]. Reserva sem
      // duração ainda usa um padrão de 60 min até ser confirmada.
      const doDia = agendamentosDB.filter((a) => a.dia === dia && a.status !== 'cancelado')

      const antesMin = (state.bufferAntes || 0) * 60
      const depoisMin = (state.bufferDepois || 0) * 60

      const custom = state.horariosCustom[dia]
      const lista = custom && custom.length ? [...custom].sort() : HORARIOS_PADRAO

      return lista.filter((h) => {
        if (bloq.includes(h)) return false
        const hMin = paraMin(h)
        const dentro = doDia.some((a) => {
          if (!a.hora) return false // reserva sem horário não bloqueia slot específico
          const oMin = paraMin(a.hora)
          if (Number.isNaN(oMin)) return false
          const dur = a.duracaoMin || 60
          return hMin >= oMin - antesMin && hMin <= oMin + dur + depoisMin
        })
        return !dentro
      })
    },
    [state.diasBloqueados, state.horariosBloqueados, agendamentosDB, state.bufferAntes, state.bufferDepois, state.horariosCustom]
  )

  // admin define o buffer (horas) antes e depois de cada ensaio
  const setBuffer = useCallback((antes, depois) => {
    setState((s) => ({
      ...s,
      bufferAntes: Math.max(0, Number(antes) || 0),
      bufferDepois: Math.max(0, Number(depois) || 0),
    }))
  }, [])

  // --- Funil --------------------------------------------------------
  // Move o cliente de etapa no banco (otimista na UI, persiste no Supabase).
  const moverFunil = useCallback((clienteId, etapaId) => {
    setClientesDB((l) => l.map((c) => (c.id === clienteId ? { ...c, funil: etapaId, etapa: etapaId } : c)))
    // limpa eventual override antigo pra não mascarar o valor do banco
    setState((s) => {
      if (!(clienteId in s.funilOverride)) return s
      const { [clienteId]: _, ...resto } = s.funilOverride
      return { ...s, funilOverride: resto }
    })
    moverClienteFunil(clienteId, etapaId)
  }, [])

  // --- Tarefas ------------------------------------------------------
  const toggleTarefa = useCallback((id) => {
    setState((s) => ({ ...s, tarefasFeitas: { ...s.tarefasFeitas, [id]: !s.tarefasFeitas[id] } }))
  }, [])

  const adicionarTarefa = useCallback((tarefa) => {
    setState((s) => ({
      ...s,
      tarefasCustom: [{ ...tarefa, id: 'custom-' + Date.now(), custom: true }, ...s.tarefasCustom],
    }))
  }, [])

  const editarTarefa = useCallback((id, campos, custom) => {
    setState((s) => {
      if (custom) {
        return { ...s, tarefasCustom: s.tarefasCustom.map((t) => (t.id === id ? { ...t, ...campos } : t)) }
      }
      return { ...s, tarefasEdit: { ...s.tarefasEdit, [id]: { ...(s.tarefasEdit[id] || {}), ...campos } } }
    })
  }, [])

  const excluirTarefa = useCallback((id, custom) => {
    setState((s) => {
      if (custom) {
        return { ...s, tarefasCustom: s.tarefasCustom.filter((t) => t.id !== id) }
      }
      return { ...s, tarefasExcluidas: { ...s.tarefasExcluidas, [id]: true } }
    })
  }, [])

  // --- Produção (progresso de edição) -------------------------------
  const setEditadas = useCallback((clienteId, editadas) => {
    setState((s) => ({ ...s, producaoOverride: { ...s.producaoOverride, [clienteId]: { editadas } } }))
  }, [])

  // --- Financeiro ---------------------------------------------------
  const adicionarLancamento = useCallback((lanc) => {
    setState((s) => ({ ...s, financeiroCustom: [{ ...lanc, id: 'fin-' + Date.now(), custom: true }, ...s.financeiroCustom] }))
  }, [])

  const editarLancamento = useCallback((id, campos, custom) => {
    setState((s) => {
      if (custom) {
        return { ...s, financeiroCustom: s.financeiroCustom.map((l) => (l.id === id ? { ...l, ...campos } : l)) }
      }
      return { ...s, financeiroEdit: { ...s.financeiroEdit, [id]: { ...(s.financeiroEdit[id] || {}), ...campos } } }
    })
  }, [])

  const excluirLancamento = useCallback((id, custom) => {
    setState((s) => {
      if (custom) {
        return { ...s, financeiroCustom: s.financeiroCustom.filter((l) => l.id !== id) }
      }
      return { ...s, financeiroExcluido: { ...s.financeiroExcluido, [id]: true } }
    })
  }, [])

  // --- Contas a pagar/receber ---------------------------------------
  // Ao quitar uma conta, gera um lançamento no financeiro (costura).
  // Ao reverter, remove esse lançamento. O lançamento carrega contaOrigem=id.
  const marcarConta = useCallback((id, status, custom, conta) => {
    setState((s) => {
      const quitou = status === 'pago' || status === 'recebido'
      const pagoEm = quitou ? new Date().toISOString().slice(0, 10) : ''
      let financeiroCustom = s.financeiroCustom
      if (quitou && conta) {
        // evita duplicar
        const jaExiste = financeiroCustom.some((l) => l.contaOrigem === id)
        if (!jaExiste) {
          financeiroCustom = [{
            id: 'fin-conta-' + id,
            custom: true,
            contaOrigem: id,
            tipo: conta.tipo === 'receber' ? 'entrada' : 'saida',
            descricao: conta.descricao,
            valor: conta.valor,
            categoria: conta.categoria || (conta.tipo === 'receber' ? 'Pacote' : 'Outros'),
            data: pagoEm,
            dataPagamento: pagoEm,
            status: 'pago',
            cliente: conta.cliente || '',
          }, ...financeiroCustom]
        }
      } else if (!quitou) {
        // reverteu: remove o lançamento gerado
        financeiroCustom = financeiroCustom.filter((l) => l.contaOrigem !== id)
      }
      const novoEstado = { ...s, financeiroCustom }
      if (custom) return { ...novoEstado, contasCustom: s.contasCustom.map((c) => (c.id === id ? { ...c, status, pagoEm } : c)) }
      return { ...novoEstado, contasEdit: { ...s.contasEdit, [id]: { ...(s.contasEdit[id] || {}), status, pagoEm } } }
    })
  }, [])

  const adicionarConta = useCallback((conta) => {
    setState((s) => ({ ...s, contasCustom: [{ ...conta, id: 'conta-' + Date.now(), custom: true }, ...s.contasCustom] }))
  }, [])

  const editarConta = useCallback((id, campos, custom) => {
    setState((s) => {
      if (custom) return { ...s, contasCustom: s.contasCustom.map((c) => (c.id === id ? { ...c, ...campos } : c)) }
      return { ...s, contasEdit: { ...s.contasEdit, [id]: { ...(s.contasEdit[id] || {}), ...campos } } }
    })
  }, [])

  const excluirConta = useCallback((id, custom) => {
    setState((s) => {
      if (custom) return { ...s, contasCustom: s.contasCustom.filter((c) => c.id !== id) }
      return { ...s, contasExcluida: { ...s.contasExcluida, [id]: true } }
    })
  }, [])

  // --- Contratos (banco) --------------------------------------------
  // Criar: aceita pdfFile (File) p/ upload no bucket privado. Otimista na lista.
  const criarContrato = useCallback(async (contrato) => {
    const novo = await dbCriarContrato(contrato)
    if (novo) setContratosDB((l) => [novo, ...l])
    return novo
  }, [])

  const atualizarContrato = useCallback(async (id, campos) => {
    const atualizado = await dbAtualizarContrato(id, campos)
    if (atualizado) setContratosDB((l) => l.map((c) => (c.id === id ? atualizado : c)))
    return atualizado
  }, [])

  const excluirContrato = useCallback(async (id) => {
    const ok = await dbExcluirContrato(id)
    if (ok) setContratosDB((l) => l.filter((c) => c.id !== id))
    return ok
  }, [])

  // Enviar p/ assinatura: marca 'enviado' no banco + registra a notificação WhatsApp.
  const enviarContrato = useCallback(async (id, notif) => {
    const atualizado = await dbEnviarContrato(id)
    if (atualizado) setContratosDB((l) => l.map((c) => (c.id === id ? atualizado : c)))
    if (notif) setState((s) => ({ ...s, notificacoes: [{ ...notif, em: new Date().toISOString() }, ...s.notificacoes] }))
    return atualizado
  }, [])

  // Marcar assinado (admin). O trigger no banco faz a costura: conta a receber
  // + move o cliente no funil. Recarrega o CRM p/ refletir isso na hora.
  const assinarContrato = useCallback(async (id) => {
    const atualizado = await dbAssinarContrato(id)
    if (atualizado) setContratosDB((l) => l.map((c) => (c.id === id ? atualizado : c)))
    await recarregarCRM()
    return atualizado
  }, [recarregarCRM])

  // --- Notas fiscais (banco) ----------------------------------------
  // Gera a nota a partir de um faturável (conta paga sem nota) e atualiza as listas.
  const gerarNota = useCallback(async (faturavel, tipo) => {
    const nova = await dbGerarNota(faturavel, tipo)
    if (nova) {
      setNotasDB((l) => [nova, ...l])
      setFaturaveisDB((l) => l.filter((f) => f.lancamentoId !== faturavel.lancamentoId))
    }
    return nova
  }, [])

  const marcarNotaEmitida = useCallback(async (id, numero) => {
    const atualizada = await dbMarcarNotaEmitida(id, numero)
    if (atualizada) setNotasDB((l) => l.map((n) => (n.id === id ? atualizada : n)))
    return atualizada
  }, [])

  // Desfaz a emissão (volta p/ pendente) — a nota continua existindo.
  const reverterEmissao = useCallback(async (id) => {
    const atualizada = await dbReverterEmissao(id)
    if (atualizada) setNotasDB((l) => l.map((n) => (n.id === id ? atualizada : n)))
    return atualizada
  }, [])

  // Cancela (estorno/devolução): atualiza a nota e a origem volta a faturável.
  const cancelarNota = useCallback(async (id) => {
    const atualizada = await dbCancelarNota(id)
    if (atualizada) { setNotasDB((l) => l.map((n) => (n.id === id ? atualizada : n))); recarregarFiscal() }
    return atualizada
  }, [recarregarFiscal])

  // Exclui a nota (some de vez) — a origem volta a ficar faturável.
  const excluirNota = useCallback(async (id) => {
    const ok = await dbExcluirNota(id)
    if (ok) { setNotasDB((l) => l.filter((n) => n.id !== id)); recarregarFiscal() }
    return ok
  }, [recarregarFiscal])

  // --- Workflow (costurado com o funil) -----------------------------
  const WORKFLOW_ORDER = ['briefing', 'ensaio', 'selecao', 'edicao', 'revisao', 'entrega']
  // Avançar: se chegar na entrega, move o cliente no funil para 'entregue'.
  const avancarEtapa = useCallback((projetoId, etapaAtual, clienteId) => {
    setState((s) => {
      const cur = s.workflowOverride[projetoId] || {}
      const idx = WORKFLOW_ORDER.indexOf(etapaAtual)
      const prox = WORKFLOW_ORDER[Math.min(WORKFLOW_ORDER.length - 1, idx + 1)]
      const funilOverride = (prox === 'entrega' && clienteId)
        ? { ...s.funilOverride, [clienteId]: 'entregue' }
        : s.funilOverride
      return { ...s, workflowOverride: { ...s.workflowOverride, [projetoId]: { ...cur, etapa: prox } }, funilOverride }
    })
  }, [])

  // Voltar: se sair da entrega, devolve o cliente ao funil 'producao'.
  const voltarEtapa = useCallback((projetoId, etapaAtual, clienteId) => {
    setState((s) => {
      const cur = s.workflowOverride[projetoId] || {}
      const idx = WORKFLOW_ORDER.indexOf(etapaAtual)
      const ant = WORKFLOW_ORDER[Math.max(0, idx - 1)]
      const funilOverride = (etapaAtual === 'entrega' && clienteId)
        ? { ...s.funilOverride, [clienteId]: 'producao' }
        : s.funilOverride
      return { ...s, workflowOverride: { ...s.workflowOverride, [projetoId]: { ...cur, etapa: ant } }, funilOverride }
    })
  }, [])

  const delegarProjeto = useCallback((projetoId, userId) => {
    setState((s) => ({ ...s, workflowOverride: { ...s.workflowOverride, [projetoId]: { ...(s.workflowOverride[projetoId] || {}), responsavel: userId } } }))
  }, [])

  // --- Clientes (banco) ---------------------------------------------
  // Cria no Supabase e adiciona à lista local (otimista no fim do retorno).
  const adicionarCliente = useCallback(async (cliente) => {
    const novo = await criarCliente(cliente)
    if (novo) setClientesDB((l) => [novo, ...l])
    return novo
  }, [])

  // Edita no banco e atualiza a linha local. (o 3º arg legado é ignorado)
  const editarCliente = useCallback(async (id, campos) => {
    const atualizado = await atualizarCliente(id, campos)
    if (atualizado) setClientesDB((l) => l.map((c) => (c.id === id ? atualizado : c)))
    return atualizado
  }, [])

  // --- Ensaios do cliente (banco) -----------------------------------
  // (nomes "...EnsaioCliente" p/ não colidir com os ensaios do PORTFÓLIO)
  const adicionarEnsaioCliente = useCallback(async (clienteId, campos) => {
    const novo = await dbCriarEnsaio({ ...campos, clienteId })
    if (novo) setEnsaiosDB((l) => [novo, ...l])
    return novo
  }, [])

  const editarEnsaioCliente = useCallback(async (id, campos) => {
    const atualizado = await dbAtualizarEnsaio(id, campos)
    if (atualizado) setEnsaiosDB((l) => l.map((e) => (e.id === id ? atualizado : e)))
    return atualizado
  }, [])

  const excluirEnsaioCliente = useCallback(async (id) => {
    const ok = await dbRemoverEnsaio(id)
    if (ok) setEnsaiosDB((l) => l.filter((e) => e.id !== id))
    return ok
  }, [])

  // --- Equipe -------------------------------------------------------
  const adicionarMembro = useCallback((membro) => {
    setState((s) => ({ ...s, membrosCustom: [{ ...membro, id: 'membro-' + Date.now(), custom: true, ativo: true, avatarGrad: 'ph-gradient-3' }, ...s.membrosCustom] }))
  }, [])

  const toggleMembroAtivo = useCallback((id, custom, ativoAtual) => {
    setState((s) => {
      if (custom) return { ...s, membrosCustom: s.membrosCustom.map((m) => (m.id === id ? { ...m, ativo: !m.ativo } : m)) }
      return { ...s, membrosState: { ...s.membrosState, [id]: { ativo: !ativoAtual } } }
    })
  }, [])

  const removerMembro = useCallback((id) => {
    setState((s) => ({ ...s, membrosCustom: s.membrosCustom.filter((m) => m.id !== id) }))
  }, [])

  // --- Galerias -----------------------------------------------------
  const criarGaleria = useCallback((galeria) => {
    setState((s) => ({ ...s, galeriasCustom: [{ ...galeria, id: 'gal-' + Date.now(), custom: true }, ...s.galeriasCustom] }))
  }, [])

  // --- Álbuns (diagramador) -----------------------------------------
  const criarAlbum = useCallback((album) => {
    const id = 'alb-' + Date.now()
    setState((s) => ({ ...s, albuns: [{ ...album, id, atualizadoEm: new Date().toISOString() }, ...s.albuns] }))
    return id
  }, [])

  const salvarAlbum = useCallback((id, campos) => {
    setState((s) => ({ ...s, albuns: s.albuns.map((a) => (a.id === id ? { ...a, ...campos, atualizadoEm: new Date().toISOString() } : a)) }))
  }, [])

  const excluirAlbum = useCallback((id) => {
    setState((s) => ({ ...s, albuns: s.albuns.filter((a) => a.id !== id) }))
  }, [])

  // --- Portfólio: ensaios (camada local, trocável por Supabase) -------
  const criarEnsaio = useCallback(({ titulo, subtitulo = '', categoria, capa = '' }) => {
    const id = 'ens-' + Date.now().toString(36)
    setState((s) => ({
      ...s,
      ensaios: [
        { id, titulo, subtitulo, categoria, capa, fotos: [], criadoEm: new Date().toISOString() },
        ...s.ensaios,
      ],
    }))
    return id
  }, [])

  const editarEnsaio = useCallback((id, campos) => {
    setState((s) => ({
      ...s,
      ensaios: s.ensaios.map((e) => (e.id === id ? { ...e, ...campos } : e)),
    }))
  }, [])

  const excluirEnsaio = useCallback((id) => {
    setState((s) => ({ ...s, ensaios: s.ensaios.filter((e) => e.id !== id) }))
  }, [])

  const adicionarFotoEnsaio = useCallback((ensaioId, src) => {
    const fotos = Array.isArray(src) ? src : [src]
    setState((s) => ({
      ...s,
      ensaios: s.ensaios.map((e) =>
        e.id === ensaioId
          ? {
              ...e,
              fotos: [
                ...e.fotos,
                ...fotos.map((f, i) => ({ id: 'f-' + Date.now().toString(36) + '-' + i, src: f })),
              ],
            }
          : e
      ),
    }))
  }, [])

  const removerFotoEnsaio = useCallback((ensaioId, fotoId) => {
    setState((s) => ({
      ...s,
      ensaios: s.ensaios.map((e) =>
        e.id === ensaioId ? { ...e, fotos: e.fotos.filter((f) => f.id !== fotoId) } : e
      ),
    }))
  }, [])

  const value = {
    ...state,
    HORARIOS_PADRAO,
    clientes,
    agendamentos: agendamentosDB, // sobrescreve o [] do state pelo do banco
    getCliente,
    getClienteNome,
    getClienteEtapa,
    toggleFoto,
    limparSelecao,
    enviarSelecao,
    definirPendencia,
    registrarPagamento,
    marcarEditando,
    liberarDownload,
    registrarNotificacao,
    resetDemo,
    adicionarAgendamento,
    recarregarCRM,
    galerias: galeriasDB,
    mudarStatusGaleria,
    confirmarAgendamento,
    cancelarAgendamento,
    toggleDiaBloqueado,
    toggleHorarioBloqueado,
    horariosLivres,
    horariosDoDia,
    adicionarHorario,
    editarHorario,
    removerHorario,
    setBuffer,
    moverFunil,
    toggleTarefa,
    adicionarTarefa,
    editarTarefa,
    excluirTarefa,
    setEditadas,
    adicionarLancamento,
    editarLancamento,
    excluirLancamento,
    marcarConta,
    adicionarConta,
    editarConta,
    excluirConta,
    contratos: contratosDB,
    assinarContrato,
    atualizarContrato,
    enviarContrato,
    criarContrato,
    excluirContrato,
    notas: notasDB,
    faturaveis: faturaveisDB,
    recarregarFiscal,
    gerarNota,
    marcarNotaEmitida,
    reverterEmissao,
    cancelarNota,
    excluirNota,
    avancarEtapa,
    voltarEtapa,
    delegarProjeto,
    adicionarCliente,
    editarCliente,
    adicionarEnsaioCliente,
    editarEnsaioCliente,
    excluirEnsaioCliente,
    adicionarMembro,
    toggleMembroAtivo,
    removerMembro,
    criarGaleria,
    criarAlbum,
    salvarAlbum,
    excluirAlbum,
    criarEnsaio,
    editarEnsaio,
    excluirEnsaio,
    adicionarFotoEnsaio,
    removerFotoEnsaio,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
