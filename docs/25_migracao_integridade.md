# 25 — Migração de Integridade do Banco de Dados

**Data:** 17/03/2026  
**Status:** Script DDL gerado — aguarda execução manual no SQL Editor do Supabase

---

## Contexto

Foram identificadas 6 melhorias de integridade referencial no banco de dados que previnem erros comuns de digitação, duplicatas e inconsistências nos relatórios financeiros.

---

## Melhorias Implementadas

### 1. Check de Valor Positivo

**Problema:** Recebimentos e pagamentos podiam ser registrados com valor zero ou negativo.  
**Solução:** Constraints `CHECK (valor > 0)` adicionadas em `recebimentos` e `pagamentos`.

```sql
ALTER TABLE public.recebimentos ADD CONSTRAINT chk_recebimentos_valor_positivo CHECK (valor > 0);
ALTER TABLE public.pagamentos   ADD CONSTRAINT chk_pagamentos_valor_positivo   CHECK (valor > 0);
```

---

### 2. Padronização de IDs para UUID Nativo

**Problema:** `formas_pagamento.id` e `categorias_pagamento.id` eram `TEXT` com UUID gerado como string, consumindo mais espaço e sendo mais lentos para indexação.  
**Solução:** Alterar tipo de `TEXT` para `UUID` nativo.

```sql
ALTER TABLE public.formas_pagamento     ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE public.categorias_pagamento ALTER COLUMN id TYPE UUID USING id::uuid;
```

---

### 3. UNIQUE no CPF

**Problema:** O mesmo paciente podia ser cadastrado duas vezes, duplicando o histórico clínico.  
**Solução:** Partial index UNIQUE no CPF (ignora NULL e string vazia).

```sql
CREATE UNIQUE INDEX uq_pacientes_cpf
  ON public.pacientes (cpf)
  WHERE cpf IS NOT NULL AND cpf <> '';
```

---

### 4. FK forma_pagamento_id em recebimentos e pagamentos

**Problema:** `forma_pagamento` era TEXT livre — "Pix" e "PIX" seriam tratados como formas distintas nos relatórios.  
**Solução:** Adicionar coluna `forma_pagamento_id UUID REFERENCES formas_pagamento(id)` e migrar dados existentes.

| Tabela | Nova coluna | Referência |
|---|---|---|
| `recebimentos` | `forma_pagamento_id` | `formas_pagamento(id)` |
| `pagamentos` | `forma_pagamento_id` | `formas_pagamento(id)` |

A coluna `forma_pagamento TEXT` foi mantida para compatibilidade retroativa.

---

### 5. FK categoria_id em pagamentos

**Problema:** `categoria` era TEXT livre — "Energia Elétrica" e "energia elétrica" seriam categorias distintas no gráfico de gastos.  
**Solução:** Adicionar coluna `categoria_id UUID REFERENCES categorias_pagamento(id)`.

---

### 6. FK explícita profissional_responsavel em pacientes

**Problema:** `profissional_responsavel` era TEXT sem FK — qualquer slug inválido era aceito silenciosamente.  
**Solução:** Adicionar `FOREIGN KEY (profissional_responsavel) REFERENCES profissionais(id) ON DELETE SET NULL`.

**Pré-requisito aplicado:** Strings vazias `""` foram convertidas para `NULL` via script Python antes da FK ser adicionada.

---

## Arquivos Gerados

| Arquivo | Descrição |
|---|---|
| `docs/sql_migracao_integridade.sql` | Script DDL idempotente com todas as 6 melhorias |
| `docs/sql_completo_atual.sql` | SQL completo atualizado com as melhorias incorporadas |

---

## Como Aplicar no Supabase

1. Acesse o **SQL Editor** do Supabase (projeto `uxastllbpbthqvicfkfo`)
2. Cole o conteúdo de `docs/sql_migracao_integridade.sql`
3. Execute e verifique o resultado da query de verificação final

---

## Estado Atual dos Dados (pré-migração DDL)

| Ação | Status |
|---|---|
| `profissional_responsavel` vazio → NULL | **Aplicado** (2 registros: Thais Almeida, Carmem Alves) |
| CHECK valor positivo | Aguarda DDL |
| UUID nativo em formas/categorias | Aguarda DDL |
| UNIQUE CPF | Aguarda DDL |
| FK forma_pagamento_id | Aguarda DDL |
| FK categoria_id | Aguarda DDL |
| FK profissional_responsavel | Aguarda DDL |
