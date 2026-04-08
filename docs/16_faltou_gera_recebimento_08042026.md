# 16 — Correção: Agendamento com Status "Faltou" Gera Recebimento

**Data:** 08/04/2026  
**Arquivo alterado:** `src/components/AgendaPage.tsx`

---

## Problema

Quando o status de um agendamento era alterado para `"faltou"` na Agenda, nenhum registro financeiro era criado na tabela `recebimentos`. O recebimento só era gerado ao marcar como `"concluido"`.

O paciente de teste **"Não vai e não paga"** exemplificava esse comportamento: seus agendamentos com falta não apareciam no módulo Financeiro.

---

## Causa

Na função `runStatusSideEffects` do `AgendaPage.tsx`, o bloco de criação de recebimento verificava apenas `newStatus === "concluido"`. O status `"faltou"` não estava contemplado.

```typescript
// Antes — só criava para "concluido"
if (
  newStatus === "concluido" &&
  appointment.pacienteId &&
  statusNaoTerminal.includes(prevStatus)
) { ... }
```

---

## Correção

Adicionado um novo bloco idempotente para `newStatus === "faltou"`, com a mesma lógica do bloco de `"concluido"`:

- Verifica se já existe recebimento vinculado ao agendamento (via `observacoes: agendamento:{id}`)
- Se não existir, busca o `valor_padrao` do procedimento
- Insere recebimento com `status: "pendente"` — o valor continua sendo devido mesmo com a falta

```typescript
// Depois — também cria para "faltou"
if (
  newStatus === "faltou" &&
  appointment.pacienteId &&
  statusNaoTerminal.includes(prevStatus)
) {
  // ... mesma lógica idempotente
  await supabase.from("recebimentos").insert({
    ...
    status: "pendente",
    observacoes: `agendamento:${appointment.id}`,
  });
}
```

---

## Regra de Negócio

Quando um paciente **falta** a uma sessão agendada, o valor da sessão **continua sendo devido** (a menos que haja política de cancelamento). Por isso, o recebimento é criado com `status: "pendente"`, igual ao fluxo de conclusão normal.

O recebimento pode ser posteriormente:
- **Confirmado** (pago mesmo com a falta)
- **Cancelado/excluído** manualmente se houver isenção

---

## Fluxo Completo Após a Correção

| Transição de Status | Gera Recebimento? |
|---|---|
| `agendado` → `confirmado` | Sim (pendente) |
| `agendado` → `concluido` | Sim (pendente, fallback) |
| `confirmado` → `concluido` | Não (já existe) |
| `agendado` → `faltou` | **Sim (pendente)** ← novo |
| `confirmado` → `faltou` | **Sim (pendente)** ← novo |
| `em_atendimento` → `faltou` | **Sim (pendente)** ← novo |
| Qualquer → `cancelado` | Não |
