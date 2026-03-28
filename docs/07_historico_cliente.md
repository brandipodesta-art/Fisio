# HistoricoCliente.tsx — Histórico Completo do Cliente

> **Arquivo:** `src/components/HistoricoCliente.tsx` · **Dados:** Supabase (tempo real)

---

## Propósito

Aba de histórico do cliente com sub-abas internas. Opera em **dois modos**:

| Modo | Tipo de usuário | Sub-abas disponíveis |
|------|----------------|----------------------|
| **Paciente** | `tipo_usuario = "paciente"` | Procedimentos, Frequência, Financeiro, Evolução |
| **Funcionário/Financeiro** | `tipo_usuario = "funcionario" \| "financeiro"` | Pacientes Vinculados (com comissões e recebimentos) |

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useEffect, useMemo` | React Hooks | `react` |
| `Card` | UI Component | `@/components/ui/card` |
| `Tabs, TabsContent, TabsList, TabsTrigger` | UI Component | `@/components/ui/tabs` |
| `Activity, DollarSign, Calendar, Stethoscope, Users, AlertTriangle, MoreHorizontal, Eye, Check, Pencil, X` | Ícones | `lucide-react` |
| `DropdownMenu` | UI Component | `@/components/ui/dropdown-menu` |
| `ConfirmActionDialog` | UI Component | `@/components/ui/ConfirmActionDialog` |
| `ModalPortal` | UI Component | `@/components/ui/ModalPortal` |
| `usePermissoes` | Hook | `@/lib/auth/usePermissoes` |
| `useAuth` | Hook | `@/lib/auth/AuthContext` |

---

## Interfaces TypeScript

### `Frequencia`

| Campo | Tipo | Descrição |
|---|---|---|
| `mes` | `string` | Mês no formato `YYYY-MM` (ex: `"2026-03"`) |
| `presencas` | `number` | Agendamentos com `status = "concluido"` |
| `faltas` | `number` | Agendamentos com `status = "faltou"` |

### `RecebimentoRaw`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID |
| `paciente_id` | `string \| null` | FK para pacientes |
| `paciente_nome` | `string \| null` | Nome do paciente |
| `procedimento_id` | `string \| null` | FK para procedimentos |
| `descricao` | `string \| null` | Descrição do recebimento |
| `valor` | `number` | Valor em R$ |
| `data_vencimento` | `string` | Data ISO |
| `data_pagamento` | `string \| null` | Data de quitação |
| `status` | `string` | `pendente \| pago \| cancelado` |

### `Evolucao`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID |
| `created_at` | `string` | Timestamp ISO |
| `descricao` | `string` | Texto da evolução |
| `profissional_nome` | `string \| null` | Nome do profissional |

---

## Fonte dos dados — Modo Paciente

```typescript
// Busca paralela no Supabase
const [recebimentos, agendamentosFreq, evols] = await Promise.all([
  get(`recebimentos?paciente_id=eq.${pacienteId}&...`),
  // Frequências calculadas dos agendamentos — nunca da tabela frequencias
  get(`agendamentos?paciente_id=eq.${pacienteId}&status=in.(concluido,faltou)&select=date,status`),
  get(`evolucoes?paciente_id=eq.${pacienteId}&order=created_at.desc&select=*`),
]);
```

### Agrupamento de Frequência (client-side)

```typescript
const byMonth: Record<string, { presencas: number; faltas: number }> = {};
for (const apt of agendamentosFreq) {
  const mes = apt.date.substring(0, 7); // "2026-03"
  if (!byMonth[mes]) byMonth[mes] = { presencas: 0, faltas: 0 };
  if (apt.status === "concluido") byMonth[mes].presencas++;
  else byMonth[mes].faltas++;
}
```

> **Importante:** A tabela `frequencias` não é usada para exibição — apenas `agendamentos` é fonte de verdade. Isso evita dados desatualizados por manipulações diretas.

---

## Sub-aba: Frequência (Modo Paciente)

Redesenhada em 28/03/2026. Ver detalhes em `docs/32_frequencia_redesign_28032026.md`.

### Helpers

| Função/Componente | Descrição |
|---|---|
| `formatMesNome(mes)` | `"2026-03"` → `"Março 2026"` |
| `TaxaBadge({ taxa })` | Badge colorido: 🟢 ≥85%, 🟡 70–84%, 🔴 <70% |
| `BarraPresenca({ taxa, showLabel? })` | Barra de progresso com cor dinâmica |

### Estrutura visual

1. **Card Resumo Geral** — aparece com ≥ 2 meses (totais + taxa geral)
2. **Gráfico de barras** — evolução mensal com código de cores (barras CSS, sem biblioteca)
3. **Cards mensais** — um por mês com badge, presenças, faltas, barra de progresso e alerta se taxa < 70%

### Faixas de taxa de presença

| Taxa | Badge | Cor barra | Alerta |
|------|-------|-----------|--------|
| ≥ 85% | ✓ Ótima (verde) | `bg-green-500` | — |
| 70–84% | ⚠ Regular (amarelo) | `bg-amber-400` | — |
| < 70% | ✗ Baixa (vermelho) | `bg-destructive` | ⚠ "Frequência abaixo do recomendado" |

---

## Sub-aba: Financeiro (Modo Paciente)

- Lista recebimentos do paciente ordenados por `data_vencimento DESC`
- Status visual: **Pendente** (amarelo), **Pago** (verde), **Cancelado** (vermelho)
- Admin/Financeiro: pode confirmar pagamento (dropdown com `ConfirmActionDialog`)
- Chama `PATCH /api/recebimentos/[id]` para confirmar

---

## Sub-aba: Procedimentos (Modo Paciente)

- Lista agendamentos com `status IN (concluido, confirmado, agendado)` agrupados
- Exibe profissional, procedimento, data e status

---

## Sub-aba: Evolução (Modo Paciente)

- Lista registros da tabela `evolucoes` do paciente
- Exibe data, profissional e descrição

---

## Modo Funcionário/Financeiro

Exibe:
- **Pacientes vinculados** ao profissional (tabela `pacientes_profissionais`)
- Por paciente: procedimentos com % de comissão calculada
- Recebimentos pendentes e pagos

---

## Notas para Edição Futura

- **Gráfico avançado:** Possível usar Recharts quando necessário para visualizações mais ricas
- **Filtro de período:** Hoje mostra todos os meses — futuramente filtrar por ano
- **Export:** Exportar frequência como PDF/CSV para fisioterapeuta apresentar ao plano de saúde
