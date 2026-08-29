# 📋 RECAP — Sistema Alma Fotografia (backend Supabase)

> Documento vivo de onde estamos. Atualizar ao fim de cada wave.
> Última atualização: 2026-06-28 · após Wave 3, Seleção turbinada, Galerias v2 e CRM+ (lead/orçamento/costuras).

---

## 🎯 Onde queremos chegar
Transformar o painel da Alma (CRM + ERP de fotografia: site público + área do cliente +
painel admin com ~19 módulos) de **demo (localStorage)** num **sistema real** com Supabase
(banco, login, storage de fotos), e que funcione como **"organismo único"** — cada ação
reverbera nos módulos certos automaticamente (as "costuras"). No fim, **revender** o sistema
para outros estúdios de fotografia.

Parceria: **Jorge** (JV Web Studio, dev/dono) + **Maurício** (dono da Alma, sócio).

---

## ⚠️ Arquitetura crítica (NUNCA esquecer)
- **PASTA FONTE** (`E:\DESENVOLVIMENTO DE SITES\ESTRUTURA SITE FOTOGRAFIA`) = molde genérico,
  zerado, revendível (código + schema SQL). **ALMA** (esta pasta) = 1ª instância (marca +
  `.env` com chaves + dados da Alma).
- **1 estúdio = 1 Supabase isolado. SEM `studio_id`, SEM multi-tenant.**
- Schema das migrations = genérico (promove pra FONTE depois); seeds + `.env` = só na ALMA.
- Decisão atual: migrations ficam só na ALMA por enquanto.

---

## 🔑 Regras e decisões (do Cowork + acordadas)
- **Começar VAZIO** (sem demo de clientes/ensaios); Jorge cria tudo testando. Catálogo é
  config → seedado.
- Só **anon key** no frontend; `service_role` nunca. **RLS** em toda tabela. **Todo `GRANT`
  explícito** (RLS sozinha dá erro `42501 permission denied`).
- **Cliente final SEM conta Auth** → entra na galeria por **código + senha**, validado no
  servidor (funções RPC SECURITY DEFINER). Originais em alta nunca expostos.
- Marca d'água gerada **no navegador (canvas)**; previews/thumbs no **bucket público**
  `previews` (UUID não-listável), originais no bucket **privado** `galerias`.
- Pagamento ao enviar a seleção: **pagar agora OU em até 3 dias úteis**. Valor a pagar =
  (valor do ensaio − sinal/reserva do pacote) + fotos extras.
- **Nada pago/externo**: aviso ao cliente via link `wa.me` (WhatsApp) e `mailto` (e-mail) —
  semi-automático (abre a mensagem pronta, estúdio confirma o envio).
- Estilo de trabalho: **velocidade, sem partes quebradas, consultar Jorge nas regras de
  negócio**. Construir em **jornadas/waves completas e testáveis**, validando cada uma.

---

## ✅ O QUE ESTÁ PRONTO (build ok)

### Migrations (`supabase/migrations/`)
| Arquivo | O que faz |
|---|---|
| `01_core` | profiles + roles; 1º usuário vira admin; RLS |
| `02_catalogo` | pacotes + produtos (leitura pública dos ativos) |
| `03_clientes` | clientes (com `data_nascimento`), RLS privada |
| `04_ensaios` | ensaios + agendamentos (reserva do site, anon insert) |
| `05_costura_agendamento` | trigger: reserva site → casa/cria cliente + lança ensaio (tag "site") |
| `06_galerias` | bucket privado `galerias` + tabelas galerias/fotos |
| `07_cliente_galeria` | bucket público `previews` + RPCs `entrar_galeria`/`salvar_selecao_foto`/`finalizar_selecao` |
| `08_pagamento_selecao` | contas_receber + RPC finalizar_selecao (pagar agora / 3 dias úteis) |
| `09_financeiro` | lancamentos + contas_pagar + costuras (ensaio→conta a receber, reserva→entrada, conta paga→lançamento reversível) + backfill |
| `10_producao` | etapas_producao (edição/cor/retoque, responsável, prazo) + agendamentos.duracao_min + backfill |
| `11_contratos` | bucket privado `contratos` + tabela contratos (cláusulas/PDF/assinatura/token) + `contas_receber.contrato_id`; costura **assinado→conta a receber + move funil** (dedup por ensaio, reversível, limpa órfã ao excluir) + RPCs anon `carregar_contrato`/`assinar_contrato` (só assina o que foi **enviado**) |
| `12_notas` | tabela notas_fiscais (base) + índice único parcial (1 nota ativa por conta); fila "Pronto para emitir" é **derivada** (contas pagas sem nota) |
| `13_selecao_plus` | `fotos.nome_arquivo` (export Lightroom) + `fotos.favorita_fotografo` + `galerias.mensagem_fotografo`; `entrar_galeria` devolve favoritas + recado (mantém valor_total/reserva do 08) |
| `14_notas_faturaveis` | `notas_fiscais.lancamento_id` + índice único; fila "Pronto para emitir" passa a vir dos **lançamentos de entrada** (todo pagamento recebido, incl. reserva do site) |
| `15_galerias_v2` | `fotos.tipo` (selecao\|entrega) + bucket público `entregas` (finais sem marca, tamanho real); `entrar_galeria` devolve as duas listas; `reenviar_selecao` (recorrência) |
| `16_crm_lead` | clientes `urgencia`/`primeiro_contato`/`orcamento` jsonb; tabela `cliente_atualizacoes` (histórico); costura **criar ensaio→funil 'agendado'**; `assinar_contrato` relaxado (bloqueia só cancelado) |

### Funcionalidades reais
- Login admin real (Supabase Auth — Maurício é admin).
- Catálogo (pacotes/produtos) lendo do banco com fallback.
- Clientes + Funil no banco; ensaios ligados a clientes.
- **Costura reserva do site → cliente + ensaio** (automática, por e-mail/telefone).
- Upload de fotos com **marca d'água**; galeria protegida.
- **Área do cliente real** (`/cliente`): login código+senha, seleção rica (clicar na foto,
  ampliar, observação por foto, foto extra por ensaio), enviar seleção.
- **Pagamento na seleção** (agora / 3 dias úteis) → gera conta a receber.
- **Seleções** (admin): status **reversível** (selecionando↔enviado↔editando↔pronto) +
  **desfazer pagamento**.
- **Costura status galeria → ensaio → funil**: cliente sobe pra "Produção"/"Entregue" sozinho.
- Funil e ClienteModal mostram **todos os ensaios** com status de cada.
- **Visão geral** real: KPIs (recebido no mês, a receber, reservas a confirmar, ensaios
  ativos), pendências, **aniversariantes do mês**.
- **Financeiro / Contas / Fluxo de Caixa & DRE** lendo do banco (lançamentos + contas).
- **Fluxo de trabalho**: ensaios em produção com sub-etapas (responsável/prazo/progresso).
- **Agenda**: confirmar reserva pede **duração real** → bloqueia horários do dia; reservas
  separadas (aguardando × histórico) e **clicáveis** (modal de detalhe).
- **Contratos no banco** (Wave 3): criar de modelo/zero/PDF (PDF em bucket **privado**),
  enviar por WhatsApp (link com **token**), **página pública `/assinar/:token`** assina sem
  login (RPC anon, só contrato **enviado**). Costura **assinado → conta a receber + move
  funil p/ "Agendado"** (dedup por ensaio p/ não cobrar 2×; reversível; sem órfã ao excluir).
- **Notas fiscais** (Wave 3, Fase 3): bloco **"Pronto para emitir"** = contas **recebidas**
  sem nota (derivado); **1 clique gera a nota** vinculada ao pagamento; lista de notas reais
  com status; "marcar emitida" manual (nº) até a Focus NFe. Emissão fiscal real fica p/ depois.
- **Seleção turbinada** (Bloco 5+): (a) **bug do pagamento corrigido** — o painel lê a conta por
  ensaio OU galeria (a conta vive no ensaio, `galeria_id` nulo), não some mais ao voltar status;
  (b) **Exportar p/ Lightroom** — gera `.lrsmcol` (Coleção Inteligente) que o LR importa e
  seleciona as fotos sozinho, casando pelo nome (sem extensão → pega o RAW) + `.txt` alternativo
  (precisa `fotos.nome_arquivo`, salvo no upload a partir de agora); (c) **avisar o cliente por
  status** — pop-up opcional com **3 modelos** (+ os do estúdio, salvos no navegador), editar e
  enviar por WhatsApp/e-mail/copiar ou **pular** (nada automático); (d) **Indicações da Alma** —
  o fotógrafo ⭐favorita fotos + escreve um recado → aparecem em destaque na área do cliente
  ("A Alma indica pra você"), ajudando a vender extras.
- **CRM+** (lead/orçamento/costuras): **lead editável** (origem, primeiro contato, interesse,
  urgência, notas) + **histórico de atualizações** (timeline "o que foi conversado",
  `cliente_atualizacoes`); **orçamento real** (jsonb no cliente; "Enviar" move pra etapa
  "Orçamento" + pop-up de modelos); costuras de funil **criar ensaio → "Agendado"** e contrato
  assinado → "Agendado"; **alerta na Visão**: qualquer ensaio sem contrato → "falar e contratar".
  Bug do envio de contrato corrigido (AnimatePresence sem key). Pop-ups com fundo leve (sistema
  visível atrás) e botão Voltar fecha o pop-up. Toda mensagem ao cliente via [[padrao-mensagens-cliente]].
- **Galeria Seleção + Entrega** (Bloco 5++): cada galeria tem 2 abas — **seleção** (provas com
  marca, 1024px, leves; não guarda original) e **entrega** (finais **sem marca**, tamanho real,
  bucket `entregas`). **Mesmo login** dá acesso às duas abas no `/cliente` (escolher / baixar em
  alta). **Recorrência:** o cliente pode escolher mais e "Enviar novas escolhas" → volta pro
  estúdio (vendas avulsas). Capa **monograma** (iniciais) nos cards. "Avisar cliente" via pop-up
  de modelos. Toda mensagem ao cliente agora usa esse pop-up ([[padrao-mensagens-cliente]]).

---

## ⏸️ ONDE PARAMOS — pendente do Jorge AGORA
1. **Rodar `11` → `12` → `13` → `14` → `15` → `16_crm_lead.sql`** no SQL Editor (conferir buckets
   `contratos` e `entregas` em Storage). Todas idempotentes.
   - Confirme o bucket privado **`contratos`** em Storage (se a policy falhar, crie o bucket à mão
     em Storage > New bucket, **Public = off**, e rode só o resto).
   - O `13` precisa que o cliente **reentre** na galeria (novo login) p/ ver favoritas/recado, e
     **fotos novas** p/ o export do Lightroom ter o nome original.
2. **Validar (teste de aceite no `supabase/README.md`):**
   - Contrato: criar → enviar → abrir `/assinar/<token>` em aba anônima → assinar. Voltar ao admin:
     contrato **Assinado**, cliente subiu p/ **Agendado** no funil, nasceu **conta a receber**.
   - Notas: marcar uma conta como **recebida** (Contas/Seleções) → em **Notas fiscais** ela aparece
     em **"Pronto para emitir"** → **Gerar nota**.
3. (Se ainda não rodou) `09_financeiro.sql` (corrigido) + `10_producao.sql` da Wave 2.

> Verificação adversarial da Wave 3 (workflow, 4 dimensões): **8 achados confirmados → 5 corrigidos
> no código** (assinar só contrato enviado; refresh ao montar Contratos/Notas; trigger limpa conta
> órfã ao excluir; índice único anti-nota-duplicada), **2 documentados** como limitação (signatário
> anônimo não vê PDF-só; upload de PDF falho é silencioso) e **1 falso-positivo** (duplo-lançamento:
> o `09` já atualiza a conta do ensaio em vez de inserir outra). Build verde.

---

## 🔜 PRÓXIMOS PASSOS (waves restantes)
- ✅ **Wave 3 — Contratos & Notas:** CONCLUÍDA (ver acima). Emissão fiscal real (Focus NFe)
  entra depois — Maurício providenciando dados fiscais (ver `docs/nfe/`).
- **Wave 4 — Portfólio:** favoritas → portfólio **sem marca d'água** (bucket público de
  portfólio + persistir no banco), perguntando a pasta/categoria antes (modal já existe).
- **Wave 5 — Kanban** (colunas customizáveis, cards arrastáveis), **Calendário** (FullCalendar
  open-source MIT, 4 visões: mês/semana/dia/lista, agregando tudo), **Tarefas** no banco,
  **relatório de aniversariantes** + presets de mensagem WhatsApp.
- **Pontas soltas:** ligar tela **Equipe** aos profiles; **disponibilidade da agenda**
  compartilhada (view pública `horarios_ocupados`) para o site público respeitar bloqueios.
- **Refinamentos Wave 3 (quando convier):** (a) signatário anônimo ver o **PDF** do contrato
  (RPC de signed-URL por token) — hoje contrato-só-PDF mostra aviso e o estúdio manda o PDF
  por fora; (b) avisar na UI quando o **upload de PDF falha** no criar contrato (hoje só
  `console.warn`); (c) **realtime** (Supabase) p/ contrato/agenda em vez de refresh-ao-montar.

---

## 🧠 Detalhes técnicos chave
- **`src/context/AppContext.jsx`** é o coração: carrega `clientesDB / ensaiosDB /
  agendamentosDB / galeriasDB` (só com sessão). O memo `clientes` **deriva** o status de cada
  ensaio e a etapa do funil a partir das galerias ligadas.
- Status da galeria: `selecionando → enviado → editando → pronto`. Funil: galeria ativa →
  `producao`, pronta → `entregue` (via `etapaMax`, nunca regride etapa manual).
- Vocabulário de status compartilhado: `src/data/statusEnsaio.js`.
- Libs de dados: `src/lib/` (supabase, catalogo, clientes, ensaios, agendamentos, galerias,
  storage, clienteGaleria, financeiro, producao, equipe).
- Gotchas: gerar/editar SQL grande em **arquivo** (não echo — trunca); **validar build sempre**
  (`npm run build`); toda tabela nova precisa de **GRANT explícito**; datas em pt-BR usar
  `new Date(iso + 'T12:00')` (evita recuo de fuso).

---

## 📚 Documentos de referência
- `CONTEXTO-PARA-CLAUDE-CODE.md` — briefing (a fonte que vale; ignora a tabela `studios` do HTML).
- `docs/backend/arquitetura-saas-supabase.html` — planta do banco (30+ tabelas, 11 blocos).
- `docs/plano/plano-costuras-painel.html` — o plano das **costuras** (o "organismo único").
- `docs/backend/perguntas-mauricio-dados-reais.md` — dados reais que o Maurício vai fornecer.
- `supabase/README.md` — ordem de aplicação das migrations + testes de cada bloco.
