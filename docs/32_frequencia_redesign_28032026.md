# Redesign Visual — Aba Frequência (28/03/2026)

> **Arquivo modificado:** `src/components/HistoricoCliente.tsx`

---

## Contexto

A aba **Frequência** no Histórico do Cliente exibia apenas números simples (presenças e faltas) sem clareza visual sobre o significado clínico desses dados. Marcelo solicitou melhorias visuais para tornar a informação mais acessível — especialmente o alerta quando a frequência está baixa, e um gráfico de evolução mensal.

---

## O que Presença e Falta representam

| Valor | Origem | Descrição |
|-------|--------|-----------|
| **Presença** | Agendamento com `status = "concluido"` | Sessão realizada pelo paciente |
| **Falta** | Agendamento com `status = "faltou"` | Paciente não compareceu |

> A contagem é calculada **diretamente da tabela `agendamentos`** (não da tabela `frequencias`), garantindo sempre dados atualizados e idempotentes.

---

## Helpers adicionados (antes do componente principal)

### `formatMesNome(mes: string): string`
Converte `"2026-03"` → `"Março 2026"`.

### `TaxaBadge({ taxa })`
Badge colorido com ícone e texto de status:

| Faixa | Visual | Label |
|-------|--------|-------|
| ≥ 85% | 🟢 Verde | ✓ Ótima (XX%) |
| 70–84% | 🟡 Amarelo | ⚠ Regular (XX%) |
| < 70% | 🔴 Vermelho | ✗ Baixa (XX%) |

### `BarraPresenca({ taxa, showLabel? })`
Barra de progresso horizontal (`h-2.5`, `rounded-full`) com cor dinâmica:
- Verde: ≥ 85%
- Amarelo: 70–84%
- Vermelho (destructive): < 70%

---

## Estrutura da Aba Frequência (nova)

### 1. Card de Resumo Geral
Aparece apenas quando há **2 ou mais meses** de dados.

```
┌─────────────────────────────────────────┐
│ Resumo Geral          [Badge taxa geral] │
├─────────────┬─────────────┬─────────────┤
│ Presenças   │   Faltas    │    Total    │
│     15      │     3       │     18      │
├─────────────┴─────────────┴─────────────┤
│ Taxa de Presença                   83%  │
│ ████████████████░░░░░░░░░░░░░░░░░░░    │
└─────────────────────────────────────────┘
```

### 2. Gráfico de Evolução Mensal
Aparece apenas quando há **2 ou mais meses** de dados.

- Barras verticais CSS puras (sem biblioteca externa)
- Altura proporcional à taxa de presença (mínimo 8%)
- Cores: verde / amarelo / vermelho conforme faixa
- Meses em ordem cronológica (mais antigo à esquerda)
- Legenda com as 3 faixas de cor

### 3. Cards Mensais Individuais
Um card por mês, do mais recente ao mais antigo.

```
┌─────────────────────────────────────────┐
│ Março 2026                [✓ Ótima 90%] │
├────────────────────┬────────────────────┤
│ ✓ Presenças        │ ✗ Faltas           │
│       9            │       1            │
│  (fundo verde/acc) │  (fundo vermelho)  │
├────────────────────┴────────────────────┤
│ Taxa de Presença                   90%  │
│ █████████████████████░░░░░░░░░░░░░░    │
└─────────────────────────────────────────┘
```

**Regras visuais:**
- Faltas ficam em vermelho **somente quando `faltas > 0`** (zero = neutro)
- Quando `taxa < 70%`: exibe alerta `⚠ Frequência abaixo do recomendado. Conversar com o paciente.`

---

## Estado vazio melhorado

Quando não há nenhum registro:
```
Nenhum registro de frequência ainda
Aparece aqui após sessões concluídas ou faltas registradas
```

---

## Faixas de referência clínica

| Taxa | Status | Ação sugerida |
|------|--------|---------------|
| ≥ 85% | Ótima | Nenhuma |
| 70–84% | Regular | Monitorar |
| < 70% | Baixa | Conversar com o paciente |
