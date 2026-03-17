# 📊 FinanceiroResumo.tsx — Dashboard Financeiro

> **Arquivo:** `src/components/FinanceiroResumo.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Fornecer uma visão geral da saúde financeira da clínica, consolidando os dados de recebimentos e pagamentos em indicadores chave (KPIs) e gráficos visuais para um mês específico.

---

## Funcionalidades Principais

### 1. Navegação Mensal
- Controle no topo para alternar o mês e ano de referência (ex: `< Janeiro 2026 >`).
- Todos os indicadores e gráficos são atualizados automaticamente ao mudar o mês.

### 2. Indicadores Chave (Cards)
- **Recebido:** Total de receitas com status "recebido" no mês.
- **Pendente (Receitas):** Total a receber no mês (status "pendente").
- **Pago:** Total de despesas já pagas no mês.
- **Pendente (Despesas):** Total de contas a pagar no mês (status "pendente").
- **Saldo Líquido:** Diferença entre Recebido e Pago.

### 3. Gráfico de Fluxo de Caixa
- Gráfico de barras simples e responsivo (construído com Tailwind, sem bibliotecas externas).
- Exibe a evolução diária/mensal das receitas (verde) versus despesas (vermelho).
- Eixo Y dinâmico baseado no maior valor do período.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useEffect, useCallback` | React Hooks | `react` |
| `Card, Button` | UI Components | `@/components/ui/...` |
| `ResumoFinanceiro` | Interface | `@/lib/types/financeiro` |
| Ícones variados | Ícones | `lucide-react` |

---

## Estrutura de Dados (API)

Os dados consolidados são consumidos do endpoint `/api/recebimentos/resumo`.

### Modelo `ResumoFinanceiro`
| Campo | Tipo | Descrição |
|---|---|---|
| `totalRecebido` | `number` | Soma das receitas pagas no mês |
| `totalPendente` | `number` | Soma das receitas pendentes no mês |
| `totalAtrasado` | `number` | Soma das receitas atrasadas |
| `totalPago` | `number` | Soma das despesas pagas no mês |
| `totalDespesasPendentes` | `number` | Soma das despesas pendentes no mês |
| `saldoLiquido` | `number` | Recebido - Pago |
| `recebimentosPorMes` | `Array` | Dados para o gráfico (receitas) |
| `pagamentosPorMes` | `Array` | Dados para o gráfico (despesas) |
