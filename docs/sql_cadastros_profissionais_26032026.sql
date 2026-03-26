-- ─── Migração: Criar cadastros na tabela pacientes para profissionais sem cadastro ───
-- Data: 26/03/2026
-- Motivo: Ana Carolina, Amanda Augusta e Aline Pereira existiam apenas na tabela
--         profissionais (para vinculação de pacientes), mas não tinham cadastro
--         na tabela pacientes, portanto não apareciam em Clientes Cadastrados.

-- Ana Carolina (já existia — criada anteriormente)
-- Amanda Augusta
INSERT INTO pacientes (nome_completo, tipo_usuario, cpf, ativo, profissional_responsavel,
  rg, estado_civil, profissao, telefone_fixo, telefone_cel, como_ficou_sabendo,
  cep, rua, numero, bairro, complemento, cidade,
  emitir_nf, nf_cpf_cnpj, nf_nome_completo, nf_cep, nf_rua, nf_numero,
  nf_bairro, nf_complemento, nf_cidade, nf_telefone_cel)
SELECT 'Amanda Augusta', 'funcionario', '000.000.000-02', true, null,
  '', '', 'Fisioterapeuta', '', '', '', '', '', '', '', '', '',
  'nao', '', '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE nome_completo = 'Amanda Augusta');

-- Aline Pereira
INSERT INTO pacientes (nome_completo, tipo_usuario, cpf, ativo, profissional_responsavel,
  rg, estado_civil, profissao, telefone_fixo, telefone_cel, como_ficou_sabendo,
  cep, rua, numero, bairro, complemento, cidade,
  emitir_nf, nf_cpf_cnpj, nf_nome_completo, nf_cep, nf_rua, nf_numero,
  nf_bairro, nf_complemento, nf_cidade, nf_telefone_cel)
SELECT 'Aline Pereira', 'funcionario', '000.000.000-03', true, null,
  '', '', 'Fisioterapeuta', '', '', '', '', '', '', '', '', '',
  'nao', '', '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM pacientes WHERE nome_completo = 'Aline Pereira');

-- Verificação final
SELECT id, nome_completo, tipo_usuario, ativo FROM pacientes ORDER BY nome_completo;
