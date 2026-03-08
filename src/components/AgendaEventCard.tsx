import type { Appointment, Professional } from "./agendaTypes";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "./agendaTypes";

/**
 * AgendaEventCard - Visual card for a scheduled appointment
 * Shows: colored left border, time range, patient name, professional name, status badge
 * Height is proportional to the event duration
 */

interface AgendaEventCardProps {
  appointment: Appointment;
  professional: Professional;
  compact?: boolean;
  onClick?: (appointment: Appointment) => void;
}

export default function AgendaEventCard({
  appointment,
  professional,
  compact = false,
  onClick,
}: AgendaEventCardProps) {
  const statusLabel = APPOINTMENT_STATUS_LABELS[appointment.status];
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];

  return (
    <div
      onClick={() => onClick?.(appointment)}
      className={`
        rounded-lg border-l-4 ${professional.borderColor} ${professional.bgColor}
        px-3 py-2 cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        ${compact ? "text-xs" : "text-sm"}
      `}
    >
      {/* Time range */}
      <div className={`font-semibold ${professional.textColor} ${compact ? "text-[10px]" : "text-xs"}`}>
        {appointment.startTime} - {appointment.endTime}
      </div>

      {/* Patient name */}
      <div className={`font-medium text-slate-900 truncate ${compact ? "text-[11px]" : "text-sm"}`}>
        {appointment.patientName}
      </div>

      {/* Professional name - hidden in compact mode */}
      {!compact && (
        <div className="text-xs text-slate-500 truncate">
          {professional.name}
        </div>
      )}

      {/* Status badge - hidden in compact mode */}
      {!compact && (
        <div className="mt-1.5">
          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      )}
    </div>
  );
}
