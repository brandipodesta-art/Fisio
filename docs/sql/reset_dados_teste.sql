-- ============================================================================
-- RESET DE DADOS DE TESTE — FisioSys
-- ============================================================================
-- Limpa todos os dados operacionais (agendamentos, pagamentos, pacientes etc.)
-- mantendo intacta a configuração do sistema e os logins administrativos.
--
-- ⚠️  IRREVERSÍVEL — Faça backup antes de rodar (Supabase: Database → Backups).
--
-- O que é APAGADO:
--   • Agendamentos
--   • Recebimentos e pagamentos
--   • Frequências
--   • Evoluções clínicas
--   • Lista de espera
--   • Alertas
--   • Pacientes (apenas tipo_usuario = 'paciente')
--
-- O que é MANTIDO:
--   • Logins administrativos (admin, financeiro, funcionário) — Amanda, secretária etc.
--   • Profissionais (fisioterapeutas cadastrados)
--   • Procedimentos (Pilates, RPG, Atendimento etc.)
--   • Formas de pagamento (Cartão, Pix, Dinheiro etc.)
--   • Comissões configuradas por profissional
--
-- Como rodar:
--   1. Supabase Dashboard → SQL Editor → New Query
--   2. Cole TODO o conteúdo deste arquivo
--   3. Clique em "Run"
--   4. Confira os contadores impressos no final
-- ============================================================================

BEGIN;

-- ── 1. Lista de Espera ──────────────────────────────────────────────────────
DELETE FROM public.lista_espera;

-- ── 2. Evoluções clínicas ───────────────────────────────────────────────────
DELETE FROM public.evolucoes;

-- ── 3. Frequências mensais ──────────────────────────────────────────────────
DELETE FROM public.frequencias;

-- ── 4. Pagamentos (comissões a profissionais) ───────────────────────────────
DELETE FROM public.pagamentos;

-- ── 5. Recebimentos (cobranças a pacientes) ─────────────────────────────────
DELETE FROM public.recebimentos;

-- ── 6. Agendamentos ─────────────────────────────────────────────────────────
DELETE FROM public.agendamentos;

-- ── 7. Alertas do sistema (se a tabela existir) ─────────────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'alertas'
    ) THEN
        EXECUTE 'DELETE FROM public.alertas';
        RAISE NOTICE 'Tabela alertas: limpa';
    ELSE
        RAISE NOTICE 'Tabela alertas: não existe — pulando';
    END IF;
END $$;

-- ── 8. Pacientes (apenas pacientes reais — preserva logins) ─────────────────
-- Mantém admin, financeiro e funcionário — esses são os usuários do sistema.
DELETE FROM public.pacientes
WHERE tipo_usuario = 'paciente';

-- ============================================================================
-- VERIFICAÇÃO — contadores após limpeza
-- ============================================================================
DO $$
DECLARE
    n_agendamentos      INT;
    n_recebimentos      INT;
    n_pagamentos        INT;
    n_frequencias       INT;
    n_evolucoes         INT;
    n_lista_espera      INT;
    n_pacientes_admin   INT;
    n_pacientes_func    INT;
    n_pacientes_fin     INT;
    n_pacientes_paciente INT;
    n_profissionais     INT;
    n_procedimentos     INT;
    n_formas_pagamento  INT;
BEGIN
    SELECT COUNT(*) INTO n_agendamentos      FROM public.agendamentos;
    SELECT COUNT(*) INTO n_recebimentos      FROM public.recebimentos;
    SELECT COUNT(*) INTO n_pagamentos        FROM public.pagamentos;
    SELECT COUNT(*) INTO n_frequencias       FROM public.frequencias;
    SELECT COUNT(*) INTO n_evolucoes         FROM public.evolucoes;
    SELECT COUNT(*) INTO n_lista_espera      FROM public.lista_espera;
    SELECT COUNT(*) INTO n_pacientes_admin   FROM public.pacientes WHERE tipo_usuario = 'admin';
    SELECT COUNT(*) INTO n_pacientes_func    FROM public.pacientes WHERE tipo_usuario = 'funcionario';
    SELECT COUNT(*) INTO n_pacientes_fin     FROM public.pacientes WHERE tipo_usuario = 'financeiro';
    SELECT COUNT(*) INTO n_pacientes_paciente FROM public.pacientes WHERE tipo_usuario = 'paciente';
    SELECT COUNT(*) INTO n_profissionais     FROM public.profissionais;
    SELECT COUNT(*) INTO n_procedimentos     FROM public.procedimentos;
    SELECT COUNT(*) INTO n_formas_pagamento  FROM public.formas_pagamento;

    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '  RESET — RESULTADO';
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '  APAGADOS (devem ser 0):';
    RAISE NOTICE '    • Agendamentos:      %', n_agendamentos;
    RAISE NOTICE '    • Recebimentos:      %', n_recebimentos;
    RAISE NOTICE '    • Pagamentos:        %', n_pagamentos;
    RAISE NOTICE '    • Frequências:       %', n_frequencias;
    RAISE NOTICE '    • Evoluções:         %', n_evolucoes;
    RAISE NOTICE '    • Lista de Espera:   %', n_lista_espera;
    RAISE NOTICE '    • Pacientes:         %', n_pacientes_paciente;
    RAISE NOTICE '────────────────────────────────────────────────';
    RAISE NOTICE '  PRESERVADOS:';
    RAISE NOTICE '    • Admins:            %', n_pacientes_admin;
    RAISE NOTICE '    • Funcionários:      %', n_pacientes_func;
    RAISE NOTICE '    • Financeiro:        %', n_pacientes_fin;
    RAISE NOTICE '    • Profissionais:     %', n_profissionais;
    RAISE NOTICE '    • Procedimentos:     %', n_procedimentos;
    RAISE NOTICE '    • Formas Pagamento:  %', n_formas_pagamento;
    RAISE NOTICE '════════════════════════════════════════════════';
END $$;

-- ── CONFIRMAÇÃO ─────────────────────────────────────────────────────────────
-- Se os contadores acima estiverem corretos, descomente COMMIT e comente ROLLBACK.
-- Se algo estiver errado, deixe ROLLBACK ativo para desfazer tudo.

-- Para CONFIRMAR a limpeza (apaga de verdade):
COMMIT;

-- Para CANCELAR (não apaga nada, faz dry-run):
-- ROLLBACK;
