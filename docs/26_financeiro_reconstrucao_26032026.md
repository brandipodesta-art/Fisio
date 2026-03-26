# Reconstrução do Módulo Financeiro — 26/03/2026

## Contexto

Após perda acidental das alterações anteriores, o módulo financeiro foi reconstruído
integralmente com base nos documentos de referência e no estado atual do banco de dados.

---

## Alterações no Banco de Dados

### Nova coluna: `recebimentos.procedimento_id`

```sql
ALTER TABLE public.recebimentos
  ADD COLUMN IF NOT EXISTS procedimento_id UUID
  REFERENCES public.procedimentos(id) ON DELETE SET NULL;
```

Esta coluna vincula cada recebimento ao procedimento realizado (UUID FK), permitindo
calcular comissões de profissionais com base na tabela `comissoes_profissional`.

---

## Arquivos Modificados

### `src/lib/types/financeiro.ts`
- Interface `Recebimento` já contém `procedimento_id: string | null`
- Interface `RecebimentoInput` herda o campo via `Omit<Recebimento, "id" | "created_at">`
- Interface `ComissaoProfissional` documenta a estrutura de comissões

### `src/components/FinanceiroRecebimentos.tsx`
- Hook `useProcedimentos` agora retorna também o `id` (UUID) de cada procedimento
- Select de procedimento usa `value={form.procedimento_id}` (UUID) em vez do nome TEXT
- Ao selecionar procedimento: grava `procedimento_id` (UUID) + `descricao` (nome TEXT)
- Parcelas recorrentes propagam o `procedimento_id` para todas as parcelas geradas

### `src/components/HistoricoCliente.tsx` — Reescrito completamente

Dois modos de operação:

#### Modo Paciente (`tipo_usuario = "paciente"`)
- Aba Procedimentos: agrupa recebimentos por procedimento base, exibe totais e status
- Aba Frequência: exibe presenças/faltas por mês
- Aba Financeiro: resumo + seção de pendentes em destaque + histórico completo
- Aba Evolução: registros de evolução clínica

#### Modo Funcionário (`tipo_usuario = "funcionario"` ou `"financeiro"`)
- Busca todos os pacientes onde `profissional_responsavel = slug_do_profissional`
- Exibe lista de pacientes vinculados no header
- Aba Procedimentos:
  - Agrupa recebimentos de TODOS os pacientes vinculados por procedimento
  - Exibe badge de porcentagem de comissão (de `comissoes_profissional`)
  - Calcula valor de comissão = valor_pago × percentual / 100
  - Resumo com total de comissão acumulada
- Aba Financeiro:
  - Seção "Pendentes de Pagamento" em destaque amarelo
  - Exibe nome do paciente em cada lançamento
  - Resumo com: Total Recebido | Pendente | Total Geral | Comissão Total

### `src/components/CadastroLayout.tsx`
- Passa `tipoUsuario` e `nomeCompleto` ao `HistoricoCliente`

---

## Fluxo de Comissões

```
comissoes_profissional
  profissional_id (TEXT slug) ──→ pacientes.profissional_responsavel
  procedimento_id (UUID)      ──→ procedimentos.id
  percentual (numeric)

recebimentos
  procedimento_id (UUID FK)   ──→ procedimentos.id
  paciente_id (UUID FK)       ──→ pacientes.id
  status                      = "recebido" → conta para comissão

Comissão = SUM(recebimentos.valor WHERE status='recebido' AND procedimento_id = X)
           × comissoes_profissional.percentual / 100
```

---

## Tabelas Envolvidas

| Tabela | Papel |
|---|---|
| `pacientes` | Cadastro de todos os usuários; `profissional_responsavel` vincula ao slug |
| `profissionais` | Cadastro de profissionais (slug, nome) |
| `procedimentos` | Tipos de procedimento com `valor_padrao` |
| `comissoes_profissional` | Percentual de comissão por profissional × procedimento |
| `recebimentos` | Lançamentos financeiros; `procedimento_id` vincula ao procedimento |
| `formas_pagamento` | Lookup de formas de pagamento (UUID FK) |
