# 💰 FinanceiroPage.tsx — Módulo Financeiro (Placeholder)

> **Arquivo:** `src/components/FinanceiroPage.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Página placeholder para o módulo financeiro da clínica. Exibe cards resumo (Receitas, Despesas, Saldo) e uma mensagem de "em desenvolvimento". Será expandido futuramente com funcionalidades reais.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `DollarSign, TrendingUp, Receipt, CreditCard` | Ícones | `lucide-react` |
| `Card` | UI Component | `@/components/ui/card` (shadcn/ui) |

---

## Estrutura UI

```
┌──────────────────────────────────────────────────────┐
│  container max-w-6xl mx-auto                          │
│                                                       │
│  h1: "Financeiro"                                     │
│  p: "Controle financeiro da clínica..."               │
│                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │📈 Receitas│ │🧾 Despesas│ │💳  Saldo  │             │
│  │    —      │ │    —      │ │    —      │             │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │  💲 Módulo em Desenvolvimento                 │    │
│  │  "O módulo financeiro está sendo construído"  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## Notas para Edição Futura

- Substituir valores "—" por dados reais quando o backend estiver pronto
- Adicionar tabelas de lançamentos, gráficos e filtros por período
- O card central de "em desenvolvimento" deve ser removido quando o módulo estiver funcional
