# Alma Fotografia — Site + Área do Cliente + CRM

Site demonstrativo da **Alma Fotografia** (Boa Vista do Buricá/RS), estúdio especialista em materno-infantil. Plataforma completa com site institucional, área de seleção de fotos do cliente e painel administrativo (CRM PRO).

> Feito por **JV Web Studio** — www.jvwebstudio.agency

## Stack
- **React 18** + **Vite 5**
- **Tailwind CSS 3** (design system próprio — paleta blush / sálvia / champagne)
- **Framer Motion** (animações e scrollytelling)
- **React Router 6** (multipage SPA)

## Rodar localmente
```bash
npm install
npm run dev      # ambiente de desenvolvimento
npm run build    # gera a versão de produção (pasta dist/)
npm run preview  # pré-visualiza o build
```

## Páginas públicas
- **/** — Home (hero, sobre, serviços, galeria, processo, avaliações Google, mapa)
- **/servicos** — Especialidades (Gestar, Newborn, Acompanhamento, Smash the Cake, Família, Nós 1+1=3...)
- **/portfolio** — Galeria filtrável com lightbox
- **/pacotes** — Pacotes (incluindo o **Pocket Especial R$600**) + FAQ
- **/agendar** — Agendamento + reserva (pagamento simulado)
- **/cliente** — Área do Cliente (seleção de fotos estilo Alboom)

## Painel administrativo
- **/admin** — CRM completo: Visão geral, Seleções, Galerias, Agenda, Fluxo de trabalho, Diagramador de álbuns, Clientes, Funil de vendas, Contratos + assinatura, Tarefas, Financeiro, Contas a pagar/receber, Fluxo de caixa & DRE, Relatórios, Equipe & permissões, Manual e Calculadora ROI.

### Credenciais demo
- **Área do Cliente:** código `SPHOR2026` · senha `demo123`
- **Admin:** `admin@almafotografia.com.br` · senha `admin123`

## Conteúdo
Todo o conteúdo editável (textos, serviços, pacotes, depoimentos, contato) está em `src/data/`. As fotos são ilustrativas (Unsplash) e devem ser trocadas pelas reais do estúdio.

As avaliações em `src/data/studio.js` são **reais**, extraídas do Google (5,0★ · 112 avaliações).
