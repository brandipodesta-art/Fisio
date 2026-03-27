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
- Auto-preenchimento do valor ao selecionar procedimento (`valor_padrao`).
- **Recorrência Mensal:** Permite gerar múltiplas parcelas mensais futuras automaticamente, com pré-visualização das datas.

### 3. Ações Rápidas
- **Marcar como Recebido:** Botão de check rápido para itens pendentes. Registra `confirmado_por` (nome do usuário logado) e `confirmado_por_id`.
- **Visualizar:** Modal de leitura com todos os detalhes do registro.
- **Editar / Excluir:** Ações padrão de CRUD com `ConfirmDeleteDialog` (sem `confirm()` nativo).

### 4. Validação de Formulário
- Campos obrigatórios: **Nome do Paciente** e **Forma de Pagamento**.
- Validação via `toast.error()` (sonner) — sem uso de `alert()` nativo do navegador.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useCallback, useRef` | React Hooks | `react` |
| `toast` | Notificações | `sonner` |
| `Card, Button, Input, Select` | UI Components | `@/components/ui/...` |
| `ConfirmDeleteDialog` | UI Component | `@/components/ui/ConfirmDeleteDialog` |
| `ConfirmActionDialog` | UI Component | `@/components/ui/ConfirmActionDialog` |
| `ModalPortal` | UI Component | `@/components/ui/ModalPortal` |
| `useAuth` | Hook | `@/lib/auth/AuthContext` |
| `Recebimento, RecebimentoInput` | Interfaces | `@/lib/types/financeiro` |
| Ícones variados | Ícones | `lucide-react` |

---

## Estrutura de Dados (API)

Os dados são consumidos da API local `/api/recebimentos` → tabela `recebimentos` no Supabase.

### Modelo `Recebimento` (em `src/lib/types/financeiro.ts`)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID gerado pelo banco |
| `paciente_id` | `string \| null` | FK para tabela `pacientes` |
| `paciente_nome` | `string \| null` | Nome desnormalizado para busca rápida |
| `procedimento_id` | `string \| null` | FK para tabela `procedimentos` |
| `descricao` | `string` | Procedimento realizado (ex: "Acupuntura", "Pilates (2/4)") |
| `valor` | `number` | Valor em reais (CHECK: valor > 0) |
| `data_vencimento` | `string` | Formato YYYY-MM-DD |
| `data_pagamento` | `string \| null` | Data de pagamento efetivo |
| `status` | `enum` | "pendente", "recebido", "atrasado", "cancelado" |
| `forma_pagamento` | `enum \| null` | Legado — slug de texto |
| `forma_pagamento_id` | `string \| null` | FK para tabela `formas_pagamento` |
| `observacoes` | `string \| null` | Notas adicionais |
| `confirmado_por` | `string \| null` | Nome do usuário que marcou como recebido |
| `confirmado_por_id` | `string \| null` | ID do usuário que confirmou |

> **Nota sobre `observacoes`:** Recebimentos gerados automaticamente pela Agenda ao concluir um atendimento terão `observacoes = "agendamento:{uuid}"`. Este campo é usado como chave de idempotência para evitar duplicação.

---

## Validação do Formulário

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!form.paciente_id) {
    toast.error("Selecione o paciente antes de salvar.");
    return;
  }
  if (!form.forma_pagamento_id) {
    toast.error("Selecione a forma de pagamento antes de salvar.");
    return;
  }
  await onSalvar(form, repete ? { meses } : undefined);
}
```

> Anteriormente usava `alert()` nativo — migrado para `toast.error()` em 27/03/2026 para consistência com o restante do sistema.

---

## Notas para Edição Futura

- Recebimentos criados automaticamente pela Agenda têm `observacoes` com o ID do agendamento — não remover esse campo ao editar manualmente
- Para adicionar novos campos obrigatórios, adicionar validação em `handleSubmit` usando `toast.error()`
- O campo `confirmado_por` é preenchido automaticamente ao marcar como recebido — não exibir no formulário de edição
