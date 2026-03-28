import type { Appointment, AppointmentStatus, Professional } from "./agendaTypes";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "./agendaTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  CheckCircle2,
  XCircle,
  UserX,
  CalendarCheck,
  Pencil,
} from "lucide-react";

/**
 * AgendaEventCard - Visual card for a scheduled appointment
 * Shows: colored left border, time range, patient name, professional name,
 * procedure type, status badge, and action menu for status changes
 */

interface AgendaEventCardProps {
  appointment: Appointment;
  professional: Professional;
  compact?: boolean;
  onClick?: (appointment: Appointment) => void;
  onStatusChange?: (appointmentId: string, newStatus: AppointmentStatus) => void;
}

/**
 * Returns the available status transitions based on current status
 */
function getStatusActions(
  currentStatus: AppointmentStatus
): { label: string; status: AppointmentStatus; icon: React.ReactNode; color: string }[] {
  switch (currentStatus) {
    case "agendado":
      return [
        { label: "Confirmar", status: "confirmado", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-600" },
        { label: "Cancelar", status: "cancelado", icon: <XCircle className="w-4 h-4" />, color: "text-red-600" },
        { label: "Faltou", status: "faltou", icon: <UserX className="w-4 h-4" />, color: "text-amber-600" },
      ];
    case "confirmado":
      return [
        { label: "Concluir", status: "concluido", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600" },
        { label: "Cancelar", status: "cancelado", icon: <XCircle className="w-4 h-4" />, color: "text-red-600" },
        { label: "Faltou", status: "faltou", icon: <UserX className="w-4 h-4" />, color: "text-amber-600" },
      ];
    case "em_atendimento":
      return [
        { label: "Concluir", status: "concluido", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600" },
      ];
    case "cancelado":
    case "faltou":
      return [
        { label: "Reagendar", status: "agendado", icon: <CalendarCheck className="w-4 h-4" />, color: "text-slate-600" },
      ];
    case "concluido":
    default:
      return [];
  }
}

export default function AgendaEventCard({
  appointment,
  professional,
  compact = false,
  onClick,
  onStatusChange,
}: AgendaEventCardProps) {
  const statusLabel = APPOINTMENT_STATUS_LABELS[appointment.status];
  const statusColor = APPOINTMENT_STATUS_COLORS[appointment.status];
  const actions = getStatusActions(appointment.status);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(appointment);
      }}
      className={`
        rounded-lg border-l-4 ${professional.borderColor} ${professional.bgColor}
        px-3 py-2 cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
        ${compact ? "text-xs" : "text-sm"}
        relative group
      `}
    >
      {/* Action menu (3 dots) - visible on hover or always on non-compact */}
      {!compact && actions.length > 0 && onStatusChange && (
        <div
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              className="p-1 rounded-md hover:bg-black/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Edit option */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.(appointment);
                }}
                className="gap-2"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Status actions */}
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(appointment.id, action.status);
                  }}
                  className={`gap-2 ${action.color}`}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Time range */}
      <div className={`font-semibold ${professional.textColor} ${compact ? "text-[10px]" : "text-xs"}`}>
        {appointment.startTime} - {appointment.endTime}
      </div>

      {/* Patient name */}
      <div className={`font-medium text-foreground truncate ${compact ? "text-[11px]" : "text-sm"}`}>
        {appointment.patientName}
      </div>

      {/* Professional name - hidden in compact mode */}
      {!compact && (
        <div className="text-xs text-muted-foreground truncate">
          {professional.name}
        </div>
      )}

      {/* Procedure type - hidden in compact mode */}
      {!compact && appointment.procedimentoNome && (
        <div className="text-xs text-muted-foreground/70 truncate italic">
          {appointment.procedimentoNome}
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
