-- ═══════════════════════════════════════════════════════════════
-- Configurações da Clínica (logo + dados institucionais)
-- Executar no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1) Tabela de configuração (linha única)
CREATE TABLE IF NOT EXISTS public.configuracoes_clinica (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  logo_url TEXT,
  nome_clinica TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Linha inicial
INSERT INTO public.configuracoes_clinica (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS liberada para o app (mesmo padrão das demais tabelas de config)
ALTER TABLE public.configuracoes_clinica ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracoes_clinica_select" ON public.configuracoes_clinica;
CREATE POLICY "configuracoes_clinica_select"
  ON public.configuracoes_clinica FOR SELECT USING (true);

DROP POLICY IF EXISTS "configuracoes_clinica_update" ON public.configuracoes_clinica;
CREATE POLICY "configuracoes_clinica_update"
  ON public.configuracoes_clinica FOR UPDATE USING (true) WITH CHECK (true);

-- 2) Bucket de storage para a logo (público para leitura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas do bucket: leitura pública, escrita liberada para o app
DROP POLICY IF EXISTS "branding_select" ON storage.objects;
CREATE POLICY "branding_select"
  ON storage.objects FOR SELECT USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "branding_insert" ON storage.objects;
CREATE POLICY "branding_insert"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "branding_update" ON storage.objects;
CREATE POLICY "branding_update"
  ON storage.objects FOR UPDATE USING (bucket_id = 'branding') WITH CHECK (bucket_id = 'branding');

DROP POLICY IF EXISTS "branding_delete" ON storage.objects;
CREATE POLICY "branding_delete"
  ON storage.objects FOR DELETE USING (bucket_id = 'branding');
