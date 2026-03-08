import type { Professional, Appointment, TimeSlot } from "./agendaTypes";

/**
 * Professionals - Test data
 * Each professional has a unique color scheme for the calendar
 */
export const PROFESSIONALS: Professional[] = [
  {
    id: "ana-carolina",
    name: "Ana Carolina",
    shortName: "Ana C.",
    color: "#10b981",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-700",
  },
  {
    id: "amanda-augusta",
    name: "Amanda Augusta",
    shortName: "Amanda A.",
    color: "#3b82f6",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
    textColor: "text-blue-700",
  },
  {
    id: "aline-pereira",
    name: "Aline Pereira",
    shortName: "Aline P.",
    color: "#f97316",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-500",
    textColor: "text-orange-700",
  },
];

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

/**
 * Mock appointments for testing
 */
export function getMockAppointments(): Appointment[] {
  const today = new Date();
  const todayStr = formatDateISO(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDateISO(tomorrow);

  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);
  const dayAfterStr = formatDateISO(dayAfter);

  return [
    {
      id: "1",
      patientName: "João Silva",
      professionalId: "ana-carolina",
      date: todayStr,
      startTime: "08:00",
      endTime: "08:50",
      duration: 50,
      status: "confirmado",
    },
    {
      id: "2",
      patientName: "Maria Santos",
      professionalId: "amanda-augusta",
      date: todayStr,
      startTime: "09:00",
      endTime: "09:50",
      duration: 50,
      status: "agendado",
    },
    {
      id: "3",
      patientName: "Carlos Oliveira",
      professionalId: "ana-carolina",
      date: todayStr,
      startTime: "10:00",
      endTime: "10:50",
      duration: 50,
      status: "em_atendimento",
    },
    {
      id: "4",
      patientName: "Fernanda Lima",
      professionalId: "aline-pereira",
      date: todayStr,
      startTime: "08:00",
      endTime: "08:50",
      duration: 50,
      status: "confirmado",
    },
    {
      id: "5",
      patientName: "Roberto Costa",
      professionalId: "amanda-augusta",
      date: todayStr,
      startTime: "14:00",
      endTime: "14:50",
      duration: 50,
      status: "agendado",
    },
    {
      id: "6",
      patientName: "Ana Paula Souza",
      professionalId: "ana-carolina",
      date: todayStr,
      startTime: "15:00",
      endTime: "16:00",
      duration: 60,
      status: "agendado",
    },
    {
      id: "7",
      patientName: "Lucas Mendes",
      professionalId: "aline-pereira",
      date: tomorrowStr,
      startTime: "09:00",
      endTime: "09:50",
      duration: 50,
      status: "agendado",
    },
    {
      id: "8",
      patientName: "Patrícia Ferreira",
      professionalId: "amanda-augusta",
      date: tomorrowStr,
      startTime: "10:00",
      endTime: "10:50",
      duration: 50,
      status: "confirmado",
    },
    {
      id: "9",
      patientName: "Bruno Almeida",
      professionalId: "ana-carolina",
      date: dayAfterStr,
      startTime: "08:00",
      endTime: "08:50",
      duration: 50,
      status: "agendado",
    },
    {
      id: "10",
      patientName: "Juliana Rocha",
      professionalId: "aline-pereira",
      date: dayAfterStr,
      startTime: "11:00",
      endTime: "11:50",
      duration: 50,
      status: "agendado",
    },
  ];
}
