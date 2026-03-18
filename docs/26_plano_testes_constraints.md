# Plano de Testes — Constraints e Integridade Referencial
**Projeto:** Fisio Clínica  
**Data:** 17/03/2026  
**Referência:** Migração `docs/25_migracao_integridade.md`

---

## Objetivo

Validar que todas as 6 melhorias de integridade aplicadas ao banco Supabase estão funcionando corretamente, rejeitando dados inválidos e aceitando dados válidos conforme esperado.

---

## Escopo

| ID | Constraint | Tabela(s) | Tipo |
|---|---|---|---|
| C1 | `chk_recebimentos_valor_positivo` | `recebimentos` | CHECK |
| C2 | `chk_pagamentos_valor_positivo` | `pagamentos` | CHECK |
| C3 | `uq_pacientes_cpf` | `pacientes` | UNIQUE INDEX |
| C4 | `recebimentos_forma_pagamento_id_fkey` | `recebimentos` | FOREIGN KEY |
| C5 | `pagamentos_forma_pagamento_id_fkey` | `pagamentos` | FOREIGN KEY |
| C6 | `pagamentos_categoria_id_fkey` | `pagamentos` | FOREIGN KEY |
| C7 | `fk_pacientes_profissional` | `pacientes` | FOREIGN KEY |
| C8 | UUID nativo em `formas_pagamento.id` | `formas_pagamento` | TIPO |
| C9 | UUID nativo em `categorias_pagamento.id` | `categorias_pagamento` | TIPO |

---

## Casos de Teste

### TC-01 — CHECK: Valor zero em recebimento deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C1 — `chk_recebimentos_valor_positivo` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `recebimentos` com `valor = 0` |
| **Resultado esperado** | Erro: `new row violates check constraint` |

---

### TC-02 — CHECK: Valor negativo em recebimento deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C1 — `chk_recebimentos_valor_positivo` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `recebimentos` com `valor = -50` |
| **Resultado esperado** | Erro: `new row violates check constraint` |

---

### TC-03 — CHECK: Valor positivo em recebimento deve ser aceito

| Campo | Valor |
|---|---|
| **Constraint** | C1 — `chk_recebimentos_valor_positivo` |
| **Tipo** | Positivo (deve passar) |
| **Ação** | INSERT em `recebimentos` com `valor = 100` (depois DELETE) |
| **Resultado esperado** | INSERT bem-sucedido (HTTP 201) |

---

### TC-04 — CHECK: Valor zero em pagamento deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C2 — `chk_pagamentos_valor_positivo` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `pagamentos` com `valor = 0` |
| **Resultado esperado** | Erro: `new row violates check constraint` |

---

### TC-05 — CHECK: Valor negativo em pagamento deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C2 — `chk_pagamentos_valor_positivo` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `pagamentos` com `valor = -1` |
| **Resultado esperado** | Erro: `new row violates check constraint` |

---

### TC-06 — UNIQUE: CPF duplicado deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C3 — `uq_pacientes_cpf` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `pacientes` com CPF já existente no banco |
| **Resultado esperado** | Erro: `duplicate key value violates unique constraint` |

---

### TC-07 — UNIQUE: CPF NULL deve ser aceito (múltiplos NULLs permitidos)

| Campo | Valor |
|---|---|
| **Constraint** | C3 — `uq_pacientes_cpf` (partial index: WHERE cpf IS NOT NULL) |
| **Tipo** | Positivo (deve passar) |
| **Ação** | INSERT em `pacientes` com `cpf = NULL` (depois DELETE) |
| **Resultado esperado** | INSERT bem-sucedido |

---

### TC-08 — FK: forma_pagamento_id inválido em recebimento deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C4 — `recebimentos_forma_pagamento_id_fkey` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `recebimentos` com `forma_pagamento_id = UUID inexistente` |
| **Resultado esperado** | Erro: `insert or update violates foreign key constraint` |

---

### TC-09 — FK: forma_pagamento_id NULL em recebimento deve ser aceito

| Campo | Valor |
|---|---|
| **Constraint** | C4 — `recebimentos_forma_pagamento_id_fkey` (ON DELETE SET NULL) |
| **Tipo** | Positivo (deve passar) |
| **Ação** | INSERT em `recebimentos` com `forma_pagamento_id = NULL` (depois DELETE) |
| **Resultado esperado** | INSERT bem-sucedido |

---

### TC-10 — FK: forma_pagamento_id inválido em pagamento deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C5 — `pagamentos_forma_pagamento_id_fkey` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `pagamentos` com `forma_pagamento_id = UUID inexistente` |
| **Resultado esperado** | Erro: `insert or update violates foreign key constraint` |

---

### TC-11 — FK: categoria_id inválido em pagamento deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C6 — `pagamentos_categoria_id_fkey` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `pagamentos` com `categoria_id = UUID inexistente` |
| **Resultado esperado** | Erro: `insert or update violates foreign key constraint` |

---

### TC-12 — FK: profissional_responsavel inválido em paciente deve ser rejeitado

| Campo | Valor |
|---|---|
| **Constraint** | C7 — `fk_pacientes_profissional` |
| **Tipo** | Negativo (deve falhar) |
| **Ação** | INSERT em `pacientes` com `profissional_responsavel = 'slug-inexistente'` |
| **Resultado esperado** | Erro: `insert or update violates foreign key constraint` |

---

### TC-13 — FK: profissional_responsavel NULL em paciente deve ser aceito

| Campo | Valor |
|---|---|
| **Constraint** | C7 — `fk_pacientes_profissional` (ON DELETE SET NULL) |
| **Tipo** | Positivo (deve passar) |
| **Ação** | INSERT em `pacientes` com `profissional_responsavel = NULL` (depois DELETE) |
| **Resultado esperado** | INSERT bem-sucedido |

---

### TC-14 — TIPO: formas_pagamento.id deve ser UUID nativo

| Campo | Valor |
|---|---|
| **Constraint** | C8 — UUID nativo |
| **Tipo** | Verificação estrutural |
| **Ação** | SELECT `data_type` em `information_schema.columns` |
| **Resultado esperado** | `data_type = 'uuid'` |

---

### TC-15 — TIPO: categorias_pagamento.id deve ser UUID nativo

| Campo | Valor |
|---|---|
| **Constraint** | C9 — UUID nativo |
| **Tipo** | Verificação estrutural |
| **Ação** | SELECT `data_type` em `information_schema.columns` |
| **Resultado esperado** | `data_type = 'uuid'` |

---

### TC-16 — Migração: dados existentes com forma_pagamento_id populado

| Campo | Valor |
|---|---|
| **Tipo** | Verificação de dados |
| **Ação** | SELECT COUNT em `recebimentos` WHERE `forma_pagamento_id IS NOT NULL` |
| **Resultado esperado** | Contagem igual ao total de recebimentos com `forma_pagamento` preenchido |

---

### TC-17 — Migração: dados existentes com categoria_id populado em pagamentos

| Campo | Valor |
|---|---|
| **Tipo** | Verificação de dados |
| **Ação** | SELECT COUNT em `pagamentos` WHERE `categoria_id IS NOT NULL` |
| **Resultado esperado** | Contagem igual ao total de pagamentos com `categoria` preenchida |

---

## Critérios de Aprovação

O plano de testes é considerado **aprovado** quando:

- Todos os testes **negativos** (TC-01, 02, 04, 05, 06, 08, 10, 11, 12) retornam erro HTTP 4xx com mensagem de constraint violation
- Todos os testes **positivos** (TC-03, 07, 09, 13) retornam HTTP 201 com sucesso
- Todos os testes **estruturais** (TC-14, 15) confirmam o tipo UUID nativo
- Todos os testes de **migração** (TC-16, 17) confirmam que os dados existentes foram migrados corretamente

---

## Execução Automatizada

Execute o script de testes:

```bash
export SUPABASE_ACCESS_TOKEN=seu_token_aqui
python3 scripts/testar_constraints.py
```

O script executa todos os 17 casos de teste e exibe um relatório final com ✅ / ❌ para cada caso.
