-- ============================================================
-- SQL: Tabelas de Configurações do Sistema Fisio
-- Execute este script no Supabase SQL Editor
-- Projeto: uxastllbpbthqvicfkfo
-- ============================================================

-- ─── 1. Adicionar coluna valor_padrao na tabela procedimentos ─────────────────
-- (caso ainda não exista)
ALTER TABLE procedimentos
  ADD COLUMN IF NOT EXISTS valor_padrao NUMERIC(10,2) DEFAULT NULL;

-- ─── 2. Formas de Pagamento ───────────────────────────────────────────────────
-- Compartilhada entre Recebimentos e Pagamentos/Despesas
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'ambos'
               CHECK (tipo IN ('recebimento', 'pagamento', 'ambos')),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública formas_pagamento" ON formas_pagamento;
CREATE POLICY "Leitura pública formas_pagamento"
  ON formas_pagamento FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Inserção autenticada formas_pagamento" ON formas_pagamento;
CREATE POLICY "Inserção autenticada formas_pagamento"
  ON formas_pagamento FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Atualização autenticada formas_pagamento" ON formas_pagamento;
CREATE POLICY "Atualização autenticada formas_pagamento"
  ON formas_pagamento FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Exclusão autenticada formas_pagamento" ON formas_pagamento;
CREATE POLICY "Exclusão autenticada formas_pagamento"
  ON formas_pagamento FOR DELETE USING (TRUE);

-- Dados iniciais
INSERT INTO formas_pagamento (nome, tipo) VALUES
  ('PIX',              'ambos'),
  ('Dinheiro',         'ambos'),
  ('Cartão de Crédito','recebimento'),
  ('Cartão de Débito', 'recebimento'),
  ('Transferência',    'ambos'),
  ('Boleto',           'pagamento'),
  ('Cheque',           'pagamento')
ON CONFLICT DO NOTHING;

-- ─── 3. Categorias de Pagamento ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias_pagamento (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE categorias_pagamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública categorias_pagamento" ON categorias_pagamento;
CREATE POLICY "Leitura pública categorias_pagamento"
  ON categorias_pagamento FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Inserção autenticada categorias_pagamento" ON categorias_pagamento;
CREATE POLICY "Inserção autenticada categorias_pagamento"
  ON categorias_pagamento FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Atualização autenticada categorias_pagamento" ON categorias_pagamento;
CREATE POLICY "Atualização autenticada categorias_pagamento"
  ON categorias_pagamento FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Exclusão autenticada categorias_pagamento" ON categorias_pagamento;
CREATE POLICY "Exclusão autenticada categorias_pagamento"
  ON categorias_pagamento FOR DELETE USING (TRUE);

-- Dados iniciais
INSERT INTO categorias_pagamento (nome) VALUES
  ('Aluguel'),
  ('Água'),
  ('Energia Elétrica'),
  ('Internet'),
  ('Telefone'),
  ('Material de Escritório'),
  ('Material de Limpeza'),
  ('Equipamentos'),
  ('Manutenção'),
  ('Salários'),
  ('Impostos'),
  ('Contabilidade'),
  ('Marketing'),
  ('Outros')
ON CONFLICT DO NOTHING;

-- ─── 4. Profissionais ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profissionais (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública profissionais" ON profissionais;
CREATE POLICY "Leitura pública profissionais"
  ON profissionais FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Inserção autenticada profissionais" ON profissionais;
CREATE POLICY "Inserção autenticada profissionais"
  ON profissionais FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Atualização autenticada profissionais" ON profissionais;
CREATE POLICY "Atualização autenticada profissionais"
  ON profissionais FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Exclusão autenticada profissionais" ON profissionais;
CREATE POLICY "Exclusão autenticada profissionais"
  ON profissionais FOR DELETE USING (TRUE);

-- ─── 5. Comissões por Profissional e Procedimento ─────────────────────────────
CREATE TABLE IF NOT EXISTS comissoes_profissional (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id  UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  procedimento_id  UUID NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
  percentual       NUMERIC(5,2) NOT NULL DEFAULT 0
                     CHECK (percentual >= 0 AND percentual <= 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profissional_id, procedimento_id)
);

-- RLS
ALTER TABLE comissoes_profissional ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública comissoes_profissional" ON comissoes_profissional;
CREATE POLICY "Leitura pública comissoes_profissional"
  ON comissoes_profissional FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Inserção autenticada comissoes_profissional" ON comissoes_profissional;
CREATE POLICY "Inserção autenticada comissoes_profissional"
  ON comissoes_profissional FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Atualização autenticada comissoes_profissional" ON comissoes_profissional;
CREATE POLICY "Atualização autenticada comissoes_profissional"
  ON comissoes_profissional FOR UPDATE USING (TRUE);
DROP POLICY IF EXISTS "Exclusão autenticada comissoes_profissional" ON comissoes_profissional;
CREATE POLICY "Exclusão autenticada comissoes_profissional"
  ON comissoes_profissional FOR DELETE USING (TRUE);

-- ─── Verificação ──────────────────────────────────────────────────────────────
SELECT 'formas_pagamento'      AS tabela, COUNT(*) AS registros FROM formas_pagamento
UNION ALL
SELECT 'categorias_pagamento'  AS tabela, COUNT(*) AS registros FROM categorias_pagamento
UNION ALL
SELECT 'profissionais'         AS tabela, COUNT(*) AS registros FROM profissionais
UNION ALL
SELECT 'comissoes_profissional' AS tabela, COUNT(*) AS registros FROM comissoes_profissional;
