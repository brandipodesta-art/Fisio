/**
 * Testes das regras de exclusão e de troca de paciente de um agendamento:
 * o que acontece com as cobranças (recebimentos) geradas por ele.
 */

import {
  idAgendamentoSalvo,
  pacienteMudou,
  planoExclusaoAgendamento,
} from "@/lib/agendamentoExclusao";

describe("planoExclusaoAgendamento", () => {
  it("sem cobrança vinculada, exclui só o agendamento", () => {
    expect(planoExclusaoAgendamento([])).toEqual({ bloqueado: false, apagarRecebimentos: [] });
  });

  it("cobrança pendente, atrasada ou cancelada é excluída junto", () => {
    const plano = planoExclusaoAgendamento([
      { id: "r1", status: "pendente" },
      { id: "r2", status: "atrasado" },
      { id: "r3", status: "cancelado" },
    ]);
    expect(plano).toEqual({ bloqueado: false, apagarRecebimentos: ["r1", "r2", "r3"] });
  });

  it("cobrança já paga impede a exclusão e nada é apagado", () => {
    const plano = planoExclusaoAgendamento([
      { id: "r1", status: "pendente" },
      { id: "r2", status: "recebido" },
    ]);
    expect(plano.bloqueado).toBe(true);
    expect(plano.apagarRecebimentos).toEqual([]);
  });

  it("aceita o status pago com qualquer caixa", () => {
    expect(planoExclusaoAgendamento([{ id: "r1", status: "Pago" }]).bloqueado).toBe(true);
  });
});

describe("pacienteMudou", () => {
  it("detecta troca pelo cadastro", () => {
    expect(pacienteMudou({ pacienteId: "a", patientName: "Ana" }, { pacienteId: "b", patientName: "Bia" })).toBe(true);
  });

  it("detecta troca de nome digitado sem cadastro", () => {
    expect(pacienteMudou({ patientName: "Ana" }, { patientName: "Bia" })).toBe(true);
  });

  it("mesmo paciente não é troca, mesmo com espaços sobrando", () => {
    expect(pacienteMudou({ pacienteId: "a", patientName: "Ana" }, { pacienteId: "a", patientName: "Ana " })).toBe(false);
  });
});

describe("idAgendamentoSalvo", () => {
  it("UUID do banco é um agendamento salvo", () => {
    expect(idAgendamentoSalvo("3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b")).toBe(true);
  });

  it("id provisório (ainda gravando) não é", () => {
    expect(idAgendamentoSalvo("1760000000000")).toBe(false);
    expect(idAgendamentoSalvo("1760000000000_2")).toBe(false);
  });
});
