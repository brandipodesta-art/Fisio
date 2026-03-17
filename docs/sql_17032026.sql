-- ============================================================
-- SQL de Alterações em 17/03/2026
-- Projeto: Fisio — Sistema de Gestão de Clínica de Fisioterapia
-- ============================================================

-- ─── 1. Adicionar valor_padrao na tabela procedimentos ────────────────────────
ALTER TABLE procedimentos
  ADD COLUMN IF NOT EXISTS valor_padrao NUMERIC(10,2) DEFAULT NULL;

-- Políticas RLS para permitir INSERT, UPDATE e DELETE em procedimentos
-- (antes só havia SELECT)
CREATE POLICY IF NOT EXISTS "allow_update_procedimentos" ON procedimentos
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "allow_insert_procedimentos" ON procedimentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "allow_delete_procedimentos" ON procedimentos
  FOR DELETE USING (true);

-- ─── 2. Tabela: formas_pagamento ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome       TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'ambos'
               CHECK (tipo IN ('recebimento', 'pagamento', 'ambos')),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'formas_pagamento' AND policyname = 'allow_all_formas_pagamento'
  ) THEN
    CREATE POLICY "allow_all_formas_pagamento" ON formas_pagamento USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO formas_pagamento (nome, tipo)
SELECT nome, tipo FROM (VALUES
  ('PIX',               'ambos'),
  ('Dinheiro',          'ambos'),
  ('Cartão de Crédito', 'recebimento'),
  ('Cartão de Débito',  'recebimento'),
  ('Transferência',     'ambos'),
  ('Boleto',            'pagamento'),
  ('Cheque',            'pagamento')
) AS v(nome, tipo)
WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE formas_pagamento.nome = v.nome);

-- ─── 3. Tabela: categorias_pagamento ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias_pagamento (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome       TEXT NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categorias_pagamento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categorias_pagamento' AND policyname = 'allow_all_categorias_pagamento'
  ) THEN
    CREATE POLICY "allow_all_categorias_pagamento" ON categorias_pagamento USING (true) WITH CHECK (true);
  END IF;
END $$;

INSERT INTO categorias_pagamento (nome)
SELECT nome FROM (VALUES
  ('Aluguel'), ('Água'), ('Energia Elétrica'), ('Internet'), ('Telefone'),
  ('Material de Escritório'), ('Material de Limpeza'), ('Equipamentos'),
  ('Manutenção'), ('Salários'), ('Impostos'), ('Contabilidade'),
  ('Marketing'), ('Outros')
) AS v(nome)
WHERE NOT EXISTS (SELECT 1 FROM categorias_pagamento WHERE categorias_pagamento.nome = v.nome);

-- ─── 4. Tabela: comissoes_profissional ────────────────────────────────────────
-- ATENÇÃO: profissionais.id é TEXT e procedimentos.id é UUID
CREATE TABLE IF NOT EXISTS comissoes_profissional (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profissional_id  TEXT NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  procedimento_id  UUID NOT NULL REFERENCES procedimentos(id) ON DELETE CASCADE,
  percentual       NUMERIC(5,2) NOT NULL DEFAULT 0
                     CHECK (percentual >= 0 AND percentual <= 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profissional_id, procedimento_id)
);

ALTER TABLE comissoes_profissional ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'comissoes_profissional' AND policyname = 'allow_all_comissoes'
  ) THEN
    CREATE POLICY "allow_all_comissoes" ON comissoes_profissional USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 5. Verificação final ─────────────────────────────────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('procedimentos', 'formas_pagamento', 'categorias_pagamento', 'profissionais', 'comissoes_profissional')
ORDER BY table_name;
