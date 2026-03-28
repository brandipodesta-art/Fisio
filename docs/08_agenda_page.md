# AgendaPage.tsx — Pagina de Agendamento (Google Calendar Style)

> **Arquivos:** `src/components/AgendaPage.tsx` (`"use client"`) + `AgendaEventCard.tsx` + `AgendaNewEventDialog.tsx` + `agendaTypes.ts` + `agendaData.ts`

---

## Proposito

Sistema de agendamento estilo Google Calendar para a clinica de fisioterapia. Permite visualizar, criar, editar e filtrar agendamentos por profissional, com visao de **dia, semana e mês**. Inclui gerenciamento de status (confirmar, iniciar atendimento, concluir, cancelar, faltou) **com integração automática ao Histórico do Cliente** (recebimentos + frequências).

---

## Arquivos do Modulo

| Arquivo | Funcao |
|---|---|
| `agendaTypes.ts` | Interfaces (Professional, Appointment), constantes de status e duracao |
| `agendaData.ts` | Mapeamento de profissionais, time slots, helpers de data pt-BR, `getMonthDays` |
| `AgendaEventCard.tsx` | Card visual do evento com cor por profissional, menu de acoes de status |
| `AgendaNewEventDialog.tsx` | Modal de criar/editar agendamento (paciente, profissional, procedimento, data, horario, duracao, observacao). Busca pacientes com `tipo_usuario = 'paciente'` |
| `AgendaPage.tsx` | Pagina principal: toolbar + sidebar + grid + handlers de CRUD e status |

---

## Dependencias

| Import | Tipo | Origem |
|---|---|---|
| `useState, useMemo, useEffect` | React Hooks | `react` |
| `Button, Card` | UI Components | `@/components/ui/...` (shadcn/ui) |
| `DropdownMenu` | UI Component | `@/components/ui/dropdown-menu` |
| `ChevronLeft, ChevronRight, Plus, Calendar, MoreVertical, CheckCircle2, PlayCircle, XCircle, UserX, CalendarCheck, Pencil` | Icones | `lucide-react` |
| `toast` | Notificacoes | `sonner` |
| `createClient` | Supabase client | `@/lib/supabase/client` |

---

## Interfaces TypeScript

### `Appointment`

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `string` | UUID gerado pelo Supabase |
| `patientName` | `string` | Nome do paciente |
| `pacienteId` | `string?` | UUID do paciente (FK para tabela pacientes) |
| `professionalId` | `string` | ID do profissional responsavel (slug) |
| `procedimentoId` | `string?` | UUID do procedimento (FK para tabela procedimentos) |
| `procedimentoNome` | `string?` | Nome do procedimento (obtido via join) |
| `date` | `string` | Data YYYY-MM-DD |
| `startTime` | `string` | Hora inicio HH:MM |
| `endTime` | `string` | Hora fim HH:MM |
| `duration` | `number` | Duracao em minutos |
| `status` | `AppointmentStatus` | agendado, confirmado, em_atendimento, concluido, cancelado, faltou |
| `notes` | `string?` | Observacao opcional |

### `AppointmentStatus`

| Status | Label | Cor | Descricao |
|---|---|---|---|
| `agendado` | Agendado | Cinza (slate) | Agendamento criado, aguardando confirmacao |
| `confirmado` | Confirmado | Verde (emerald) | Paciente confirmou presenca |
| `em_atendimento` | Em Atendimento | Azul (blue) | Sessao em andamento |
| `concluido` | Concluido | Verde (green) | Sessao finalizada |
| `cancelado` | Cancelado | Vermelho (red) | Agendamento cancelado |
| `faltou` | Faltou | Amarelo (amber) | Paciente nao compareceu |

---

## Fluxo de Status

```
agendado ──> confirmado ──> em_atendimento ──> concluido ★
   │              │
   ├──> cancelado ├──> cancelado
   └──> faltou ★  └──> faltou ★

cancelado ──> agendado (reagendar)
faltou ──> agendado (reagendar)

★ = dispara integração com Histórico (recebimentos + frequencias)
```

### Acoes disponiveis por status

| Status Atual | Acoes Disponiveis |
|---|---|
| `agendado` | Confirmar, Cancelar, Faltou |
| `confirmado` | Iniciar Atendimento, Cancelar, Faltou |
| `em_atendimento` | Concluir |
| `concluido` | (nenhuma) |
| `cancelado` | Reagendar |
| `faltou` | Reagendar |

---

## Integração Agenda → Histórico (handleStatusChange)

Implementada em 27/03/2026. Ao alterar o status de um agendamento, além de atualizar a tabela `agendamentos`, o sistema dispara ações automáticas nas tabelas `recebimentos` e `frequencias`.

### Regra de disparo

Só ocorre se o agendamento estiver saindo de um **status não-terminal**:

```
statusNaoTerminal = ["agendado", "confirmado", "em_atendimento"]
```

### Ao concluir (`concluido`) — requer `pacienteId`

**1. Criar recebimento (idempotente):**
- Verifica se já existe um recebimento com `observacoes ILIKE '%agendamento:{id}%'`
- Se não existe:
  - Busca `valor_padrao` em `procedimentos`
  - Se `valor > 0`: insere em `recebimentos` com `status = "pendente"` e `observacoes = "agendamento:{id}"`
  - Se `valor = 0`: exibe `toast.error()` orientando a cadastrar o valor em Configurações

**2. Registrar presença em `frequencias`:**
- Calcula `mes = date.substring(0, 7)` (ex: `"2026-03"`)
- Se registro do mês já existe: incrementa `presencas + 1`
- Se não existe: cria com `presencas = 1, faltas = 0`

### Ao registrar falta (`faltou`) — requer `pacienteId`

- Calcula `mes` da data do agendamento
- Se registro do mês já existe: incrementa `faltas + 1`
- Se não existe: cria com `presencas = 0, faltas = 1`

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

> **Nota:** O campo `observacoes` com o ID do agendamento é usado como chave de idempotência — impede duplicação se o status for alterado para "concluido" mais de uma vez.

---

## Tabela Supabase: `agendamentos`

| Coluna | Tipo | Descricao |
|---|---|---|
| `id` | UUID (PK) | Gerado automaticamente |
| `created_at` | TIMESTAMPTZ | Data de criacao |
| `patient_name` | TEXT | Nome do paciente |
| `paciente_id` | UUID (FK) | Referencia para `pacientes(id)` |
| `professional_id` | TEXT (FK) | Referencia para `profissionais(id)` |
| `procedimento_id` | UUID (FK) | Referencia para `procedimentos(id)` |
| `date` | TEXT | Data no formato YYYY-MM-DD |
| `start_time` | TEXT | Horario de inicio HH:MM |
| `end_time` | TEXT | Horario de termino HH:MM |
| `duration` | INTEGER | Duracao em minutos |
| `status` | TEXT | Status do agendamento |
| `notes` | TEXT | Observacoes opcionais |

---

## Estados Internos (AgendaPage)

| Estado | Tipo | Valor Inicial | Descricao |
|---|---|---|---|
| `currentDate` | `Date` | `new Date()` | Data sendo visualizada |
| `viewMode` | `"day" \| "week" \| "month"` | `"day"` | Modo de exibicao |
| `monthDays` | `Date[]` (useMemo) | `[]` | Dias do mês atual incluindo padding de semanas incompletas |
| `appointments` | `Appointment[]` | `[]` (carregado do Supabase) | Todos os agendamentos |
| `professionals` | `Professional[]` | `[]` (carregado do Supabase) | Profissionais disponiveis |
| `selectedProfessionals` | `string[]` | Todos os IDs | Filtro de profissionais ativos |
| `dialogOpen` | `boolean` | `false` | Controla modal de agendamento |
| `editingAppointment` | `Appointment \| null` | `null` | Agendamento sendo editado |
| `isLoading` | `boolean` | `true` | Loading state do fetch |

---

## Funcoes Principais

| Funcao | Descricao |
|---|---|
| `fetchProfessionals()` | Carrega profissionais do Supabase |
| `fetchAppointments()` | Carrega agendamentos (com join procedimentos, fallback sem join) |
| `goToday()` | Navega para a data atual |
| `goPrev() / goNext()` | Navega 1 dia, 7 dias ou 1 mês conforme viewMode |
| `toggleProfessional(id)` | Liga/desliga filtro de um profissional |
| `getSlotAppointments(hour, date?)` | Retorna agendamentos de um horario especifico |
| `handleSaveAppointment(apt)` | Cria novo agendamento no Supabase |
| `handleUpdateAppointment(apt)` | Atualiza agendamento existente no Supabase |
| `handleStatusChange(id, status)` | Altera status + dispara integração com Histórico |

---

## Visão Mês

Implementada em 27/03/2026. Grade mensal no estilo Google Calendar.

### Comportamento
- Exibe todos os dias do mês em grade Seg–Dom com padding de semanas incompletas (dias de mês anterior/posterior em cinza)
- Hoje destacado com círculo verde (igual ao Google Calendar)
- Cada dia mostra até **3 eventos** com chip colorido por profissional (`HH:MM NomePaciente`)
- Se houver mais de 3: exibe `+N mais`
- **Clicar no dia** → navega direto para visão de Dia daquele dia
- **Clicar em um evento** → abre modal de edição
- Navegação `<` `>` avança/recua por mês inteiro
- Título da toolbar: `Março de 2026`

### Helper `getMonthDays(date)` — `agendaData.ts`
Retorna array de `Date` cobrindo a grade completa:
1. Encontra o primeiro dia do mês
2. Recua até a segunda-feira anterior (ou o próprio dia se já for segunda)
3. Avança até o domingo seguinte ao último dia do mês
4. Resultado: sempre múltiplo de 7 (semanas completas)

---

## Integração com Histórico do Cliente (28/03/2026)

| Status | Frequência | Recebimento |
|--------|-----------|-------------|
| `agendado` | sem efeito | sem efeito |
| `confirmado` | sem efeito | **cria pendente** (idempotente via `observacoes`) |
| `concluido` | +1 presença (recomputa de agendamentos) | fallback: cria se não existe |
| `faltou` | +1 falta (recomputa de agendamentos) | mantém pendente (pagamento mensal) |
| `cancelado` | sem efeito | admin gerencia manualmente |

A frequência é sempre recomputada diretamente de `agendamentos WHERE status IN (concluido, faltou)` — nunca de contador incremental. Idempotente.

---

## AgendaNewEventDialog — Busca de Pacientes

O autocomplete do campo "Paciente" filtra a tabela `pacientes` com:
- `tipo_usuario = 'paciente'` — exclui funcionários, admins e financeiros
- `ativo = true` — exclui inativos
- `nome_completo ILIKE '%termo%'` — busca parcial

---

## Notas para Edicao Futura

- **Exclusão:** Ainda não há opção para excluir agendamentos
- **Drag & drop:** Futuro: arrastar eventos para reagendar
- **Recorrência:** Futuro: agendamentos recorrentes (semanais)
- **Notificações:** Futuro: lembrete por WhatsApp/email
- **Conflito de horário:** Não há validação de conflito — pode agendar 2 pacientes no mesmo horário/profissional
- **Horários configuráveis:** TIME_SLOTS hardcoded — futuro: página de configuração da clínica
- **Reversão de frequência:** A frequência é recomputada do zero a partir dos agendamentos — se um appointment "concluido" for reaberto via Reagendar (faltou → agendado), a contagem é atualizada automaticamente
