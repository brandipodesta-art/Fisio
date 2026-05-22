/**
 * Agenda Types - Interfaces for the scheduling system
 * All types used across agenda components
 */

export interface Professional {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  pacienteId?: string;
  professionalId: string;
  procedimentoId?: string;
  procedimentoNome?: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  gerarCobranca?: boolean;
  // Lista de Espera (apenas no fluxo de salvamento — não persistido em agendamentos)
  addToWaitlist?: boolean;
  waitlistUrgencia?: "alta" | "media" | "baixa";
}

export type AppointmentStatus =
  | "agendado"
  | "presenca_confirmada"
  | "atendimento_individual"
  | "atendido"
  | "nao_atendido"
  | "falta_com_reposicao"
  | "falta_sem_reposicao"
  | "reposicao";

export type ViewMode = "day" | "week" | "month";

export interface TimeSlot {
  hour: number;
  label: string;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  presenca_confirmada: "Presença Confirmada",
  atendimento_individual: "Atendimento Individual",
  atendido: "Atendido",
  nao_atendido: "Não Atendido",
  falta_com_reposicao: "Falta com Direito a Reposição",
  falta_sem_reposicao: "Falta sem Direito a Reposição",
  reposicao: "Reposição",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  agendado: "bg-slate-100 text-slate-700",
  presenca_confirmada: "bg-emerald-100 text-emerald-700",
  atendimento_individual: "bg-blue-100 text-blue-700",
  atendido: "bg-green-100 text-green-700",
  nao_atendido: "bg-rose-100 text-rose-700",
  falta_com_reposicao: "bg-amber-100 text-amber-700",
  falta_sem_reposicao: "bg-red-100 text-red-700",
  reposicao: "bg-purple-100 text-purple-700",
};

/** Status que cancelam o recebimento (paciente não pagará) */
export const STATUS_CANCELA_RECEBIMENTO: AppointmentStatus[] = [
  "nao_atendido",
  "falta_sem_reposicao",
];

/** Status terminais — agendamento encerrado, não pode mais ser alterado normalmente */
export const STATUS_TERMINAIS: AppointmentStatus[] = [
  "atendido",
  "nao_atendido",
  "falta_sem_reposicao",
  "reposicao",
];

export const DURATION_OPTIONS = [
  { value: 30, label: "30 minutos" },
  { value: 50, label: "50 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
];
