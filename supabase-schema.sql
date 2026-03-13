-- ==============================================================================
-- 🏥 Fisio App - Supabase Schema Migration
-- Instruções: Copie este código e cole no SQL Editor do seu Supabase.
-- Depois, clique em "Run" (Executar) para criar todas as tabelas.
-- ==============================================================================

-- 1. Tabela de Profissionais (Fisioterapeutas)
CREATE TABLE IF NOT EXISTS public.profissionais (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    color TEXT NOT NULL,
    bg_color TEXT NOT NULL,
    border_color TEXT NOT NULL,
    text_color TEXT NOT NULL
);

-- Inserir os profissionais padrão
INSERT INTO public.profissionais (id, name, short_name, color, bg_color, border_color, text_color)
VALUES 
    ('ana-carolina', 'Ana Carolina', 'Ana C.', '#10b981', 'bg-emerald-100', 'border-emerald-200', 'text-emerald-700'),
    ('amanda-augusta', 'Amanda Augusta', 'Amanda A.', '#3b82f6', 'bg-blue-100', 'border-blue-200', 'text-blue-700'),
    ('aline-pereira', 'Aline Pereira', 'Aline P.', '#f97316', 'bg-orange-100', 'border-orange-200', 'text-orange-700')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Pacientes
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    tipo_usuario TEXT,
    profissional_responsavel TEXT,
    nome_completo TEXT NOT NULL,
    cpf TEXT,
    rg TEXT,
    data_nascimento TEXT,
    estado_civil TEXT,
    profissao TEXT,
    telefone_fixo TEXT,
    telefone_cel TEXT,
    como_ficou_sabendo TEXT,
    cep TEXT,
    rua TEXT,
    numero TEXT,
    bairro TEXT,
    complemento TEXT,
    cidade TEXT,
    emitir_nf TEXT,
    nf_cpf_cnpj TEXT,
    nf_nome_completo TEXT,
    nf_cep TEXT,
    nf_rua TEXT,
    nf_numero TEXT,
    nf_bairro TEXT,
    nf_complemento TEXT,
    nf_cidade TEXT,
    nf_telefone_cel TEXT
);

-- 3. Tabela de Agendamentos (AgendaPage)
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    patient_name TEXT NOT NULL,
    professional_id TEXT REFERENCES public.profissionais(id),
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT
);

-- 4. Tabela de Evoluções Clínicas
CREATE TABLE IF NOT EXISTS public.evolucoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    data_salva TEXT NOT NULL,
    hora_salva TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabelas Filhas para o Histórico do Cliente
CREATE TABLE IF NOT EXISTS public.exames (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    data TEXT NOT NULL,
    resultado TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.frequencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    mes TEXT NOT NULL,
    presencas INT NOT NULL DEFAULT 0,
    faltas INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.financeiro_paciente (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data TEXT NOT NULL,
    status TEXT NOT NULL
);

-- ==============================================================================
-- DESLIGAR RLS (Row Level Security) TEMPORARIAMENTE PARA O MVP FUNCIONAR SEM LOGIN
-- Como o Auth do front-end ainda não está forçando sessão de usuário, precisamos
-- expor essas tabelas localmente de modo público e rápido.
-- ==============================================================================
ALTER TABLE public.profissionais DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolucoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_paciente DISABLE ROW LEVEL SECURITY;

-- No entanto, mesmo com o RLS desabilitado, dependendo das configs do seu Supabase,
-- tabelas criadas a partir do editor ainda precisam não ter políticas bloqueando (o que é true se disable),
-- ou pode ser desejado habilitar a flag Anon public usage:
GRANT ALL ON TABLE public.profissionais TO anon, authenticated;
GRANT ALL ON TABLE public.pacientes TO anon, authenticated;
GRANT ALL ON TABLE public.agendamentos TO anon, authenticated;
GRANT ALL ON TABLE public.evolucoes TO anon, authenticated;
GRANT ALL ON TABLE public.exames TO anon, authenticated;
GRANT ALL ON TABLE public.frequencias TO anon, authenticated;
GRANT ALL ON TABLE public.financeiro_paciente TO anon, authenticated;
