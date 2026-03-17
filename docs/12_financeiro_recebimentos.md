# 💵 FinanceiroRecebimentos.tsx — Módulo de Receitas

> **Arquivo:** `src/components/FinanceiroRecebimentos.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Gerencia os recebimentos (receitas) da clínica, permitindo o registro de pagamentos de pacientes, visualização detalhada, edição, exclusão e controle de status (pendente, recebido, atrasado, cancelado).

---

## Funcionalidades Principais

### 1. Listagem e Filtros
- Exibe os recebimentos em cards com status colorido e detalhes do procedimento.
- **Filtros básicos:** Busca por nome do paciente e filtro por status.
- **Filtros avançados:** 
  - **Procedimento:** Dropdown com procedimentos disponíveis.
  - **Vencimento:** Intervalo de datas (de/até).
  - **Data do Pagamento:** Intervalo de datas (de/até).
- Totalizador dinâmico no topo da lista com base nos itens filtrados.

### 2. Criação e Edição (FormModal)
- Modal para registrar ou editar um recebimento.
- Autocomplete integrado para vincular o recebimento a um paciente existente.
- **Recorrência Mensal:** Ao criar um novo recebimento, permite gerar múltiplas parcelas mensais futuras automaticamente, com pré-visualização das datas.
- Extração inteligente do procedimento base ao editar parcelas geradas por recorrência.

### 3. Ações Rápidas
- **Marcar como Recebido:** Botão de check rápido para itens pendentes.
- **Visualizar:** Modal de leitura (somente leitura) com todos os detalhes do registro, separando visualmente o procedimento base da numeração da parcela.
- **Editar / Excluir:** Ações padrão de CRUD.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useCallback, useMemo` | React Hooks | `react` |
| `Card, Button, Input, Select` | UI Components | `@/components/ui/...` |
| `AutocompletePaciente` | Componente | `@/components/AutocompletePaciente` |
| `Recebimento, RecebimentoInput` | Interfaces | `@/lib/types/financeiro` |
| Ícones variados | Ícones | `lucide-react` |

---

## Estrutura de Dados (API)

Os dados são consumidos da API local `/api/recebimentos`, que por sua vez se conecta à tabela `recebimentos` no Supabase.

### Modelo `Recebimento`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID gerado pelo banco |
| `paciente_id` | `string \| null` | Relacionamento opcional com tabela pacientes |
| `paciente_nome` | `string \| null` | Nome desnormalizado para busca rápida |
| `descricao` | `string` | Procedimento realizado (ex: "Acupuntura", "Pilates (2/4)") |
| `valor` | `number` | Valor em reais |
| `data_vencimento` | `string` | Data no formato YYYY-MM-DD |
| `data_pagamento` | `string \| null` | Data em que foi efetivamente pago |
| `status` | `enum` | "pendente", "recebido", "atrasado", "cancelado" |
| `forma_pagamento` | `enum \| null` | "dinheiro", "pix", "cartao_credito", etc. |
| `observacoes` | `string \| null` | Notas adicionais |
