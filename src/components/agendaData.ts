import type { Professional, Appointment, TimeSlot } from "./agendaTypes";

/**
 * Deriva borderColor a partir de bgColor quando border_color não existe no DB
 * Ex: "bg-emerald-100" -> "border-emerald-500"
 */
function deriveBorderColor(bgColor: string): string {
  return bgColor.replace("bg-", "border-").replace(/\d+$/, "500");
}

/**
 * Mapeia uma row da tabela profissionais (Supabase) para a interface Professional
 */
export function mapDbProfessional(row: {
  id: string;
  name: string;
  short_name: string;
  color: string;
  bg_color: string;
  border_color?: string | null;
  text_color: string;
}): Professional {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    color: row.color,
    bgColor: row.bg_color,
    borderColor: row.border_color ?? deriveBorderColor(row.bg_color),
    textColor: row.text_color,
  };
}

/** Horário padrão da Agenda quando a clínica não configurou outro */
export const HORA_INICIO_PADRAO = 7;
export const HORA_FIM_PADRAO = 20;

/**
 * Normaliza o horário configurado da Agenda.
 * Valores ausentes ou inválidos voltam ao padrão (07:00 a 20:00).
 */
export function horarioAgenda(
  inicio: number | null | undefined,
  fim: number | null | undefined
): { inicio: number; fim: number } {
  const valido = (h: unknown): h is number => Number.isInteger(h) && (h as number) >= 0 && (h as number) <= 23;
  const i = valido(inicio) ? inicio : HORA_INICIO_PADRAO;
  const f = valido(fim) ? fim : HORA_FIM_PADRAO;
  return i <= f ? { inicio: i, fim: f } : { inicio: HORA_INICIO_PADRAO, fim: HORA_FIM_PADRAO };
}

/** Linhas da grade da Agenda, uma por hora, de `inicio` até `fim` (inclusive) */
export function gerarTimeSlots(inicio: number, fim: number): TimeSlot[] {
  return Array.from({ length: fim - inicio + 1 }, (_, i) => ({
    hour: inicio + i,
    label: `${String(inicio + i).padStart(2, "0")}:00`,
  }));
}

/** Horários do agendamento a cada 30 min, de `inicio`:00 até `fim`:00 */
export function gerarTimeOptions(inicio: number, fim: number): string[] {
  return Array.from({ length: (fim - inicio) * 2 + 1 }, (_, i) => {
    const hour = Math.floor(i / 2) + inicio;
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  });
}

/**
 * Time slots - Clinic working hours
 * Default: 07:00 to 20:00
 */
export const TIME_SLOTS: TimeSlot[] = gerarTimeSlots(HORA_INICIO_PADRAO, HORA_FIM_PADRAO);

/**
 * Available time options for the appointment dialog (every 30 min)
 */
export const TIME_OPTIONS: string[] = Array.from({ length: 27 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

/**
 * Helper: Calculate end time from start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

/**
 * Helper: Format date to DD/MM/YYYY
 */
export function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Helper: Format date to YYYY-MM-DD (for input[type=date])
 */
export function formatDateISO(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Get day name in Portuguese
 */
const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAY_SHORT_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function getDayName(date: Date, short = false): string {
  return short ? DAY_SHORT_NAMES[date.getDay()] : DAY_NAMES[date.getDay()];
}

export function getMonthName(date: Date): string {
  return MONTH_NAMES[date.getMonth()];
}

export function formatDateFull(date: Date): string {
  return `${date.getDate()} de ${getMonthName(date)} de ${date.getFullYear()}`;
}

/**
 * Helper: Get Monday of the week for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

/**
 * Helper: Get array of 7 days starting from Monday
 */
export function getWeekDays(date: Date): Date[] {
  const monday = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * Helper: Get all days to display in a month calendar grid (Mon–Sun)
 * Includes padding days from prev/next months to complete the grid rows
 */
export function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from Monday (if 1st is Sunday → go back 6 days)
  const startDay = new Date(firstDay);
  const startDow = startDay.getDay();
  startDay.setDate(startDay.getDate() - (startDow === 0 ? 6 : startDow - 1));

  // End on Sunday
  const endDay = new Date(lastDay);
  const endDow = endDay.getDay();
  endDay.setDate(endDay.getDate() + (endDow === 0 ? 0 : 7 - endDow));

  const days: Date[] = [];
  const current = new Date(startDay);
  while (current <= endDay) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

