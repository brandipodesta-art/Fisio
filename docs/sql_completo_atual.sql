-- ============================================================
-- SQL COMPLETO — Projeto Fisio Clínica
-- Estado atual: 17/03/2026
-- Todas as tabelas com RLS, políticas e dados iniciais
-- Script idempotente (seguro para re-executar)
-- ============================================================

-- ─── 1. Tabela: pacientes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pacientes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT        NOT NULL,
  cpf             TEXT,
  rg              TEXT,
  data_nascimento DATE,
  telefone        TEXT,
  email           TEXT,
  endereco        TEXT,
  cidade          TEXT,
  estado          TEXT,
  cep             TEXT,
  estado_civil    TEXT,
  profissao       TEXT,
  tipo_usuario    TEXT        NOT NULL DEFAULT 'paciente'
                    CHECK (tipo_usuario IN ('paciente','funcionario','admin','financeiro')),
  status          TEXT        NOT NULL DEFAULT 'ativo'
                    CHECK (status IN ('ativo','inativo')),
  profissional_id TEXT,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pacientes' AND policyname = 'allow_all_pacientes') THEN
    CREATE POLICY "allow_all_pacientes" ON public.pacientes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 2. Tabela: profissionais ─────────────────────────────────────────────────
-- ATENÇÃO: id é TEXT (slug), não UUID
CREATE TABLE IF NOT EXISTS public.profissionais (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  short_name TEXT,
  color      TEXT        NOT NULL DEFAULT '#7c3aed',
  bg_color   TEXT        NOT NULL DEFAULT '#ede9fe',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profissionais' AND policyname = 'allow_all_profissionais') THEN
    CREATE POLICY "allow_all_profissionais" ON public.profissionais FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 3. Tabela: procedimentos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.procedimentos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT        NOT NULL UNIQUE,
  descricao    TEXT,
  valor_padrao NUMERIC(10,2),
  ativo        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedimentos' AND policyname = 'allow_all_procedimentos') THEN
    CREATE POLICY "allow_all_procedimentos" ON public.procedimentos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 4. Tabela: formas_pagamento ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.formas_pagamento (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome       TEXT        NOT NULL,
  tipo       TEXT        NOT NULL DEFAULT 'ambos'
               CHECK (tipo IN ('recebimento', 'pagamento', 'ambos')),
  ativo      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'formas_pagamento' AND policyname = 'allow_all_formas_pagamento') THEN
    CREATE POLICY "allow_all_formas_pagamento" ON public.formas_pagamento FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
-- Dados iniciais
INSERT INTO public.formas_pagamento (nome, tipo)
SELECT nome, tipo FROM (VALUES
  ('PIX',               'ambos'),
  ('Dinheiro',          'ambos'),
  ('Cartão de Crédito', 'recebimento'),
  ('Cartão de Débito',  'recebimento'),
  ('Transferência',     'ambos'),
  ('Boleto',            'pagamento'),
  ('Cheque',            'pagamento')
) AS v(nome, tipo)
WHERE NOT EXISTS (SELECT 1 FROM public.formas_pagamento WHERE formas_pagamento.nome = v.nome);

-- ─── 5. Tabela: categorias_pagamento ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categorias_pagamento (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome       TEXT        NOT NULL,
  ativo      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.categorias_pagamento ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categorias_pagamento' AND policyname = 'allow_all_categorias_pagamento') THEN
    CREATE POLICY "allow_all_categorias_pagamento" ON public.categorias_pagamento FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
-- Dados iniciais
INSERT INTO public.categorias_pagamento (nome)
SELECT nome FROM (VALUES
  ('Aluguel'), ('Água'), ('Energia Elétrica'), ('Internet'), ('Telefone'),
  ('Material de Escritório'), ('Material de Limpeza'), ('Equipamentos'),
  ('Manutenção'), ('Salários'), ('Impostos'), ('Contabilidade'),
  ('Marketing'), ('Outros')
) AS v(nome)
WHERE NOT EXISTS (SELECT 1 FROM public.categorias_pagamento WHERE categorias_pagamento.nome = v.nome);

-- ─── 6. Tabela: comissoes_profissional ────────────────────────────────────────
-- ATENÇÃO: profissionais.id é TEXT e procedimentos.id é UUID
CREATE TABLE IF NOT EXISTS public.comissoes_profissional (
  id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profissional_id  TEXT        NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  procedimento_id  UUID        NOT NULL REFERENCES public.procedimentos(id) ON DELETE CASCADE,
  percentual       NUMERIC(5,2) NOT NULL DEFAULT 0
                     CHECK (percentual >= 0 AND percentual <= 100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profissional_id, procedimento_id)
);
ALTER TABLE public.comissoes_profissional ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comissoes_profissional' AND policyname = 'allow_all_comissoes') THEN
    CREATE POLICY "allow_all_comissoes" ON public.comissoes_profissional FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 7. Tabela: recebimentos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recebimentos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id      UUID        REFERENCES public.pacientes(id) ON DELETE SET NULL,
  descricao        TEXT        NOT NULL,
  valor            NUMERIC(10,2) NOT NULL,
  data_recebimento DATE,
  data_vencimento  DATE,
  forma_pagamento  TEXT,
  status           TEXT        NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','recebido','atrasado','cancelado')),
  observacoes      TEXT,
  profissional_id  TEXT        REFERENCES public.profissionais(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recebimentos' AND policyname = 'allow_all_recebimentos') THEN
    CREATE POLICY "allow_all_recebimentos" ON public.recebimentos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 8. Tabela: pagamentos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao        TEXT        NOT NULL,
  fornecedor       TEXT,
  categoria        TEXT,
  valor            NUMERIC(10,2) NOT NULL,
  data_vencimento  DATE,
  data_pagamento   DATE,
  forma_pagamento  TEXT,
  status           TEXT        NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','pago','atrasado','cancelado')),
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pagamentos' AND policyname = 'allow_all_pagamentos') THEN
    CREATE POLICY "allow_all_pagamentos" ON public.pagamentos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 9. Tabela: configuracoes_alertas ────────────────────────────────────────
-- Armazena as preferências de envio de alertas por e-mail
-- dias_semana: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
CREATE TABLE IF NOT EXISTS public.configuracoes_alertas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            TEXT        NOT NULL DEFAULT 'pagamentos_vencidos',
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  email_destino   TEXT        NOT NULL DEFAULT 'brandipodesta@gmail.com',
  email_remetente TEXT        NOT NULL DEFAULT 'marpodesta@gmail.com',
  dias_semana     INTEGER[]   NOT NULL DEFAULT '{1,2,3,4,5}',
  horario         TIME        NOT NULL DEFAULT '08:00:00',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.configuracoes_alertas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'configuracoes_alertas' AND policyname = 'allow_all_alertas') THEN
    CREATE POLICY "allow_all_alertas" ON public.configuracoes_alertas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
-- Registro inicial
INSERT INTO public.configuracoes_alertas (tipo, ativo, email_destino, email_remetente, dias_semana, horario)
SELECT 'pagamentos_vencidos', true, 'brandipodesta@gmail.com', 'marpodesta@gmail.com', '{1,2,3,4,5}', '08:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_alertas WHERE tipo = 'pagamentos_vencidos');

-- ─── Verificação final ────────────────────────────────────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'pacientes','profissionais','procedimentos',
    'formas_pagamento','categorias_pagamento','comissoes_profissional',
    'recebimentos','pagamentos','configuracoes_alertas'
  )
ORDER BY table_name;
