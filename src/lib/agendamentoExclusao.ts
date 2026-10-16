/**
 * Regras para excluir um agendamento e para trocar o paciente de um agendamento.
 *
 * O agendamento pode ter gerado cobranças (recebimentos) — o vínculo fica em
 * `recebimentos.observacoes` como "agendamento:<id>". Cobrança já paga é dinheiro que
 * entrou (e pode ter gerado comissão): nunca some junto com o agendamento.
 */

export interface RecebimentoVinculado {
  id: string;
  status: string;
}

export interface PlanoExclusao {
  /** true = existe cobrança paga; o agendamento não pode ser excluído por aqui */
  bloqueado: boolean;
  /** cobranças (pendentes, atrasadas ou canceladas) a excluir junto com o agendamento */
  apagarRecebimentos: string[];
}

const STATUS_PAGO = ["recebido", "pago"];

export function planoExclusaoAgendamento(recebimentos: RecebimentoVinculado[]): PlanoExclusao {
  const pago = recebimentos.some((r) => STATUS_PAGO.includes(r.status.toLowerCase()));
  if (pago) return { bloqueado: true, apagarRecebimentos: [] };
  return { bloqueado: false, apagarRecebimentos: recebimentos.map((r) => r.id) };
}

interface PacienteDoAgendamento {
  pacienteId?: string | null;
  patientName: string;
}

/** O paciente do agendamento foi trocado na edição? */
export function pacienteMudou(antes: PacienteDoAgendamento, depois: PacienteDoAgendamento): boolean {
  return (
    (antes.pacienteId ?? null) !== (depois.pacienteId ?? null) ||
    antes.patientName.trim() !== depois.patientName.trim()
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Agendamento recém-criado fica com id provisório até o banco devolver o UUID. */
export function idAgendamentoSalvo(id: string): boolean {
  return UUID.test(id);
}
