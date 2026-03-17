/**
 * Testes automatizados para as validações de duplicidade e inconsistência
 * implementadas na página de Configurações da Clínica de Fisioterapia.
 *
 * Cobertura:
 * - Duplicidade de nome em Formas de Pagamento
 * - Duplicidade de nome em Categorias de Pagamento
 * - Validação de percentual de comissão (0–100%)
 * - Procedimentos disponíveis (sem duplicidade por profissional)
 * - Validações de campos obrigatórios
 */

import {
  temNomeDuplicado,
  mensagemDuplicadaFormaPagamento,
  mensagemDuplicadaCategoria,
  validarPercentualComissao,
  procedimentosDisponiveis,
  validarNomeObrigatorio,
  validarProcedimentoSelecionado,
  type ItemComNome,
  type ComissaoItem,
} from "@/lib/validacoes-configuracoes";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const formasPagamento: ItemComNome[] = [
  { id: "fp-1", nome: "PIX" },
  { id: "fp-2", nome: "Dinheiro" },
  { id: "fp-3", nome: "Cartão de Crédito" },
  { id: "fp-4", nome: "Transferência" },
];

const categorias: ItemComNome[] = [
  { id: "cat-1", nome: "Aluguel" },
  { id: "cat-2", nome: "Energia Elétrica" },
  { id: "cat-3", nome: "Internet" },
  { id: "cat-4", nome: "Salários" },
];

const procedimentos = [
  { id: "proc-1", nome: "Fisioterapia" },
  { id: "proc-2", nome: "Pilates" },
  { id: "proc-3", nome: "Acupuntura" },
  { id: "proc-4", nome: "Laserterapia" },
];

const comissoes: ComissaoItem[] = [
  { id: "com-1", profissional_id: "prof-1", procedimento_id: "proc-1", percentual: 20 },
  { id: "com-2", profissional_id: "prof-1", procedimento_id: "proc-2", percentual: 15 },
  { id: "com-3", profissional_id: "prof-2", procedimento_id: "proc-1", percentual: 25 },
];

// ─── 1. Duplicidade em Formas de Pagamento ────────────────────────────────────

describe("temNomeDuplicado — Formas de Pagamento", () => {
  test("retorna true ao tentar cadastrar nome já existente (exato)", () => {
    expect(temNomeDuplicado(formasPagamento, "PIX")).toBe(true);
  });

  test("retorna true ao tentar cadastrar nome já existente (case-insensitive)", () => {
    expect(temNomeDuplicado(formasPagamento, "pix")).toBe(true);
    expect(temNomeDuplicado(formasPagamento, "PIX")).toBe(true);
    expect(temNomeDuplicado(formasPagamento, "Pix")).toBe(true);
  });

  test("retorna true ao tentar cadastrar nome com espaços extras", () => {
    expect(temNomeDuplicado(formasPagamento, "  PIX  ")).toBe(true);
  });

  test("retorna false para nome novo que não existe", () => {
    expect(temNomeDuplicado(formasPagamento, "Boleto")).toBe(false);
  });

  test("retorna false ao editar mantendo o mesmo nome (não conflita consigo mesmo)", () => {
    expect(temNomeDuplicado(formasPagamento, "PIX", "fp-1")).toBe(false);
  });

  test("retorna true ao editar e tentar usar nome de outro item", () => {
    expect(temNomeDuplicado(formasPagamento, "Dinheiro", "fp-1")).toBe(true);
  });

  test("retorna false em lista vazia", () => {
    expect(temNomeDuplicado([], "PIX")).toBe(false);
  });

  test("retorna false para nome com variação de acentuação (tratado como diferente)", () => {
    expect(temNomeDuplicado(formasPagamento, "Cartao de Credito")).toBe(false);
  });
});

// ─── 2. Duplicidade em Categorias de Pagamento ───────────────────────────────

describe("temNomeDuplicado — Categorias de Pagamento", () => {
  test("retorna true ao tentar cadastrar categoria já existente", () => {
    expect(temNomeDuplicado(categorias, "Aluguel")).toBe(true);
  });

  test("retorna true com variação de caixa (case-insensitive)", () => {
    expect(temNomeDuplicado(categorias, "aluguel")).toBe(true);
    expect(temNomeDuplicado(categorias, "ALUGUEL")).toBe(true);
  });

  test("retorna false para categoria nova", () => {
    expect(temNomeDuplicado(categorias, "Manutenção")).toBe(false);
  });

  test("retorna false ao editar mantendo o mesmo nome", () => {
    expect(temNomeDuplicado(categorias, "Salários", "cat-4")).toBe(false);
  });

  test("retorna true ao editar e tentar usar nome de outra categoria", () => {
    expect(temNomeDuplicado(categorias, "Internet", "cat-1")).toBe(true);
  });
});

// ─── 3. Mensagens de Erro de Duplicidade ─────────────────────────────────────

describe("mensagens de duplicidade", () => {
  test("mensagem correta para forma de pagamento duplicada", () => {
    const msg = mensagemDuplicadaFormaPagamento("PIX");
    expect(msg).toBe('Já existe uma forma de pagamento com o nome "PIX".');
  });

  test("mensagem correta para categoria duplicada", () => {
    const msg = mensagemDuplicadaCategoria("Aluguel");
    expect(msg).toBe('Já existe uma categoria com o nome "Aluguel".');
  });

  test("mensagem remove espaços extras do nome", () => {
    const msg = mensagemDuplicadaFormaPagamento("  PIX  ");
    expect(msg).toBe('Já existe uma forma de pagamento com o nome "PIX".');
  });
});

// ─── 4. Validação de Percentual de Comissão ──────────────────────────────────

describe("validarPercentualComissao", () => {
  // Casos válidos
  test("aceita percentual 0 (zero comissão)", () => {
    const resultado = validarPercentualComissao("0");
    expect(resultado.valido).toBe(true);
    if (resultado.valido) expect(resultado.valor).toBe(0);
  });

  test("aceita percentual 100 (comissão total)", () => {
    const resultado = validarPercentualComissao("100");
    expect(resultado.valido).toBe(true);
    if (resultado.valido) expect(resultado.valor).toBe(100);
  });

  test("aceita percentual decimal (ex: 12.5)", () => {
    const resultado = validarPercentualComissao("12.5");
    expect(resultado.valido).toBe(true);
    if (resultado.valido) expect(resultado.valor).toBe(12.5);
  });

  test("aceita percentual 50", () => {
    const resultado = validarPercentualComissao("50");
    expect(resultado.valido).toBe(true);
    if (resultado.valido) expect(resultado.valor).toBe(50);
  });

  // Casos inválidos
  test("rejeita campo vazio", () => {
    const resultado = validarPercentualComissao("");
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("Informe o percentual de comissão.");
  });

  test("rejeita campo undefined", () => {
    const resultado = validarPercentualComissao(undefined);
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("Informe o percentual de comissão.");
  });

  test("rejeita campo null", () => {
    const resultado = validarPercentualComissao(null);
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("Informe o percentual de comissão.");
  });

  test("rejeita texto não numérico", () => {
    const resultado = validarPercentualComissao("abc");
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("O percentual deve ser um número válido.");
  });

  test("rejeita percentual negativo", () => {
    const resultado = validarPercentualComissao("-5");
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("O percentual deve ser um número positivo.");
  });

  test("rejeita percentual acima de 100", () => {
    const resultado = validarPercentualComissao("101");
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("O percentual não pode ser superior a 100%.");
  });

  test("rejeita percentual 100.01 (acima do limite)", () => {
    const resultado = validarPercentualComissao("100.01");
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("O percentual não pode ser superior a 100%.");
  });

  test("rejeita percentual 999", () => {
    const resultado = validarPercentualComissao("999");
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) expect(resultado.erro).toBe("O percentual não pode ser superior a 100%.");
  });
});

// ─── 5. Procedimentos Disponíveis (sem duplicidade por profissional) ──────────

describe("procedimentosDisponiveis", () => {
  test("retorna apenas procedimentos não vinculados ao profissional", () => {
    const disponiveis = procedimentosDisponiveis(comissoes, "prof-1", procedimentos);
    const ids = disponiveis.map((p) => p.id);
    expect(ids).not.toContain("proc-1"); // Fisioterapia já vinculada
    expect(ids).not.toContain("proc-2"); // Pilates já vinculada
    expect(ids).toContain("proc-3");     // Acupuntura disponível
    expect(ids).toContain("proc-4");     // Laserterapia disponível
  });

  test("retorna todos os procedimentos para profissional sem comissões", () => {
    const disponiveis = procedimentosDisponiveis(comissoes, "prof-99", procedimentos);
    expect(disponiveis).toHaveLength(4);
  });

  test("retorna lista vazia se todos os procedimentos já estiverem vinculados", () => {
    const todasComissoes: ComissaoItem[] = procedimentos.map((p, i) => ({
      id: `com-${i}`,
      profissional_id: "prof-1",
      procedimento_id: p.id,
      percentual: 10,
    }));
    const disponiveis = procedimentosDisponiveis(todasComissoes, "prof-1", procedimentos);
    expect(disponiveis).toHaveLength(0);
  });

  test("não afeta a lista de outro profissional", () => {
    // prof-2 só tem proc-1 vinculado
    const disponiveis = procedimentosDisponiveis(comissoes, "prof-2", procedimentos);
    const ids = disponiveis.map((p) => p.id);
    expect(ids).not.toContain("proc-1"); // já vinculado
    expect(ids).toContain("proc-2");
    expect(ids).toContain("proc-3");
    expect(ids).toContain("proc-4");
  });

  test("retorna todos quando não há comissões cadastradas", () => {
    const disponiveis = procedimentosDisponiveis([], "prof-1", procedimentos);
    expect(disponiveis).toHaveLength(4);
  });
});

// ─── 6. Validação de Nome Obrigatório ─────────────────────────────────────────

describe("validarNomeObrigatorio", () => {
  test("retorna null para nome válido", () => {
    expect(validarNomeObrigatorio("Fisioterapia")).toBeNull();
  });

  test("retorna erro para string vazia", () => {
    expect(validarNomeObrigatorio("")).toBe("O nome é obrigatório.");
  });

  test("retorna erro para string com apenas espaços", () => {
    expect(validarNomeObrigatorio("   ")).toBe("O nome é obrigatório.");
  });

  test("retorna erro para undefined", () => {
    expect(validarNomeObrigatorio(undefined)).toBe("O nome é obrigatório.");
  });

  test("retorna erro para null", () => {
    expect(validarNomeObrigatorio(null)).toBe("O nome é obrigatório.");
  });

  test("aceita nome com espaços internos", () => {
    expect(validarNomeObrigatorio("Drenagem Linfática")).toBeNull();
  });
});

// ─── 7. Validação de Procedimento Selecionado ─────────────────────────────────

describe("validarProcedimentoSelecionado", () => {
  test("retorna null quando procedimento está selecionado no modo novo", () => {
    expect(validarProcedimentoSelecionado("proc-1", true)).toBeNull();
  });

  test("retorna erro quando procedimento não selecionado no modo novo", () => {
    expect(validarProcedimentoSelecionado(undefined, true)).toBe("Selecione um procedimento.");
    expect(validarProcedimentoSelecionado("", true)).toBe("Selecione um procedimento.");
    expect(validarProcedimentoSelecionado(null, true)).toBe("Selecione um procedimento.");
  });

  test("retorna null no modo edição mesmo sem procedimento (não é obrigatório reeditar)", () => {
    expect(validarProcedimentoSelecionado(undefined, false)).toBeNull();
    expect(validarProcedimentoSelecionado("", false)).toBeNull();
  });
});

// ─── 8. Casos de Borda e Integração ──────────────────────────────────────────

describe("casos de borda e integração", () => {
  test("fluxo completo: nome duplicado bloqueia antes de chamar API", () => {
    const nome = "PIX";
    const erroNome = validarNomeObrigatorio(nome);
    expect(erroNome).toBeNull(); // nome não está vazio

    const duplicado = temNomeDuplicado(formasPagamento, nome);
    expect(duplicado).toBe(true); // deve ser bloqueado aqui

    const mensagem = mensagemDuplicadaFormaPagamento(nome);
    expect(mensagem).toContain("PIX");
  });

  test("fluxo completo: percentual inválido bloqueia antes de chamar API", () => {
    const percentual = "150";
    const resultado = validarPercentualComissao(percentual);
    expect(resultado.valido).toBe(false);
    if (!resultado.valido) {
      expect(resultado.erro).toContain("100%");
    }
  });

  test("fluxo completo: novo item válido passa todas as validações", () => {
    const nome = "Cheque";
    expect(validarNomeObrigatorio(nome)).toBeNull();
    expect(temNomeDuplicado(formasPagamento, nome)).toBe(false);
  });

  test("fluxo completo: nova comissão válida passa todas as validações", () => {
    const percentual = "30";
    const procedimentoId = "proc-3";
    const profissionalId = "prof-1";

    const resultadoPerc = validarPercentualComissao(percentual);
    expect(resultadoPerc.valido).toBe(true);

    const erroProcedimento = validarProcedimentoSelecionado(procedimentoId, true);
    expect(erroProcedimento).toBeNull();

    const disponiveis = procedimentosDisponiveis(comissoes, profissionalId, procedimentos);
    const disponivel = disponiveis.some((p) => p.id === procedimentoId);
    expect(disponivel).toBe(true); // proc-3 (Acupuntura) ainda não vinculada
  });
});
