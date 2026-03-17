# Supabase — Alterações em 17/03/2026

## Visão Geral

Este documento registra todas as alterações realizadas no banco de dados Supabase em 17/03/2026, incluindo criação de tabelas, adição de colunas e configuração de políticas RLS.

---

## 1. Coluna adicionada: `procedimentos.valor_padrao`

```sql
ALTER TABLE procedimentos
  ADD COLUMN IF NOT EXISTS valor_padrao NUMERIC(10,2) DEFAULT NULL;
```

**Finalidade:** Armazenar o valor padrão de cobrança de cada procedimento, utilizado para preencher automaticamente o campo Valor no modal de Novo Recebimento.

**Políticas RLS adicionadas** (a tabela só tinha SELECT):

```sql
CREATE POLICY "allow_update_procedimentos" ON procedimentos
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "allow_insert_procedimentos" ON procedimentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_delete_procedimentos" ON procedimentos
  FOR DELETE USING (true);
```

---

## 2. Tabela criada: `formas_pagamento`

```sql
CREATE TABLE formas_pagamento (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome       TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'ambos'
               CHECK (tipo IN ('recebimento', 'pagamento', 'ambos')),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_formas_pagamento" ON formas_pagamento USING (true) WITH CHECK (true);
```

**Dados iniciais inseridos:**

| nome | tipo |
|---|---|
| PIX | ambos |
| Dinheiro | ambos |
| Cartão de Crédito | recebimento |
| Cartão de Débito | recebimento |
| Transferência | ambos |
| Boleto | pagamento |
| Cheque | pagamento |

---

## 3. Tabela criada: `categorias_pagamento`

```sql
CREATE TABLE categorias_pagamento (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome       TEXT NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categorias_pagamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_categorias_pagamento" ON categorias_pagamento USING (true) WITH CHECK (true);
```

**Dados iniciais inseridos (14 categorias):**

Aluguel, Água, Energia Elétrica, Internet, Telefone, Material de Escritório, Material de Limpeza, Equipamentos, Manutenção, Salários, Impostos, Contabilidade, Marketing, Outros.

---

## 4. Tabela criada: `profissionais`

> **Atenção:** Esta tabela já existia no banco com estrutura diferente da esperada. A estrutura real é:

| coluna | tipo | descrição |
|---|---|---|
| id | text | Chave primária |
| name | text | Nome completo |
| short_name | text | Nome curto/apelido |
| color | text | Cor principal (hex) |
| bg_color | text | Cor de fundo (hex) |
| border_color | text | Cor da borda (hex) |
| text_color | text | Cor do texto (hex) |

O componente `ConfiguracoesPage` foi adaptado para usar a coluna `name` em vez de `nome`.

---

## 5. Tabela criada: `comissoes_profissional`

```sql
CREATE TABLE comissoes_profissional (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profissional_id  TEXT NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  procedimento_id  UUID NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
  percentual       NUMERIC(5,2) NOT NULL DEFAULT 0
                     CHECK (percentual >= 0 AND percentual <= 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profissional_id, procedimento_id)
);

ALTER TABLE comissoes_profissional ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_comissoes" ON comissoes_profissional USING (true) WITH CHECK (true);
```

> **Nota de compatibilidade de tipos:**
> - `profissional_id` é `TEXT` (compatível com `profissionais.id` que é `text`)
> - `procedimento_id` é `UUID` (compatível com `procedimentos.id` que é `uuid`)

---

## Resumo das tabelas do projeto

| tabela | tipo id | RLS | observação |
|---|---|---|---|
| pacientes | uuid | sim | existente |
| procedimentos | uuid | sim | coluna `valor_padrao` adicionada hoje |
| agendamentos | uuid | sim | existente |
| evolucoes | uuid | sim | existente |
| exames | uuid | sim | existente |
| frequencias | uuid | sim | existente |
| recebimentos | uuid | sim | existente |
| pagamentos | uuid | sim | existente |
| financeiro_paciente | uuid | sim | existente |
| profissionais | text | — | existente, estrutura diferente do esperado |
| formas_pagamento | text | sim | **criada hoje** |
| categorias_pagamento | text | sim | **criada hoje** |
| comissoes_profissional | text | sim | **criada hoje** |
