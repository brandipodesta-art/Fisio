-- ============================================================
-- MIGRAÇÃO DE INTEGRIDADE — Projeto Fisio Clínica
-- Data: 17/03/2026
-- Aplica 6 melhorias de integridade referencial ao banco
-- Script idempotente (seguro para re-executar)
-- ============================================================
-- COMO EXECUTAR:
--   1. Acesse o SQL Editor do Supabase (projeto uxastllbpbthqvicfkfo)
--   2. Cole e execute este script completo
--   3. Verifique o resultado na seção "Verificação final" ao final
-- ============================================================

-- ─── MELHORIA 1: Check de Valor Positivo ─────────────────────────────────────
-- Impede valor zero ou negativo em recebimentos e pagamentos

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_recebimentos_valor_positivo'
  ) THEN
    ALTER TABLE public.recebimentos
      ADD CONSTRAINT chk_recebimentos_valor_positivo CHECK (valor > 0);
    RAISE NOTICE 'CHECK valor positivo adicionado em recebimentos';
  ELSE
    RAISE NOTICE 'CHECK valor positivo já existe em recebimentos';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_pagamentos_valor_positivo'
  ) THEN
    ALTER TABLE public.pagamentos
      ADD CONSTRAINT chk_pagamentos_valor_positivo CHECK (valor > 0);
    RAISE NOTICE 'CHECK valor positivo adicionado em pagamentos';
  ELSE
    RAISE NOTICE 'CHECK valor positivo já existe em pagamentos';
  END IF;
END $$;

-- ─── MELHORIA 2: Padronizar IDs — formas_pagamento e categorias_pagamento ─────
-- Os IDs já são UUIDs armazenados como TEXT.
-- Convertemos para o tipo UUID nativo para melhor performance e indexação.
-- NOTA: Só é possível se não houver FKs apontando para essas tabelas ainda.

-- 2a. Alterar id de formas_pagamento de TEXT para UUID
DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'formas_pagamento' AND column_name = 'id' AND table_schema = 'public') = 'text' THEN
    ALTER TABLE public.formas_pagamento ALTER COLUMN id TYPE UUID USING id::uuid;
    RAISE NOTICE 'formas_pagamento.id convertido para UUID';
  ELSE
    RAISE NOTICE 'formas_pagamento.id já é UUID';
  END IF;
END $$;

-- 2b. Alterar id de categorias_pagamento de TEXT para UUID
DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'categorias_pagamento' AND column_name = 'id' AND table_schema = 'public') = 'text' THEN
    ALTER TABLE public.categorias_pagamento ALTER COLUMN id TYPE UUID USING id::uuid;
    RAISE NOTICE 'categorias_pagamento.id convertido para UUID';
  ELSE
    RAISE NOTICE 'categorias_pagamento.id já é UUID';
  END IF;
END $$;

-- ─── MELHORIA 3: UNIQUE no CPF ────────────────────────────────────────────────
-- Evita cadastro duplicado do mesmo paciente (partial index: ignora NULL e vazio)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uq_pacientes_cpf'
  ) THEN
    CREATE UNIQUE INDEX uq_pacientes_cpf
      ON public.pacientes (cpf)
      WHERE cpf IS NOT NULL AND cpf <> '';
    RAISE NOTICE 'UNIQUE INDEX no CPF criado';
  ELSE
    RAISE NOTICE 'UNIQUE INDEX no CPF já existe';
  END IF;
END $$;

-- ─── MELHORIA 4 e 5: FKs no Financeiro ───────────────────────────────────────
-- Adicionar colunas FK (UUID) em recebimentos e pagamentos
-- e migrar os dados existentes usando mapeamento nome→UUID

-- 4a. Adicionar forma_pagamento_id em recebimentos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recebimentos' AND column_name = 'forma_pagamento_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.recebimentos
      ADD COLUMN forma_pagamento_id UUID REFERENCES public.formas_pagamento(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna forma_pagamento_id adicionada em recebimentos';
  ELSE
    RAISE NOTICE 'Coluna forma_pagamento_id já existe em recebimentos';
  END IF;
END $$;

-- 4b. Migrar dados existentes: texto → UUID (case-insensitive)
UPDATE public.recebimentos r
SET forma_pagamento_id = fp.id
FROM public.formas_pagamento fp
WHERE LOWER(r.forma_pagamento) = LOWER(fp.nome)
  AND r.forma_pagamento_id IS NULL;

-- 4c. Adicionar forma_pagamento_id em pagamentos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'forma_pagamento_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.pagamentos
      ADD COLUMN forma_pagamento_id UUID REFERENCES public.formas_pagamento(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna forma_pagamento_id adicionada em pagamentos';
  ELSE
    RAISE NOTICE 'Coluna forma_pagamento_id já existe em pagamentos';
  END IF;
END $$;

-- 4d. Migrar dados existentes em pagamentos
UPDATE public.pagamentos p
SET forma_pagamento_id = fp.id
FROM public.formas_pagamento fp
WHERE LOWER(p.forma_pagamento) = LOWER(fp.nome)
  AND p.forma_pagamento_id IS NULL;

-- 4e. Adicionar categoria_id em pagamentos (FK para categorias)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pagamentos' AND column_name = 'categoria_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.pagamentos
      ADD COLUMN categoria_id UUID REFERENCES public.categorias_pagamento(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna categoria_id adicionada em pagamentos';
  ELSE
    RAISE NOTICE 'Coluna categoria_id já existe em pagamentos';
  END IF;
END $$;

-- 4f. Migrar categoria texto → UUID
UPDATE public.pagamentos p
SET categoria_id = cp.id
FROM public.categorias_pagamento cp
WHERE p.categoria = cp.nome
  AND p.categoria_id IS NULL;

-- ─── MELHORIA 6: FK explícita de profissional_responsavel em pacientes ────────
-- profissional_responsavel é TEXT (slug) → REFERENCES profissionais(id)
-- PRÉ-REQUISITO: strings vazias já foram convertidas para NULL via script Python

-- Garantir que não há strings vazias restantes
UPDATE public.pacientes
SET profissional_responsavel = NULL
WHERE profissional_responsavel = '';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_pacientes_profissional'
  ) THEN
    ALTER TABLE public.pacientes
      ADD CONSTRAINT fk_pacientes_profissional
      FOREIGN KEY (profissional_responsavel)
      REFERENCES public.profissionais(id)
      ON DELETE SET NULL;
    RAISE NOTICE 'FK profissional_responsavel → profissionais adicionada';
  ELSE
    RAISE NOTICE 'FK profissional_responsavel já existe';
  END IF;
END $$;

-- ─── Verificação final ────────────────────────────────────────────────────────
SELECT
  tc.table_name                                    AS tabela,
  tc.constraint_name                               AS constraint,
  tc.constraint_type                               AS tipo,
  COALESCE(
    ccu.table_name || '.' || ccu.column_name,
    cc.check_clause,
    ''
  )                                                AS detalhes
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name AND tc.table_schema = cc.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('pacientes', 'recebimentos', 'pagamentos', 'formas_pagamento', 'categorias_pagamento')
  AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
