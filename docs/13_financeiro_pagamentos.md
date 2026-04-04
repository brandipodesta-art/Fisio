# 💸 FinanceiroPagamentos.tsx — Módulo de Despesas

> **Arquivo:** `src/components/FinanceiroPagamentos.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Gerencia as contas a pagar e despesas gerais da clínica. Permite o registro, categorização, visualização e controle de vencimentos das obrigações financeiras.

---

## Funcionalidades Principais

### 1. Listagem e Alertas
- Exibe os pagamentos em cards detalhados.
- **Busca:** Texto livre por descrição ou fornecedor.
- **Filtros:** Por status e por categoria.
- **Alerta de Duplicidade Inline:** Cards que possuem a mesma categoria e data de vencimento recebem borda e fundo âmbar, além de um badge indicando "Possível duplicata".
- Totalizador dinâmico no topo da lista.

### 2. Criação e Edição (FormModal)
- Modal para registrar ou editar um pagamento.
- **Categorias Pré-definidas:** Aluguel, Energia, Água, Salários, Impostos, etc.
- **Recorrência Mensal:** Permite gerar parcelas futuras automaticamente (ex: contas fixas) ao criar um novo registro.
- **Detecção Ativa de Duplicidade:** Ao tentar salvar, se já existir um registro com a mesma categoria e vencimento, um pop-up de alerta é exibido, permitindo cancelar ou forçar o salvamento. A verificação ocorre tanto na criação quanto na edição (ignorando o próprio registro).
- **Dados da Comissão (categoria "Comissões"):** Ao selecionar a categoria Comissões, exibe campos extras: Profissional, Procedimento e Paciente. O campo **Paciente** usa `AutocompletePaciente` — busca nomes em tempo real nos pacientes cadastrados, com dropdown de sugestões. O nome selecionado é salvo em `observacoes` como `Paciente: {nome}`.

### 3. Ações Rápidas
- **Marcar como Pago:** Botão de check rápido para itens pendentes.
- **Visualizar:** Modal de leitura com todos os detalhes do registro.
- **Editar / Excluir:** Ações padrão de CRUD. A exclusão exibe um `ConfirmDeleteDialog` in-app (dialog harmonizado com o sistema) ao invés do `confirm()` nativo do navegador.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useCallback, useMemo` | React Hooks | `react` |
| `Card, Button, Input, Select` | UI Components | `@/components/ui/...` |
| `ConfirmDeleteDialog` | UI Component | `@/components/ui/ConfirmDeleteDialog` |
| `AutocompletePaciente` | UI Component | `@/components/ui/AutocompletePaciente` |
| `Pagamento, PagamentoInput` | Interfaces | `@/lib/types/financeiro` |
| Ícones variados | Ícones | `lucide-react` |

---

## Estrutura de Dados (API)

Os dados são consumidos da API local `/api/pagamentos`, conectada à tabela `pagamentos` no Supabase.

## Chave Interna de Idempotência (`recebimento:{uuid}`)

Pagamentos de comissão gerados automaticamente armazenam `observacoes = "recebimento:{uuid}"`. Essa chave é usada pelo backend para evitar duplicação de comissões.

**Comportamento:**
- No formulário de edição, a chave `recebimento:{uuid}` é filtrada do textarea antes de exibir ao usuário
- No modal de visualização, também é filtrada — se não restar texto, o bloco Observações não é exibido

---

### Modelo `Pagamento`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID gerado pelo banco |
| `descricao` | `string` | Descrição da despesa |
| `categoria` | `string` | Categoria da despesa (ex: "Água", "Aluguel") |
| `valor` | `number` | Valor em reais |
| `data_vencimento` | `string` | Data no formato YYYY-MM-DD |
| `data_pagamento` | `string \| null` | Data em que foi efetivamente pago |
| `status` | `enum` | "pendente", "pago", "atrasado", "cancelado" |
| `forma_pagamento` | `enum \| null` | "dinheiro", "pix", "boleto", etc. |
| `fornecedor` | `string \| null` | Nome do fornecedor |
| `observacoes` | `string \| null` | Notas adicionais |
