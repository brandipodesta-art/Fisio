-- ============================================================================
-- Tabela: lista_espera
-- ============================================================================
-- Pacientes aguardando vaga / com agendamento marcado para data distante mas
-- que aceitariam ser chamados antes caso surja uma vaga (cancelamento, falta).
--
-- Fluxo:
--   1. Recepcionista marca paciente em lista de espera (motivo: dor, urgência, etc).
--   2. Quando alguém cancela, recepcionista abre a lista (manual) e oferece a vaga.
--   3. Ao contactar, marca status = "contactado".
--   4. Se o paciente aceitar a nova vaga, cria-se um novo agendamento e
--      marca-se status = "atendido".
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lista_espera (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vínculo com paciente (opcional para entradas avulsas)
    paciente_id               UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
    paciente_nome             TEXT NOT NULL,
    telefone                  TEXT,

    -- Preferências
    profissional_preferido_id TEXT,
    procedimento_id           UUID REFERENCES public.procedimentos(id) ON DELETE SET NULL,

    -- Contexto clínico
    motivo                    TEXT,
    urgencia                  TEXT NOT NULL DEFAULT 'media'
                              CHECK (urgencia IN ('baixa', 'media', 'alta')),

    -- Se o paciente já tem agendamento marcado (caso do Marcelo: agendado pra sexta
    -- mas aceita ir antes se vagar)
    agendamento_atual_id      UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,

    -- Estado
    status                    TEXT NOT NULL DEFAULT 'aguardando'
                              CHECK (status IN ('aguardando', 'contactado', 'atendido', 'desistiu')),
    observacoes               TEXT,

    -- Auditoria
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    contacted_at              TIMESTAMPTZ,
    contacted_by              TEXT,
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lista_espera_status
    ON public.lista_espera(status);

CREATE INDEX IF NOT EXISTS idx_lista_espera_urgencia
    ON public.lista_espera(urgencia);

CREATE INDEX IF NOT EXISTS idx_lista_espera_paciente
    ON public.lista_espera(paciente_id);

CREATE INDEX IF NOT EXISTS idx_lista_espera_created
    ON public.lista_espera(created_at DESC);

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION public.lista_espera_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lista_espera_updated_at ON public.lista_espera;
CREATE TRIGGER trg_lista_espera_updated_at
    BEFORE UPDATE ON public.lista_espera
    FOR EACH ROW
    EXECUTE FUNCTION public.lista_espera_set_updated_at();

-- RLS: liberado para usuários autenticados (admin, financeiro, funcionário)
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lista_espera_all_authenticated ON public.lista_espera;
CREATE POLICY lista_espera_all_authenticated
    ON public.lista_espera
    FOR ALL
    USING (true)
    WITH CHECK (true);
