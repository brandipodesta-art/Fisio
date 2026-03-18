-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRAÇÃO: Campos TEXT legados → FKs UUID
-- Data: 17/03/2026
-- Objetivo:
--   1. Popular forma_pagamento_id em pagamentos e recebimentos a partir do
--      campo TEXT legado forma_pagamento (slug → UUID via formas_pagamento.nome)
--   2. Popular categoria_id em pagamentos a partir do campo TEXT legado
--      categoria (nome → UUID via categorias_pagamento.nome)
--   3. Inserir categorias faltantes (ex: "Material de Consumo") em
--      categorias_pagamento para não perder dados legados
--   4. Todos os scripts são IDEMPOTENTES (seguros para re-executar)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── PASSO 1: Garantir que todas as categorias TEXT existam na tabela ─────────
-- "Material de Consumo" existe nos dados legados mas não na tabela
INSERT INTO public.categorias_pagamento (nome)
SELECT 'Material de Consumo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_pagamento WHERE nome = 'Material de Consumo'
);

-- ─── PASSO 2: Mapear slugs TEXT → UUIDs de formas_pagamento ──────────────────
-- Os slugs usados no campo legado forma_pagamento:
--   'dinheiro'       → nome 'Dinheiro'
--   'pix'            → nome 'PIX'
--   'cartao_credito' → nome 'Cartão de Crédito'
--   'cartao_debito'  → nome 'Cartão de Débito'
--   'transferencia'  → nome 'Transferência'
--   'boleto'         → nome 'Boleto'
--   'cheque'         → nome 'Cheque'

-- Atualizar forma_pagamento_id em PAGAMENTOS onde ainda está NULL
UPDATE public.pagamentos p
SET forma_pagamento_id = fp.id
FROM public.formas_pagamento fp
WHERE p.forma_pagamento_id IS NULL
  AND p.forma_pagamento IS NOT NULL
  AND fp.nome = CASE p.forma_pagamento
    WHEN 'dinheiro'       THEN 'Dinheiro'
    WHEN 'pix'            THEN 'PIX'
    WHEN 'cartao_credito' THEN 'Cartão de Crédito'
    WHEN 'cartao_debito'  THEN 'Cartão de Débito'
    WHEN 'transferencia'  THEN 'Transferência'
    WHEN 'boleto'         THEN 'Boleto'
    WHEN 'cheque'         THEN 'Cheque'
    ELSE NULL
  END;

-- Atualizar forma_pagamento_id em RECEBIMENTOS onde ainda está NULL
UPDATE public.recebimentos r
SET forma_pagamento_id = fp.id
FROM public.formas_pagamento fp
WHERE r.forma_pagamento_id IS NULL
  AND r.forma_pagamento IS NOT NULL
  AND fp.nome = CASE r.forma_pagamento
    WHEN 'dinheiro'       THEN 'Dinheiro'
    WHEN 'pix'            THEN 'PIX'
    WHEN 'cartao_credito' THEN 'Cartão de Crédito'
    WHEN 'cartao_debito'  THEN 'Cartão de Débito'
    WHEN 'transferencia'  THEN 'Transferência'
    WHEN 'boleto'         THEN 'Boleto'
    WHEN 'cheque'         THEN 'Cheque'
    ELSE NULL
  END;

-- ─── PASSO 3: Mapear nomes TEXT → UUIDs de categorias_pagamento ──────────────
-- Atualizar categoria_id em PAGAMENTOS onde ainda está NULL
UPDATE public.pagamentos p
SET categoria_id = cp.id
FROM public.categorias_pagamento cp
WHERE p.categoria_id IS NULL
  AND p.categoria IS NOT NULL
  AND cp.nome = p.categoria;

-- ─── PASSO 4: Verificação final ───────────────────────────────────────────────
-- Contar registros ainda sem FK populada (deve ser 0 após migração bem-sucedida)
SELECT
  'pagamentos' AS tabela,
  COUNT(*) FILTER (WHERE forma_pagamento IS NOT NULL AND forma_pagamento_id IS NULL) AS forma_sem_fk,
  COUNT(*) FILTER (WHERE categoria IS NOT NULL AND categoria_id IS NULL) AS categoria_sem_fk
FROM public.pagamentos
UNION ALL
SELECT
  'recebimentos' AS tabela,
  COUNT(*) FILTER (WHERE forma_pagamento IS NOT NULL AND forma_pagamento_id IS NULL) AS forma_sem_fk,
  NULL AS categoria_sem_fk
FROM public.recebimentos;
