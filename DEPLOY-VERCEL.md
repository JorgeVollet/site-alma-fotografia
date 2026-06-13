# 🚀 Deploy do site Alma Fotografia (GitHub + Vercel)

Guia rápido para publicar o site e ter um link para apresentar ao cliente.

---

## 1. Testar localmente (opcional, recomendado)
No PowerShell, dentro da pasta do projeto:
```powershell
npm install
npm run build
npm run preview
```
Abra o link que aparecer e navegue pelo site + admin para conferir.

---

## 2. Subir para o GitHub

Crie um repositório **vazio e privado** no github.com (sem README), por exemplo `site-alma-fotografia`. Depois, no PowerShell:

```powershell
cd "E:\DESENVOLVIMENTO DE SITES\SITE ALMA FOTOGRAFIA"
git init
git add .
git commit -m "Alma Fotografia - site completo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/site-alma-fotografia.git
git push -u origin main
```
> Troque `SEU_USUARIO` pelo seu usuário do GitHub.

---

## 3. Publicar na Vercel
1. Acesse **vercel.com** e entre com a conta do GitHub.
2. **Add New → Project** → importe o repositório `site-alma-fotografia`.
3. A Vercel detecta o Vite automaticamente. É só clicar em **Deploy**.
4. Em ~2 minutos o site estará no ar com um link público.

A cada `git push`, a Vercel atualiza o site sozinha.

---

## Credenciais demo (para apresentar)
- **Área do Cliente:** código `SPHOR2026` · senha `demo123`
- **Painel Admin:** `admin@almafotografia.com.br` · senha `admin123`
  - Atalho: botão **Painel Administrador** no rodapé do site.

---

## Roteiro de apresentação (sugestão)
1. **Home** — destaque o hero suave, o selo **5,0★ no Google** e o carrossel de avaliações reais (passe o mouse para pausar).
2. **Serviços / Pacotes** — mostre o **Pocket Especial R$600** e os pacotes.
3. **Agendar** — simule um agendamento com reserva.
4. **Área do Cliente** (`SPHOR2026`) — mostre a seleção de fotos estilo Alboom.
5. **Painel Admin** — funil de vendas, contratos com assinatura, financeiro/DRE e o **Diagramador de álbuns** (Canva próprio).

---

> Importante: o site usa `base: '/'` no Vite — necessário para as rotas com barra (ex: `/diagramador/:id`) funcionarem no deploy.

_Feito por JV Web Studio — www.jvwebstudio.agency_
