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

export const CATEGORIA_PAGAMENTO = [
  "Aluguel",
  "Energia Elétrica",
  "Água",
  "Internet / Telefone",
  "Equipamentos",
  "Material de Consumo",
  "Salários",
  "Impostos / Taxas",
  "Manutenção",
  "Marketing",
  "Seguros",
  "Outros",
] as const;

export type CategoriaPagamento = typeof CATEGORIA_PAGAMENTO[number];

// ─── Recebimento ──────────────────────────────────────────────────────────────

export interface Recebimento {
  id: string;
  paciente_id: string | null;
  paciente_nome: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;       // ISO date "YYYY-MM-DD"
  data_pagamento: string | null; // ISO date "YYYY-MM-DD"
  status: StatusRecebimento;
  forma_pagamento: FormaPagamento | null;
  observacoes: string | null;
  created_at: string;
}

export type RecebimentoInput = Omit<Recebimento, "id" | "created_at">;

// ─── Pagamento ────────────────────────────────────────────────────────────────

export interface Pagamento {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data_vencimento: string;       // ISO date "YYYY-MM-DD"
  data_pagamento: string | null; // ISO date "YYYY-MM-DD"
  status: StatusPagamento;
  forma_pagamento: FormaPagamento | null;
  fornecedor: string | null;
  observacoes: string | null;
  created_at: string;
}

export type PagamentoInput = Omit<Pagamento, "id" | "created_at">;

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
