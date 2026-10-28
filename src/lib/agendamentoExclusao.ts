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

interface AgendamentoDaSerie extends PacienteDoAgendamento {
  id: string;
  professionalId: string;
  date: string;
  startTime: string;
  status: string;
}

/** Status de quem ainda não foi atendido: só esses entram em "excluir os próximos" */
const STATUS_EM_ABERTO = ["agendado", "presenca_confirmada"];

function mesmoPaciente(a: PacienteDoAgendamento, b: PacienteDoAgendamento): boolean {
  if (a.pacienteId && b.pacienteId) return a.pacienteId === b.pacienteId;
  const nome = (n: string) => n.trim().toLowerCase().replace(/\s+/g, " ");
  return nome(a.patientName) === nome(b.patientName);
}

function diaDaSemana(dataISO: string): number {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(ano, mes - 1, dia).getDay();
}

/**
 * Agendamentos futuros da mesma série semanal: mesmo paciente, profissional, horário e
 * dia da semana, depois da data do agendamento informado e ainda em aberto.
 * A repetição semanal grava agendamentos independentes (sem id de série), então a série
 * é reconhecida por esses dados. Ordenados por data.
 */
export function proximosDaSerie<T extends AgendamentoDaSerie>(base: T, todos: T[]): T[] {
  const semana = diaDaSemana(base.date);
  return todos
    .filter(
      (a) =>
        a.id !== base.id &&
        a.date > base.date &&
        a.professionalId === base.professionalId &&
        a.startTime === base.startTime &&
        STATUS_EM_ABERTO.includes(a.status) &&
        diaDaSemana(a.date) === semana &&
        mesmoPaciente(a, base)
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
