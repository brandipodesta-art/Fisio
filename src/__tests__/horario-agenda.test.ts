/**
 * Testes do horário configurável da Agenda: normalização da configuração
 * e geração das linhas da grade e dos horários de agendamento.
 */

import {
  TIME_OPTIONS,
  TIME_SLOTS,
  gerarTimeOptions,
  gerarTimeSlots,
  horarioAgenda,
} from "@/components/agendaData";

describe("horarioAgenda", () => {
  it("usa 07:00 a 20:00 quando não há configuração", () => {
    expect(horarioAgenda(null, undefined)).toEqual({ inicio: 7, fim: 20 });
  });

  it("aceita o horário configurado", () => {
    expect(horarioAgenda(6, 21)).toEqual({ inicio: 6, fim: 21 });
    expect(horarioAgenda(6, null)).toEqual({ inicio: 6, fim: 20 });
  });

  it("volta ao padrão com valores inválidos ou invertidos", () => {
    expect(horarioAgenda(-1, 30)).toEqual({ inicio: 7, fim: 20 });
    expect(horarioAgenda(21, 6)).toEqual({ inicio: 7, fim: 20 });
  });
});

describe("gerarTimeSlots", () => {
  it("gera uma linha por hora, incluindo a última", () => {
    const slots = gerarTimeSlots(6, 8);
    expect(slots).toEqual([
      { hour: 6, label: "06:00" },
      { hour: 7, label: "07:00" },
      { hour: 8, label: "08:00" },
    ]);
  });

  it("mantém a grade padrão igual à anterior (07:00 a 20:00)", () => {
    expect(TIME_SLOTS).toHaveLength(14);
    expect(TIME_SLOTS[0].label).toBe("07:00");
    expect(TIME_SLOTS[TIME_SLOTS.length - 1].label).toBe("20:00");
  });
});

describe("gerarTimeOptions", () => {
  it("gera horários a cada 30 minutos", () => {
    expect(gerarTimeOptions(6, 7)).toEqual(["06:00", "06:30", "07:00"]);
  });

  it("equivale à lista padrão anterior com 07:00 a 20:00", () => {
    expect(gerarTimeOptions(7, 20)).toEqual(TIME_OPTIONS);
  });
});
