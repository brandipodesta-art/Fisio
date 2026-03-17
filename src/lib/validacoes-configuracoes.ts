/**
 * Funções de validação puras extraídas do ConfiguracoesPage.
 * Testáveis de forma isolada, sem dependência de React ou Supabase.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ItemComNome {
  id: string;
  nome: string;
}

export interface ItemComName {
  id: string;
  name: string;
}

export interface ComissaoItem {
  id: string;
  profissional_id: string;
  procedimento_id: string;
  percentual: number;
}

// ─── Validações de Nome Duplicado ─────────────────────────────────────────────

/**
 * Verifica se já existe um item com o mesmo nome (case-insensitive),
 * excluindo o item que está sendo editado (pelo id).
 *
 * @param itens     Lista de itens existentes
 * @param nome      Nome a ser verificado
 * @param idAtual   ID do item em edição (undefined para novo item)
 * @returns true se houver duplicata
 */
export function temNomeDuplicado(
  itens: ItemComNome[],
  nome: string,
  idAtual?: string
): boolean {
  const nomeNormalizado = nome.trim().toLowerCase();
  return itens.some(
    (i) => i.nome.toLowerCase() === nomeNormalizado && i.id !== idAtual
  );
}

/**
 * Retorna a mensagem de erro para nome duplicado em formas de pagamento.
 */
export function mensagemDuplicadaFormaPagamento(nome: string): string {
  return `Já existe uma forma de pagamento com o nome "${nome.trim()}".`;
}

/**
 * Retorna a mensagem de erro para nome duplicado em categorias.
 */
export function mensagemDuplicadaCategoria(nome: string): string {
  return `Já existe uma categoria com o nome "${nome.trim()}".`;
}

// ─── Validação de Percentual de Comissão ─────────────────────────────────────

export type ResultadoValidacaoPercentual =
  | { valido: true; valor: number }
  | { valido: false; erro: string };

/**
 * Valida o percentual de comissão informado pelo usuário.
 *
 * Regras:
 * - Campo obrigatório
 * - Deve ser um número válido
 * - Deve ser >= 0
 * - Deve ser <= 100
 */
export function validarPercentualComissao(
  valor: string | undefined | null
): ResultadoValidacaoPercentual {
  if (!valor || valor.trim() === "") {
    return { valido: false, erro: "Informe o percentual de comissão." };
  }
  const perc = parseFloat(valor);
  if (isNaN(perc)) {
    return { valido: false, erro: "O percentual deve ser um número válido." };
  }
  if (perc < 0) {
    return { valido: false, erro: "O percentual deve ser um número positivo." };
  }
  if (perc > 100) {
    return { valido: false, erro: "O percentual não pode ser superior a 100%." };
  }
  return { valido: true, valor: perc };
}

// ─── Validação de Procedimento Já Vinculado ───────────────────────────────────

/**
 * Retorna os IDs de procedimentos que ainda não foram vinculados
 * ao profissional informado.
 *
 * @param todasComissoes   Lista completa de comissões
 * @param profissionalId   ID do profissional
 * @param todosProcedimentos  Lista de todos os procedimentos disponíveis
 */
export function procedimentosDisponiveis(
  todasComissoes: ComissaoItem[],
  profissionalId: string,
  todosProcedimentos: { id: string; nome: string }[]
): { id: string; nome: string }[] {
  const jaVinculados = new Set(
    todasComissoes
      .filter((c) => c.profissional_id === profissionalId)
      .map((c) => c.procedimento_id)
  );
  return todosProcedimentos.filter((p) => !jaVinculados.has(p.id));
}

// ─── Validação de Nome Obrigatório ────────────────────────────────────────────

/**
 * Valida se o nome informado não está vazio.
 */
export function validarNomeObrigatorio(nome: string | undefined | null): string | null {
  if (!nome || nome.trim() === "") {
    return "O nome é obrigatório.";
  }
  return null;
}

// ─── Validação de Procedimento Selecionado ────────────────────────────────────

/**
 * Valida se um procedimento foi selecionado ao criar nova comissão.
 */
export function validarProcedimentoSelecionado(
  procedimentoId: string | undefined | null,
  modoNovo: boolean
): string | null {
  if (modoNovo && (!procedimentoId || procedimentoId.trim() === "")) {
    return "Selecione um procedimento.";
  }
  return null;
}
