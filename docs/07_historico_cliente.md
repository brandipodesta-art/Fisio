# 📊 HistoricoCliente.tsx — Histórico Completo do Cliente

> **Arquivo:** `HistoricoCliente.tsx` · **Linhas:** 329 · **Tamanho:** 11.517 bytes

---

## Propósito

Aba de histórico do cliente com 4 sub-abas internas: **Exames**, **Frequência**, **Financeiro** e **Evolução**. Exibe dados mockados (de exemplo) para demonstração. Cada seção apresenta informações em formato de cards individuais.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `Card` | UI Component | `@/components/ui/card` |
| `Tabs, TabsContent, TabsList, TabsTrigger` | UI Component | `@/components/ui/tabs` |
| `Activity, DollarSign, Calendar, FileText` | Ícones | `lucide-react` |

---

## Interfaces

### `Exame`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único |
| `tipo` | `string` | Tipo do exame (ex: Avaliação Inicial) |
| `data` | `string` | Data do exame (DD/MM/AAAA) |
| `resultado` | `string` | Resultado ou observação |

### `Frequencia`

| Campo | Tipo | Descrição |
|---|---|---|
| `mes` | `string` | Mês/Ano (ex: Fevereiro/2026) |
| `presencas` | `number` | Quantidade de presenças |
| `faltas` | `number` | Quantidade de faltas |

### `Financeiro`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único |
| `descricao` | `string` | Descrição do serviço |
| `valor` | `number` | Valor em R$ |
| `data` | `string` | Data do registro (DD/MM/AAAA) |
| `status` | `"pago" \| "pendente" \| "cancelado"` | Status do pagamento |

### `Evolucao`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único |
| `data` | `string` | Data da evolução (DD/MM/AAAA) |
| `descricao` | `string` | Descrição da evolução |

---

## Dados Mockados (Exemplo)

### Exames (2 itens)

| Tipo | Data | Resultado |
|---|---|---|
| Avaliação Inicial | 15/02/2026 | Limitação de movimento no ombro direito |
| Ressonância Magnética | 10/02/2026 | Inflamação leve no tendão |

### Frequência (3 meses)

| Mês | Presenças | Faltas | Taxa |
|---|---|---|---|
| Fevereiro/2026 | 8 | 2 | 80% |
| Janeiro/2026 | 10 | 0 | 100% |
| Dezembro/2025 | 9 | 1 | 90% |

### Financeiro (3 itens)

| Descrição | Valor | Data | Status |
|---|---|---|---|
| Sessão de Fisioterapia | R$ 150,00 | 15/02/2026 | ✅ Pago |
| Avaliação Inicial | R$ 200,00 | 10/02/2026 | ✅ Pago |
| Sessão de Fisioterapia | R$ 150,00 | 08/02/2026 | ⏳ Pendente |

### Evolução (2 itens)

| Data | Descrição |
|---|---|
| 15/02/2026 | Melhora significativa na amplitude de movimento. Redução de 40% da dor. |
| 12/02/2026 | Iniciado programa de fortalecimento. Paciente tolerou bem. |

---

## Funções

### `getStatusColor(status: string): string`

Retorna classes CSS de cor baseado no status do pagamento:

| Status | Classes | Visual |
|---|---|---|
| `"pago"` | `bg-emerald-100 text-emerald-800` | 🟢 Verde |
| `"pendente"` | `bg-amber-100 text-amber-800` | 🟡 Amarelo |
| `"cancelado"` | `bg-red-100 text-red-800` | 🔴 Vermelho |
| *outro* | `bg-slate-100 text-slate-800` | 🔘 Cinza |

---

## Estrutura UI — Diagrama Visual Completo

### Header do Histórico

```
┌──────────────────────────────────────────────────────────┐
│  Card  bg-gradient-to-r from-slate-50 to-emerald-50     │
│                                                          │
│  h2: "Histórico do Cliente"                              │
│  text-2xl font-bold text-slate-900                       │
│                                                          │
│  p: "Visualize exames, frequência, dados financeiros..." │
│  text-slate-600                                          │
└──────────────────────────────────────────────────────────┘
```

### Tabs de Navegação (4 sub-abas)

```
┌────────────┬─────────────┬─────────────┬─────────────┐
│ 📄 Exames  │ 📅 Frequên. │ 💰 Finance. │ 📊 Evolução │
│  (ativo)   │             │             │             │
└────────────┴─────────────┴─────────────┴─────────────┘
bg-white  border border-slate-200  rounded-lg  p-1
grid-cols-4
Ativo: bg-emerald-50 text-emerald-700
```

> **Responsividade:** Texto das abas usa `hidden sm:inline` — em mobile, só ícones.

---

### Sub-aba: Exames

```
┌──────────────────────────────────────────────────────────┐
│  Card  p-6  border-slate-200  shadow-sm                  │
│  ┌──────────────────────────────────────────────┐        │
│  │  h3: "Avaliação Inicial"    [Concluído] 🟢  │        │
│  │  text-sm: "15/02/2026"                       │        │
│  └──────────────────────────────────────────────┘        │
│  p: "Paciente com limitação de movimento..."             │
│  text-slate-700 text-sm                                  │
└──────────────────────────────────────────────────────────┘
```

Badge "Concluído":
- `px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full`

---

### Sub-aba: Frequência

```
┌──────────────────────────────────────────────────────────┐
│  Card  p-6                                               │
│  h3: "Fevereiro/2026"                                    │
│  ┌────────────────────────┬────────────────────────┐     │
│  │  bg-emerald-50         │  bg-red-50             │     │
│  │  border-emerald-200    │  border-red-200        │     │
│  │                        │                        │     │
│  │  Presenças             │  Faltas                │     │
│  │  text-sm text-slate-600│  text-sm text-slate-600│     │
│  │                        │                        │     │
│  │  8                     │  2                     │     │
│  │  text-3xl font-bold    │  text-3xl font-bold    │     │
│  │  text-emerald-700      │  text-red-700          │     │
│  └────────────────────────┴────────────────────────┘     │
│  ───────────────── border-t border-slate-200 ──────────  │
│  Taxa de Presença: 80%                                   │
│  text-sm  span: font-semibold text-slate-900             │
└──────────────────────────────────────────────────────────┘
```

**Cálculo da taxa:** `Math.round((presencas / (presencas + faltas)) * 100)`

---

### Sub-aba: Financeiro

#### Card de Resumo (topo)

```
┌──────────────────────────────────────────────────────────┐
│  Card  bg-slate-50  p-6                                  │
│  grid-cols-3                                             │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Total Pago   │ Pendente     │ Total Geral  │          │
│  │ text-sm      │ text-sm      │ text-sm      │          │
│  │              │              │              │          │
│  │ R$ 350.00    │ R$ 150.00    │ R$ 500.00    │          │
│  │ text-2xl     │ text-2xl     │ text-2xl     │          │
│  │ font-bold    │ font-bold    │ font-bold    │          │
│  │ emerald-700  │ amber-700    │ slate-900    │          │
│  └──────────────┴──────────────┴──────────────┘          │
└──────────────────────────────────────────────────────────┘
```

**Cálculos:**
- Total Pago: `filter(status === "pago").reduce(sum + valor)`
- Pendente: `filter(status === "pendente").reduce(sum + valor)`
- Total Geral: `reduce(sum + valor)` (todos)

#### Cards Individuais (por transação)

```
┌──────────────────────────────────────────────────────────┐
│  Card  p-6                                               │
│  ┌──────────────────────────────────┬─────────────────┐  │
│  │  h3: "Sessão de Fisioterapia"   │  R$ 150.00      │  │
│  │  p: "15/02/2026"                │  font-bold      │  │
│  │  flex-1                         │                  │  │
│  │                                 │  [Pago] 🟢      │  │
│  │                                 │  rounded-full    │  │
│  └──────────────────────────────────┴─────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

Status badges:
- `px-3 py-1 text-xs font-medium rounded-full`
- Cores via `getStatusColor()`

---

### Sub-aba: Evolução

```
┌──────────────────────────────────────────────────────────┐
│  Card  p-6                                               │
│  p: "15/02/2026"                                         │
│  text-sm font-medium text-slate-900                      │
│                                                          │
│  p: "Paciente apresentou melhora significativa..."       │
│  text-slate-700 text-sm leading-relaxed                  │
└──────────────────────────────────────────────────────────┘
```

---

## Mapa Completo dos Ícones

| Aba | Ícone Lucide | Tamanho |
|---|---|---|
| Exames | `FileText` 📄 | `w-4 h-4` |
| Frequência | `Calendar` 📅 | `w-4 h-4` |
| Financeiro | `DollarSign` 💰 | `w-4 h-4` |
| Evolução | `Activity` 📊 | `w-4 h-4` |

---

## Notas para Edição Futura

- **Dados mockados:** Todos os dados são hardcoded dentro do componente — precisam ser substituídos por chamadas de API
- **Sem estado:** Componente não usa `useState` — é puramente visual/display
- **Duplicação:** A sub-aba "Evolução" aqui mostra dados diferentes da aba "Evolução" principal (`EvolucaoField.tsx`). Considerar unificar ou sincronizar os dados
- **Financeiro:** Valores formatados sem localização brasileira (usa ponto ao invés de vírgula). Considerar usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- **Exames:** Todos os exames têm badge "Concluído" fixo — precisa de lógica para outros status
- **Sem interação:** Nenhuma ação de adicionar/editar/deletar nas sub-abas — tudo é somente leitura
- **Paginação:** Sem paginação em nenhuma das sub-abas — pode causar problemas com muitos registros
- **Responsividade do resumo financeiro:** `grid-cols-3` sem breakpoint — pode ficam apertado em mobile. Considerar `grid-cols-1 md:grid-cols-3`
- **Divisão por zero:** Taxa de Presença divide por `(presencas + faltas)` — se ambos forem 0, resulta em `NaN`. Adicionar proteção
