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

/**
 * Time slots - Clinic working hours
 * Default: 07:00 to 20:00
 */
export const TIME_SLOTS: TimeSlot[] = Array.from({ length: 14 }, (_, i) => ({
  hour: i + 7,
  label: `${String(i + 7).padStart(2, "0")}:00`,
}));

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

