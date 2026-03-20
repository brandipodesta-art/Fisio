# AgendaPage.tsx — Pagina de Agendamento (Google Calendar Style)

> **Arquivos:** `src/components/AgendaPage.tsx` (`"use client"`) + `AgendaEventCard.tsx` + `AgendaNewEventDialog.tsx` (`"use client"`) + `agendaTypes.ts` + `agendaData.ts`

---

## Proposito

Sistema de agendamento estilo Google Calendar para a clinica de fisioterapia. Permite visualizar, criar, **editar** e filtrar agendamentos por profissional, com visao de dia e semana. Inclui gerenciamento de status (confirmar, iniciar atendimento, concluir, cancelar, faltou) e selecao de procedimento.

---

## Arquivos do Modulo

| Arquivo | Funcao |
|---|---|
| `agendaTypes.ts` | Interfaces (Professional, Appointment), constantes de status e duracao |
| `agendaData.ts` | Mapeamento de profissionais, time slots, helpers de data pt-BR |
| `AgendaEventCard.tsx` | Card visual do evento com cor por profissional, menu de acoes de status |
| `AgendaNewEventDialog.tsx` | Modal de criar/editar agendamento (paciente, profissional, procedimento, data, horario, duracao, observacao) |
| `AgendaPage.tsx` | Pagina principal: toolbar + sidebar + grid + handlers de CRUD e status |

---

## Dependencias

| Import | Tipo | Origem |
|---|---|---|
| `useState, useMemo, useEffect, useRef` | React Hooks | `react` |
| `Button, Card, Input, Label` | UI Components | `@/components/ui/...` (shadcn/ui) |
| `Select, Dialog` | UI Components | `@/components/ui/...` (shadcn/ui) |
| `DropdownMenu` | UI Component | `@/components/ui/dropdown-menu` (shadcn/ui) |
| `ChevronLeft, ChevronRight, Plus, Calendar, CalendarPlus, Pencil, MoreVertical, CheckCircle2, PlayCircle, XCircle, UserX, CalendarCheck` | Icones | `lucide-react` |
| `toast` | Notificacoes | `sonner` |
| `createClient` | Supabase client | `@/lib/supabase/client` |

---

## Interfaces TypeScript

### `Professional`

| Campo | Tipo | Descricao |
|---|---|---|
| `id` | `string` | Identificador unico (slug, ex: "ana-carolina") |
| `name` | `string` | Nome completo |
| `shortName` | `string` | Nome curto para mobile |
| `color` | `string` | Cor hex para indicador visual |
| `bgColor` | `string` | Classe Tailwind do fundo |
| `borderColor` | `string` | Classe Tailwind da borda |
| `textColor` | `string` | Classe Tailwind do texto |

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

## Fluxo de Status (Secretaria)

```
agendado ──> confirmado ──> em_atendimento ──> concluido
   │              │
   ├──> cancelado ├──> cancelado
   └──> faltou    └──> faltou

cancelado ──> agendado (reagendar)
faltou ──> agendado (reagendar)
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

**Migracao:** `docs/sql_migracao_procedimento_agendamento.sql` — adiciona `procedimento_id`

---

## Estrutura UI

### Toolbar

```
┌──────────────────────────────────────────────────────────┐
│  [Hoje] [<] [>]  Sexta, 20 de Marco de 2026             │
│                          [Dia|Semana]  [+ Novo Agendamento]│
└──────────────────────────────────────────────────────────┘
```

### Layout Principal (Desktop)

```
┌──────────────┬──────────────────────────────────────────┐
│  SIDEBAR     │  CALENDAR GRID                           │
│  w-48        │  flex-1                                  │
│              │                                          │
│  Profission. │  07:00 │                                 │
│  ☑ Todos     │  08:00 │ ┌─────────────────────┐  [⋮]  │
│  🟢 Ana C.   │        │ │ 08:00-08:50         │        │
│  🔵 Amanda   │        │ │ Joao Silva          │        │
│  🟠 Aline    │  09:00 │ │ Ana Carolina        │        │
│              │        │ │ Consulta            │        │
│              │        │ │ [Confirmado]        │        │
│              │        │ └─────────────────────┘        │
│              │  ...   │                                 │
└──────────────┴──────────────────────────────────────────┘
```

### Modal Criar/Editar Agendamento

```
┌──────────────────────────────────────┐
│  ✏️ Editar Agendamento       ✕       │  ← ou "Novo Agendamento"
│  "Altere os dados do agendamento"   │
│  ─────────────────────────────────  │
│  Paciente *                          │
│  [🔍 Buscar paciente... (autocomplete)]│
│                                      │
│  Profissional *                      │
│  [Select ▼: 🟢 Ana Carolina  ]      │
│                                      │
│  Procedimento                        │  ← NOVO
│  [Select ▼: Selecione procedimento]  │
│                                      │
│  Data *          Horario *           │
│  [📅 20/03/2026] [⏰ 18:00 ▼]       │
│                                      │
│  Duracao                             │
│  [Select ▼: 50 minutos      ]      │
│                                      │
│  Observacao (opcional)               │
│  [Input                       ]      │
│  ─────────────────────────────────  │
│                [Cancelar] [Salvar]   │  ← "Agendar" para novo
└──────────────────────────────────────┘
```

### Card de Evento com Menu de Acoes

```
┌─────────────────────────────────┐
│▌ 18:00 - 18:50              [⋮]│  ← menu aparece no hover
│▌ Renata Andrade                │
│▌ Terezinha de Jesus            │
│▌ Consulta                      │  ← tipo de procedimento
│▌ [Confirmado]                  │  ← badge de status
└─────────────────────────────────┘

Menu [⋮] (contextual por status):
  ┌─────────────────┐
  │ ✏️ Editar        │
  │ ─────────────── │
  │ ✅ Confirmar     │  ← verde
  │ ❌ Cancelar      │  ← vermelho
  │ 👤 Faltou        │  ← amarelo
  └─────────────────┘
```

---

## Estados Internos (AgendaPage)

| Estado | Tipo | Valor Inicial | Descricao |
|---|---|---|---|
| `currentDate` | `Date` | `new Date()` | Data sendo visualizada |
| `viewMode` | `"day" \| "week"` | `"day"` | Modo de exibicao |
| `appointments` | `Appointment[]` | `[]` (carregado do Supabase) | Todos os agendamentos |
| `professionals` | `Professional[]` | `[]` (carregado do Supabase) | Profissionais disponiveis |
| `selectedProfessionals` | `string[]` | Todos os IDs | Filtro de profissionais ativos |
| `dialogOpen` | `boolean` | `false` | Controla modal de agendamento |
| `dialogDefaults` | `{ date?, time? }` | `{}` | Valores pre-preenchidos do modal |
| `editingAppointment` | `Appointment \| null` | `null` | Agendamento sendo editado |
| `isLoading` | `boolean` | `true` | Loading state do fetch |

---

## Funcoes Principais

| Funcao | Descricao |
|---|---|
| `goToday()` | Navega para a data atual |
| `goPrev()` | Volta 1 dia (dia) ou 7 dias (semana) |
| `goNext()` | Avanca 1 dia ou 7 dias |
| `toggleProfessional(id)` | Liga/desliga filtro de um profissional |
| `toggleAllProfessionals()` | Liga/desliga todos os profissionais |
| `getSlotAppointments(hour, date?)` | Retorna agendamentos de um horario especifico |
| `openNewDialog(date?, time?)` | Abre modal para criar novo agendamento |
| `handleEditClick(apt)` | Abre modal em modo edicao com dados preenchidos |
| `handleSaveAppointment(apt)` | Cria novo agendamento no Supabase |
| `handleUpdateAppointment(apt)` | Atualiza agendamento existente no Supabase |
| `handleStatusChange(id, status)` | Altera status de um agendamento no Supabase |

---

## Helpers de Data (agendaData.ts)

| Funcao | Retorno | Descricao |
|---|---|---|
| `mapDbProfessional(row)` | `Professional` | Mapeia row do Supabase para interface |
| `formatDateBR(date)` | `"08/03/2026"` | Formato brasileiro |
| `formatDateISO(date)` | `"2026-03-08"` | Formato ISO para input date |
| `formatDateFull(date)` | `"8 de Marco de 2026"` | Formato extenso pt-BR |
| `getDayName(date, short?)` | `"Sabado"` / `"Sab"` | Nome do dia da semana |
| `getMonthName(date)` | `"Marco"` | Nome do mes |
| `getWeekStart(date)` | `Date` | Retorna a segunda-feira da semana |
| `getWeekDays(date)` | `Date[7]` | Array de 7 dias (Seg-Dom) |
| `calculateEndTime(start, dur)` | `"08:50"` | Calcula horario de termino |

---

## Constantes Configuraveis

| Constante | Valor Atual | Descricao |
|---|---|---|
| `TIME_SLOTS` | 07:00-20:00 (14 slots) | Horarios do grid |
| `TIME_OPTIONS` | 07:00-20:00 a cada 30min | Opcoes do select de horario |
| `DURATION_OPTIONS` | 30, 50, 60, 90 min | Opcoes de duracao da sessao |
| `APPOINTMENT_STATUS_LABELS` | 6 status | Labels dos status em portugues |
| `APPOINTMENT_STATUS_COLORS` | 6 status | Classes Tailwind para cada status |

---

## Notas para Edicao Futura

- **Drag & drop:** Futuro: arrastar eventos para reagendar
- **Recorrencia:** Futuro: agendamentos recorrentes (semanais)
- **Notificacoes:** Futuro: lembrete por WhatsApp/email
- **Conflito de horario:** Nao ha validacao de conflito — pode agendar 2 pacientes no mesmo horario/profissional
- **Horarios configuraveis:** TIME_SLOTS hardcoded — futuro: pagina de configuracao da clinica
- **Exclusao:** Ainda nao ha opcao para excluir agendamentos
