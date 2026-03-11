# 🏠 page.tsx — Página Principal (Next.js App Router)

> **Arquivo:** `src/app/page.tsx` · **Linhas:** 18 · **Tipo:** Client Component (`"use client"`)

---

## Propósito

Página principal (rota raiz `/`) da aplicação. Equivale ao antigo `Home.tsx` do Vite. Serve como wrapper que renderiza o `CadastroLayout`, o qual contém todo o sistema de abas. Marcado com `"use client"` porque renderiza componentes que usam hooks React.

---

## Dependências

| Import | Origem |
|---|---|
| `CadastroLayout` | `@/components/CadastroLayout` |

---

## Componente: `Page`

- **Tipo:** Componente funcional (function component)
- **Diretiva:** `"use client"` — necessária porque `CadastroLayout` usa `useState`
- **Props:** Nenhuma
- **Export:** `default`

---

## Estrutura JSX

```
┌──────────────────────────────────────────────────┐
│  <div>  min-h-screen  flex  flex-col             │
│  ┌────────────────────────────────────────────┐   │
│  │  <main>                                    │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  <CadastroLayout />                  │  │   │
│  │  │  (todo o conteúdo está aqui)         │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Estilização CSS/Tailwind

| Elemento | Classes | Efeito |
|---|---|---|
| `<div>` wrapper | `min-h-screen flex flex-col` | Ocupa 100% da viewport, layout vertical flexível |
| `<main>` | *(sem classes)* | Container semântico HTML5 |

---

## Diferenças em relação ao antigo Home.tsx

| Aspecto | Antes (Vite) | Agora (Next.js) |
|---|---|---|
| Arquivo | `src/pages/Home.tsx` | `src/app/page.tsx` |
| Roteamento | Sem roteamento (SPA única) | App Router (rota `/` automática) |
| Diretiva | Nenhuma | `"use client"` obrigatória |
| Nome export | `Home` | `Page` |
| Toaster | Renderizado no `main.tsx` | Renderizado no `layout.tsx` |

---

## UI Renderizada

A página em si é apenas um container transparente. Todo o visual vem do `CadastroLayout`:

1. **Header** com título "Cadastro de Pacientes"
2. **Tabs** com 4 abas: Cadastro, Evolução, Histórico, Agenda
3. **Conteúdo** da aba ativa

---

## Notas para Edição Futura

- Para adicionar **novas rotas**, crie novos arquivos/pastas em `src/app/` (App Router)
- Para adicionar um **navbar/sidebar**, crie no `layout.tsx` (aparecerá em todas as páginas)
- Para um **layout com sidebar**, modifique o `layout.tsx` para incluir a estrutura desejada
- O `flex-col` permite que o `<main>` cresça verticalmente com `flex-1` se necessário
