import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ensaiosDemo } from '../data/galleries'

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
  // contratos: status atualizado { id: { status, assinadoEm } }
  contratosEdit: {},
  contratosCustom: [],
  contratosExcluido: {},
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
    setState((s) => ({
      ...s,
      statusEnsaio: 'pronto',
      // costura: entregar as fotos da Helena move ela para 'entregue' no funil
      funilOverride: { ...s.funilOverride, sphor: 'entregue' },
      notificacoes: notif ? [{ ...notif, em: new Date().toISOString() }, ...s.notificacoes] : s.notificacoes,
    }))
  }, [])

  const registrarNotificacao = useCallback((notif) => {
    setState((s) => ({ ...s, notificacoes: [{ ...notif, em: new Date().toISOString() }, ...s.notificacoes] }))
  }, [])

  const resetDemo = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  // --- Agendamentos -------------------------------------------------
  const adicionarAgendamento = useCallback((ag) => {
    setState((s) => ({
      ...s,
      agendamentos: [{ ...ag, id: Date.now(), criadoEm: new Date().toISOString() }, ...s.agendamentos],
    }))
  }, [])

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
      const ocupados = state.agendamentos.filter((a) => a.dia === dia).map((a) => a.hora)

      const antesMin = (state.bufferAntes || 0) * 60
      const depoisMin = (state.bufferDepois || 0) * 60

      // usa os horários personalizados do dia, se houver; senão o padrão
      const custom = state.horariosCustom[dia]
      const lista = custom && custom.length ? [...custom].sort() : HORARIOS_PADRAO

      return lista.filter((h) => {
        if (bloq.includes(h)) return false
        if (ocupados.includes(h)) return false
        // some se cair dentro da janela de buffer de algum ensaio ocupado
        const hMin = paraMin(h)
        const dentroBuffer = ocupados.some((occ) => {
          const oMin = paraMin(occ)
          return hMin >= oMin - antesMin && hMin <= oMin + depoisMin
        })
        return !dentroBuffer
      })
    },
    [state.diasBloqueados, state.horariosBloqueados, state.agendamentos, state.bufferAntes, state.bufferDepois, state.horariosCustom]
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
  const moverFunil = useCallback((clienteId, etapaId) => {
    setState((s) => ({ ...s, funilOverride: { ...s.funilOverride, [clienteId]: etapaId } }))
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

  // --- Contratos ----------------------------------------------------
  // Ao assinar: marca assinado + cria conta a receber + move cliente no funil.
  const assinarContrato = useCallback((id, contrato) => {
    setState((s) => {
      const hoje = new Date().toISOString().slice(0, 10)
      let contasCustom = s.contasCustom
      let funilOverride = s.funilOverride
      if (contrato) {
        const jaTemConta = contasCustom.some((c) => c.contratoOrigem === id)
        if (!jaTemConta && contrato.valor) {
          // vencimento sugerido: 30 dias após assinatura
          const venc = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
          contasCustom = [{
            id: 'conta-contrato-' + id,
            custom: true,
            contratoOrigem: id,
            tipo: 'receber',
            descricao: 'Contrato — ' + (contrato.clienteNome || ''),
            valor: contrato.valor,
            vencimento: venc,
            cliente: contrato.cliente || '',
            categoria: 'Pacote',
            status: 'pendente',
          }, ...contasCustom]
        }
        // move o cliente no funil para 'agendado' (negócio fechado)
        if (contrato.cliente) {
          const atual = s.funilOverride[contrato.cliente]
          // só avança se ainda estiver em lead/orcamento
          if (atual === 'lead' || atual === 'orcamento' || atual === undefined) {
            funilOverride = { ...s.funilOverride, [contrato.cliente]: 'agendado' }
          }
        }
      }
      return {
        ...s,
        contratosEdit: { ...s.contratosEdit, [id]: { status: 'assinado', assinadoEm: hoje } },
        contasCustom,
        funilOverride,
      }
    })
  }, [])

  const atualizarContrato = useCallback((id, campos, custom) => {
    setState((s) => {
      if (custom) return { ...s, contratosCustom: s.contratosCustom.map((c) => (c.id === id ? { ...c, ...campos } : c)) }
      return { ...s, contratosEdit: { ...s.contratosEdit, [id]: { ...(s.contratosEdit[id] || {}), ...campos } } }
    })
  }, [])

  const criarContrato = useCallback((contrato) => {
    setState((s) => ({ ...s, contratosCustom: [{ ...contrato, id: 'contr-' + Date.now(), custom: true, status: 'rascunho', criado: new Date().toISOString().slice(0, 10) }, ...s.contratosCustom] }))
  }, [])

  const excluirContrato = useCallback((id, custom) => {
    setState((s) => {
      if (custom) return { ...s, contratosCustom: s.contratosCustom.filter((c) => c.id !== id) }
      return { ...s, contratosExcluido: { ...s.contratosExcluido, [id]: true } }
    })
  }, [])

  // Enviar contrato para assinatura (marca 'enviado' + registra notificação WhatsApp)
  const enviarContrato = useCallback((id, notif, custom) => {
    setState((s) => {
      const hoje = new Date().toISOString().slice(0, 10)
      const notificacoes = notif ? [{ ...notif, em: new Date().toISOString() }, ...s.notificacoes] : s.notificacoes
      if (custom) return { ...s, contratosCustom: s.contratosCustom.map((c) => (c.id === id ? { ...c, status: 'enviado', enviadoEm: hoje } : c)), notificacoes }
      return { ...s, contratosEdit: { ...s.contratosEdit, [id]: { ...(s.contratosEdit[id] || {}), status: 'enviado', enviadoEm: hoje } }, notificacoes }
    })
  }, [])

  // Registrar a assinatura (vinda da página pública do cliente) — cai no painel.
  // Reaproveita a lógica de assinarContrato (conta a receber + move funil) + guarda a imagem.
  const registrarAssinatura = useCallback((id, assinaturaDataURL, contrato) => {
    setState((s) => {
      const hoje = new Date().toISOString().slice(0, 10)
      let contasCustom = s.contasCustom
      let funilOverride = s.funilOverride
      if (contrato) {
        const jaTemConta = contasCustom.some((c) => c.contratoOrigem === id)
        if (!jaTemConta && contrato.valor) {
          const venc = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
          contasCustom = [{
            id: 'conta-contrato-' + id, custom: true, contratoOrigem: id,
            tipo: 'receber', descricao: 'Contrato — ' + (contrato.clienteNome || ''),
            valor: contrato.valor, vencimento: venc, cliente: contrato.cliente || '',
            categoria: 'Pacote', status: 'pendente',
          }, ...contasCustom]
        }
        if (contrato.cliente) {
          const atual = s.funilOverride[contrato.cliente]
          if (atual === 'lead' || atual === 'orcamento' || atual === undefined) {
            funilOverride = { ...s.funilOverride, [contrato.cliente]: 'agendado' }
          }
        }
      }
      const assinaturaCampos = { status: 'assinado', assinadoEm: hoje, assinatura: assinaturaDataURL }
      const base = { ...s, contasCustom, funilOverride }
      if (contrato && contrato.custom) {
        return { ...base, contratosCustom: s.contratosCustom.map((c) => (c.id === id ? { ...c, ...assinaturaCampos } : c)) }
      }
      return { ...base, contratosEdit: { ...s.contratosEdit, [id]: { ...(s.contratosEdit[id] || {}), ...assinaturaCampos } } }
    })
  }, [])

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

  // --- Clientes -----------------------------------------------------
  const adicionarCliente = useCallback((cliente) => {
    setState((s) => ({ ...s, clientesCustom: [{ ...cliente, id: 'cli-' + Date.now(), custom: true, funil: 'lead', ensaios: [], avatarGrad: 'ph-gradient-2', desde: new Date().toISOString().slice(0, 10) }, ...s.clientesCustom] }))
  }, [])

  const editarCliente = useCallback((id, campos, custom) => {
    setState((s) => {
      if (custom) return { ...s, clientesCustom: s.clientesCustom.map((c) => (c.id === id ? { ...c, ...campos } : c)) }
      return { ...s, clientesEdit: { ...s.clientesEdit, [id]: { ...(s.clientesEdit[id] || {}), ...campos } } }
    })
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
    assinarContrato,
    atualizarContrato,
    enviarContrato,
    registrarAssinatura,
    criarContrato,
    excluirContrato,
    avancarEtapa,
    voltarEtapa,
    delegarProjeto,
    adicionarCliente,
    editarCliente,
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
