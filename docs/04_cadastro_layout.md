# 📑 CadastroLayout.tsx — Layout Principal com Abas

> **Arquivo:** `CadastroLayout.tsx` · **Linhas:** 94 · **Tamanho:** 3.386 bytes

---

## Propósito

Componente central que organiza todo o sistema em **3 abas**: Cadastro, Evolução e Histórico. Contém o header da página e gerencia a navegação entre as seções.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `Tabs, TabsContent, TabsList, TabsTrigger` | UI Component | `@/components/ui/tabs` (shadcn/ui) |
| `Card` | UI Component | `@/components/ui/card` (shadcn/ui) |
| `Users, FileText, History` | Ícones | `lucide-react` |
| `useState` | React Hook | `react` |
| `CadastroForm` | Componente local | `./CadastroForm` |
| `EvolucaoField` | Componente local | `./EvolucaoField` |
| `HistoricoCliente` | Componente local | `./HistoricoCliente` |

---

## Interface: `CadastroLayoutProps`

| Prop | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `onTabChange` | `(tab: string) => void` | Não | Callback quando a aba ativa muda |

---

## Estado Interno

| Estado | Tipo | Valor Inicial | Descrição |
|---|---|---|---|
| `activeTab` | `string` | `"cadastro"` | Aba atualmente selecionada |

---

## Funções

### `handleTabChange(value: string)`
- Atualiza `activeTab` com o novo valor
- Chama `onTabChange?.(value)` se a prop foi fornecida

---

## Estrutura UI — Diagrama Visual

```
┌──────────────────────────────────────────────────────────┐
│  bg-gradient-to-br from-slate-50 to-slate-100            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  HEADER                                            │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  h1: "Cadastro de Pacientes"                 │  │   │
│  │  │  text-3xl font-bold text-slate-900           │  │   │
│  │  │                                              │  │   │
│  │  │  p: "Gerencie informações de pacientes..."   │  │   │
│  │  │  text-slate-600                              │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                    │   │
│  │  TABS NAVIGATION                                   │   │
│  │  ┌──────────────┬──────────────┬──────────────┐    │   │
│  │  │ 👤 Cadastro  │ 📄 Evolução │ 🕐 Histórico │    │   │
│  │  │   (ativo)    │             │              │    │   │
│  │  └──────────────┴──────────────┴──────────────┘    │   │
│  │  bg-white border border-slate-200 rounded-lg p-1   │   │
│  │  Ativo: bg-emerald-50 text-emerald-700             │   │
│  │                                                    │   │
│  │  TAB CONTENT                                       │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │                                              │  │   │
│  │  │  · Cadastro → <CadastroForm />               │  │   │
│  │  │  · Evolução → <Card> + <EvolucaoField />     │  │   │
│  │  │  · Histórico → <HistoricoCliente />          │  │   │
│  │  │                                              │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────┘   │
│  container max-w-6xl mx-auto px-4                        │
└──────────────────────────────────────────────────────────┘
```

---

## Detalhes de Estilização

### Container Principal

| Propriedade | Valor | Efeito |
|---|---|---|
| Background | `bg-gradient-to-br from-slate-50 to-slate-100` | Gradiente sutil de cinza claro |
| Padding vertical | `py-8` | 32px acima e abaixo |
| Container | `max-w-6xl mx-auto px-4` | Largura máx 1152px, centralizado |

### Header

| Elemento | Classes | Visual |
|---|---|---|
| Título h1 | `text-3xl font-bold text-slate-900 mb-2` | Grande, bold, quase preto |
| Subtítulo p | `text-slate-600` | Cinza médio |
| Container | `mb-8` | Margem inferior de 32px |

### Tabs Navigation

| Propriedade | Valor |
|---|---|
| Layout | `grid w-full grid-cols-3` — 3 colunas iguais |
| Fundo | `bg-white` |
| Borda | `border border-slate-200 rounded-lg p-1` |
| Margem inferior | `mb-6` |

### Tab Trigger (cada aba)

| Estado | Classes |
|---|---|
| Normal | `flex items-center gap-2` |
| **Ativo** | `data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700` |

### Ícones das Abas

| Aba | Ícone | Tamanho |
|---|---|---|
| Cadastro | `Users` 👤 | `w-4 h-4` |
| Evolução | `FileText` 📄 | `w-4 h-4` |
| Histórico | `History` 🕐 | `w-4 h-4` |

> **Responsividade:** O texto das abas (`<span>`) usa `hidden sm:inline` — em telas pequenas, só os ícones aparecem.

### Tab Content

| Aba | Conteúdo |
|---|---|
| `cadastro` | `<CadastroForm />` direto |
| `evolucao` | `<Card p-6>` wrapper → `<EvolucaoField />` dentro |
| `historico` | `<HistoricoCliente />` direto |

---

## Notas para Edição Futura

- Para **adicionar uma nova aba**, insira um novo `TabsTrigger` + `TabsContent` e atualize o grid para `grid-cols-4`
- Para **mudar a aba padrão**, altere o valor inicial de `activeTab` no `useState`
- O tab **Evolução** tem um `<Card>` wrapper extra que Cadastro e Histórico não têm — pode unificar se desejar
- A prop `onTabChange` permite que componentes pais (como `Home`) reajam a mudanças de aba
- Para **persistir a aba ativa** na URL, use query params ou React Router
