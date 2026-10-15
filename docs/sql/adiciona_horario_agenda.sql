-- Executar no SQL Editor do Supabase para permitir configurar o horário da Agenda
-- (Configurações > Dados da Clínica > Horário da Agenda).
-- Os padrões mantêm o horário atual: primeiro horário 07:00, último horário 20:00.
ALTER TABLE public.configuracoes_clinica
  ADD COLUMN IF NOT EXISTS hora_inicio_agenda SMALLINT DEFAULT 7
    CHECK (hora_inicio_agenda BETWEEN 0 AND 23);

ALTER TABLE public.configuracoes_clinica
  ADD COLUMN IF NOT EXISTS hora_fim_agenda SMALLINT DEFAULT 20
    CHECK (hora_fim_agenda BETWEEN 0 AND 23);

UPDATE public.configuracoes_clinica SET hora_inicio_agenda = 7 WHERE hora_inicio_agenda IS NULL;
UPDATE public.configuracoes_clinica SET hora_fim_agenda = 20 WHERE hora_fim_agenda IS NULL;
