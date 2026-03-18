import { FormaPagamentoItem, CategoriaPagamentoItem, PagamentoInput, RecebimentoInput } from "../lib/types/financeiro";

// Mocks de dados de lookup
const mockFormas: FormaPagamentoItem[] = [
  { id: "fp-1", nome: "PIX", tipo: "ambos" },
  { id: "fp-2", nome: "Cartão de Crédito", tipo: "recebimento" },
  { id: "fp-3", nome: "Boleto", tipo: "pagamento" },
];

const mockCategorias: CategoriaPagamentoItem[] = [
  { id: "cat-1", nome: "Energia Elétrica" },
  { id: "cat-2", nome: "Material de Consumo" },
];

// Funções puras extraídas dos componentes para teste

// 1. Mapeamento de nome de forma de pagamento para slug legado (Recebimentos e Pagamentos)
function slugFromNome(nome: string): string | null {
  const map: Record<string, string> = {
    "Dinheiro":          "dinheiro",
    "PIX":               "pix",
    "Cartão de Crédito": "cartao_credito",
    "Cartão de Débito":  "cartao_debito",
    "Transferência":     "transferencia",
    "Boleto":            "boleto",
    "Cheque":            "cheque",
  };
  return map[nome] ?? null;
}

// 2. Geração de datas recorrentes
function gerarDatasRecorrentes(base: string, qtd: number): string[] {
  const [y, m, d] = base.split("-").map(Number);
  const datas: string[] = [];
  for (let i = 1; i <= qtd; i++) {
    let nm = m + i;
    let ny = y;
    while (nm > 12) { nm -= 12; ny++; }
    const maxDia = new Date(ny, nm, 0).getDate();
    const dia = Math.min(d, maxDia);
    datas.push(`${String(ny).padStart(4,"0")}-${String(nm).padStart(2,"0")}-${String(dia).padStart(2,"0")}`);
  }
  return datas;
}

// 3. Verificação de duplicidade de pagamentos
function verificarDuplicidade(
  novoPagamento: Partial<PagamentoInput>,
  existentes: any[],
  categorias: CategoriaPagamentoItem[]
): boolean {
  const catNomeNovo = novoPagamento.categoria_id
    ? (categorias.find(c => c.id === novoPagamento.categoria_id)?.nome ?? novoPagamento.categoria)
    : novoPagamento.categoria;

  if (!catNomeNovo || !novoPagamento.data_vencimento) return false;

  return existentes.some(p => {
    const pCat = p.categoria_id
      ? (categorias.find(c => c.id === p.categoria_id)?.nome ?? p.categoria)
      : p.categoria;
    return pCat === catNomeNovo && p.data_vencimento === novoPagamento.data_vencimento;
  });
}

describe("Módulo Financeiro - Regras de Negócio e Integração", () => {
  describe("Mapeamento de Formas de Pagamento (Compatibilidade Legada)", () => {
    it("deve mapear corretamente os nomes do banco para os slugs esperados", () => {
      expect(slugFromNome("PIX")).toBe("pix");
      expect(slugFromNome("Cartão de Crédito")).toBe("cartao_credito");
      expect(slugFromNome("Boleto")).toBe("boleto");
    });

    it("deve retornar null para formas de pagamento não mapeadas", () => {
      expect(slugFromNome("Vale Refeição")).toBeNull();
      expect(slugFromNome("")).toBeNull();
    });
  });

  describe("Geração de Parcelas Recorrentes", () => {
    it("deve gerar os próximos 3 meses mantendo o mesmo dia", () => {
      const base = "2026-03-15";
      const datas = gerarDatasRecorrentes(base, 3);
      expect(datas).toEqual([
        "2026-04-15",
        "2026-05-15",
        "2026-06-15"
      ]);
    });

    it("deve ajustar para o último dia do mês quando o mês seguinte for mais curto", () => {
      const base = "2026-01-31";
      const datas = gerarDatasRecorrentes(base, 1);
      // 2026 não é bissexto, então fevereiro tem 28 dias
      expect(datas).toEqual(["2026-02-28"]);
    });

    it("deve virar o ano corretamente", () => {
      const base = "2026-11-10";
      const datas = gerarDatasRecorrentes(base, 3);
      expect(datas).toEqual([
        "2026-12-10",
        "2027-01-10",
        "2027-02-10"
      ]);
    });
  });

  describe("Detecção de Duplicidade de Pagamentos", () => {
    const pagamentosExistentes = [
      { id: "1", categoria: "Energia Elétrica", categoria_id: null, data_vencimento: "2026-03-10" },
      { id: "2", categoria: null, categoria_id: "cat-2", data_vencimento: "2026-03-15" }, // Material de Consumo
    ];

    it("deve detectar duplicidade quando um novo pagamento usa a mesma categoria (TEXT) e data", () => {
      const novo = { categoria: "Energia Elétrica", data_vencimento: "2026-03-10" };
      expect(verificarDuplicidade(novo, pagamentosExistentes, mockCategorias)).toBe(true);
    });

    it("deve detectar duplicidade cruzando categoria_id (novo) com categoria TEXT (legado)", () => {
      // Novo pagamento usando ID "cat-1" (que resolve para "Energia Elétrica")
      const novo = { categoria_id: "cat-1", data_vencimento: "2026-03-10" };
      expect(verificarDuplicidade(novo, pagamentosExistentes, mockCategorias)).toBe(true);
    });

    it("deve detectar duplicidade cruzando categoria TEXT (novo) com categoria_id (legado)", () => {
      // Novo pagamento usando TEXT "Material de Consumo"
      const novo = { categoria: "Material de Consumo", data_vencimento: "2026-03-15" };
      expect(verificarDuplicidade(novo, pagamentosExistentes, mockCategorias)).toBe(true);
    });

    it("não deve detectar duplicidade se a data for diferente", () => {
      const novo = { categoria_id: "cat-1", data_vencimento: "2026-03-11" };
      expect(verificarDuplicidade(novo, pagamentosExistentes, mockCategorias)).toBe(false);
    });

    it("não deve detectar duplicidade se a categoria for diferente", () => {
      const novo = { categoria_id: "cat-2", data_vencimento: "2026-03-10" };
      expect(verificarDuplicidade(novo, pagamentosExistentes, mockCategorias)).toBe(false);
    });
  });
});
