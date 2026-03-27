# 🔗 Integração Agenda → Histórico do Cliente (27/03/2026)

> **Data:** 27/03/2026 · **Arquivo modificado:** `src/components/AgendaPage.tsx`

---

## Problema

Os módulos Agenda e Histórico estavam desconectados. Ao concluir ou registrar falta em um agendamento, nenhum dado era gravado automaticamente no Histórico do Cliente (tabs Frequência e Financeiro).

---

## Solução

A função `handleStatusChange` em `AgendaPage.tsx` foi expandida para disparar ações automáticas nas tabelas `recebimentos` e `frequencias` ao mudar o status de um agendamento.

---

## Regra de Disparo

A integração só ocorre quando o status anterior é **não-terminal**:

```
statusNaoTerminal = ["agendado", "confirmado", "em_atendimento"]
```

Isso evita double-counting se um agendamento já concluído ou com falta for reprocessado.

---

## Ao Concluir (`concluido`)

Requer `pacienteId` preenchido no agendamento.

### 1. Criar recebimento (idempotente)

- Verifica se já existe um `recebimento` com `observacoes ILIKE '%agendamento:{id}%'`
- Se **não existir**:
  - Busca `valor_padrao` do procedimento na tabela `procedimentos`
  - Se `valor > 0`: insere em `recebimentos` com `status = "pendente"`
  - Se `valor = 0`: exibe `toast.error()` orientando a cadastrar o valor em Configurações — **não cria** o recebimento (evita violar `CHECK (valor > 0)`)

### Campos gravados em `recebimentos`

| Campo | Valor |
|---|---|
| `paciente_id` | `appointment.pacienteId` |
| `paciente_nome` | `appointment.patientName` |
| `procedimento_id` | `appointment.procedimentoId` |
| `descricao` | `procedimentoNome ?? notes ?? "Atendimento"` |
| `valor` | `procedimento.valor_padrao` |
| `data_vencimento` | `appointment.date` |
| `status` | `"pendente"` |
| `observacoes` | `"agendamento:{appointment.id}"` |

### 2. Registrar presença em `frequencias`

- Calcula `mes = appointment.date.substring(0, 7)` (ex: `"2026-03"`)
- Se registro do mês **já existe**: incrementa `presencas + 1`
- Se **não existe**: cria com `presencas = 1, faltas = 0`

---

## Ao Registrar Falta (`faltou`)

Requer `pacienteId` preenchido no agendamento.

- Calcula `mes` da data do agendamento
- Se registro do mês **já existe**: incrementa `faltas + 1`
- Se **não existe**: cria com `presencas = 0, faltas = 1`

---

## Fluxo de Status Atualizado

```
agendado ──> confirmado ──> em_atendimento ──> concluido ★
   │              │
   ├──> cancelado ├──> cancelado
   └──> faltou ★  └──> faltou ★

cancelado ──> agendado (reagendar)
faltou ──> agendado (reagendar)

★ = dispara integração com Histórico (recebimentos + frequencias)
```

---

## Idempotência

O campo `observacoes = "agendamento:{uuid}"` funciona como chave de idempotência: mesmo que o status seja alterado para `concluido` mais de uma vez (ex: reagendar e concluir novamente), o recebimento não é duplicado.

---

## Notas

- A frequência **não é decrementada** automaticamente se um agendamento `concluido` for reaberto via Reagendar
- Se o agendamento não tiver `pacienteId`, a integração é silenciosamente ignorada
- O Histórico do Profissional exibe os dados via join com `agendamentos` — não requer inserção separada
