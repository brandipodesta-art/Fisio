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
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
}

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "em_atendimento"
  | "concluido"
  | "cancelado"
  | "faltou";

export type ViewMode = "day" | "week";

export interface TimeSlot {
  hour: number;
  label: string;
}

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em Atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  agendado: "bg-slate-100 text-slate-700",
  confirmado: "bg-emerald-100 text-emerald-700",
  em_atendimento: "bg-blue-100 text-blue-700",
  concluido: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
  faltou: "bg-amber-100 text-amber-700",
};

export const DURATION_OPTIONS = [
  { value: 30, label: "30 minutos" },
  { value: 50, label: "50 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
];
