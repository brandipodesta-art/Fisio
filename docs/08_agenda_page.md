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
| `AgendaNewEventDialog.tsx` | Modal de criar/editar agendamento. No modo edição: exibe seletor de Status (badges) e modo bloqueado para status terminais (somente Observação editável + botão Editar para desbloquear) |
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
| `gerarCobranca` | `boolean?` | Flag indicando se este agendamento está autorizado a gerar boleto recebimento |

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
**Importante (08/04/2026):** Side-effects no setor de recebimentos só ocorrem se `appointment.gerarCobranca !== false` para respeitar pacientes de pacotes/Pilates.

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
| `handleUpdateAppointment(apt)` | Atualiza agendamento existente; se status mudou, chama `runStatusSideEffects` |
| `handleStatusChange(id, status)` | Altera status no Supabase e chama `runStatusSideEffects` |
| `runStatusSideEffects(apt, prev, new)` | Side effects de mudança de status: atualiza frequências e cria recebimentos |

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

## Integração com Histórico do Cliente (28/03/2026, atualizado 30/03/2026)

| Status | Frequência | Recebimento |
|--------|-----------|-------------|
| `agendado` | sem efeito | sem efeito |
| `confirmado` | sem efeito | **cria pendente** (idempotente via `observacoes`) |
| `concluido` | +1 presença (recomputa de agendamentos) | fallback: cria se não existe |
| `faltou` | +1 falta (recomputa de agendamentos) | mantém pendente (pagamento mensal) |
| `cancelado` | sem efeito (aparece na lista de sessões em cinza) | admin gerencia manualmente |

A frequência é sempre recomputada diretamente de `agendamentos WHERE status IN (concluido, faltou)` — nunca de contador incremental. Idempotente.

Os side effects são disparados tanto ao usar o menu de status nos cards (`handleStatusChange`) quanto ao salvar o modal de edição com status alterado (`handleUpdateAppointment → runStatusSideEffects`).

---

## AgendaNewEventDialog — Seletor de Status e Modo Bloqueado (30/03/2026)

### Seletor de Status
- Exibido **somente no modo edição**
- Linha de badges clicáveis com as cores de `APPOINTMENT_STATUS_COLORS`
- Badge ativo: `ring-1 ring-current ring-offset-1 opacity-100`; inativo: `opacity-50`
- Status salvo junto ao `onUpdate` — dispara `runStatusSideEffects` se mudou

### Modo Bloqueado (`isLocked`)
Ativado quando `isEditing && status IN (concluido, cancelado, faltou) && !isForceEdit`

| Elemento | Comportamento quando bloqueado |
|---|---|
| Banner colorido | Exibe "Agendamento **Concluído/Cancelado/Faltou** — campos bloqueados" |
| Paciente, Profissional, Procedimento, Data, Horário, Duração | `disabled` |
| Status (badges) | `disabled`, sem clique |
| **Observação** | **Permanece editável** — para a funcionária adicionar notas |
| Botão "Editar" | Aparece no rodapé esquerdo — seta `isForceEdit = true` (desbloqueia tudo) |
| Botão "Cancelar" | Muda label para "Fechar" |

`isForceEdit` é resetado ao fechar o modal.

---

## AgendaNewEventDialog — Busca de Pacientes

O autocomplete do campo "Paciente" filtra a tabela `pacientes` com:
- `tipo_usuario = 'paciente'` — exclui funcionários, admins e financeiros
- `ativo = true` — exclui inativos
- `nome_completo ILIKE '%termo%'` — busca parcial

---

## AgendaNewEventDialog — Repetição Semanal

Implementado em 27/03/2026. Permite criar múltiplos agendamentos semanais de uma só vez.

### Comportamento
- Exibe somente no modo **criação** (não aparece ao editar)
- Checkbox **"Repetir semanalmente"** — ativo apenas quando data está preenchida
- Campo numérico **"Gerar mais X semana(s)"** (padrão: 4, máximo: 52)
- Preview das datas adicionais exibido como chips coloridos (`dd/MM`)
- Ao salvar: cria o agendamento base + N agendamentos nas semanas seguintes

### Implementação
- Props: `onSaveMultiple?: (apts: Appointment[]) => void`
- `datesPreview()`: gera as N datas futuras usando `new Date(y, m-1, day + i*7)`
- Em `handleSave`: quando `repete=true`, monta array com base + N cópias e chama `onSaveMultiple`
- Em `AgendaPage`: `handleSaveMultipleAppointments` faz batch insert via `supabase.from("agendamentos").insert(rows)` e atualiza IDs reais

### Exemplo
Data base: 27/03 (sexta), semanas=4 → cria: 27/03, 03/04, 10/04, 17/04, 24/04 (5 agendamentos no total)

---

## AgendaNewEventDialog — Controle de Geração Financeira (08/04/2026)

Adicionada uma trava no agendamento para evitar a criação automática de Contas a Receber em pacientes que já pagam por **pacotes ou mensalidades** (ex: Pilates).

### Comportamento e Implementação:
- Novo checkbox disponível durante a criação ou edição do agendamento: **"Gerar cobrança financeira"** (padrão marcado).
- Ao ser desmarcada, o agendamento é salvo sem disparar eventos que lançariam pendências na aba "Financeiro" do usuário quando o status vai para Confirmado/Concluído/Faltou.
- **Implementação (_no-schema change_):** O sistema não criou novas colunas de banco de dados. A diretiva é embutida salvando uma flag oculta `[NO_BILLING]` no banco dentro do texto de observação (`notas`). Ao carregar a página da Agenda, ele lê e extirpa a informação de lá, transformando-a novamente em um controle visual na tela, sem poluir os dados.

---

## Notas para Edicao Futura

- **Exclusão:** Ainda não há opção para excluir agendamentos
- **Drag & drop:** Futuro: arrastar eventos para reagendar
- **Recorrência mensal:** Futuro: além de semanal, opção mensal
- **Notificações:** Futuro: lembrete por WhatsApp/email
- **Conflito de horário:** Não há validação de conflito — pode agendar 2 pacientes no mesmo horário/profissional
- **Horários configuráveis:** TIME_SLOTS hardcoded — futuro: página de configuração da clínica
- **Reversão de frequência:** A frequência é recomputada do zero a partir dos agendamentos — se um appointment "concluido" for reaberto via Reagendar (faltou → agendado), a contagem é atualizada automaticamente
