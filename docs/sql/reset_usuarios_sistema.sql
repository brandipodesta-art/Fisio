-- ============================================================================
-- RESET DE USUÁRIOS DO SISTEMA — FisioSys
-- ============================================================================
-- Limpa profissionais e usuários de sistema (funcionário, admin, financeiro)
-- de teste, mantendo apenas:
--   • Amanda  → dona da clínica
--   • Marcelo → admin do sistema
--
-- ⚠️  Rode ANTES o script `reset_dados_teste.sql`, pois este script depende
--    de que agendamentos / recebimentos / pagamentos já estejam vazios
--    (caso contrário FKs vão bloquear o DELETE em profissionais).
-- ============================================================================

BEGIN;

-- ── PREVIEW — quem vai ser MANTIDO e DELETADO ───────────────────────────────
DO $$
DECLARE
    nome RECORD;
BEGIN
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '  PROFISSIONAIS — serão MANTIDOS:';
    RAISE NOTICE '────────────────────────────────────────────────';
    FOR nome IN
        SELECT name FROM public.profissionais
        WHERE name ILIKE '%amanda%' OR name ILIKE '%marcelo%'
        ORDER BY name
    LOOP
        RAISE NOTICE '    ✓ %', nome.name;
    END LOOP;

    RAISE NOTICE '────────────────────────────────────────────────';
    RAISE NOTICE '  PROFISSIONAIS — serão DELETADOS:';
    RAISE NOTICE '────────────────────────────────────────────────';
    FOR nome IN
        SELECT name FROM public.profissionais
        WHERE NOT (name ILIKE '%amanda%' OR name ILIKE '%marcelo%')
        ORDER BY name
    LOOP
        RAISE NOTICE '    ✗ %', nome.name;
    END LOOP;

    RAISE NOTICE '────────────────────────────────────────────────';
    RAISE NOTICE '  USUÁRIOS SISTEMA (pacientes) — serão MANTIDOS:';
    RAISE NOTICE '────────────────────────────────────────────────';
    FOR nome IN
        SELECT nome_completo, tipo_usuario FROM public.pacientes
        WHERE tipo_usuario IN ('admin','financeiro','funcionario')
          AND (nome_completo ILIKE '%amanda%' OR nome_completo ILIKE '%marcelo%')
        ORDER BY nome_completo
    LOOP
        RAISE NOTICE '    ✓ % (%)', nome.nome_completo, nome.tipo_usuario;
    END LOOP;

    RAISE NOTICE '────────────────────────────────────────────────';
    RAISE NOTICE '  USUÁRIOS SISTEMA (pacientes) — serão DELETADOS:';
    RAISE NOTICE '────────────────────────────────────────────────';
    FOR nome IN
        SELECT nome_completo, tipo_usuario FROM public.pacientes
        WHERE tipo_usuario IN ('admin','financeiro','funcionario')
          AND NOT (nome_completo ILIKE '%amanda%' OR nome_completo ILIKE '%marcelo%')
        ORDER BY nome_completo
    LOOP
        RAISE NOTICE '    ✗ % (%)', nome.nome_completo, nome.tipo_usuario;
    END LOOP;
    RAISE NOTICE '════════════════════════════════════════════════';
END $$;

-- ── 1. Comissões dos profissionais que serão deletados ──────────────────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'comissoes_profissional'
    ) THEN
        DELETE FROM public.comissoes_profissional
        WHERE profissional_id IN (
            SELECT id FROM public.profissionais
            WHERE NOT (name ILIKE '%amanda%' OR name ILIKE '%marcelo%')
        );
        RAISE NOTICE 'Comissões dos profissionais deletados: limpas';
    END IF;
END $$;

-- ── 2. Profissionais — manter só Amanda e Marcelo ───────────────────────────
DELETE FROM public.profissionais
WHERE NOT (name ILIKE '%amanda%' OR name ILIKE '%marcelo%');

-- ── 3. Pacientes de tipo sistema (admin / funcionario / financeiro) ─────────
-- Mantém apenas Amanda e Marcelo. Pacientes do tipo 'paciente' não são tocados
-- (já foram limpos pelo script reset_dados_teste.sql).
DELETE FROM public.pacientes
WHERE tipo_usuario IN ('admin','financeiro','funcionario')
  AND NOT (nome_completo ILIKE '%amanda%' OR nome_completo ILIKE '%marcelo%');

-- ── 4. Tabela usuarios_acesso (se existir) ──────────────────────────────────
-- Detecta dinamicamente quais colunas de "nome" existem nessa tabela
-- (nome_completo, nome_acesso, nome, email etc.) e monta o filtro com elas.
DO $$
DECLARE
    cond TEXT := '';
    col  TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'usuarios_acesso'
    ) THEN
        RAISE NOTICE 'Tabela usuarios_acesso: não existe — pulando';
        RETURN;
    END IF;

    -- Lista de colunas que podem conter o "nome" do usuário
    FOR col IN
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'usuarios_acesso'
          AND column_name = ANY(ARRAY[
              'nome_completo','nome_acesso','nome',
              'usuario','username','email','login'
          ])
    LOOP
        IF cond <> '' THEN
            cond := cond || ' OR ';
        END IF;
        cond := cond ||
                format('%I ILIKE ''%%amanda%%'' OR %I ILIKE ''%%marcelo%%''',
                       col, col);
    END LOOP;

    IF cond = '' THEN
        RAISE NOTICE 'Tabela usuarios_acesso: sem colunas de nome reconhecidas — pulando';
        RETURN;
    END IF;

    EXECUTE format(
        'DELETE FROM public.usuarios_acesso WHERE NOT (%s)',
        cond
    );

    RAISE NOTICE 'Tabela usuarios_acesso: limpa (filtro por %)', cond;
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
DO $$
DECLARE
    n_profs            INT;
    n_admins           INT;
    n_funcs            INT;
    n_finance          INT;
    nome               RECORD;
BEGIN
    SELECT COUNT(*) INTO n_profs   FROM public.profissionais;
    SELECT COUNT(*) INTO n_admins  FROM public.pacientes WHERE tipo_usuario = 'admin';
    SELECT COUNT(*) INTO n_funcs   FROM public.pacientes WHERE tipo_usuario = 'funcionario';
    SELECT COUNT(*) INTO n_finance FROM public.pacientes WHERE tipo_usuario = 'financeiro';

    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '  RESULTADO FINAL';
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '  Profissionais restantes: %', n_profs;
    RAISE NOTICE '  Admins restantes:        %', n_admins;
    RAISE NOTICE '  Funcionários restantes:  %', n_funcs;
    RAISE NOTICE '  Financeiro restantes:    %', n_finance;
    RAISE NOTICE '────────────────────────────────────────────────';
    RAISE NOTICE '  Lista de profissionais mantidos:';
    FOR nome IN SELECT name FROM public.profissionais ORDER BY name
    LOOP
        RAISE NOTICE '    • %', nome.name;
    END LOOP;
    RAISE NOTICE '────────────────────────────────────────────────';
    RAISE NOTICE '  Lista de usuários sistema mantidos:';
    FOR nome IN
        SELECT nome_completo, tipo_usuario FROM public.pacientes
        WHERE tipo_usuario IN ('admin','financeiro','funcionario')
        ORDER BY nome_completo
    LOOP
        RAISE NOTICE '    • % (%)', nome.nome_completo, nome.tipo_usuario;
    END LOOP;
    RAISE NOTICE '════════════════════════════════════════════════';
END $$;

-- ── CONFIRMAÇÃO ─────────────────────────────────────────────────────────────
-- Confira no log acima se a lista final está correta antes de confirmar.
--
-- Para CONFIRMAR a limpeza:
COMMIT;

-- Para CANCELAR (dry-run, não apaga nada):
-- ROLLBACK;
