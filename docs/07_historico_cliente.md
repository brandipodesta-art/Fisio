# HistoricoCliente.tsx — Histórico Completo do Cliente

> **Arquivo:** `src/components/HistoricoCliente.tsx` · **Dados:** Supabase (tempo real)

---

## Propósito

Aba de histórico do cliente com sub-abas internas. Opera em **dois modos**:

| Modo | Tipo de usuário | Sub-abas |
|------|----------------|----------|
| **Paciente** | `tipo_usuario = "paciente"` | Frequência · Financeiro · Evolução |
| **Funcionário/Financeiro** | `tipo_usuario = "funcionario" \| "financeiro"` | Procedimentos · Financeiro |

> **Nota:** A aba "Procedimentos" foi removida do modo Paciente em 28/03/2026 — as informações estão cobertas por Frequência (sessões + procedimento) e Financeiro (valores).

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

### `FrequenciaSession`

| Campo | Tipo | Descrição |
|---|---|---|
| `date` | `string` | Data YYYY-MM-DD da sessão |
| `status` | `"concluido" \| "faltou" \| "cancelado"` | Status do agendamento |
| `procedimentoNome` | `string \| null` | Nome do procedimento (via join) |

### `Frequencia`

| Campo | Tipo | Descrição |
|---|---|---|
| `mes` | `string` | Mês no formato `YYYY-MM` (ex: `"2026-03"`) |
| `presencas` | `number` | Quantidade de agendamentos `concluido` |
| `faltas` | `number` | Quantidade de agendamentos `faltou` |
| `sessoes` | `FrequenciaSession[]` | Lista detalhada de cada sessão do mês (inclui cancelados) |

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
| `status` | `string` | `pendente \| pago \| cancelado \| atrasado \| recebido` |

### `Evolucao`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID |
| `data` | `string` | Data (mapeada de `data_salva`) |
| `descricao` | `string` | Texto (mapeado de `texto`) |

---

## Fonte dos dados — Modo Paciente

```typescript
const [recebimentos, agendamentosFreq, evols] = await Promise.all([
  get(`recebimentos?paciente_id=eq.${pacienteId}&order=data_vencimento.desc&select=...`),
  // Join com procedimentos para exibir o nome do procedimento em cada sessão
  get(`agendamentos?paciente_id=eq.${pacienteId}&status=in.(concluido,faltou,cancelado)&select=date,status,procedimentos(nome)&order=date.desc`),
  get(`evolucoes?paciente_id=eq.${pacienteId}&order=created_at.desc&select=*`),
]);
```

### Agrupamento de Frequência (client-side)

```typescript
const byMonth: Record<string, { presencas: number; faltas: number; sessoes: FrequenciaSession[] }> = {};
for (const apt of agendamentosFreq) {
  const mes = apt.date.substring(0, 7); // "2026-03"
  if (!byMonth[mes]) byMonth[mes] = { presencas: 0, faltas: 0, sessoes: [] };
  if (apt.status === "concluido") byMonth[mes].presencas++;
  else if (apt.status === "faltou") byMonth[mes].faltas++;
  // cancelado: aparece na lista mas NÃO conta em presencas nem faltas
  byMonth[mes].sessoes.push({
    date: apt.date,
    status: apt.status,
    procedimentoNome: apt.procedimentos?.nome ?? null,
  });
}
```

> **Importante:** A tabela `frequencias` **não é usada para exibição** — apenas `agendamentos` é fonte de verdade. Elimina problema de dados desatualizados por manipulações diretas.

---

## Sub-aba: Frequência (Modo Paciente)

Ver detalhes completos em `docs/32_frequencia_redesign_28032026.md`.

### Helpers

| Função/Componente | Descrição |
|---|---|
| `formatMesNome(mes)` | `"2026-03"` → `"Março 2026"` |
| `TaxaBadge({ taxa })` | Badge colorido: 🟢 ≥85% Ótima · 🟡 70–84% Regular · 🔴 <70% Baixa |
| `BarraPresenca({ taxa, showLabel? })` | Barra de progresso com cor dinâmica |

### Estrutura visual

1. **Card Resumo Geral** — aparece com ≥ 2 meses (totais + taxa geral + barra)
2. **Gráfico de barras** — evolução mensal com código de cores (CSS puro, sem biblioteca)
3. **Cards mensais** — por mês com badge, presenças, faltas, barra de progresso
4. **Lista de sessões individuais** — dentro de cada card: data DD/MM + nome do procedimento + ícone de status:
   - `✓` verde = concluído
   - `✗` vermelho = faltou
   - `–` cinza + label "Cancelado" = cancelado (não conta em presenças nem faltas)

### Faixas de taxa de presença

| Taxa | Badge | Cor barra | Comportamento extra |
|------|-------|-----------|---------------------|
| ≥ 85% | ✓ Ótima (verde) | `bg-green-500` | — |
| 70–84% | ⚠ Regular (amarelo) | `bg-amber-400` | — |
| < 70% | ✗ Baixa (vermelho) | `bg-destructive` | Alerta: "Frequência abaixo do recomendado" |

---

## Sub-aba: Financeiro (Modo Paciente)

- Lista recebimentos do paciente ordenados por `data_vencimento DESC`
- Status visual: **Pendente** (amarelo), **Pago** (verde), **Cancelado** (cinza)
- Admin/Financeiro: pode confirmar pagamento via dropdown → `ConfirmActionDialog`
- Confirmar chama `PATCH` direto na REST API do Supabase (status → `recebido`, `data_pagamento`, `confirmado_por`)

---

## Sub-aba: Evolução (Modo Paciente)

- Lista registros da tabela `evolucoes` do paciente
- Ordenado por `created_at DESC`
- Mapeamento: `data_salva` → `data`, `texto` → `descricao`

---

## Modo Funcionário/Financeiro

### Sub-aba: Procedimentos
- Agrupa recebimentos por procedimento (via `extrairProcedimentoBase()`)
- Mostra: total de sessões, pagas, pendentes, canceladas, valor total
- Calcula comissão: `valorPago × comissaoPercentual / 100`
- Exibe totais de comissão por procedimento e geral

### Sub-aba: Financeiro
- Mesma estrutura do modo paciente, mas filtra por pacientes vinculados ao profissional

---

## Notas para Edição Futura

- **Gráfico avançado:** Possível usar Recharts quando necessário para visualizações mais ricas
- **Filtro de período:** Hoje mostra todos os meses — futuramente filtrar por ano
- **Export:** Exportar frequência como PDF/CSV para fisioterapeuta apresentar ao plano de saúde
