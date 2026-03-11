# 📅 AgendaPage.tsx — Página de Agendamento (Google Calendar Style)

> **Arquivos:** `src/components/AgendaPage.tsx` (`"use client"`) + `AgendaEventCard.tsx` + `AgendaNewEventDialog.tsx` (`"use client"`) + `agendaTypes.ts` + `agendaData.ts`

---

## Propósito

Sistema de agendamento estilo Google Calendar para a clínica de fisioterapia. Permite visualizar, criar e filtrar agendamentos por profissional, com visão de dia e semana.

---

## Arquivos do Módulo

| Arquivo | Linhas | Função |
|---|---|---|
| `agendaTypes.ts` | ~65 | Interfaces (Professional, Appointment), constantes de status e duração |
| `agendaData.ts` | ~170 | Profissionais, time slots, helpers de data pt-BR, dados mockados |
| `AgendaEventCard.tsx` | ~65 | Card visual do evento com cor por profissional |
| `AgendaNewEventDialog.tsx` | ~180 | Modal simples de novo agendamento (4 campos) |
| `AgendaPage.tsx` | ~275 | Página principal: toolbar + sidebar + grid |

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useMemo` | React Hooks | `react` |
| `Button, Card, Input, Label` | UI Components | `@/components/ui/...` (shadcn/ui) |
| `Select, Dialog` | UI Components | `@/components/ui/...` (shadcn/ui) |
| `ChevronLeft, ChevronRight, Plus, Calendar, CalendarPlus, CalendarDays` | Ícones | `lucide-react` |
| `toast` | Notificações | `sonner` |

---

## Interfaces TypeScript

### `Professional`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | Identificador único (slug) |
| `name` | `string` | Nome completo |
| `shortName` | `string` | Nome curto para mobile |
| `color` | `string` | Cor hex para indicador visual |
| `bgColor` | `string` | Classe Tailwind do fundo |
| `borderColor` | `string` | Classe Tailwind da borda |
| `textColor` | `string` | Classe Tailwind do texto |

### `Appointment`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | ID único |
| `patientName` | `string` | Nome do paciente |
| `professionalId` | `string` | ID do profissional responsável |
| `date` | `string` | Data YYYY-MM-DD |
| `startTime` | `string` | Hora início HH:MM |
| `endTime` | `string` | Hora fim HH:MM |
| `duration` | `number` | Duração em minutos |
| `status` | `AppointmentStatus` | agendado, confirmado, em_atendimento, concluido, cancelado, faltou |
| `notes` | `string?` | Observação opcional |

---

## Profissionais (Dados de Teste)

| Nome | Cor | Hex |
|---|---|---|
| Ana Carolina | 🟢 Esmeralda | `#10b981` |
| Amanda Augusta | 🔵 Azul | `#3b82f6` |
| Aline Pereira | 🟠 Laranja | `#f97316` |

---

## Estrutura UI — Diagrama Visual

### Toolbar

```
┌──────────────────────────────────────────────────────────┐
│  Card p-4                                                │
│  ┌─────┐ ┌──┐ ┌──┐                                      │
│  │Hoje │ │◀ │ │▶ │  Sábado, 8 de Março de 2026          │
│  └─────┘ └──┘ └──┘                                      │
│                          ┌─────┬────────┐  ┌────────────┐│
│                          │ Dia │ Semana │  │+ Novo Agen.││
│                          └─────┴────────┘  └────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Layout Principal (Desktop)

```
┌──────────────┬──────────────────────────────────────────┐
│  SIDEBAR     │  CALENDAR GRID                           │
│  Card w-48   │  Card flex-1                             │
│              │                                          │
│  Profission. │  07:00 │                                 │
│  ☑ Todos     │  08:00 │ ┌─────────────────────┐        │
│  🟢 Ana C.   │        │ │ 🟢 08:00-08:50      │        │
│  🔵 Amanda   │        │ │ João Silva           │        │
│  🟠 Aline    │  09:00 │ │ Ana Carolina         │        │
│              │        │ └─────────────────────┘        │
│              │  10:00 │ ┌─────────────────────┐        │
│              │        │ │ 🔵 10:00-10:50      │        │
│              │        │ │ Carlos Oliveira      │        │
│              │  11:00 │ │ Amanda Augusta       │        │
│              │        │ └─────────────────────┘        │
│              │  12:00 │                                 │
│              │  ...   │                                 │
│              │  20:00 │                                 │
└──────────────┴──────────────────────────────────────────┘
```

### Layout Mobile (< md)

```
┌──────────────────────────────────────────┐
│  TOOLBAR (compacto)                      │
│  [Hoje] [◀] [▶] 8 Mar 2026              │
│                    [Dia|Semana] [+ Novo] │
├──────────────────────────────────────────┤
│  CALENDAR GRID (full width)              │
│  07:00 │                                 │
│  08:00 │ ┌───────────────────────┐       │
│        │ │ 🟢 08:00-08:50 João   │       │
│  09:00 │ └───────────────────────┘       │
│  ...                                     │
├──────────────────────────────────────────┤
│  FILTRO PROFISSIONAIS (pills)            │
│  [🟢 Ana C.] [🔵 Amanda A.] [🟠 Aline]  │
└──────────────────────────────────────────┘
```

### Modal "Novo Agendamento"

```
┌──────────────────────────────────────┐
│  ✨ Novo Agendamento        ✕ Fechar │
│  "Preencha os dados..."             │
│  ─────────────────────────────────  │
│  Paciente *                          │
│  [Input: Nome do paciente     ]      │
│                                      │
│  Profissional *                      │
│  [Select ▼: 🟢 Ana Carolina  ]      │
│                                      │
│  Data *          Horário *           │
│  [📅 08/03/2026] [⏰ 08:00 ▼]       │
│                                      │
│  Duração                             │
│  [Select ▼: 50 minutos      ]      │
│                                      │
│  Observação (opcional)               │
│  [Input                       ]      │
│  ─────────────────────────────────  │
│                [Cancelar] [Agendar]  │
└──────────────────────────────────────┘
```

### Card de Evento

```
┌─────────────────────────────────┐
│▌ 08:00 - 08:50                  │  ← borda lateral colorida
│▌ João Silva                     │  ← nome do paciente (bold)
│▌ Ana Carolina                   │  ← nome do profissional (cinza)
│▌ [Confirmado ✅]                │  ← badge de status
└─────────────────────────────────┘
```

Modo compacto (visão semanal): sem profissional e sem badge.

---

## Estados Internos (AgendaPage)

| Estado | Tipo | Valor Inicial | Descrição |
|---|---|---|---|
| `currentDate` | `Date` | `new Date()` | Data sendo visualizada |
| `viewMode` | `"day" \| "week"` | `"day"` | Modo de exibição |
| `appointments` | `Appointment[]` | Mock data (10 itens) | Todos os agendamentos |
| `selectedProfessionals` | `string[]` | Todos os IDs | Filtro de profissionais ativos |
| `dialogOpen` | `boolean` | `false` | Controla modal de novo agendamento |
| `dialogDefaults` | `{ date?, time? }` | `{}` | Valores pré-preenchidos do modal |

---

## Funções Principais

| Função | Descrição |
|---|---|
| `goToday()` | Navega para a data atual |
| `goPrev()` | Volta 1 dia (dia) ou 7 dias (semana) |
| `goNext()` | Avança 1 dia ou 7 dias |
| `toggleProfessional(id)` | Liga/desliga filtro de um profissional |
| `toggleAllProfessionals()` | Liga/desliga todos os profissionais |
| `getSlotAppointments(hour, date?)` | Retorna agendamentos de um horário específico |
| `openNewDialog(date?, time?)` | Abre modal com defaults opcionais |
| `handleSaveAppointment(apt)` | Adiciona agendamento ao estado |

---

## Helpers de Data (agendaData.ts)

| Função | Retorno | Descrição |
|---|---|---|
| `formatDateBR(date)` | `"08/03/2026"` | Formato brasileiro |
| `formatDateISO(date)` | `"2026-03-08"` | Formato ISO para input date |
| `formatDateFull(date)` | `"8 de Março de 2026"` | Formato extenso pt-BR |
| `getDayName(date, short?)` | `"Sábado"` / `"Sáb"` | Nome do dia da semana |
| `getMonthName(date)` | `"Março"` | Nome do mês |
| `getWeekStart(date)` | `Date` | Retorna a segunda-feira da semana |
| `getWeekDays(date)` | `Date[7]` | Array de 7 dias (Seg-Dom) |
| `calculateEndTime(start, dur)` | `"08:50"` | Calcula horário de término |

---

## Constantes Configuráveis

| Constante | Valor Atual | Descrição |
|---|---|---|
| `PROFESSIONALS` | 3 profissionais | Lista de fisioterapeutas |
| `TIME_SLOTS` | 07:00-20:00 (14 slots) | Horários do grid |
| `TIME_OPTIONS` | 07:00-20:00 a cada 30min | Opções do select de horário |
| `DURATION_OPTIONS` | 30, 50, 60, 90 min | Opções de duração da sessão |

---

## Notas para Edição Futura

- **Backend:** Dados são apenas estado React — integrar com API/banco para persistência
- **Busca de paciente:** Campo de paciente é texto livre — implementar autocomplete com lista de pacientes cadastrados
- **Edição/exclusão:** Ainda não é possível editar ou excluir agendamentos existentes
- **Drag & drop:** Futuro: arrastar eventos para reagendar
- **Recorrência:** Futuro: agendamentos recorrentes (semanais)
- **Notificações:** Futuro: lembrete por WhatsApp/email
- **Conflito de horário:** Não há validação de conflito — pode agendar 2 pacientes no mesmo horário/profissional
- **Profissionais dinâmicos:** Lista hardcoded — futuro: carregar de uma página de configuração
- **Horários configuráveis:** TIME_SLOTS hardcoded — futuro: página de configuração da clínica
