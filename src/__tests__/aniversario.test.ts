/**
 * Testes das regras de aniversário: detecção do aniversariante do dia
 * e montagem do link de parabéns pelo WhatsApp.
 */

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));

import {
  diaMesNascimento,
  ehAniversario,
  idadeNoAniversario,
  linkWhatsAppParabens,
  normalizarNome,
  telefoneWhatsApp,
} from "@/lib/aniversario";

describe("diaMesNascimento", () => {
  it("lê o formato DD/MM/AAAA do cadastro", () => {
    expect(diaMesNascimento("17/09/1980")).toEqual({ dia: 17, mes: 9 });
  });

  it("lê o formato ISO", () => {
    expect(diaMesNascimento("1980-09-17")).toEqual({ dia: 17, mes: 9 });
    expect(diaMesNascimento("1980-09-17T00:00:00+00:00")).toEqual({ dia: 17, mes: 9 });
  });

  it("retorna null para valores vazios ou inválidos", () => {
    expect(diaMesNascimento(null)).toBeNull();
    expect(diaMesNascimento("")).toBeNull();
    expect(diaMesNascimento("17/09")).toBeNull();
    expect(diaMesNascimento("40/13/1980")).toBeNull();
  });
});

describe("ehAniversario", () => {
  it("confirma quando dia e mês coincidem", () => {
    expect(ehAniversario("17/09/1980", new Date(2026, 8, 17))).toBe(true);
    expect(ehAniversario("1980-09-17", new Date(2026, 8, 17))).toBe(true);
  });

  it("nega em outros dias", () => {
    expect(ehAniversario("17/09/1980", new Date(2026, 8, 18))).toBe(false);
    expect(ehAniversario("09/17/1980", new Date(2026, 8, 17))).toBe(false);
    expect(ehAniversario(null, new Date(2026, 8, 17))).toBe(false);
  });

  it("trata nascidos em 29/02", () => {
    expect(ehAniversario("29/02/2000", new Date(2028, 1, 29))).toBe(true);
    expect(ehAniversario("29/02/2000", new Date(2028, 1, 28))).toBe(false);
    expect(ehAniversario("29/02/2000", new Date(2027, 1, 28))).toBe(true);
  });
});

describe("idadeNoAniversario", () => {
  it("calcula a idade completada no ano", () => {
    expect(idadeNoAniversario("17/09/1980", new Date(2026, 8, 17))).toBe(46);
    expect(idadeNoAniversario("1980-09-17", new Date(2026, 8, 17))).toBe(46);
  });

  it("retorna null sem ano válido", () => {
    expect(idadeNoAniversario(null, new Date(2026, 8, 17))).toBeNull();
    expect(idadeNoAniversario("17/09/0000", new Date(2026, 8, 17))).toBeNull();
  });
});

describe("normalizarNome", () => {
  it("ignora acentos, caixa e espaços extras", () => {
    expect(normalizarNome("  Elaine  Gonçalves Sarti ")).toBe("elaine goncalves sarti");
  });
});

describe("telefoneWhatsApp", () => {
  it("acrescenta o DDI 55 a números com DDD", () => {
    expect(telefoneWhatsApp("(11) 98765-4321")).toBe("5511987654321");
    expect(telefoneWhatsApp("11 3456-7890")).toBe("551134567890");
  });

  it("mantém números que já têm DDI", () => {
    expect(telefoneWhatsApp("+55 (11) 98765-4321")).toBe("5511987654321");
  });

  it("retorna null para números sem DDD ou vazios", () => {
    expect(telefoneWhatsApp("98765-4321")).toBeNull();
    expect(telefoneWhatsApp("")).toBeNull();
    expect(telefoneWhatsApp(null)).toBeNull();
  });
});

describe("linkWhatsAppParabens", () => {
  it("monta o link com o primeiro nome e a clínica", () => {
    const link = linkWhatsAppParabens("(11) 98765-4321", "Elaine Gonçalves Sarti", "Fisio Vida");
    expect(link).toContain("https://wa.me/5511987654321?text=");
    const texto = decodeURIComponent(link!.split("?text=")[1]);
    expect(texto).toContain("Olá, Elaine!");
    expect(texto).toContain("Feliz aniversário");
    expect(texto).toContain("equipe Fisio Vida");
  });

  it("retorna null sem telefone válido", () => {
    expect(linkWhatsAppParabens(null, "Elaine")).toBeNull();
  });
});
