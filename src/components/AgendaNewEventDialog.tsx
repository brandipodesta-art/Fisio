"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import type { Appointment } from "./agendaTypes";
import { DURATION_OPTIONS } from "./agendaTypes";
import { PROFESSIONALS, TIME_OPTIONS, calculateEndTime, formatDateISO } from "./agendaData";

/**
 * AgendaNewEventDialog - Simple modal for creating a new appointment
 * Only 4 required fields + 1 optional = easy to use
 */

interface AgendaNewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appointment: Appointment) => void;
  defaultDate?: string;
  defaultTime?: string;
}

export default function AgendaNewEventDialog({
  open,
  onOpenChange,
  onSave,
  defaultDate,
  defaultTime,
}: AgendaNewEventDialogProps) {
  const [patientName, setPatientName] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(defaultDate || formatDateISO(new Date()));
  const [startTime, setStartTime] = useState(defaultTime || "08:00");
  const [duration, setDuration] = useState("50");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setPatientName("");
    setProfessionalId("");
    setDate(defaultDate || formatDateISO(new Date()));
    setStartTime(defaultTime || "08:00");
    setDuration("50");
    setNotes("");
  };

  const handleSave = () => {
    if (!patientName.trim()) {
      toast.error("Informe o nome do paciente");
      return;
    }
    if (!professionalId) {
      toast.error("Selecione o profissional");
      return;
    }

    const durationNum = parseInt(duration);
    const endTime = calculateEndTime(startTime, durationNum);

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      patientName: patientName.trim(),
      professionalId,
      date,
      startTime,
      endTime,
      duration: durationNum,
      status: "agendado",
      notes: notes.trim() || undefined,
    };

    onSave(newAppointment);
    resetForm();
    onOpenChange(false);
    toast.success("Agendamento criado com sucesso!");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-emerald-600" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma sessão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Patient Name */}
          <div>
            <Label htmlFor="patient" className="text-sm font-medium text-slate-700">
              Paciente *
            </Label>
            <Input
              id="patient"
              placeholder="Nome do paciente"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="mt-1.5"
              autoFocus
            />
          </div>

          {/* Professional */}
          <div>
            <Label htmlFor="professional" className="text-sm font-medium text-slate-700">
              Profissional *
            </Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger id="professional" className="mt-1.5">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONALS.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: prof.color }}
                      />
                      {prof.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-sm font-medium text-slate-700">
                Horário *
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="time" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration" className="text-sm font-medium text-slate-700">
              Duração
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
              Observação <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="notes"
              placeholder="Alguma observação sobre a sessão..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Agendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
