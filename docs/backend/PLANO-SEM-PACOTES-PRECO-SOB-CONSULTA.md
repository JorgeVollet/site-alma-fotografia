# PLANO — Remover pacotes/preços do site + "preço sob consulta" (para o Claude Code)

> Instrução de execução para o Claude Code. Vem de uma decisão estratégica do dono
> (Maurício). Leia o CONTEXTO-PARA-CLAUDE-CODE.md antes. Execute quando o Jorge pedir
> (provavelmente após terminar a etapa atual do backend).

---

## POR QUÊ (a decisão estratégica)
O Maurício NÃO quer mostrar preços/pacotes no site público. O preço da Alma é um pouco
acima da concorrência; mostrado sem contexto, o cliente se assusta e desiste. A estratégia
é agregar valor NA CONVERSA (WhatsApp) e só então apresentar o preço ("preço sob consulta").
Muitos clientes já chegam direto pelo WhatsApp.

## O QUE FAZER (resumo)
1. Remover a página de **Pacotes** do site público (rota + menu).
2. Transformar a área de **Serviços** no ponto de conversão, com "preço sob consulta" e dois caminhos: falar no WhatsApp OU agendar a data com sinal fixo.
3. Ajustar o fluxo de agendamento para NÃO depender de pacote/preço (sinal fixo único).
4. No backend/painel: pacotes deixam de ser vitrine; vira "orçamento personalizado por cliente" (uso interno).

---

## FRONTEND — passo a passo

### 1. Remover a página de Pacotes
- `src/App.jsx`: remover o `import Pacotes` e a `<Route path="/pacotes" ...>`.
- `src/components/Header.jsx`: remover o item de menu `{ to: '/pacotes', label: 'Pacotes', n: '04' }` e renumerar os demais itens do menu (n: '01', '02'...) para não pular número.
- O arquivo `src/pages/Pacotes.jsx` pode ser deletado OU mantido sem rota (decidir com o Jorge; sugiro deletar para limpar).
- Conferir se algum outro lugar linka para `/pacotes` (buscar no projeto) e trocar esses links por `/servicos` ou pelo CTA de agendar.

### 2. Serviços vira o ponto de conversão (`src/pages/Servicos.jsx`)
Hoje cada serviço (SERVICOS de studio.js) tem um card com link "Agendar {nome}" para `/agendar`.
Adicionar, em cada serviço, um bloco de **"agendar sua data"** com:
- Texto: **"Investimento sob consulta"** + algo como "Cada ensaio é único. Fale com a gente para um orçamento personalizado, ou garanta já a sua data."
- Dois botões/CTAs:
  - **"Falar no WhatsApp"** → usa o helper `src/lib/wa.js` (já existe). Mensagem pré-pronta tipo: "Oi! Tenho interesse no ensaio {nome}. Pode me passar um orçamento?"
  - **"Agendar minha data"** → leva ao fluxo de agendamento (`/agendar`), já com o serviço pré-selecionado se possível.
- NÃO mostrar preço em lugar nenhum.

### 3. Fluxo de agendamento sem preço (`src/pages/Agendar.jsx`)
Hoje o Agendar depende de PACOTES (escolher pacote, ver preço, pagar reserva proporcional).
Mudar para:
- Cliente escolhe o **tipo de ensaio** (serviço) e a **data** (dos horários disponíveis).
- Mantém as 2 opções já decididas: "agendar um horário agora" OU "só quero que entrem em contato" (ver fluxo-agendamento no CONTEXTO).
- A reserva cobra um **SINAL FIXO ÚNICO** (não proporcional ao pacote). Valor placeholder por enquanto (ex: R$100) — o Maurício confirma o valor real depois. Esse sinal é abatido do orçamento na conversa.
- Texto deixando claro: "O valor do ensaio é definido em orçamento personalizado. Este sinal garante a sua data e é abatido do valor final."
- Remover qualquer referência a preço de pacote / cálculo proporcional.

### 4. Limpeza
- `src/data/studio.js`: os PACOTES podem sair do site, mas NÃO apague o array ainda — ele vira referência para o "orçamento interno" no painel. Conferir com o Jorge. (No backend, vira a lógica de orçamento por cliente.)
- Garantir que a Home não tenha mais seção/links de pacotes com preço.

---

## BACKEND (Supabase) — ajustes relacionados
- A tabela `pacotes` continua existindo (uso INTERNO do painel para montar orçamento), mas **não alimenta vitrine pública**.
- `agendamentos`: o campo de valor da reserva passa a ser o **sinal fixo** (config do estúdio), não derivado do pacote. Guardar em `config_estudio` a chave `sinal_reserva` (valor único).
- O conceito de "orçamento personalizado por cliente" (tabela `orcamentos` + `orcamento_itens`, já no schema) é o que substitui o "pacote fixo" no fluxo de venda real: a Alma monta o orçamento no painel, na conversa.
- `ensaios.valor` e `ensaios.valor_foto_extra` continuam (definidos quando o orçamento é fechado, não pelo site).

---

## REGRAS (não esquecer)
- Pensar genérico (vai pra PASTA FONTE depois). Outro estúdio pode querer mostrar preço — então o "mostrar preço sim/não" idealmente é uma **config** (ex: `config_estudio.mostrar_precos = false` para a Alma). Se for simples, implemente como flag; se complicar, deixe hard-coded para a Alma e anote como melhoria.
- Sinal fixo = valor placeholder até o Maurício confirmar.
- Bug de truncamento: editar via heredoc/python, validar build (esbuild + tailwind).
- Validar que o site não quebra sem a rota /pacotes (links órfãos).
