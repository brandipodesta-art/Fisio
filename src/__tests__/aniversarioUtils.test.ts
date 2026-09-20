import {
  parseDataNascimento,
  isAniversariante,
  calcularIdade,
  gerarLinkWhatsApp,
  extrairDiaMesReferencia,
} from "../lib/aniversarioUtils";

describe("aniversarioUtils", () => {
  describe("parseDataNascimento", () => {
    it("deve converter formato brasileiro DD/MM/AAAA", () => {
      expect(parseDataNascimento("17/09/1990")).toEqual({
        dia: 17,
        mes: 9,
        ano: 1990,
      });
    });

    it("deve converter formato brasileiro sem ano DD/MM", () => {
      expect(parseDataNascimento("17/09")).toEqual({
        dia: 17,
        mes: 9,
        ano: undefined,
      });
    });

    it("deve converter formato ISO AAAA-MM-DD", () => {
      expect(parseDataNascimento("1990-09-17")).toEqual({
        dia: 17,
        mes: 9,
        ano: 1990,
      });
    });

    it("deve retornar null para strings inválidas ou vazias", () => {
      expect(parseDataNascimento("")).toBeNull();
      expect(parseDataNascimento(null)).toBeNull();
      expect(parseDataNascimento(undefined)).toBeNull();
      expect(parseDataNascimento("invalido")).toBeNull();
      expect(parseDataNascimento("32/01/2000")).toBeNull();
    });
  });

  describe("isAniversariante", () => {
    it("deve retornar true quando o dia e mês coincidem (formato BR)", () => {
      expect(isAniversariante("17/09/1985", "2026-09-17")).toBe(true);
    });

    it("deve retornar true quando o dia e mês coincidem (formato ISO)", () => {
      expect(isAniversariante("1985-09-17", "2026-09-17")).toBe(true);
    });

    it("deve retornar false quando dia ou mês são diferentes", () => {
      expect(isAniversariante("18/09/1985", "2026-09-17")).toBe(false);
      expect(isAniversariante("17/10/1985", "2026-09-17")).toBe(false);
    });

    it("deve retornar false para valores nulos ou vazios", () => {
      expect(isAniversariante(null, "2026-09-17")).toBe(false);
      expect(isAniversariante("", "2026-09-17")).toBe(false);
    });

    it("deve lidar com 29 de fevereiro em anos não bissextos", () => {
      // 2026 não é bissexto
      expect(isAniversariante("29/02/2000", "2026-02-28")).toBe(true);
    });
  });

  describe("calcularIdade", () => {
    it("deve calcular idade corretamente quando aniversário já ocorreu no ano", () => {
      expect(calcularIdade("17/09/1990", "2026-09-17")).toBe(36);
    });

    it("deve calcular idade corretamente quando aniversário ainda não ocorreu", () => {
      expect(calcularIdade("18/09/1990", "2026-09-17")).toBe(35);
    });

    it("deve retornar null se a data de nascimento não contiver ano", () => {
      expect(calcularIdade("17/09", "2026-09-17")).toBeNull();
    });
  });

  describe("gerarLinkWhatsApp", () => {
    it("deve gerar link correto com mensagem personalizada", () => {
      const link = gerarLinkWhatsApp("11999998888", "Elaine Gonçalves Sarti", "Clínica Fisio");
      expect(link).not.toBeNull();
      expect(link).toContain("https://wa.me/5511999998888");
      expect(link).toContain("Elaine");
      expect(link).toContain("Cl%C3%ADnica%20Fisio");
    });

    it("deve retornar null para telefone ausente ou inválido", () => {
      expect(gerarLinkWhatsApp("", "Elaine")).toBeNull();
      expect(gerarLinkWhatsApp(null, "Elaine")).toBeNull();
      expect(gerarLinkWhatsApp("123", "Elaine")).toBeNull();
    });
  });
});
