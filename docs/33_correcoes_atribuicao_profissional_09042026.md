# 🔧 Correções — Atribuição de Histórico/Financeiro por Profissional

> **Data:** 09/04/2026 · **Impacto:** Crítico — corrige cruzamento de dados entre profissionais

---

## Problema Identificado

O sistema agrupava **todo o histórico e financeiro** de um paciente baseando-se no campo global
`profissional_responsavel` do cadastro do paciente.

### Consequência prática

1. Paciente criado com Profissional A como responsável.
2. Agenda: sessão de Pilates com Profissional A + outra modalidade com Profissional B.
3. **Resultado errado:** Toda a receita ia para o Profissional A (responsável do cadastro).
4. **Profissional B** aparecia com histórico e comissão **zerados**, mesmo tendo realizado atendimentos.

---

## Solução Implementada

**Migração da fonte de verdade:** de `pacientes.profissional_responsavel` → `recebimentos.profissional_id`

Cada recebimento gerado pelo agendamento agora carrega diretamente o ID do profissional que
realizou aquele atendimento específico.

---

## Alterações no Banco (Supabase)

```sql
ALTER TABLE recebimentos ADD COLUMN IF NOT EXISTS profissional_id TEXT;
```

> **Executar no SQL Editor do Supabase antes de usar o sistema.**

---

## Arquivos Alterados

### 1. `src/components/AgendaPage.tsx`

**Função:** `runStatusSideEffects` — geração de recebimentos ao mudar status do agendamento.

**Antes:** inserts de recebimentos **sem** `profissional_id`.

**Depois:** todos os inserts (confirmado, concluído, faltou) agora incluem:

```typescript
profissional_id: appointment.professionalId ?? null,
```

Cobre os três fluxos:
- Status → **confirmado** (gera recebimento pendente)
- Status → **concluído** (gera recebimento final)
- Status → **faltou** (gera taxa de falta)

---

### 2. `src/components/HistoricoCliente.tsx`

**Modo Funcionário — busca de recebimentos.**

**Antes (incorreto):**
```typescript
// Buscava pacientes vinculados ao profissional via profissional_responsavel
// e depois carregava todos os recebimentos desses pacientes
const pacs = await get(`pacientes?profissional_responsavel=eq.${slugProfissional}`);
const ids = pacs.map(p => p.id).join(",");
const recs = await get(`recebimentos?paciente_id=in.(${ids})`);
```

**Depois (correto):**
```typescript
// Busca diretamente pelo profissional_id no recebimento
const recs = await get(
  `recebimentos?profissional_id=eq.${profissionalId}&order=data_vencimento.desc`
);
```

---

### 3. `src/components/RelatoriosPage.tsx`

**Interface `Recebimento`:** adicionado campo `profissional_id: string | null`.

**Função `groupByProfissional`:**

**Antes:** recebia `(recebimentos, pacientes)` e buscava o profissional via `paciente.profissional_responsavel`.

**Depois:** usa diretamente `recebimento.profissional_id` — sem necessidade de `pacientes` como segundo parâmetro.

```typescript
// Antes
function groupByProfissional(recs: Recebimento[], pacientes: Paciente[])

// Depois
function groupByProfissional(recs: Recebimento[])
```

Todas as chamadas da função foram atualizadas (5 ocorrências).

**Query de funcionários:** agora filtra diretamente por `profissional_id`:
```typescript
`recebimentos?profissional_id=eq.${funcionarioId}&data_vencimento=gte.${dataInicial}&data_vencimento=lte.${dataFinal}`
```

---

### 4. `src/components/CadastroForm.tsx`

**Removido o campo "Profissional Responsável"** do formulário de cadastro de pacientes.

- Estado `profissionalResponsavel` removido
- Select de seleção de profissional removido da UI
- Campo excluído dos payloads de `INSERT` e `PUT`

> **Decisão de design:** a responsabilidade agora é **exclusiva do agendamento**. O paciente não tem mais um "dono" fixo — ele pode ser atendido por qualquer profissional, e cada atendimento gera um recebimento vinculado ao profissional correto.

---

## Novo Componente: `DateRangePicker`

> **Arquivo:** `src/components/ui/DateRangePicker.tsx`

Componente de seleção de intervalo de datas com calendário visual. Substituiu os pares de
`<input type="date">` em todos os filtros de data do sistema.

### Funcionalidades

| Feature | Descrição |
|---|---|
| **Atalhos rápidos** | Hoje, Esta semana, Semana passada, Este mês, Mês passado |
| **Seletor de mês** | Grade mensal para selecionar um mês inteiro |
| **Período customizado** | Clique em dois dias para definir o intervalo |
| **Confirmação explícita** | Filtro só é aplicado ao clicar em "Filtrar" |
| **Limpeza rápida** | Botão `×` no trigger para limpar o filtro |
| **Range highlight** | Dias dentro do intervalo ficam destacados no calendário |

### Props

```typescript
interface DateRangePickerProps {
  label?: string;
  value: DateRange;           // { from: string; to: string } — YYYY-MM-DD
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}
```

### Aplicado em

| Componente | Filtros substituídos |
|---|---|
| `FinanceiroRecebimentos.tsx` | Vencimento + Data Pagamento |
| `FinanceiroPagamentos.tsx` | Vencimento + Data do Pagamento |
| `RelatoriosPage.tsx` | Data Inicial + Data Final (unificados em 1 picker) |

---

## Limpeza de Dados (Supabase)

Durante os testes, dados inconsistentes ficaram na tabela `recebimentos`.
Para resetar o financeiro mantendo somente profissionais e cadastros:

```sql
DELETE FROM recebimentos;
```

> **Executado em 09/04/2026** — tabela zerada para início do uso em produção.

---

## Fluxo Correto Pós-Correção

```
Agenda → Agendar sessão (profissional X)
       → Concluir/Confirmar/Falta
       → INSERT recebimentos { profissional_id: X, ... }

Histórico do Profissional → SELECT recebimentos WHERE profissional_id = X
Relatórios de Funcionários → SELECT recebimentos WHERE profissional_id = X
```

Cada profissional **vê apenas o que realizou**, independente de qual profissional está
vinculado no cadastro do paciente.

---

## Verificação (TypeScript)

```bash
npx tsc --noEmit
# Resultado: zero erros
```
