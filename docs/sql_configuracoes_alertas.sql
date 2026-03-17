-- ============================================================
-- Tabela: configuracoes_alertas
-- Armazena as preferências de envio de alertas por e-mail
-- ============================================================

CREATE TABLE IF NOT EXISTS public.configuracoes_alertas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            text        NOT NULL DEFAULT 'pagamentos_vencidos',
  ativo           boolean     NOT NULL DEFAULT true,
  email_destino   text        NOT NULL DEFAULT 'brandipodesta@gmail.com',
  email_remetente text        NOT NULL DEFAULT 'marpodesta@gmail.com',
  -- dias_semana: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  dias_semana     integer[]   NOT NULL DEFAULT '{1,2,3,4,5}',
  horario         time        NOT NULL DEFAULT '08:00:00',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.configuracoes_alertas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON public.configuracoes_alertas;
CREATE POLICY "allow_all" ON public.configuracoes_alertas
  FOR ALL USING (true) WITH CHECK (true);

-- Registro inicial (dias úteis, 8h, e-mails padrão)
INSERT INTO public.configuracoes_alertas (tipo, ativo, email_destino, email_remetente, dias_semana, horario)
SELECT 'pagamentos_vencidos', true, 'brandipodesta@gmail.com', 'marpodesta@gmail.com', '{1,2,3,4,5}', '08:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.configuracoes_alertas WHERE tipo = 'pagamentos_vencidos'
);
