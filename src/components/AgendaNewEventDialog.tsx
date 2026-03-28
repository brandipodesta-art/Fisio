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
import { CalendarDays, CalendarPlus, Pencil, Repeat2, Search } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, Professional } from "./agendaTypes";
import { DURATION_OPTIONS } from "./agendaTypes";
import { TIME_OPTIONS, calculateEndTime, formatDateISO } from "./agendaData";

interface AgendaNewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appointment: Appointment) => void;
  onSaveMultiple?: (appointments: Appointment[]) => void;
  onUpdate?: (appointment: Appointment) => void;
  appointmentToEdit?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
  professionals: Professional[];
}

export default function AgendaNewEventDialog({
  open,
  onOpenChange,
  onSave,
  onSaveMultiple,
  onUpdate,
  appointmentToEdit,
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
  const [procedimentoId, setProcedimentoId] = useState("");
  const [procedimentos, setProcedimentos] = useState<
    { id: string; nome: string }[]
  >([]);
  const [date, setDate] = useState(defaultDate || formatDateISO(new Date()));
  const [startTime, setStartTime] = useState(defaultTime || "08:00");
  const [duration, setDuration] = useState("50");
  const [notes, setNotes] = useState("");
  const [repete, setRepete] = useState(false);
  const [semanas, setSemanas] = useState(4);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const isEditing = !!appointmentToEdit;

  // Buscar procedimentos ativos
  useEffect(() => {
    async function fetchProcedimentos() {
      const { data } = await supabase
        .from("procedimentos")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      if (data) setProcedimentos(data);
    }
    fetchProcedimentos();
  }, []);

  // Preencher formulário ao editar
  useEffect(() => {
    if (appointmentToEdit && open) {
      setPatientSearch(appointmentToEdit.patientName);
      if (appointmentToEdit.pacienteId) {
        setSelectedPatient({
          id: appointmentToEdit.pacienteId,
          nome_completo: appointmentToEdit.patientName,
        });
      } else {
        setSelectedPatient(null);
      }
      setProfessionalId(appointmentToEdit.professionalId);
      setProcedimentoId(appointmentToEdit.procedimentoId || "");
      setDate(appointmentToEdit.date);
      setStartTime(appointmentToEdit.startTime);
      setDuration(String(appointmentToEdit.duration));
      setNotes(appointmentToEdit.notes || "");
    }
  }, [appointmentToEdit, open]);

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
        .eq("tipo_usuario", "paciente")
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

  // Preview das datas semanais adicionais
  function datesPreview(): string[] {
    if (!date || !repete) return [];
    const [y, m, day] = date.split("-").map(Number);
    const dates: string[] = [];
    for (let i = 1; i <= semanas; i++) {
      const next = new Date(y, m - 1, day + i * 7);
      const dd = String(next.getDate()).padStart(2, "0");
      const mm = String(next.getMonth() + 1).padStart(2, "0");
      dates.push(`${dd}/${mm}`);
    }
    return dates;
  }

  const resetForm = () => {
    setPatientSearch("");
    setSelectedPatient(null);
    setPatientResults([]);
    setShowPatientDropdown(false);
    setProfessionalId("");
    setProcedimentoId("");
    setDate(defaultDate || formatDateISO(new Date()));
    setStartTime(defaultTime || "08:00");
    setDuration("50");
    setNotes("");
    setRepete(false);
    setSemanas(4);
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

    // Buscar nome do procedimento selecionado
    const procNome = procedimentoId
      ? procedimentos.find((p) => p.id === procedimentoId)?.nome
      : undefined;

    const appointment: Appointment = {
      id: isEditing ? appointmentToEdit!.id : Date.now().toString(),
      patientName: selectedPatient?.nome_completo || patientSearch.trim(),
      pacienteId: selectedPatient?.id,
      professionalId,
      procedimentoId: procedimentoId || undefined,
      procedimentoNome: procNome,
      date,
      startTime,
      endTime,
      duration: durationNum,
      status: isEditing ? appointmentToEdit!.status : "agendado",
      notes: notes.trim() || undefined,
    };

    if (isEditing && onUpdate) {
      onUpdate(appointment);
      toast.success("Agendamento atualizado com sucesso!");
    } else if (repete && semanas > 0 && onSaveMultiple) {
      // Gerar série semanal: data base + N semanas seguintes
      const [y, m, day] = date.split("-").map(Number);
      const allApts: Appointment[] = [appointment];
      for (let i = 1; i <= semanas; i++) {
        const nextDate = new Date(y, m - 1, day + i * 7);
        allApts.push({
          ...appointment,
          id: `${Date.now()}_${i}`,
          date: formatDateISO(nextDate),
        });
      }
      onSaveMultiple(allApts);
      toast.success(`${allApts.length} agendamentos criados com sucesso!`);
    } else {
      onSave(appointment);
      toast.success("Agendamento criado com sucesso!");
    }

    resetForm();
    onOpenChange(false);
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
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 text-primary" />
                Editar Agendamento
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5 text-primary" />
                Novo Agendamento
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do agendamento"
              : "Preencha os dados para agendar uma sessão"}
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

          {/* Procedimento */}
          <div>
            <Label htmlFor="procedimento" className="text-sm font-medium text-foreground/80">
              Procedimento
            </Label>
            <Select value={procedimentoId} onValueChange={setProcedimentoId}>
              <SelectTrigger id="procedimento" className="mt-1.5">
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedimentos.map((proc) => (
                  <SelectItem key={proc.id} value={proc.id}>
                    {proc.nome}
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

          {/* Repetição semanal — somente na criação */}
          {!isEditing && (
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium select-none ${
                date ? "text-foreground/80 cursor-pointer" : "text-muted-foreground/60 cursor-not-allowed"
              }`}>
                <input
                  type="checkbox"
                  checked={repete}
                  disabled={!date}
                  onChange={(e) => setRepete(e.target.checked)}
                  className="w-4 h-4 accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <Repeat2 className={`w-4 h-4 ${date ? "text-muted-foreground/60" : "text-muted-foreground/30"}`} />
                Repetir semanalmente
                {!date && (
                  <span className="text-xs font-normal text-muted-foreground/60">(preencha a data primeiro)</span>
                )}
              </label>
              {repete && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-xs text-muted-foreground">Gerar mais</span>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={semanas}
                    onChange={(e) => setSemanas(Math.max(1, Math.min(52, Number(e.target.value))))}
                    className="w-16 text-center text-sm border border-border rounded-md px-2 py-1 bg-background"
                  />
                  <span className="text-xs text-muted-foreground">semana(s)</span>
                </div>
              )}
              {repete && datesPreview().length > 0 && (
                <div className="pl-6">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Datas que serão criadas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {datesPreview().map((dateStr) => (
                      <span
                        key={dateStr}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
                      >
                        {dateStr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
            {isEditing ? "Salvar" : "Agendar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
