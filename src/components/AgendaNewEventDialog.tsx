"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { CalendarPlus, Search } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, Professional } from "./agendaTypes";
import { DURATION_OPTIONS } from "./agendaTypes";
import { TIME_OPTIONS, calculateEndTime, formatDateISO } from "./agendaData";

interface AgendaNewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appointment: Appointment) => void;
  defaultDate?: string;
  defaultTime?: string;
  professionals: Professional[];
}

export default function AgendaNewEventDialog({
  open,
  onOpenChange,
  onSave,
  defaultDate,
  defaultTime,
  professionals,
}: AgendaNewEventDialogProps) {
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    nome_completo: string;
  } | null>(null);
  const [patientResults, setPatientResults] = useState<
    { id: string; nome_completo: string }[]
  >([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(defaultDate || formatDateISO(new Date()));
  const [startTime, setStartTime] = useState(defaultTime || "08:00");
  const [duration, setDuration] = useState("50");
  const [notes, setNotes] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Buscar pacientes com debounce
  useEffect(() => {
    if (patientSearch.length < 2 || selectedPatient) {
      setPatientResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("pacientes")
        .select("id, nome_completo")
        .ilike("nome_completo", `%${patientSearch}%`)
        .eq("ativo", true)
        .order("nome_completo")
        .limit(10);
      if (data) {
        setPatientResults(data);
        setShowPatientDropdown(true);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, selectedPatient]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPatientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setPatientSearch("");
    setSelectedPatient(null);
    setPatientResults([]);
    setShowPatientDropdown(false);
    setProfessionalId("");
    setDate(defaultDate || formatDateISO(new Date()));
    setStartTime(defaultTime || "08:00");
    setDuration("50");
    setNotes("");
  };

  const handleSave = () => {
    if (!selectedPatient && !patientSearch.trim()) {
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
      patientName: selectedPatient?.nome_completo || patientSearch.trim(),
      pacienteId: selectedPatient?.id,
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
            <CalendarPlus className="w-5 h-5 text-primary" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma sessão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Patient Search with Autocomplete */}
          <div ref={dropdownRef}>
            <Label htmlFor="patient" className="text-sm font-medium text-foreground/80">
              Paciente *
            </Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                id="patient"
                placeholder="Buscar paciente..."
                value={selectedPatient ? selectedPatient.nome_completo : patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setSelectedPatient(null);
                  if (e.target.value.length >= 2) {
                    setShowPatientDropdown(true);
                  }
                }}
                onFocus={() => {
                  if (patientSearch.length >= 2 && !selectedPatient) {
                    setShowPatientDropdown(true);
                  }
                }}
                className="pl-9"
                autoFocus
                autoComplete="off"
              />
              {showPatientDropdown && patientResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientSearch(p.nome_completo);
                        setShowPatientDropdown(false);
                      }}
                    >
                      {p.nome_completo}
                    </button>
                  ))}
                </div>
              )}
              {patientSearch.length >= 2 &&
                !selectedPatient &&
                patientResults.length === 0 &&
                showPatientDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md px-3 py-2">
                    <span className="text-sm text-muted-foreground">
                      Nenhum paciente encontrado
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Professional */}
          <div>
            <Label htmlFor="professional" className="text-sm font-medium text-foreground/80">
              Profissional *
            </Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger id="professional" className="mt-1.5">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((prof) => (
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
              <Label htmlFor="date" className="text-sm font-medium text-foreground/80">
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
              <Label htmlFor="time" className="text-sm font-medium text-foreground/80">
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
            <Label htmlFor="duration" className="text-sm font-medium text-foreground/80">
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
            <Label htmlFor="notes" className="text-sm font-medium text-foreground/80">
              Observação <span className="text-muted-foreground/60 font-normal">(opcional)</span>
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
        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Agendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
