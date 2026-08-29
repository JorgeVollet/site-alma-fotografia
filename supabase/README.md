# Backend Supabase — migrations

> 1 estúdio = 1 Supabase isolado. Sem `studio_id`, sem multi-tenant.
> Estes arquivos SQL são **genéricos** (servem para qualquer estúdio) e serão
> promovidos para a PASTA FONTE. Nada específico da Alma mora aqui.

## Ordem de aplicação

| Arquivo | Bloco | O que cria |
|---|---|---|
| `migrations/01_core.sql` | 0 | `profiles` + roles, trigger de signup (1º usuário vira admin), RLS |
| `migrations/02_catalogo.sql` | 1 | `pacotes` + `produtos`, RLS (leitura pública dos ativos, escrita só admin) |
| `migrations/03_clientes.sql` | 2 | `clientes` (com `data_nascimento`), RLS privada (só equipe autenticada), grants |
| `migrations/04_ensaios.sql` | 3A | `ensaios` (sessões, FK clientes) + `agendamentos` (reservas do site, anon insert), RLS + grants |
| `migrations/05_costura_agendamento.sql` | 3A | Trigger: reserva do site casa/cria cliente (por email/telefone) e lança ensaio com origem 'site' |
| `migrations/06_galerias.sql` | 4A | Bucket privado `galerias` + policies storage + tabelas `galerias` e `fotos`, RLS + grants |
| `migrations/07_cliente_galeria.sql` | 4B/5 | Bucket público `previews` + RPCs `entrar_galeria`/`salvar_selecao_foto`/`enviar_selecao` (acesso do cliente) |
| `migrations/08_pagamento_selecao.sql` | J1 | `contas_receber` + valores na galeria + RPC `finalizar_selecao` (pagar agora / 3 dias úteis) |
| `migrations/09_financeiro.sql` | J-Fin | `lancamentos` + `contas_pagar`; costuras: ensaio→conta a receber, reserva→entrada, conta paga→lançamento (reversível); backfill |
| `migrations/10_producao.sql` | Wave 2 | `etapas_producao` (edição/cor/retoque, responsável, prazo) + `agendamentos.duracao_min`; trigger galeria→'editando' cria 3 etapas; backfill |
| `migrations/11_contratos.sql` | 8a | bucket privado `contratos` + tabela `contratos` (cláusulas, PDF, assinatura, token); `contas_receber.contrato_id`; costura **assinado → conta a receber + move funil** (com dedup por ensaio, reversível); RPCs anon `carregar_contrato`/`assinar_contrato` |
| `migrations/12_notas.sql` | 8b | `notas_fiscais` (base/fila); a fila "Pronto para emitir" é **derivada** (contas pagas sem nota); emissão real Focus NFe entra depois |
| `migrations/13_selecao_plus.sql` | 5+ | `fotos.nome_arquivo` (export Lightroom) + `fotos.favorita_fotografo` (estúdio indica) + `galerias.mensagem_fotografo`; `entrar_galeria` redefinido (devolve favoritas + recado, mantendo valor_total/reserva do 08) |
| `migrations/14_notas_faturaveis.sql` | 8c | `notas_fiscais.lancamento_id` + índice único; a fila "Pronto para emitir" passa a vir dos **lançamentos de entrada** (todo pagamento recebido, incl. a reserva do site) |
| `migrations/15_galerias_v2.sql` | 5++ | `fotos.tipo` (selecao\|entrega) + bucket público `entregas` (finais sem marca); `entrar_galeria` devolve seleção **e** entregas; `reenviar_selecao` (recorrência) |
| `migrations/16_crm_lead.sql` | CRM+ | clientes ganham `urgencia`/`primeiro_contato`/`orcamento` jsonb; tabela `cliente_atualizacoes` (histórico); costura **criar ensaio → funil 'agendado'**; `assinar_contrato` relaxado (bloqueia só cancelado) |

Os próximos blocos entram como novos arquivos numerados (`17_*.sql`, etc.).

## Seeds (dados da instância — específicos da Alma)

`seeds/` tem dados **da Alma** (não vão para a PASTA FONTE). Rode DEPOIS da migration do bloco correspondente.

| Arquivo | Depende de | O que insere |
|---|---|---|
| `seeds/alma_catalogo.sql` | `02_catalogo.sql` | 3 pacotes (Pocket/Memórias/Experiência) + 3 produtos. Idempotente (`on conflict` atualiza). Valores provisórios, editáveis no admin. |

## Como aplicar (no painel do Supabase)

1. Abra o projeto em **supabase.com**.
2. Menu lateral > **SQL Editor** > **New query**.
3. Cole o conteúdo de `01_core.sql` e clique em **Run**.
4. Confira em **Table Editor** que a tabela `profiles` apareceu.

## Teste do Bloco 0

1. No `.env` (raiz do projeto) preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (Supabase > Settings > API).
2. Crie o primeiro usuário da equipe: Supabase > **Authentication** > **Users** >
   **Add user** > e-mail + senha do Maurício. (Marque "Auto Confirm User".)
   - Por ser o **primeiro** usuário, o trigger o torna **admin** automaticamente.
3. Rode o app (`npm run dev`) e entre em `/admin` com esse e-mail e senha.
4. ✅ Logou com e-mail e senha de verdade = Bloco 0 concluído.

## Teste do Bloco 1 (Catálogo)

1. SQL Editor > rode `migrations/02_catalogo.sql` > depois `seeds/alma_catalogo.sql`.
2. Confira em Table Editor que `pacotes` (3 linhas) e `produtos` (3 linhas) apareceram.
3. `npm run dev` > abra `/pacotes` — a página lê do banco (com fallback pro código se o banco falhar).
4. ✅ Para confirmar que veio do banco: edite o preço de um pacote no Table Editor do Supabase, recarregue `/pacotes` e veja o valor novo.

## Teste do Bloco 2 (Clientes + Funil)

1. SQL Editor > rode `migrations/03_clientes.sql`. (Não tem seed — começa VAZIO.)
2. Confira em Table Editor que a tabela `clientes` apareceu (0 linhas).
3. `npm run dev`, entre em `/admin`, vá em **Clientes** > **Novo cliente**. Preencha nome e a **data de nascimento**, salve.
4. Vá em **Funil** — o cliente aparece na coluna "Novo lead". **Arraste** para outra etapa.
5. **Recarregue a página** (F5). ✅ O cliente continua lá, na etapa para onde foi arrastado = está no banco.
6. Sanidade de privacidade: clientes NÃO podem ser lidos sem login (RLS). O site público não os expõe.

> Nota da migração: o admin agora começa VAZIO. Módulos como Seleções/Galerias/Financeiro
> mostram estados vazios até seus blocos (4–9). Isso é esperado.

## Teste do Bloco 3A (Ensaios + Agendamentos)

1. SQL Editor > rode `migrations/04_ensaios.sql`. (Sem seed — começa vazio.)
2. Table Editor: confira que `ensaios` e `agendamentos` apareceram (0 linhas).
3. **Reserva do site → banco:** com `npm run dev`, abra `/agendar` (como visitante, sem login),
   escolha pacote/data/horário, preencha nome/contato e finalize.
4. Entre no `/admin` > **Agenda** > a reserva aparece em "Reservas feitas no site". ✅
   (E em Table Editor a linha está em `agendamentos` com status `a-confirmar`.)
5. **Ensaio ligado a cliente:** em **Clientes** > abra um cliente > **Novo ensaio** >
   escolha tipo/pacote (valor e título são sugeridos) > salve. Recarregue (F5): o ensaio persiste na ficha.

### Costura reserva → cliente (trigger)

Rode `migrations/05_costura_agendamento.sql`. A partir daí, toda reserva NOVA do site:
- casa com um cliente existente por **e-mail OU telefone** → lança o ensaio na ficha dele; ou
- se não existir, **cria o cliente** (etapa "Agendado") e lança o ensaio.
- O ensaio aparece com a tag **"agendamento pelo site"**.

Teste: faça uma reserva em `/agendar` com um e-mail/telefone novo → veja o cliente nascer em
**Clientes** com um ensaio tagueado. Reserve de novo com o MESMO e-mail/telefone → vira um 2º
ensaio no MESMO cliente (não duplica).

> ⚠️ Vale só para reservas feitas DEPOIS de aplicar o trigger. Reservas/clientes de teste
> antigos não são religados — apague-os e teste do zero.

> Limites do 3A (vão para o 3B): a disponibilidade que o admin configura (dias/horários
> bloqueados, buffer) ainda é por navegador (localStorage), então o site público não a
> respeita ainda; e o fluxo "a confirmar" com reajuste automático + o calendário FullCalendar
> são o próximo passo.

## Teste do Bloco 4A (Galerias + Fotos)

1. SQL Editor > rode `migrations/06_galerias.sql`.
   - Confira em **Storage** que o bucket **`galerias`** apareceu (privado).
   - Se a criação da policy de storage der erro de permissão, crie o bucket pelo painel
     (Storage > New bucket > nome `galerias`, **Public = off**) e rode só a parte das tabelas.
2. Precisa de um cliente COM ensaio. Crie um em **Clientes** (ou faça uma reserva no site, que
   cria cliente+ensaio pela costura).
3. **Admin → Galerias → Nova galeria** > escolha o cliente e o ensaio > criar.
4. Abra a galeria > **Enviar fotos** > selecione várias imagens. Elas sobem (com barra de
   progresso) e aparecem no grid **com marca d'água**.
5. ✅ Protegidas: em **Storage > galerias**, cada foto tem `original.*` (alta, privada),
   `preview.jpg` (marca d'água) e `thumb.jpg`. O bucket é privado — sem URL pública; o app
   usa URLs assinadas temporárias.

> 4A faz o upload e a galeria no admin. Ligar a galeria à área do cliente (login por código +
> seleção rica com observação por foto) é o Bloco 5.

## Teste do Bloco 4B/5 (Área do cliente + seleção rica)

1. SQL Editor > rode `migrations/07_cliente_galeria.sql`. Confira em **Storage** que o bucket
   **`previews`** (público) apareceu.
2. ⚠️ As fotos do 4A subiram preview/thumb no bucket privado; agora vão para o `previews`.
   Na galeria de teste, **apague as fotos antigas e suba de novo** (e confira que tem **senha**:
   no painel da galeria, defina/edite a senha e salve).
3. Pegue o **código** e a **senha** da galeria (no admin, dentro da galeria).
4. Abra **`/cliente`** (em aba anônima, como o cliente), entre com código + senha.
5. **Seleção rica:** clique nas fotos para selecionar; clique na **lupa** para ampliar e escrever
   uma **observação** ("arrumar o cabelo"); veja o contador de **fotos extras** somar. Clique
   **Enviar seleção**.
6. Volte ao admin > a galeria mostra as fotos **selecionadas** e as **observações** do cliente.
7. **Avisar o cliente:** no painel da galeria, os botões **WhatsApp** e **E-mail** abrem a
   mensagem pronta (código + senha + passo a passo) — é só enviar.

> Segurança: o cliente vê só as **previews com marca d'água** (bucket público, link UUID
> não-listável). Os **originais em alta** ficam no bucket privado `galerias` e nunca são expostos.

## Teste da Jornada 1 (seleção → pagamento → produção)

1. SQL Editor > rode `migrations/07_cliente_galeria.sql` (se ainda não rodou) e depois
   `migrations/08_pagamento_selecao.sql`.
2. Crie uma galeria NOVA (Galerias > Nova galeria) — para os valores (pacote/reserva)
   serem gravados — e **suba fotos** (use "Selecionar todas / Excluir selecionadas" se precisar limpar).
3. Pegue **código + senha** da galeria.
4. Em `/cliente` (aba anônima): entre, **selecione**, deixe observação, clique **Enviar seleção**.
   - Aparece o resumo (**saldo + fotos extras = total**) e a escolha **Pagar agora** ou
     **Pagar em até 3 dias úteis**. Escolha uma.
5. No admin > **Seleções**: a galeria aparece como "Seleção recebida". Abra:
   - vê as **fotos selecionadas** + **observações**;
   - vê o **pagamento** (pago, ou a receber até a data) e pode **marcar como recebido**;
   - botões **Iniciar edição** → **Marcar como pronto** movem o status.

> Pendente (próximas jornadas): a Visão geral (dashboard) e os relatórios ainda não leem os
> dados reais — entram na jornada de Gestão. Produção por etapas/Kanban e Financeiro completo
> também são as próximas jornadas.

## Teste do Bloco 8 (Contratos & Notas — Wave 3)

1. SQL Editor > rode `migrations/11_contratos.sql` e depois `migrations/12_notas.sql`.
   - Confira em **Storage** que o bucket **`contratos`** (privado) apareceu.
   - Table Editor: `contratos` e `notas_fiscais` apareceram (0 linhas).
2. **Criar + enviar + assinar (contrato):**
   - Admin → **Contratos → Novo contrato**. Escolha um cliente, um modelo, valor, e crie.
     (Opcional: vincular a um ensaio do cliente — aí o contrato **não** gera outra conta.)
   - Abra o contrato → **Enviar por WhatsApp** → copie o **link** (usa o *token*).
   - Abra o link em **aba anônima** (`/assinar/<token>`): o contrato carrega, **assine** no canvas e confirme.
3. ✅ **Costura do contrato:** volte ao admin (recarregue). O contrato está **Assinado**; o cliente
   subiu no **Funil** para "Agendado"; e em **Contas/Financeiro** nasceu uma **conta a receber** do
   contrato (só se ele **não** estava vinculado a um ensaio que já tinha conta — evita cobrar 2×).
   - Reversível: o admin pode "Marcar assinado" direto (sem o link), com a mesma costura.
4. **Notas faturáveis (Fase 3):** marque uma **conta a receber** como **recebida** (em Seleções/Contas).
   - Vá em **Notas fiscais** → o pagamento aparece no bloco **"Pronto para emitir"**.
   - Clique **Gerar nota** (NFS-e/NF-e) → a nota nasce vinculada àquele pagamento, na lista de notas.
   - No detalhe da nota, "Marcar como emitida" registra o número manualmente (até a Focus NFe conectar).
5. ✅ Teste de aceite (do plano): *conta recebida → aparece na fila "pronto para emitir" → 1 clique gera a nota.*

> Emissão fiscal REAL (XML/PDF na prefeitura via **Focus NFe**) entra depois — esta fase só prepara a
> conexão. Dados fiscais (CNPJ, regime, CFOP…) o Maurício vai fornecer (ver `docs/nfe/`).

## Teste do Bloco 5+ (Seleção turbinada — bug pagamento, Lightroom, favoritas, avisos)

1. SQL Editor > rode `migrations/13_selecao_plus.sql`.
2. **Bug do pagamento (corrigido):** abra uma seleção em **Seleções**. O painel "Pagamento da
   seleção" agora mostra a cobrança **sempre que existir** (a conta vive no ensaio, com
   `galeria_id` nulo) — antes sumia ao voltar o status. Voltar/avançar status não esconde mais.
3. **Exportar p/ Lightroom:** **suba fotos NOVAS** numa galeria (o nome original só é salvo a
   partir de agora — fotos antigas não têm). O cliente seleciona; no admin, em Seleções, clique
   **Exportar p/ Lightroom** → baixa um `.lrsmcol`.
   - No Lightroom Classic: painel **Coleções** > clique direito > **Importar configurações de
     coleção inteligente** > escolha o arquivo. A coleção aparece já com as fotos escolhidas
     (casa pelo nome, sem extensão → pega o RAW). Pra virar bandeira: abra a coleção, Ctrl/Cmd+A,
     tecla **P**. (Há também a opção **Lista (.txt)** como alternativa.)
4. **Avisar o cliente por status:** mude o status (ex: **Iniciar edição**). Abre um pop-up com
   **3 modelos** de mensagem (+ os seus, salvos no navegador): escolha, edite e envie por
   **WhatsApp/e-mail/copiar**, ou clique **Pular**. Nada dispara sozinho. Dá pra reabrir no
   botão **Avisar cliente**.
5. **Indicações da Alma (favoritas do fotógrafo):** em Seleções, na grade **Fotos**, clique na
   **⭐** das fotos que você recomenda + escreva o **recado** e salve. Entre em `/cliente` com o
   código+senha: aparece a faixa **"A Alma indica pra você"** com o recado e as fotos indicadas
   (clicáveis), e um selo ⭐ nas indicadas do grid. (Ótimo p/ vender extras.)

## Ajustes pós-teste (Bloco 8 + Visão geral)

Rode `migrations/14_notas_faturaveis.sql`. O que mudou:
- **Contrato puxa o valor do ensaio:** em *Novo contrato*, ao escolher o ensaio vinculado, o
  **valor** (e o objeto) vêm do ensaio automaticamente.
- **Notas "Pronto para emitir" = todo pagamento recebido:** agora a fila vem dos **lançamentos
  de entrada** — inclusive a **reserva paga no agendamento do site**. Os ensaios pré-pagos
  aparecem lá. (Gerar nota fica `pendente` = gerada, aguardando a emissão real da Focus NFe.)
- **Desfazer / cancelar / excluir nota:** no detalhe da nota — *Desfazer emissão* (volta p/
  gerada), *Cancelar* (estorno/devolução) e *Excluir*; ao cancelar/excluir, o pagamento volta
  para "Pronto para emitir".
- **Agendou pelo site → atenção na Visão geral:** clientes que reservaram pelo site (já pagaram)
  e ainda **sem contrato** aparecem num bloco "Agendou pelo site — fale e contrate" (WhatsApp +
  criar contrato).
- **Aniversariantes (Visão geral):** filtros **Próx. 7 dias / 15 dias / Mês** (agora atravessa a
  virada de mês). Clique no aniversariante → pop-up com **6 mensagens** carinhosas (WhatsApp/
  e-mail/copiar), igual ao aviso de status.
- **Export da seleção:** ao baixar, abre um passo a passo de como **importar o `.lrsmcol`** no
  Lightroom.

## Teste do Bloco 5++ (Galeria com Seleção + Entrega)

1. SQL Editor > rode `migrations/15_galerias_v2.sql`. Confira em **Storage** o bucket **`entregas`**
   (público). Se a policy falhar, crie à mão (Storage > New bucket > `entregas`, **Public = on**).
2. **Capa monograma:** os cards de Galerias mostram as iniciais do cliente + sigla do ensaio + data.
3. **Abas no admin** (Galerias > abra uma): **Fotos p/ seleção** (provas, marca d'água, 1024px) e
   **Entrega das fotos** (finais **sem marca**, tamanho real). Suba fotos em cada aba.
   - ⚠️ A seleção agora redimensiona p/ **1024px** e **não guarda o original** (economia). O estúdio
     mantém os RAW no Lightroom; as finais vão na aba Entrega.
4. **Avisar cliente:** botão abre o pop-up de **modelos** (escolher fotos / baixar finais) — você
   revisa e envia (nunca dispara sozinho).
5. **Cliente (`/cliente`):** mesmo **código+senha** dá acesso às duas abas — **Escolher fotos**
   (seleção) e **Minhas fotos** (baixar as finais em alta, "Baixar todas").
6. **Recorrência:** depois de enviar, o cliente pode escolher **mais** fotos e clicar **"Enviar
   novas escolhas"** → a galeria volta p/ "Seleção recebida" no painel (estúdio reedita / combina
   as avulsas). Ótimo p/ vendas futuras.

## Teste do CRM+ (lead editável, orçamento, costuras)

1. SQL Editor > rode `migrations/16_crm_lead.sql`.
2. **Contrato (bug corrigido):** Contratos > abra um > **Enviar por WhatsApp** > **Marcar enviado**
   (não "abre e fecha" mais; abre o WhatsApp se houver telefone, e o contrato fica liberado p/
   assinatura mesmo sem telefone — é só copiar o link).
3. **Pop-ups:** qualquer modal abre com o **painel visível por trás** (fundo bem mais leve).
4. **Lead editável + histórico:** Funil > clique num cliente **lead** > edite origem / primeiro
   contato / interesse / urgência / notas e **Salvar**. Abaixo, em **Histórico de atualizações**,
   escreva "o que foi conversado" e adicione — fica registrado com data.
5. **Novo ensaio → Agendado:** Clientes > abra um lead > **Novo ensaio** > salve. O cliente sobe
   para **Agendado** no funil automaticamente (forward-only).
6. **Orçamento:** Funil > cliente na etapa **Orçamento** (ou mova p/ lá) > monte os itens >
   **Enviar orçamento** > move p/ "Orçamento" + abre o pop-up de modelos com o total.
7. **Visão:** qualquer cliente com ensaio e **sem contrato** aparece no bloco "Ensaio sem
   contrato — falar e contratar".

## Regras de segurança

- Só a **anon key** vai pro frontend (`.env`). A `service_role` nunca sai do servidor.
- **RLS ligado** em toda tabela antes de qualquer dado real.
- Cliente final **não** tem conta Auth (galeria por código + senha, validado no servidor).
