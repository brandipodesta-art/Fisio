/**
 * Testes de "excluir este e os próximos": reconhecimento da série semanal.
 */

import { proximosDaSerie } from "@/lib/agendamentoExclusao";

const base = {
  id: "a1",
  pacienteId: "p1",
  patientName: "Maria Souza",
  professionalId: "prof1",
  date: "2026-10-27", // terça
  startTime: "08:00",
  status: "agendado",
};

function apt(over: Partial<typeof base>) {
  return { ...base, ...over };
}

describe("proximosDaSerie", () => {
  it("encontra as próximas semanas do mesmo paciente, profissional e horário", () => {
    const todos = [
      base,
      apt({ id: "a3", date: "2026-11-10" }),
      apt({ id: "a2", date: "2026-11-03" }),
    ];
    expect(proximosDaSerie(base, todos).map((a) => a.id)).toEqual(["a2", "a3"]);
  });

  it("ignora datas anteriores e o próprio agendamento", () => {
    const todos = [base, apt({ id: "a0", date: "2026-10-20" })];
    expect(proximosDaSerie(base, todos)).toEqual([]);
  });

  it("ignora outro paciente, profissional, horário ou dia da semana", () => {
    const todos = [
      base,
      apt({ id: "x1", date: "2026-11-03", pacienteId: "p2", patientName: "Outra" }),
      apt({ id: "x2", date: "2026-11-03", professionalId: "prof2" }),
      apt({ id: "x3", date: "2026-11-03", startTime: "09:00" }),
      apt({ id: "x4", date: "2026-11-04" }), // quarta
    ];
    expect(proximosDaSerie(base, todos)).toEqual([]);
  });

  it("ignora agendamentos já atendidos ou com falta registrada", () => {
    const todos = [
      base,
      apt({ id: "x1", date: "2026-11-03", status: "atendido" }),
      apt({ id: "x2", date: "2026-11-10", status: "falta_sem_reposicao" }),
      apt({ id: "a4", date: "2026-11-17", status: "presenca_confirmada" }),
    ];
    expect(proximosDaSerie(base, todos).map((a) => a.id)).toEqual(["a4"]);
  });

  it("compara pelo nome quando o agendamento não tem paciente vinculado", () => {
    const semId = { ...base, pacienteId: undefined };
    const todos = [semId, { ...semId, id: "a2", date: "2026-11-03", patientName: " maria  souza " }];
    expect(proximosDaSerie(semId, todos).map((a) => a.id)).toEqual(["a2"]);
  });
});
