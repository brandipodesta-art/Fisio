-- Migração: Adicionar paciente_id na tabela agendamentos
-- Data: 2026-03-20
-- Objetivo: Vincular agendamentos a pacientes cadastrados

-- 1. Adicionar coluna paciente_id (nullable para não quebrar dados existentes)
ALTER TABLE agendamentos
  ADD COLUMN IF NOT EXISTS paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL;

-- 2. Backfill: vincular agendamentos existentes pelo nome do paciente (melhor esforço)
UPDATE agendamentos a
SET paciente_id = p.id
FROM pacientes p
WHERE a.patient_name = p.nome_completo
  AND a.paciente_id IS NULL;
