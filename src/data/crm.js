// =====================================================================
//  CRM — Configurações e dados do estúdio
//
//  ⚠️ MIGRAÇÃO EM ANDAMENTO (backend Supabase):
//  Os dados TRANSACIONAIS (clientes, financeiro, contratos gerados,
//  contas, tarefas, projetos) foram ZERADOS — o admin começa VAZIO e
//  cada um ganha seu backend no bloco correspondente:
//    • clientes  -> Supabase (Bloco 2, JÁ migrado: src/lib/clientes.js)
//    • financeiro/contas -> Bloco 7
//    • contratos -> Bloco 8
//    • tarefas/projetos  -> Bloco 9
//  O que permanece aqui é CONFIGURAÇÃO (etapas, papéis, categorias,
//  modelos de contrato) até virar editável no banco.
//  (histórico do demo antigo está no git, se precisar consultar.)
// =====================================================================
import { GALERIA_CLIENTE_DEMO, OUTROS_ENSAIOS } from './galleries'

// VAZIO — clientes agora vêm do Supabase (Bloco 2). Ver src/lib/clientes.js.
export const CLIENTES = []

// Mapa galeriaId -> dados de fotos (galerias ainda são demo até o Bloco 4)
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

// Etapas do funil de vendas (CONFIG — vira tabela no Bloco 6, Kanban).
// O cliente guarda a etapa em clientes.funil_etapa (texto = id daqui).
export const FUNIL_ETAPAS = [
  { id: 'lead', nome: 'Novo lead', cor: 'bg-sand-300' },
  { id: 'orcamento', nome: 'Orçamento', cor: 'bg-clay-400' },
  { id: 'agendado', nome: 'Agendado', cor: 'bg-terracotta-400' },
  { id: 'producao', nome: 'Em produção', cor: 'bg-clay-500' },
  { id: 'entregue', nome: 'Entregue', cor: 'bg-cocoa-600' },
]

// VAZIO — lançamentos financeiros vêm do banco no Bloco 7.
export const FINANCEIRO_DEMO = []

export const CATEGORIAS_FIN = ['Reserva', 'Pacote', 'Extras', 'Álbum', 'Fixo', 'Material', 'Produção', 'Equipamento', 'Marketing', 'Outros']

// VAZIO — tarefas vêm do banco no Bloco 9.
export const TAREFAS_DEMO = []

// =====================================================================
//  CRM PRO — config de equipe, contratos, contas, permissões
// =====================================================================

// VAZIO — a equipe real vem de `profiles` (Supabase Auth, Bloco 0). A tela
// Equipe lê este array por enquanto; será ligada aos profiles depois.
// O Maurício já existe no Auth (admin). Ver src/lib/clientes.js como modelo.
export const EQUIPE_CRM = []

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

// VAZIO — contratos gerados vêm do banco no Bloco 8.
export const CONTRATOS_DEMO = []

// VAZIO — contas a pagar/receber vêm do banco no Bloco 7.
export const CONTAS_DEMO = []

// =====================================================================
//  CRM PRO — Fluxo de trabalho (workflow)
// =====================================================================

// Etapas padrão de um projeto fotográfico (CONFIG)
export const WORKFLOW_ETAPAS = [
  { id: 'briefing', nome: 'Briefing', prazoDias: 2 },
  { id: 'ensaio', nome: 'Ensaio', prazoDias: 0 },
  { id: 'selecao', nome: 'Seleção do cliente', prazoDias: 7 },
  { id: 'edicao', nome: 'Edição', prazoDias: 10 },
  { id: 'revisao', nome: 'Revisão', prazoDias: 2 },
  { id: 'entrega', nome: 'Entrega', prazoDias: 1 },
]

// VAZIO — projetos ativos vêm do banco no Bloco 9.
export const PROJETOS_DEMO = []
