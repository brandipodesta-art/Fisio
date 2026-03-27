/**
 * usePermissoes — Hook centralizado de controle de acesso por perfil
 *
 * Perfis:
 *  - admin      → acesso total, incluindo Configurações
 *  - financeiro → acesso total exceto Configurações
 *  - funcionario → acesso restrito conforme regras abaixo
 */

import { useAuth } from "./AuthContext";

export function usePermissoes() {
  const { usuario } = useAuth();
  const tipo = usuario?.tipo_usuario ?? "funcionario";

  const isAdmin      = tipo === "admin";
  const isFinanceiro = tipo === "financeiro";
  const isFuncionario = tipo === "funcionario";

  return {
    // ── Menus / Navegação ─────────────────────────────────────────────────────
    /** Pode acessar Configurações */
    podeVerConfiguracoes: isAdmin,

    // ── Cadastro / Listagem ───────────────────────────────────────────────────
    /** Pode ver registros do tipo funcionario, admin, financeiro na listagem */
    podeVerUsuariosSistema: isAdmin || isFinanceiro,

    /** Pode criar/editar tipos diferentes de paciente no formulário */
    podeSelecionarTipoUsuario: isAdmin || isFinanceiro,

    /** Pode editar cadastros (botão Editar na listagem) */
    podeEditarCadastro: isAdmin || isFinanceiro,

    /** Pode ativar/desativar cadastros */
    podeAlternarStatus: isAdmin || isFinanceiro,

    // ── Histórico / Financeiro do Paciente ────────────────────────────────────
    /** Pode confirmar pagamento no histórico do paciente */
    podeConfirmarPagamento: isAdmin || isFinanceiro,

    /** Pode alterar recebimento no histórico do paciente */
    podeAlterarRecebimento: isAdmin || isFinanceiro,

    // ── Financeiro (módulo principal) ─────────────────────────────────────────
    /** Pode acessar o módulo Financeiro */
    podeVerFinanceiro: isAdmin || isFinanceiro,

    // ── Utilitários ───────────────────────────────────────────────────────────
    tipo,
    isAdmin,
    isFinanceiro,
    isFuncionario,
  };
}
