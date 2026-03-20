-- ============================================================
-- Migração: Adicionar procedimento_id na tabela agendamentos
-- Data: 2026-03-20
-- Objetivo: Vincular agendamentos a procedimentos cadastrados
-- ============================================================

-- Adicionar coluna procedimento_id (FK para procedimentos)
ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS procedimento_id UUID REFERENCES public.procedimentos(id) ON DELETE SET NULL;

-- Garantir permissões (consistente com o restante do schema)
GRANT ALL ON TABLE public.agendamentos TO anon, authenticated;
