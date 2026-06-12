-- Executar no SQL Editor do seu Supabase para adicionar o suporte a cores de tema
ALTER TABLE public.configuracoes_clinica ADD COLUMN IF NOT EXISTS cor_tema TEXT DEFAULT 'verde';
