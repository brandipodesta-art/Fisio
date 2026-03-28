"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import type { Appointment, AppointmentStatus, Professional, ViewMode } from "./agendaTypes";
import {
  mapDbProfessional,
  TIME_SLOTS,
  formatDateFull,
  formatDateISO,
  getDayName,
  getWeekDays,
  getMonthDays,
  getMonthName,
} from "./agendaData";
import AgendaEventCard from "./AgendaEventCard";
import AgendaNewEventDialog from "./AgendaNewEventDialog";

/**
 * AgendaPage - Main scheduling page (Google Calendar style)
 * Features: toolbar with navigation, sidebar with professional filters,
 * time grid with events, day/week view toggle, new/edit appointment dialog,
 * status management
 */

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaults, setDialogDefaults] = useState<{
    date?: string;
    time?: string;
  }>({});
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Buscar profissionais do Supabase
  useEffect(() => {
    async function fetchProfessionals() {
      const { data } = await supabase
        .from("profissionais")
        .select("id, name, short_name, color, bg_color, border_color, text_color")
        .order("name");
      if (data) {
        const mapped = data.map(mapDbProfessional);
        setProfessionals(mapped);
        setSelectedProfessionals(mapped.map((p) => p.id));
      }
    }
    fetchProfessionals();
  }, []);

  // Buscar agendamentos do Supabase (tenta join com procedimentos, fallback para select *)
  useEffect(() => {
    async function fetchAppointments() {
      let { data, error } = await supabase
        .from("agendamentos")
        .select("*, procedimentos(nome)");

      // Fallback: se join falhar (coluna procedimento_id ainda não existe), buscar sem join
      if (error || !data) {
        const res = await supabase.from("agendamentos").select("*");
        data = res.data;
      }

      if (data) {
        const mapped: Appointment[] = data.map((d: any) => ({
          id: d.id,
          patientName: d.patient_name,
          pacienteId: d.paciente_id || undefined,
          professionalId: d.professional_id,
          procedimentoId: d.procedimento_id || undefined,
          procedimentoNome: d.procedimentos?.nome || undefined,
          date: d.date,
          startTime: d.start_time,
          endTime: d.end_time,
          duration: d.duration,
          status: d.status,
          notes: d.notes,
        }));
        setAppointments(mapped);
      }
      setIsLoading(false);
    }
    fetchAppointments();
  }, []);

  // Navigation
  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  // Professional filter toggle
  const toggleProfessional = (id: string) => {
    setSelectedProfessionals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAllProfessionals = () => {
    if (selectedProfessionals.length === professionals.length) {
      setSelectedProfessionals([]);
    } else {
      setSelectedProfessionals(professionals.map((p) => p.id));
    }
  };

  // Get filtered appointments for current view
  const filteredAppointments = useMemo(() => {
    const dateStr = formatDateISO(currentDate);
    return appointments.filter((apt) => {
      if (!selectedProfessionals.includes(apt.professionalId)) return false;
      if (viewMode === "day") return apt.date === dateStr;
      if (viewMode === "week") {
        const weekDates = getWeekDays(currentDate).map((d) => formatDateISO(d));
        return weekDates.includes(apt.date);
      }
      // month: filter by year + month
      const aptDate = new Date(apt.date + "T00:00:00");
      return (
        aptDate.getFullYear() === currentDate.getFullYear() &&
        aptDate.getMonth() === currentDate.getMonth()
      );
    });
  }, [appointments, currentDate, viewMode, selectedProfessionals]);

  // Get appointments for a specific time slot and date
  const getSlotAppointments = (hour: number, dateStr?: string) => {
    const targetDate = dateStr || formatDateISO(currentDate);
    return filteredAppointments.filter((apt) => {
      if (apt.date !== targetDate) return false;
      const [startHour] = apt.startTime.split(":").map(Number);
      return startHour === hour;
    });
  };

  // Open dialog for NEW appointment
  const openNewDialog = (date?: string, time?: string) => {
    setEditingAppointment(null);
    setDialogDefaults({ date, time });
    setDialogOpen(true);
  };

  // Open dialog for EDITING appointment
  const handleEditClick = (apt: Appointment) => {
    setEditingAppointment(apt);
    setDialogDefaults({});
    setDialogOpen(true);
  };

  // Save new appointment
  const handleSaveAppointment = async (apt: Appointment) => {
    const backup = [...appointments];
    setAppointments((prev) => [...prev, apt]); // otimismo com ID temporário

    const { id, procedimentoNome, ...rest } = apt;

    const { data, error } = await supabase.from("agendamentos").insert({
      patient_name: rest.patientName,
      paciente_id: rest.pacienteId || null,
      professional_id: rest.professionalId,
      procedimento_id: rest.procedimentoId || null,
      date: rest.date,
      start_time: rest.startTime,
      end_time: rest.endTime,
      duration: rest.duration,
      status: rest.status,
      notes: rest.notes,
    }).select("id").single();

    if (error) {
      toast.error("Erro ao salvar agendamento. Tente novamente.");
      setAppointments(backup);
      return;
    }

    // Substituir o ID temporário pelo UUID real gerado pelo Supabase
    if (data?.id) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, id: data.id } : a))
      );
    }
  };

  // Update existing appointment
  const handleUpdateAppointment = async (apt: Appointment) => {
    const backup = [...appointments];
    setAppointments((prev) =>
      prev.map((a) => (a.id === apt.id ? apt : a))
    );

    const { error } = await supabase
      .from("agendamentos")
      .update({
        patient_name: apt.patientName,
        paciente_id: apt.pacienteId || null,
        professional_id: apt.professionalId,
        procedimento_id: apt.procedimentoId || null,
        date: apt.date,
        start_time: apt.startTime,
        end_time: apt.endTime,
        duration: apt.duration,
        status: apt.status,
        notes: apt.notes,
      })
      .eq("id", apt.id);

    if (error) {
      toast.error("Erro ao atualizar agendamento. Tente novamente.");
      setAppointments(backup);
    }
  };

  // Change appointment status
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    const prevStatus = appointment?.status;
    const backup = [...appointments];

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId ? { ...a, status: newStatus } : a
      )
    );

    const { error } = await supabase
      .from("agendamentos")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (error) {
      toast.error("Erro ao alterar status. Tente novamente.");
      setAppointments(backup);
      return;
    }

    // Integração Agenda → Histórico
    const statusNaoTerminal = ["agendado", "confirmado", "em_atendimento"];
    if (!appointment || !statusNaoTerminal.includes(prevStatus ?? "")) return;

    if (newStatus === "concluido" && appointment.pacienteId) {
      // 1. Criar recebimento (idempotente via observacoes)
      const { data: existing } = await supabase
        .from("recebimentos")
        .select("id")
        .ilike("observacoes", `%agendamento:${appointment.id}%`)
        .maybeSingle();

      if (!existing) {
        let valor = 0;
        if (appointment.procedimentoId) {
          const { data: proc } = await supabase
            .from("procedimentos")
            .select("valor_padrao")
            .eq("id", appointment.procedimentoId)
            .maybeSingle();
          valor = proc?.valor_padrao ?? 0;
        }

        const descricao = appointment.procedimentoNome ?? appointment.notes ?? "Atendimento";

        if (valor > 0) {
          await supabase.from("recebimentos").insert({
            paciente_id: appointment.pacienteId,
            paciente_nome: appointment.patientName,
            procedimento_id: appointment.procedimentoId ?? null,
            descricao,
            valor,
            data_vencimento: appointment.date,
            status: "pendente",
            observacoes: `agendamento:${appointment.id}`,
          });
        } else {
          toast.error("Procedimento sem valor cadastrado — recebimento não criado. Cadastre o valor em Configurações.");
        }
      }

      // 2. Registrar presença em frequencias
      const mes = appointment.date.substring(0, 7); // "YYYY-MM"
      const { data: freq } = await supabase
        .from("frequencias")
        .select("*")
        .eq("paciente_id", appointment.pacienteId)
        .eq("mes", mes)
        .maybeSingle();

      if (freq) {
        await supabase
          .from("frequencias")
          .update({ presencas: freq.presencas + 1 })
          .eq("id", freq.id);
      } else {
        await supabase.from("frequencias").insert({
          paciente_id: appointment.pacienteId,
          mes,
          presencas: 1,
          faltas: 0,
        });
      }
    }

    if (newStatus === "faltou" && appointment.pacienteId) {
      // Registrar falta em frequencias
      const mes = appointment.date.substring(0, 7);
      const { data: freq } = await supabase
        .from("frequencias")
        .select("*")
        .eq("paciente_id", appointment.pacienteId)
        .eq("mes", mes)
        .maybeSingle();

      if (freq) {
        await supabase
          .from("frequencias")
          .update({ faltas: freq.faltas + 1 })
          .eq("id", freq.id);
      } else {
        await supabase.from("frequencias").insert({
          paciente_id: appointment.pacienteId,
          mes,
          presencas: 0,
          faltas: 1,
        });
      }
    }
  };

  // Get professional by ID (com fallback para profissional não encontrado)
  const getProfessional = (id: string): Professional =>
    professionals.find((p) => p.id === id) ?? {
      id,
      name: id,
      shortName: id,
      color: "#6b7280",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-500",
      textColor: "text-gray-700",
    };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = getWeekDays(currentDate);
  const monthDays = useMemo(
    () => viewMode === "month" ? getMonthDays(currentDate) : [],
    [currentDate, viewMode]
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4 border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToday}
              className="text-sm font-medium"
            >
              Hoje
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={goPrev} className="h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={goNext} className="h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <h2 className="text-lg font-semibold text-foreground ml-2">
              {viewMode === "day" ? (
                <>
                  <span className="hidden sm:inline">{getDayName(currentDate)}, </span>
                  {formatDateFull(currentDate)}
                </>
              ) : viewMode === "week" ? (
                <>
                  {getDayName(weekDays[0], true)} {weekDays[0].getDate()} -{" "}
                  {getDayName(weekDays[6], true)} {weekDays[6].getDate()},{" "}
                  {weekDays[0].getMonth() !== weekDays[6].getMonth()
                    ? `${weekDays[0].toLocaleDateString("pt-BR", { month: "short" })} / ${weekDays[6].toLocaleDateString("pt-BR", { month: "short" })}`
                    : weekDays[0].toLocaleDateString("pt-BR", { month: "long" })}{" "}
                  {weekDays[0].getFullYear()}
                </>
              ) : (
                `${getMonthName(currentDate)} de ${currentDate.getFullYear()}`
              )}
            </h2>
          </div>

          {/* Right: View toggle + New */}
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "day"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
                  viewMode === "week"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
                  viewMode === "month"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted/50"
                }`}
              >
                Mês
              </button>
            </div>
            <Button
              onClick={() => openNewDialog()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Novo Agendamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Main content: Sidebar + Grid */}
      <div className="flex gap-4">
        {/* Sidebar: Professional filters */}
        <Card className="p-4 border-border shadow-sm w-48 shrink-0 hidden md:block">
          <h3 className="text-sm font-semibold text-foreground mb-3">Profissionais</h3>
          <div className="space-y-2">
            {/* Toggle all */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedProfessionals.length === professionals.length}
                onChange={toggleAllProfessionals}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground font-medium">
                Todos
              </span>
            </label>
            <div className="border-t border-border my-2" />
            {/* Individual professionals */}
            {professionals.map((prof) => (
              <label
                key={prof.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedProfessionals.includes(prof.id)}
                  onChange={() => toggleProfessional(prof.id)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: prof.color }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: prof.color }}
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground truncate">
                  {prof.shortName}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Calendar Grid */}
        <Card className="flex-1 border-border shadow-sm overflow-hidden">
          {/* Week header (only in week view) */}
          {viewMode === "week" && (
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/50">
              <div className="p-2" />
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`p-2 text-center border-l border-border ${
                    isToday(day) ? "bg-accent" : ""
                  }`}
                >
                  <div className="text-xs text-muted-foreground font-medium">
                    {getDayName(day, true)}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isToday(day)
                        ? "text-white bg-primary w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                        : "text-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Month grid */}
          {viewMode === "month" && (
            <>
              {/* Day name headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/50">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
                  <div
                    key={d}
                    className={`p-2 text-center text-xs font-medium text-muted-foreground ${i > 0 ? "border-l border-border" : ""}`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7">
                {monthDays.map((day, i) => {
                  const dateStr = formatDateISO(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const dayApts = appointments
                    .filter((a) => a.date === dateStr && selectedProfessionals.includes(a.professionalId))
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));
                  const visible = dayApts.slice(0, 3);
                  const overflow = dayApts.length - 3;

                  return (
                    <div
                      key={i}
                      onClick={() => { setCurrentDate(new Date(day)); setViewMode("day"); }}
                      className={`min-h-[90px] p-1.5 border-b border-border cursor-pointer hover:bg-muted/40 transition-colors ${
                        i % 7 !== 0 ? "border-l border-border" : ""
                      } ${!isCurrentMonth ? "bg-muted/20" : ""}`}
                    >
                      {/* Day number */}
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                        isToday(day)
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                      }`}>
                        {day.getDate()}
                      </div>
                      {/* Events */}
                      <div className="space-y-0.5">
                        {visible.map((apt) => {
                          const prof = getProfessional(apt.professionalId);
                          return (
                            <div
                              key={apt.id}
                              onClick={(e) => { e.stopPropagation(); handleEditClick(apt); }}
                              title={`${apt.startTime} — ${apt.patientName}`}
                              className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 ${prof.bgColor} ${prof.textColor}`}
                            >
                              {apt.startTime} {apt.patientName}
                            </div>
                          );
                        })}
                        {overflow > 0 && (
                          <div className="text-[10px] text-muted-foreground pl-1 font-medium">
                            +{overflow} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Time grid */}
          {viewMode !== "month" && (
          <div className="overflow-y-auto max-h-[calc(100vh-320px)] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-card/50 z-10 flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">Carregando agenda...</span>
              </div>
            )}
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.hour}
                className={`
                  ${viewMode === "day"
                    ? "grid grid-cols-[60px_1fr]"
                    : "grid grid-cols-[60px_repeat(7,1fr)]"
                  }
                  min-h-[72px] border-b border-border/60
                `}
              >
                {/* Time label */}
                <div className="p-2 text-xs text-muted-foreground/60 font-medium text-right pr-3 pt-1 border-r border-border">
                  {slot.label}
                </div>

                {viewMode === "day" ? (
                  /* Day view: single column */
                  <div
                    className="p-1 hover:bg-muted/50/50 cursor-pointer transition-colors relative"
                    onClick={() =>
                      openNewDialog(formatDateISO(currentDate), slot.label)
                    }
                  >
                    <div className="space-y-1">
                      {getSlotAppointments(slot.hour).map((apt) => (
                        <AgendaEventCard
                          key={apt.id}
                          appointment={apt}
                          professional={getProfessional(apt.professionalId)}
                          onClick={handleEditClick}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Week view: 7 columns */
                  weekDays.map((day, i) => {
                    const dateStr = formatDateISO(day);
                    const dayAppointments = getSlotAppointments(
                      slot.hour,
                      dateStr
                    );
                    return (
                      <div
                        key={i}
                        className={`p-0.5 border-l border-border/60 hover:bg-muted/50/50 cursor-pointer transition-colors ${
                          isToday(day) ? "bg-accent/30" : ""
                        }`}
                        onClick={() => openNewDialog(dateStr, slot.label)}
                      >
                        {dayAppointments.map((apt) => (
                          <AgendaEventCard
                            key={apt.id}
                            appointment={apt}
                            professional={getProfessional(apt.professionalId)}
                            compact
                            onClick={handleEditClick}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
          )}

          {/* Empty state — only for day/week view */}
          {viewMode !== "month" && filteredAppointments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                Nenhum agendamento
              </h3>
              <p className="text-sm text-muted-foreground/60 mb-4">
                {selectedProfessionals.length === 0
                  ? "Selecione pelo menos um profissional na barra lateral"
                  : "Nenhum agendamento para este período"}
              </p>
              {selectedProfessionals.length > 0 && (
                <Button
                  onClick={() => openNewDialog()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Criar Agendamento
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Mobile professional filter (shown below grid on small screens) */}
      <Card className="p-4 border-border shadow-sm md:hidden">
        <h3 className="text-sm font-semibold text-foreground mb-3">Filtrar Profissionais</h3>
        <div className="flex flex-wrap gap-2">
          {professionals.map((prof) => (
            <button
              key={prof.id}
              onClick={() => toggleProfessional(prof.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all
                ${
                  selectedProfessionals.includes(prof.id)
                    ? `${prof.bgColor} ${prof.borderColor} ${prof.textColor}`
                    : "bg-card border-border text-muted-foreground/60"
                }
              `}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: prof.color }}
              />
              {prof.shortName}
            </button>
          ))}
        </div>
      </Card>

      {/* New/Edit Event Dialog */}
      <AgendaNewEventDialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) setEditingAppointment(null);
        }}
        onSave={handleSaveAppointment}
        onUpdate={handleUpdateAppointment}
        appointmentToEdit={editingAppointment}
        defaultDate={dialogDefaults.date}
        defaultTime={dialogDefaults.time}
        professionals={professionals}
      />
    </div>
  );
}
