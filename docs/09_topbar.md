# 🔝 TopBar.tsx — Barra de Navegação Superior

> **Arquivo:** `src/components/TopBar.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Barra de navegação fixa no topo da aplicação. Contém a logo da clínica à esquerda, links de navegação centralizados (Cadastro, Agenda, Financeiro) e botão de logout à direita. Controla a troca de seções da página principal via callback `onPageChange`.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `Activity, Users, CalendarDays, DollarSign, LogOut` | Ícones | `lucide-react` |
| `Button` | UI Component | `@/components/ui/button` (shadcn/ui) |

---

## Interface: `TopBarProps`

| Prop | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `activePage` | `string` | Sim | Página atualmente ativa (`"cadastro"`, `"agenda"`, `"financeiro"`) |
| `onPageChange` | `(page: string) => void` | Sim | Callback quando um menu é clicado |

---

## Constante: `menuItems`

| Key | Label | Ícone |
|---|---|---|
| `cadastro` | Cadastro | `Users` 👤 |
| `agenda` | Agenda | `CalendarDays` 📅 |
| `financeiro` | Financeiro | `DollarSign` 💲 |

---

## Estrutura UI — Diagrama Visual

```
┌────────────────────────────────────────────────────────────────┐
│  bg-white  border-b  shadow-sm  sticky top-0 z-50             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  max-w-7xl mx-auto  h-16  flex justify-between          │  │
│  │                                                          │  │
│  │  ┌─────────┐    ┌───────────────────────┐   ┌─────────┐ │  │
│  │  │ 🟢 Fisio│    │ Cadastro Agenda Financ│   │ 🚪 Sair │ │  │
│  │  │  (logo) │    │    (nav center)       │   │ (logout) │ │  │
│  │  └─────────┘    └───────────────────────┘   └─────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Detalhes de Estilização

### Header Container

| Propriedade | Valor | Efeito |
|---|---|---|
| Background | `bg-white` | Fundo branco sólido |
| Borda | `border-b border-slate-200` | Linha sutil embaixo |
| Sombra | `shadow-sm` | Elevação leve |
| Posição | `sticky top-0 z-50` | Fixa no topo ao rolar |
| Altura | `h-16` | 64px fixo |

### Logo (Esquerda)

| Elemento | Classes |
|---|---|
| Ícone container | `w-9 h-9 rounded-lg bg-emerald-600` |
| Ícone `Activity` | `w-5 h-5 text-white` |
| Texto "Fisio" | `text-xl font-bold text-slate-900 tracking-tight` |

### Menu Item (Centro)

| Estado | Classes |
|---|---|
| Normal | `text-slate-600 hover:bg-slate-50 hover:text-slate-900` |
| **Ativo** | `bg-emerald-50 text-emerald-700` |
| Ambos | `px-4 py-2 rounded-lg text-sm font-medium transition-colors` |

### Botão Sair (Direita)

| Classes |
|---|
| `text-slate-500 hover:text-red-600 hover:bg-red-50` |
| Usa `Button` do shadcn/ui com `variant="ghost" size="sm"` |

> **Responsividade:** Labels dos menus e do botão Sair usam `hidden sm:inline` — em telas pequenas, apenas os ícones aparecem.

---

## Notas para Edição Futura

- Para adicionar **novos menus**, insira um novo objeto no array `menuItems`
- Para implementar **logout real**, adicione a lógica no `onClick` do botão Sair
- Para usar uma **imagem de logo**, substitua o bloco do ícone `Activity` por um `<Image>` do Next.js
- O componente é **sticky** — permanece visível ao rolar a página
