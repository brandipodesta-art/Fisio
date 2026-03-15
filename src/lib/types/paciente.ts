/**
 * Tipos compartilhados para o modelo Paciente
 * Reflete exatamente a estrutura da tabela `pacientes` no Supabase
 */

/** Registro completo vindo do banco de dados */
export interface PacienteDB {
  id: string;
  created_at: string;
  tipo_usuario: string;
  profissional_responsavel: string;
  nome_completo: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  estado_civil: string;
  profissao: string;
  telefone_fixo: string;
  telefone_cel: string;
  como_ficou_sabendo: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  cidade: string;
  emitir_nf: string;
  nf_cpf_cnpj: string;
  nf_nome_completo: string;
  nf_cep: string;
  nf_rua: string;
  nf_numero: string;
  nf_bairro: string;
  nf_complemento: string;
  nf_cidade: string;
  nf_telefone_cel: string;
}

/** Payload para criação de um novo paciente (sem id e created_at) */
export type PacienteInsert = Omit<PacienteDB, "id" | "created_at">;

/** Payload para atualização parcial de um paciente */
export type PacienteUpdate = Partial<PacienteInsert>;

/** Versão resumida usada na listagem */
export interface PacienteResumo {
  id: string;
  nome_completo: string;
  cpf: string;
  tipo_usuario: string;
  profissional_responsavel: string;
  telefone_cel: string;
  data_nascimento: string;
  cidade: string;
  created_at: string;
}

/** Mapa de labels para tipo de usuário */
export const TIPO_USUARIO_LABEL: Record<string, string> = {
  paciente: "Paciente",
  funcionario: "Funcionário",
  admin: "Admin",
  financeiro: "Financeiro",
};

/** Mapa de cores Tailwind para tipo de usuário */
export const TIPO_USUARIO_COLOR: Record<string, string> = {
  paciente: "bg-emerald-100 text-emerald-700",
  funcionario: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  financeiro: "bg-amber-100 text-amber-700",
};
