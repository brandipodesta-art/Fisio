# 🏠 page.tsx — Página Principal (Next.js App Router)

> **Arquivo:** `src/app/page.tsx` · **Tipo:** Client Component (`"use client"`)

---

## Propósito

Página principal (rota raiz `/`) da aplicação. Gerencia a navegação entre as 3 seções do sistema via estado `activePage`. Renderiza a `TopBar` no topo e o conteúdo da seção ativa abaixo.

---

## Dependências

| Import | Origem |
|---|---|
| `useState` | `react` |
| `TopBar` | `@/components/TopBar` |
| `CadastroLayout` | `@/components/CadastroLayout` |
| `AgendaPage` | `@/components/AgendaPage` |
| `FinanceiroPage` | `@/components/FinanceiroPage` |

---

## Estado Interno

| Estado | Tipo | Valor Inicial | Descrição |
|---|---|---|---|
| `activePage` | `string` | `"cadastro"` | Seção da Top Bar atualmente ativa |

---

## Estrutura JSX

```
┌──────────────────────────────────────────────────┐
│  <div>  min-h-screen  flex  flex-col              │
│  bg-gradient-to-br from-slate-50 to-slate-100     │
│  ┌────────────────────────────────────────────┐   │
│  │  <TopBar />  (sticky no topo)              │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  <main>  flex-1                            │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  activePage === "cadastro"           │  │   │
│  │  │    → <CadastroLayout />              │  │   │
│  │  │  activePage === "agenda"             │  │   │
│  │  │    → <AgendaPage /> (com header)     │  │   │
│  │  │  activePage === "financeiro"         │  │   │
│  │  │    → <FinanceiroPage />              │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Navegação por Estado

| `activePage` | Componente Renderizado |
|---|---|
| `"cadastro"` | `<CadastroLayout />` — abas internas (Cadastro, Evolução, Histórico) |
| `"agenda"` | `<AgendaPage />` | com header próprio em largura expandida (mas limitada a `1600px` com margens) |
| `"financeiro"` | `<FinanceiroPage />` — placeholder com cards resumo |

---

## Notas para Edição Futura

- Para adicionar **novas seções**, crie o componente e adicione uma condição em `page.tsx` + um item no `menuItems` do `TopBar`
- O gradiente de fundo agora está no `page.tsx` (antes estava no `CadastroLayout`)
- Para **roteamento real** (URLs diferentes), migre para App Router com pastas em `src/app/`
