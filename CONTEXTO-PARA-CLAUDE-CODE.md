# CONTEXTO DO PROJETO — Leia isto primeiro

> Este arquivo é o briefing completo do projeto. Foi escrito pelo Claude do Cowork
> (que planejou tudo com o Jorge) para passar o bastão ao Claude Code, que vai
> EXECUTAR a construção do backend. Leia este arquivo INTEIRO antes de começar.

---

## Quem é quem
- **Jorge Henrique** (JV Web Studio) — o dev/dono do projeto. Fala português. Quer respostas concisas e diretas, e ser tratado como parceiro técnico ("nós", "vamos").
- **Maurício Diesel** — dono do estúdio Alma Fotografia, agora SÓCIO do Jorge no projeto.
- Stack: **React 18 + Vite 5 + Tailwind CSS 3 + Framer Motion + React Router v6**.

## O que é o projeto
Um sistema completo (site público + área do cliente + painel admin) para o estúdio
**Alma Fotografia** (Boa Vista do Buricá/RS, nicho materno-infantil). O painel admin é
um CRM + ERP de fotografia: galerias, seleção de fotos, agendamento, financeiro,
contratos, notas fiscais, portfólio, diagramador de álbuns, etc.

---

## ⚠️ ARQUITETURA CRÍTICA — PASTA FONTE x ALMA (NUNCA ESQUECER)

O Jorge vai **REVENDER** este sistema para outros estúdios de fotografia. Por isso:

1. **`E:\DESENVOLVIMENTO DE SITES\ESTRUTURA SITE FOTOGRAFIA`** = a **PASTA FONTE** (o molde/template GENÉRICO e ZERADO). É o miolo revendível, SEM marca, SEM dados da Alma. É a "fonte da verdade" do código genérico.

2. **`E:\DESENVOLVIMENTO DE SITES\SITE ALMA FOTOGRAFIA`** = a **ALMA** (a primeira instância). É o template + a marca da Alma (logo, cores, textos) + as chaves do Supabase dela + os dados dela.

**REGRA DE OURO ao construir qualquer coisa nova:**
- Separe sempre o que é **genérico** (lógica, componentes, schema do banco, código do sistema → vai para a PASTA FONTE) do que é **específico da Alma** (marca, `.env` com chaves, seeds de dados → fica só na ALMA).
- Construa pensando nessa separação DESDE O INÍCIO. Quando o Jorge for vender para outro estúdio, ele copia a PASTA FONTE (já limpa), troca a marca e conecta um Supabase novo vazio.
- **NÃO** fazer cópia automática a cada mudança (risco de divergir). A PASTA FONTE é a fonte; a Alma nasce dela.
- Cada estúdio terá o **PRÓPRIO Supabase isolado** (não compartilhado, sem multi-tenant, SEM coluna `studio_id`). O banco inteiro já é de um estúdio.

---

## Onde estamos AGORA (estado real)

**O que JÁ EXISTE e funciona:**
- Todo o FRONTEND (site público + área do cliente + painel admin com ~19 módulos).
- O estado vive em `src/context/AppContext.jsx` + `localStorage`, com dados DEMO em `src/data/crm.js`, `studio.js`, `galleries.js`, `notasFiscais.js`.
- Já foi feita a "Fase 0 das costuras" (cliente unificado) ainda no localStorage.

**O que NÃO existe ainda (a construir = SEU trabalho):**
- Backend Supabase (banco, login real, storage de fotos).
- Trocar TODO o demo por dados reais. **O Jorge quer começar VAZIO** — remover todos os clientes/ensaios demo; ele cria tudo do zero testando manualmente.
- As melhorias pedidas pelo Maurício (ver abaixo).

---

## O PLANO — documento mestre da arquitetura
Leia: **`docs/backend/arquitetura-saas-supabase.html`** (a planta completa do banco, 30+ tabelas, auth, storage, 11 blocos de migração, RLS). Tudo que você precisa para o schema está lá, derivado do código real.

**Outros documentos úteis em `docs/`:**
- `docs/backend/perguntas-mauricio-dados-reais.md` — dados reais que o Maurício vai fornecer (pacotes, equipe, etapas, etc.).
- `docs/plano/plano-costuras-painel.html` — plano das costuras entre módulos.
- `docs/nfe/` — tudo da Nota Fiscal (Focus NFe), já planejado, o Maurício está providenciando os dados fiscais.

---

## As MELHORIAS pedidas pelo Maurício (entram durante a migração)
1. **Prazos por etapa de produção** — cada ensaio tem sub-etapas (edição → tratamento de cor → retoque de pele), cada uma com prazo, responsável e lembrete próprios.
2. **Valor de foto extra por cliente/ensaio** — hoje fixo no pacote; deve ser configurável por ensaio (negociam caso a caso), definido ao enviar as fotos pra seleção.
3. **Kanban estilo Trello** — quadro de produção com colunas customizáveis e cards arrastáveis (eles usam Trello hoje).
4. **Seleção de fotos rica** (na área do cliente) — selecionar clicando NA FOTO (não só no coração) + botão ampliar + **observação por foto** (texto livre que o editor lê: "arrumar cabelo", "tirar mancha").
5. **Data de nascimento + aniversariantes** — cadastro com data de nascimento; alerta de aniversariantes do mês na Visão geral (ordenado por proximidade); relatório de aniversariantes com filtros. Futuro: presets de mensagem WhatsApp.
6. **Mais relatórios** — hoje só funil; adicionar aniversariantes, financeiro, produção, com filtros.

## CALENDÁRIO COMPLETO (melhoria grande)
A Agenda atual é fraca. O Jorge quer um **calendário tão bom quanto o Google Calendar**:
- 4 visões: Mês (eventos DENTRO de cada dia), Semana (com horas), Dia (hora a hora), Lista (próximos).
- Mostra TUDO: ensaios + prazos de entrega + etapas de produção + aniversários + tarefas + contas a vencer.
- Eventos manuais livres (a equipe cria os próprios).
- **Avaliar usar FullCalendar** (versão open-source MIT, GRATUITA) em vez de construir do zero. **IMPORTANTE: o Jorge NÃO quer NADA com custo.** Só usar libs gratuitas/open-source. Se sugerir algo, confirmar que é grátis.

## GATEWAY DE PAGAMENTO = STONE (decisão do cliente)
- O gateway será **Stone Online** (API Stone, devcenter em stone.com.br/devcenter) — PIX, cartão, boleto, webhook, sandbox. NÃO usar Mercado Pago. Motivo: a Alma já usa Stone, centraliza o financeiro.
- Integra no Bloco 7-8 (pagamento real). Precisa: API key da Stone (do Maurício), webhook pra confirmar pagamento.
- **Maquininha física (Stone Connect 2.0) = DESEJO FUTURO**, não implementar agora (exige homologação no Programa de Parcerias Stone; ganho pequeno por ora).

## FLUXO DE AGENDAMENTO (regra de negócio importante)
- Site oferece 2 opções ao cliente: "agendar um horário agora" OU "só quero que entrem em contato".
- Agendamento do site cai como **"a confirmar"** (provisório), usando um tempo de precaução configurável (buffer antes/depois).
- Para CONFIRMAR é **OBRIGATÓRIO** preencher o tempo REAL do ensaio. Sem isso, não confirma.
- Ao confirmar → a agenda **reajusta automaticamente** os horários livres do dia.

---

## ⚠️ REGRAS TÉCNICAS (aprendidas neste projeto)
1. **Cada estúdio = 1 Supabase isolado.** Sem `studio_id`, sem multi-tenant.
2. **Chaves secretas NUNCA no frontend.** Só a `anon key` (VITE_SUPABASE_ANON_KEY) vai pro client. `service_role` só em Edge Functions/servidor. O `.env` já está no `.gitignore`.
3. **RLS obrigatório** em toda tabela antes de pôr dados reais.
4. **Bug de truncamento de arquivos grandes:** editar/gerar arquivos longos via heredoc ou Python, NÃO via echo/redirect simples (truncam e injetam null bytes). Quebrar migrations em vários arquivos por domínio (01_core.sql, 02_catalogo.sql...). Validar sempre.
5. **Cliente final NÃO tem conta Auth** — entra na galeria com código de acesso + senha, validado no servidor (Edge Function). Modelo Alboom.
6. **Começar VAZIO** — remover todo o demo, o Jorge cria tudo testando.

---

## PRÓXIMO PASSO: BLOCO 0 (banco + login)
1. Instalar `@supabase/supabase-js`.
2. Criar `src/lib/supabase.js` com o client (usando VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY do `.env`).
3. Gerar as migrations SQL do núcleo: tabelas base (sem studio_id), função/trigger de criar profile no signup, RLS.
4. **O Jorge precisa fazer (você o guia):** criar o projeto no painel do Supabase (supabase.com), pegar a URL + anon key, colar no `.env`, e rodar as migrations no SQL Editor do Supabase.
5. Trocar o login fake do `src/pages/Admin.jsx` pelo Supabase Auth real.
6. **Teste do Bloco 0:** o Maurício (ou o Jorge) loga no painel com e-mail e senha de verdade.

> Comece confirmando com o Jorge se ele já criou o projeto no Supabase. Se não, guie-o
> passo a passo (ele não precisa saber SQL nem programar — só clicar e colar chaves).

---

## Como o Jorge trabalha
- Português, conciso. Valoriza honestidade técnica (apontar riscos, não prometer o que não dá).
- Testa visualmente no navegador — confie nisso para pegar erros de runtime.
- Sempre validar build antes de dizer que está pronto.

## ⚠️ MUITO IMPORTANTE — O Jorge é INICIANTE em backend/banco de dados
- O Jorge sabe mexer no frontend, mas é **NOVO em Supabase, SQL, terminal e banco de dados**.
- **SEMPRE dê passo a passo MASTIGADO** quando pedir algo que ele faça no Supabase ou no terminal. Nunca assuma que ele sabe o que é "Table Editor", "rodar uma migration", "SQL Editor", etc.
- Para CADA ação no painel do Supabase, diga EXATAMENTE: onde clicar (nome do menu/botão), o que copiar, onde colar, e o que ele deve VER na tela depois pra saber que deu certo.
- Quando precisar que ele rode um SQL: **mostre o conteúdo do arquivo pra ele copiar** (ele não sabe abrir arquivos sozinho), e diga "cole no SQL Editor do Supabase e clique em Run".
- Diferencie claramente: "SQL Editor" = onde se RODA comandos; "Table Editor" = onde se VÊ/edita os dados como planilha (não roda nada).
- Evite jargão. Se usar um termo técnico, explique em uma frase. Trate como se estivesse ensinando alguém que nunca usou Supabase.
- Prefira numerar os passos (1, 2, 3...) e ser explícito. Mais vale repetir do que deixar ele travado.
