# 🏠 page.tsx — Página Principal (Next.js App Router)

> **Arquivo:** `src/app/page.tsx` · **Tipo:** Client Component (`"use client"`)

---

## Propósito

Página principal (rota raiz `/`) da aplicação. Gerencia a navegação entre as seções do sistema via estado `activePage`. Renderiza a `TopBar` no topo e o conteúdo da seção ativa abaixo. Controla autenticação: exibe tela de login se não autenticado, loading enquanto restaura sessão.

---

## Dependências

| Import | Origem |
|---|---|
| `useState`, `useEffect` | `react` |
| `TopBar` | `@/components/TopBar` |
| `CadastroLayout` | `@/components/CadastroLayout` |
| `AgendaPage` | `@/components/AgendaPage` |
| `FinanceiroPage` | `@/components/FinanceiroPage` |
| `ConfiguracoesPage` | `@/components/ConfiguracoesPage` |
| `LoginPage` | `@/components/LoginPage` |
| `useAuth` | `@/lib/auth/AuthContext` |
| `Loader2` | `lucide-react` |

---

## Estado Interno

| Estado | Tipo | Valor Inicial | Descrição |
|---|---|---|---|
| `activePage` | `string` | `localStorage.getItem("fisio_active_page") ?? "cadastro"` | Seção da Top Bar atualmente ativa — **persiste entre reloads** |

### Persistência no localStorage

```typescript
// Leitura na inicialização (lazy initializer)
const [activePage, setActivePage] = useState(() =>
  typeof window !== "undefined"
    ? (localStorage.getItem("fisio_active_page") ?? "cadastro")
    : "cadastro"
);

// Gravação a cada mudança
useEffect(() => {
  localStorage.setItem("fisio_active_page", activePage);
}, [activePage]);
```

> A verificação `typeof window !== "undefined"` é necessária para compatibilidade com SSR do Next.js.

---

## Fluxo de Autenticação

```
Carregando? ──> Spinner (Loader2 + "Carregando...")
     │
     ▼
!usuario? ──> <LoginPage />
     │
     ▼
Autenticado ──> <TopBar /> + <main> (seção ativa)
```

---

## Estrutura JSX

```
┌──────────────────────────────────────────────────┐
│  <div>  min-h-screen  flex  flex-col  bg-background│
│  ┌────────────────────────────────────────────┐   │
│  │  <TopBar />                                │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  <main key={activePage}> animate-fade-in   │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  "cadastro"    → <CadastroLayout />  │  │   │
│  │  │  "agenda"      → <AgendaPage />      │  │   │
│  │  │  "financeiro"  → <FinanceiroPage />  │  │   │
│  │  │  "configuracoes"→<ConfiguracoesPage/>│  │   │
│  │  └──────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Navegação por Estado

| `activePage` | Componente Renderizado |
|---|---|
| `"cadastro"` | `<CadastroLayout />` — abas internas (Cadastro, Evolução, Histórico) |
| `"agenda"` | `<AgendaPage />` com header próprio (max-w-1600px) |
| `"financeiro"` | `<FinanceiroPage />` — recebimentos e pagamentos |
| `"configuracoes"` | `<ConfiguracoesPage />` — procedimentos, formas de pagamento, alertas |

---

## Notas para Edição Futura

- Para adicionar **novas seções**, crie o componente e adicione condição em `page.tsx` + item no `menuItems` do `TopBar`
- A chave `key={activePage}` no `<main>` faz o `animate-fade-in` executar a cada troca de aba
- O `localStorage` usa a chave `"fisio_active_page"` — mude se precisar de múltiplos ambientes
- Para **roteamento real** (URLs diferentes), migre para App Router com pastas em `src/app/`
