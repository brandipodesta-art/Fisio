-- ═══════════════════════════════════════════════════════════════
-- Criação da Tabela de Taxas de Cartão e Campos Financeiros
-- Executar no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1) Tabela de taxas de cartão por bandeira
CREATE TABLE IF NOT EXISTS public.taxas_cartao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bandeira TEXT NOT NULL UNIQUE CHECK (bandeira IN ('ELO', 'MASTER', 'VISA')),
  debito NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (debito >= 0 AND debito <= 100),
  credito NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (credito >= 0 AND credito <= 100),
  parcelado_2_6 NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (parcelado_2_6 >= 0 AND parcelado_2_6 <= 100),
  parcelado_7_12 NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (parcelado_7_12 >= 0 AND parcelado_7_12 <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dados iniciais (planilha do cliente)
INSERT INTO public.taxas_cartao (bandeira, debito, credito, parcelado_2_6, parcelado_7_12)
VALUES 
  ('ELO', 0.97, 2.08, 2.60, 2.97),
  ('MASTER', 0.97, 2.08, 2.60, 2.97),
  ('VISA', 0.97, 2.08, 2.60, 2.97)
ON CONFLICT (bandeira) DO NOTHING;

-- RLS liberada para o app (mesmo padrão das demais tabelas de config)
ALTER TABLE public.taxas_cartao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_taxas_cartao" ON public.taxas_cartao;
CREATE POLICY "allow_all_taxas_cartao" ON public.taxas_cartao FOR ALL USING (true) WITH CHECK (true);

-- 2) Adição de colunas na tabela de configuração (configuracoes_clinica) para PIX e Antecipação
ALTER TABLE public.configuracoes_clinica ADD COLUMN IF NOT EXISTS taxa_pix NUMERIC(5,2) DEFAULT 0.00 CHECK (taxa_pix >= 0 AND taxa_pix <= 100);
ALTER TABLE public.configuracoes_clinica ADD COLUMN IF NOT EXISTS taxa_antecipacao NUMERIC(5,2) DEFAULT 1.54 CHECK (taxa_antecipacao >= 0 AND taxa_antecipacao <= 100);

-- Garante que se a tabela já existe com dados, estas colunas comecem com os valores padrão
UPDATE public.configuracoes_clinica SET taxa_pix = 0.00 WHERE taxa_pix IS NULL;
UPDATE public.configuracoes_clinica SET taxa_antecipacao = 1.54 WHERE taxa_antecipacao IS NULL;

-- 3) Adição de colunas na tabela de recebimentos para gravar os detalhes do cartão e a taxa calculada
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS cartao_bandeira TEXT CHECK (cartao_bandeira IN ('ELO', 'MASTER', 'VISA'));
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS cartao_tipo TEXT CHECK (cartao_tipo IN ('debito', 'credito', 'parcelado_2_6', 'parcelado_7_12'));
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS cartao_antecipado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS taxa_valor NUMERIC(10,2) DEFAULT 0 CHECK (taxa_valor >= 0);
ALTER TABLE public.recebimentos ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC(10,2);

-- Preenche registros antigos com valor_liquido = valor para manter integridade
UPDATE public.recebimentos SET valor_liquido = valor WHERE valor_liquido IS NULL;
UPDATE public.recebimentos SET taxa_valor = 0 WHERE taxa_valor IS NULL;
UPDATE public.recebimentos SET cartao_antecipado = FALSE WHERE cartao_antecipado IS NULL;
