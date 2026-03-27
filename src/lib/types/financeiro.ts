// ─── Tipos do Módulo Financeiro ───────────────────────────────────────────────

export type StatusRecebimento = "pendente" | "recebido" | "atrasado" | "cancelado";
export type StatusPagamento   = "pendente" | "pago"     | "atrasado" | "cancelado";
export type FormaPagamento    = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "transferencia" | "boleto" | "cheque" | "outro";

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  dinheiro:        "Dinheiro",
  pix:             "PIX",
  cartao_credito:  "Cartão de Crédito",
  cartao_debito:   "Cartão de Débito",
  transferencia:   "Transferência Bancária",
  boleto:          "Boleto",
  cheque:          "Cheque",
  outro:           "Outro",
};

// ─── Interfaces de lookup (carregadas dinamicamente do banco) ─────────────────

export interface FormaPagamentoItem {
  id: string;   // UUID
  nome: string;
  tipo: "recebimento" | "pagamento" | "ambos";
}

export interface CategoriaPagamentoItem {
  id: string;   // UUID
  nome: string;
}

export interface ProcedimentoItem {
  id: string;   // UUID
  nome: string;
  valor_padrao: number | null;
}

// ─── Recebimento ──────────────────────────────────────────────────────────────

export interface Recebimento {
  id: string;
  paciente_id: string | null;
  paciente_nome: string | null;
  // Vínculo com procedimento (UUID FK → procedimentos.id)
  procedimento_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;       // ISO date "YYYY-MM-DD"
  data_pagamento: string | null; // ISO date "YYYY-MM-DD"
  status: StatusRecebimento;
  // Campo legado (TEXT slug) — mantido para leitura de registros antigos
  forma_pagamento: FormaPagamento | null;
  // Campo novo (UUID FK) — usado em novos registros e edições
  forma_pagamento_id: string | null;
  observacoes: string | null;
  created_at: string;
  /** Nome do usuário que confirmou o recebimento */
  confirmado_por: string | null;
  /** ID do usuário que confirmou o recebimento (FK → usuarios_acesso.id) */
  confirmado_por_id: string | null;
}

export type RecebimentoInput = Omit<Recebimento, "id" | "created_at">;

// ─── Pagamento ────────────────────────────────────────────────────────────────

export interface Pagamento {
  id: string;
  descricao: string;
  // Campo legado (TEXT nome) — mantido para leitura de registros antigos
  categoria: string | null;
  // Campo novo (UUID FK) — usado em novos registros e edições
  categoria_id: string | null;
  valor: number;
  data_vencimento: string;        // ISO date "YYYY-MM-DD"
  data_pagamento: string | null;  // ISO date "YYYY-MM-DD"
  status: StatusPagamento;
  // Campo legado (TEXT slug) — mantido para leitura de registros antigos
  forma_pagamento: FormaPagamento | null;
  // Campo novo (UUID FK) — usado em novos registros e edições
  forma_pagamento_id: string | null;
  fornecedor: string | null;
  observacoes: string | null;
  created_at: string;
}

export type PagamentoInput = Omit<Pagamento, "id" | "created_at">;

// ─── Comissão por Profissional ────────────────────────────────────────────────

export interface ComissaoProfissional {
  profissional_id: string;   // TEXT slug (ex: "terezinha-de-jesus")
  profissional_nome: string;
  procedimento_id: string;   // UUID
  procedimento_nome: string;
  percentual: number;        // 0-100
  valor_recebido: number;    // soma dos recebimentos com status=recebido
  valor_comissao: number;    // valor_recebido * percentual / 100
}

// ─── Resumo Financeiro ────────────────────────────────────────────────────────

export interface ResumoFinanceiro {
  totalRecebido: number;
  totalPendente: number;
  totalAtrasado: number;
  totalPago: number;
  totalDespesasPendentes: number;
  saldoLiquido: number;
  recebimentosPorMes: { mes: string; valor: number }[];
  pagamentosPorMes:   { mes: string; valor: number }[];
}
