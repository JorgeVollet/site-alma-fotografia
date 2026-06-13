// =====================================================================
//  CRM — Dados unificados de clientes da Alma Fotografia (demo)
//  Centraliza clientes, funil, financeiro e tarefas. Tudo conectado.
//  Nicho: materno-infantil (gestante, newborn, smash, família).
// =====================================================================
import { GALERIA_CLIENTE_DEMO, OUTROS_ENSAIOS } from './galleries'

// Clientes do estúdio. O id 'demo' é o ensaio newborn ao vivo (Família Sphor).
export const CLIENTES = [
  {
    id: 'sphor', nome: 'Família Sphor', contato: 'Majoire Sphor',
    email: 'majoire.sphor@email.com', telefone: '(55) 99988-7766', desde: '2026-05-20',
    ensaios: [{ id: 'demo', titulo: 'Ensaio Newborn · Antônio', pacote: 'memorias', valor: 890, data: '2026-05-28', status: 'selecionando' }],
    galeriaId: 'demo', funil: 'producao', avatarGrad: 'ph-gradient-4',
    agendamento: { data: '2026-05-28', hora: '10:30', local: 'Estúdio — Av. Farrapos, 560', pessoas: 3, obs: 'Bebê de 8 dias. Ambiente aquecido, props newborn.' },
    producao: { fotosBrutas: 120, selecionadas: null, editadas: 0, prazo: '2026-06-12', etapaProd: 'Aguardando seleção do cliente' },
  },
  {
    id: 'patricia', nome: 'Patrícia Krever', contato: 'Patrícia Krever',
    email: 'patricia.krever@email.com', telefone: '(55) 99876-5432', desde: '2026-04-10',
    ensaios: [{ id: 'patricia', titulo: 'Ensaio Gestante', pacote: 'pocket', valor: 600, data: '2026-05-18', status: 'enviado' }],
    galeriaId: 'patricia', funil: 'producao', avatarGrad: 'ph-gradient-2',
    agendamento: { data: '2026-05-18', hora: '16:00', local: 'Estúdio + externo (golden hour)', pessoas: 2, obs: 'Gestante 32 semanas. Levar véu e figurinos.' },
    producao: { fotosBrutas: 180, selecionadas: 30, editadas: 8, prazo: '2026-06-15', etapaProd: 'Edição em andamento (8/30)' },
  },
  {
    id: 'daniela', nome: 'Daniela Schroter', contato: 'Daniela Schroter',
    email: 'daniela.schroter@email.com', telefone: '(55) 99765-4321', desde: '2026-03-22',
    ensaios: [{ id: 'daniela', titulo: 'Ensaio de Família', pacote: 'memorias', valor: 890, data: '2026-04-02', status: 'editando' }],
    galeriaId: 'daniela', funil: 'producao', avatarGrad: 'ph-gradient',
    agendamento: { data: '2026-04-02', hora: '17:00', local: 'Parque da Cidade (externo)', pessoas: 5, obs: 'Golden hour. Levar refletor.' },
    producao: { fotosBrutas: 340, selecionadas: 22, editadas: 22, prazo: '2026-06-11', etapaProd: 'Tratamento finalizado — revisar e entregar' },
  },
  {
    id: 'majoire', nome: 'Majoire Sphor', contato: 'Majoire Sphor',
    email: 'majoire.s@email.com', telefone: '(55) 99654-3210', desde: '2026-05-30',
    ensaios: [{ id: 'majoire', titulo: 'Smash the Cake · 1 aninho', pacote: 'memorias', valor: 890, data: '2026-06-05', status: 'selecionando' }],
    galeriaId: 'majoire', funil: 'producao', avatarGrad: 'ph-gradient-4',
    agendamento: { data: '2026-06-05', hora: '14:00', local: 'Estúdio — cenário smash the cake', pessoas: 4, obs: 'Tema: jardim encantado. Bolo cenográfico providenciado.' },
    producao: { fotosBrutas: 95, selecionadas: 6, editadas: 0, prazo: '2026-06-18', etapaProd: 'Aguardando mais seleções' },
  },
  {
    id: 'lead-camila', nome: 'Camila Renz', contato: 'Camila Renz',
    email: 'camila.renz@email.com', telefone: '(55) 99543-2109', desde: '2026-06-08',
    ensaios: [], galeriaId: null, funil: 'lead', interesse: 'Acompanhamento do bebê', avatarGrad: 'ph-gradient-2',
    lead: { origem: 'Instagram (anúncio)', primeiroContato: '2026-06-08', interesse: 'Acompanhamento do 1º ano (4 ensaios)', urgencia: 'Bebê nasce em 1 mês', notas: 'Pediu valores do acompanhamento. Respondeu o direct, aguardando retorno.' },
  },
  {
    id: 'lead-fernanda', nome: 'Fernanda Klein', contato: 'Fernanda Klein',
    email: 'fe.klein@email.com', telefone: '(55) 99432-1098', desde: '2026-06-09',
    ensaios: [], galeriaId: null, funil: 'orcamento', interesse: 'Ensaio Gestante', avatarGrad: 'ph-gradient',
    lead: { origem: 'Indicação (cliente Daniela)', primeiroContato: '2026-06-09', interesse: 'Ensaio gestante 32 semanas', urgencia: 'Ensaio em ~3 semanas', notas: 'Quer externo + estúdio. Enviar orçamento do pacote Memórias com adicional de locação.' },
    orcamento: { itens: [{ desc: 'Pacote Memórias', valor: 890 }, { desc: 'Locação externa adicional', valor: 180 }, { desc: '+5 fotos extras', valor: 150 }], desconto: 0, enviado: false },
  },
]

// Mapa galeriaId -> dados de fotos (Sphor vem de GALERIA_CLIENTE_DEMO; resto de OUTROS_ENSAIOS)
export function getGaleriaData(galeriaId) {
  if (galeriaId === 'demo') {
    return {
      fotos: GALERIA_CLIENTE_DEMO.fotos,
      fotosInclusas: GALERIA_CLIENTE_DEMO.fotosInclusas,
      fotoExtra: GALERIA_CLIENTE_DEMO.fotoExtra,
      pacote: GALERIA_CLIENTE_DEMO.pacote,
    }
  }
  const e = OUTROS_ENSAIOS.find((x) => x.id === galeriaId)
  if (!e) return null
  return { fotos: e.fotos, fotosInclusas: e.fotosInclusas, fotoExtra: e.fotoExtra, pacote: e.pacote, selecionadas: e.selecionadas }
}

// Etapas do funil de vendas
export const FUNIL_ETAPAS = [
  { id: 'lead', nome: 'Novo lead', cor: 'bg-sand-300' },
  { id: 'orcamento', nome: 'Orçamento', cor: 'bg-clay-400' },
  { id: 'agendado', nome: 'Agendado', cor: 'bg-terracotta-400' },
  { id: 'producao', nome: 'Em produção', cor: 'bg-clay-500' },
  { id: 'entregue', nome: 'Entregue', cor: 'bg-cocoa-600' },
]

// Lançamentos financeiros de exemplo
// status: 'pago' | 'pendente' · dataPagamento quando pago
export const FINANCEIRO_DEMO = [
  { id: 'd1', tipo: 'entrada', descricao: 'Reserva — Gestante Patrícia Krever', valor: 150, data: '2026-04-10', dataPagamento: '2026-04-10', categoria: 'Reserva', status: 'pago', cliente: 'patricia' },
  { id: 'd2', tipo: 'entrada', descricao: 'Saldo pacote — Patrícia Krever', valor: 450, data: '2026-05-18', dataPagamento: '', categoria: 'Pacote', status: 'pendente', cliente: 'patricia' },
  { id: 'd3', tipo: 'entrada', descricao: 'Reserva — Família Daniela', valor: 200, data: '2026-03-22', dataPagamento: '2026-03-22', categoria: 'Reserva', status: 'pago', cliente: 'daniela' },
  { id: 'd4', tipo: 'entrada', descricao: 'Fotos extras — Daniela (7×)', valor: 210, data: '2026-04-12', dataPagamento: '2026-04-12', categoria: 'Extras', status: 'pago', cliente: 'daniela' },
  { id: 'd5', tipo: 'entrada', descricao: 'Reserva — Newborn Antônio (Sphor)', valor: 200, data: '2026-05-20', dataPagamento: '2026-05-20', categoria: 'Reserva', status: 'pago', cliente: 'sphor' },
  { id: 'd6', tipo: 'saida', descricao: 'Aluguel do estúdio (jun)', valor: 1200, data: '2026-06-05', dataPagamento: '2026-06-05', categoria: 'Fixo', status: 'pago', cliente: '' },
  { id: 'd7', tipo: 'saida', descricao: 'Props newborn novos', valor: 480, data: '2026-05-15', dataPagamento: '2026-05-15', categoria: 'Material', status: 'pago', cliente: '' },
  { id: 'd8', tipo: 'saida', descricao: 'Impressão de álbuns', valor: 350, data: '2026-05-28', dataPagamento: '', categoria: 'Produção', status: 'pendente', cliente: '' },
]

export const CATEGORIAS_FIN = ['Reserva', 'Pacote', 'Extras', 'Álbum', 'Fixo', 'Material', 'Produção', 'Equipamento', 'Marketing', 'Outros']

// Tarefas de exemplo
export const TAREFAS_DEMO = [
  { id: 1, texto: 'Editar fotos selecionadas da Daniela', clienteId: 'daniela', prazo: '2026-06-12', feita: false, prioridade: 'alta' },
  { id: 2, texto: 'Enviar orçamento de gestante para Fernanda', clienteId: 'lead-fernanda', prazo: '2026-06-11', feita: false, prioridade: 'alta' },
  { id: 3, texto: 'Ligar para Camila (acompanhamento do bebê)', clienteId: 'lead-camila', prazo: '2026-06-13', feita: false, prioridade: 'media' },
  { id: 4, texto: 'Preparar estúdio para smash the cake da Majoire', clienteId: 'majoire', prazo: '2026-06-05', feita: true, prioridade: 'media' },
  { id: 5, texto: 'Postar prévia do gestante no Instagram', clienteId: 'patricia', prazo: '2026-06-15', feita: false, prioridade: 'baixa' },
]

// =====================================================================
//  CRM PRO — dados de equipe, contratos, contas, permissões
// =====================================================================

// Equipe / usuários do sistema
export const EQUIPE_CRM = [
  { id: 'u1', nome: 'Fotógrafa Responsável', email: 'admin@almafotografia.com.br', papel: 'admin', avatarGrad: 'ph-gradient-4', ativo: true },
  { id: 'u2', nome: 'Co-Fotógrafa', email: 'foto2@almafotografia.com.br', papel: 'fotografo', avatarGrad: 'ph-gradient-2', ativo: true },
  { id: 'u3', nome: 'Editora', email: 'edicao@almafotografia.com.br', papel: 'editor', avatarGrad: 'ph-gradient', ativo: true },
  { id: 'u4', nome: 'Atendimento', email: 'contato@almafotografia.com.br', papel: 'atendimento', avatarGrad: 'ph-gradient-2', ativo: false },
]

// Papéis e permissões por módulo
export const PAPEIS = {
  admin: { nome: 'Administradora', cor: 'bg-terracotta-500/20 text-terracotta-400', desc: 'Acesso total ao sistema' },
  fotografo: { nome: 'Fotógrafa', cor: 'bg-clay-400/20 text-clay-300', desc: 'Ensaios, galerias e agenda' },
  editor: { nome: 'Editora', cor: 'bg-sand-300/20 text-sand-200', desc: 'Produção e edição de fotos' },
  atendimento: { nome: 'Atendimento', cor: 'bg-cream-100/10 text-cream-100/60', desc: 'Clientes e funil de vendas' },
}

export const MODULOS_PERM = ['Visão geral', 'Seleções', 'Galerias', 'Agenda', 'Clientes', 'Funil', 'Financeiro', 'Contratos', 'Relatórios', 'Equipe']

// Permissões padrão por papel (true = acesso)
export const PERMISSOES_PADRAO = {
  admin:        { 'Visão geral': true, 'Seleções': true, 'Galerias': true, 'Agenda': true, 'Clientes': true, 'Funil': true, 'Financeiro': true, 'Contratos': true, 'Relatórios': true, 'Equipe': true },
  fotografo:    { 'Visão geral': true, 'Seleções': true, 'Galerias': true, 'Agenda': true, 'Clientes': true, 'Funil': true, 'Financeiro': false, 'Contratos': false, 'Relatórios': false, 'Equipe': false },
  editor:       { 'Visão geral': true, 'Seleções': true, 'Galerias': true, 'Agenda': false, 'Clientes': false, 'Funil': false, 'Financeiro': false, 'Contratos': false, 'Relatórios': false, 'Equipe': false },
  atendimento:  { 'Visão geral': true, 'Seleções': false, 'Galerias': false, 'Agenda': true, 'Clientes': true, 'Funil': true, 'Financeiro': false, 'Contratos': true, 'Relatórios': false, 'Equipe': false },
}

// Modelos de contrato — com cláusulas. {{cliente}}, {{valor}}, {{data}}, {{ensaio}} são substituídos.
export const MODELOS_CONTRATO = [
  {
    id: 'm1', nome: 'Contrato de Ensaio Fotográfico', tipo: 'Ensaio',
    clausulas: [
      'CONTRATANTE: {{cliente}}. CONTRATADO: Alma Fotografia, Boa Vista do Buricá/RS.',
      'OBJETO: Prestação de serviços de fotografia referente a {{ensaio}}, na data de {{data}}.',
      'VALOR: O CONTRATANTE pagará ao CONTRATADO o valor total de {{valor}}, sendo a reserva no ato e o saldo até a entrega.',
      'ENTREGA: As fotos tratadas serão entregues em até 15 dias úteis após a seleção, via galeria online.',
      'DIREITOS: O CONTRATADO poderá utilizar as imagens para portfólio e divulgação, salvo manifestação contrária do CONTRATANTE.',
      'CANCELAMENTO: Em caso de cancelamento pelo CONTRATANTE, o valor da reserva não será restituído.',
    ],
  },
  {
    id: 'm2', nome: 'Contrato de Ensaio Gestante', tipo: 'Gestante',
    clausulas: [
      'CONTRATANTE: {{cliente}}. CONTRATADO: Alma Fotografia, Boa Vista do Buricá/RS.',
      'OBJETO: Ensaio gestante ({{ensaio}}) na data de {{data}}, em estúdio e/ou locação externa.',
      'VALOR: O valor total dos serviços é de {{valor}}, conforme pacote contratado.',
      'FIGURINOS: O estúdio disponibiliza figurinos para o ensaio, conforme disponibilidade e acordo prévio.',
      'ENTREGA: Galeria online em até 15 dias após a seleção das imagens.',
      'DIREITOS AUTORAIS: As imagens são de autoria do CONTRATADO, licenciadas ao CONTRATANTE para uso pessoal.',
    ],
  },
  {
    id: 'm3', nome: 'Contrato de Ensaio Newborn', tipo: 'Newborn',
    clausulas: [
      'CONTRATANTE: {{cliente}}. CONTRATADO: Alma Fotografia, Boa Vista do Buricá/RS.',
      'OBJETO: Ensaio newborn ({{ensaio}}), realizado nos primeiros dias de vida do bebê, na data de {{data}}.',
      'VALOR: O valor total é de {{valor}}, incluindo props, ambiente aquecido e tratamento das imagens.',
      'SEGURANÇA: O bebê será manuseado sempre com a presença e consentimento dos pais, priorizando seu conforto e segurança.',
      'ENTREGA: Fotos tratadas em até 15 dias via galeria online.',
    ],
  },
  {
    id: 'm4', nome: 'Contrato de Acompanhamento do Bebê', tipo: 'Acompanhamento',
    clausulas: [
      'CONTRATANTE: {{cliente}}. CONTRATADO: Alma Fotografia, Boa Vista do Buricá/RS.',
      'OBJETO: Acompanhamento fotográfico do bebê ({{ensaio}}) ao longo do primeiro ano, a partir de {{data}}.',
      'VALOR: O valor total do plano de acompanhamento é de {{valor}}, contemplando os ensaios acordados.',
      'AGENDAMENTO: As datas de cada ensaio serão combinadas conforme os marcos de desenvolvimento do bebê.',
      'ENTREGA: Cada etapa é entregue em até 15 dias via galeria online.',
    ],
  },
]

// Gera o corpo do contrato substituindo as variáveis
export function montarContrato(modeloNome, dados) {
  const m = MODELOS_CONTRATO.find((x) => x.nome === modeloNome)
  if (!m) return []
  const repl = (t) => t
    .replace(/\{\{cliente\}\}/g, dados.cliente || '—')
    .replace(/\{\{valor\}\}/g, dados.valor || '—')
    .replace(/\{\{data\}\}/g, dados.data || '—')
    .replace(/\{\{ensaio\}\}/g, dados.ensaio || 'o ensaio contratado')
  return m.clausulas.map(repl)
}

// Contratos gerados (demo)
export const CONTRATOS_DEMO = [
  { id: 'c1', cliente: 'patricia', clienteNome: 'Patrícia Krever', telefone: '(55) 99876-5432', ensaio: 'Ensaio Gestante', modelo: 'Contrato de Ensaio Gestante', valor: 600, criado: '2026-04-08', status: 'assinado', assinadoEm: '2026-04-09' },
  { id: 'c2', cliente: 'daniela', clienteNome: 'Daniela Schroter', telefone: '(55) 99765-4321', ensaio: 'Ensaio de Família', modelo: 'Contrato de Ensaio Fotográfico', valor: 890, criado: '2026-03-20', status: 'assinado', assinadoEm: '2026-03-21' },
  { id: 'c3', cliente: 'sphor', clienteNome: 'Família Sphor', telefone: '(55) 99988-7766', ensaio: 'Ensaio Newborn · Antônio', modelo: 'Contrato de Ensaio Newborn', valor: 890, criado: '2026-05-18', status: 'enviado', assinadoEm: '' },
  { id: 'c4', cliente: 'lead-fernanda', clienteNome: 'Fernanda Klein', telefone: '(55) 99432-1098', ensaio: 'Ensaio Gestante', modelo: 'Contrato de Ensaio Gestante', valor: 1020, criado: '2026-06-09', status: 'rascunho', assinadoEm: '' },
]

// Contas a pagar e a receber (vencimentos)
export const CONTAS_DEMO = [
  { id: 'r1', tipo: 'receber', descricao: 'Saldo gestante — Patrícia Krever', valor: 450, vencimento: '2026-06-18', cliente: 'patricia', status: 'pendente' },
  { id: 'r2', tipo: 'receber', descricao: 'Saldo smash — Majoire', valor: 290, vencimento: '2026-06-20', cliente: 'majoire', status: 'pendente' },
  { id: 'r3', tipo: 'receber', descricao: 'Saldo newborn — Sphor', valor: 540, vencimento: '2026-06-08', cliente: 'sphor', status: 'vencido' },
  { id: 'p1', tipo: 'pagar', descricao: 'Aluguel do estúdio (julho)', valor: 1200, vencimento: '2026-07-05', cliente: '', status: 'pendente' },
  { id: 'p2', tipo: 'pagar', descricao: 'Mensalidade Supabase', valor: 125, vencimento: '2026-06-15', cliente: '', status: 'pendente' },
  { id: 'p3', tipo: 'pagar', descricao: 'Encadernação álbum Daniela', valor: 280, vencimento: '2026-06-09', cliente: '', status: 'vencido' },
]

// =====================================================================
//  CRM PRO — Fluxo de trabalho (workflow) com etapas e responsáveis
// =====================================================================

// Etapas padrão de um projeto fotográfico
export const WORKFLOW_ETAPAS = [
  { id: 'briefing', nome: 'Briefing', prazoDias: 2 },
  { id: 'ensaio', nome: 'Ensaio', prazoDias: 0 },
  { id: 'selecao', nome: 'Seleção do cliente', prazoDias: 7 },
  { id: 'edicao', nome: 'Edição', prazoDias: 10 },
  { id: 'revisao', nome: 'Revisão', prazoDias: 2 },
  { id: 'entrega', nome: 'Entrega', prazoDias: 1 },
]

// Projetos ativos com etapa atual e responsável (referencia EQUIPE_CRM)
export const PROJETOS_DEMO = [
  { id: 'pj1', cliente: 'patricia', clienteNome: 'Patrícia Krever', etapa: 'edicao', responsavel: 'u3', prazo: '2026-06-15', etapasFeitas: ['briefing', 'ensaio', 'selecao'] },
  { id: 'pj2', cliente: 'daniela', clienteNome: 'Daniela Schroter', etapa: 'revisao', responsavel: 'u1', prazo: '2026-06-11', etapasFeitas: ['briefing', 'ensaio', 'selecao', 'edicao'] },
  { id: 'pj3', cliente: 'sphor', clienteNome: 'Família Sphor', etapa: 'selecao', responsavel: 'u2', prazo: '2026-06-12', etapasFeitas: ['briefing', 'ensaio'] },
  { id: 'pj4', cliente: 'majoire', clienteNome: 'Majoire Sphor', etapa: 'selecao', responsavel: 'u2', prazo: '2026-06-14', etapasFeitas: ['briefing', 'ensaio'] },
]
