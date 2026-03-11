"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import type { Appointment, ViewMode } from "./agendaTypes";
import {
  PROFESSIONALS,
  TIME_SLOTS,
  getMockAppointments,
  formatDateFull,
  formatDateISO,
  getDayName,
  getWeekDays,
} from "./agendaData";
import AgendaEventCard from "./AgendaEventCard";
import AgendaNewEventDialog from "./AgendaNewEventDialog";

/**
 * AgendaPage - Main scheduling page (Google Calendar style)
 * Features: toolbar with navigation, sidebar with professional filters,
 * time grid with events, day/week view toggle, new appointment dialog
 */

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [appointments, setAppointments] = useState<Appointment[]>(getMockAppointments());
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>(
    PROFESSIONALS.map((p) => p.id)
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDefaults, setDialogDefaults] = useState<{
    date?: string;
    time?: string;
  }>({});

  // Navigation
  const goToday = () => setCurrentDate(new Date());

  const goPrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === "week" ? 7 : 1));
    setCurrentDate(d);
  };

  const goNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === "week" ? 7 : 1));
    setCurrentDate(d);
  };

  // Professional filter toggle
  const toggleProfessional = (id: string) => {
    setSelectedProfessionals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAllProfessionals = () => {
    if (selectedProfessionals.length === PROFESSIONALS.length) {
      setSelectedProfessionals([]);
    } else {
      setSelectedProfessionals(PROFESSIONALS.map((p) => p.id));
    }
  };

  // Get filtered appointments for current view
  const filteredAppointments = useMemo(() => {
    const dateStr = formatDateISO(currentDate);
    return appointments.filter((apt) => {
      if (!selectedProfessionals.includes(apt.professionalId)) return false;
      if (viewMode === "day") return apt.date === dateStr;
      const weekDays = getWeekDays(currentDate).map((d) => formatDateISO(d));
      return weekDays.includes(apt.date);
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

  // Open dialog with defaults
  const openNewDialog = (date?: string, time?: string) => {
    setDialogDefaults({ date, time });
    setDialogOpen(true);
  };

  // Save new appointment
  const handleSaveAppointment = (apt: Appointment) => {
    setAppointments((prev) => [...prev, apt]);
  };

  // Get professional by ID
  const getProfessional = (id: string) =>
    PROFESSIONALS.find((p) => p.id === id)!;

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4 border-slate-200 shadow-sm">
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
            <h2 className="text-lg font-semibold text-slate-900 ml-2">
              {viewMode === "day" ? (
                <>
                  <span className="hidden sm:inline">{getDayName(currentDate)}, </span>
                  {formatDateFull(currentDate)}
                </>
              ) : (
                <>
                  {getDayName(weekDays[0], true)} {weekDays[0].getDate()} -{" "}
                  {getDayName(weekDays[6], true)} {weekDays[6].getDate()},{" "}
                  {weekDays[0].getMonth() !== weekDays[6].getMonth()
                    ? `${weekDays[0].toLocaleDateString("pt-BR", { month: "short" })} / ${weekDays[6].toLocaleDateString("pt-BR", { month: "short" })}`
                    : weekDays[0].toLocaleDateString("pt-BR", { month: "long" })}{" "}
                  {weekDays[0].getFullYear()}
                </>
              )}
            </h2>
          </div>

          {/* Right: View toggle + New */}
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "day"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "week"
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Semana
              </button>
            </div>
            <Button
              onClick={() => openNewDialog()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
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
        <Card className="p-4 border-slate-200 shadow-sm w-48 shrink-0 hidden md:block">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Profissionais</h3>
          <div className="space-y-2">
            {/* Toggle all */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedProfessionals.length === PROFESSIONALS.length}
                onChange={toggleAllProfessionals}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 font-medium">
                Todos
              </span>
            </label>
            <div className="border-t border-slate-200 my-2" />
            {/* Individual professionals */}
            {PROFESSIONALS.map((prof) => (
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
                <span className="text-sm text-slate-600 group-hover:text-slate-900 truncate">
                  {prof.shortName}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Calendar Grid */}
        <Card className="flex-1 border-slate-200 shadow-sm overflow-hidden">
          {/* Week header (only in week view) */}
          {viewMode === "week" && (
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50">
              <div className="p-2" />
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`p-2 text-center border-l border-slate-200 ${
                    isToday(day) ? "bg-emerald-50" : ""
                  }`}
                >
                  <div className="text-xs text-slate-500 font-medium">
                    {getDayName(day, true)}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isToday(day)
                        ? "text-white bg-emerald-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto"
                        : "text-slate-900"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Time grid */}
          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.hour}
                className={`
                  ${viewMode === "day"
                    ? "grid grid-cols-[60px_1fr]"
                    : "grid grid-cols-[60px_repeat(7,1fr)]"
                  }
                  min-h-[72px] border-b border-slate-100
                `}
              >
                {/* Time label */}
                <div className="p-2 text-xs text-slate-400 font-medium text-right pr-3 pt-1 border-r border-slate-200">
                  {slot.label}
                </div>

                {viewMode === "day" ? (
                  /* Day view: single column */
                  <div
                    className="p-1 hover:bg-slate-50/50 cursor-pointer transition-colors relative"
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
                        className={`p-0.5 border-l border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors ${
                          isToday(day) ? "bg-emerald-50/30" : ""
                        }`}
                        onClick={() => openNewDialog(dateStr, slot.label)}
                      >
                        {dayAppointments.map((apt) => (
                          <AgendaEventCard
                            key={apt.id}
                            appointment={apt}
                            professional={getProfessional(apt.professionalId)}
                            compact
                          />
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredAppointments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-1">
                Nenhum agendamento
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {selectedProfessionals.length === 0
                  ? "Selecione pelo menos um profissional na barra lateral"
                  : "Nenhum agendamento para este período"}
              </p>
              {selectedProfessionals.length > 0 && (
                <Button
                  onClick={() => openNewDialog()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
      <Card className="p-4 border-slate-200 shadow-sm md:hidden">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Filtrar Profissionais</h3>
        <div className="flex flex-wrap gap-2">
          {PROFESSIONALS.map((prof) => (
            <button
              key={prof.id}
              onClick={() => toggleProfessional(prof.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all
                ${
                  selectedProfessionals.includes(prof.id)
                    ? `${prof.bgColor} ${prof.borderColor} ${prof.textColor}`
                    : "bg-white border-slate-200 text-slate-400"
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

      {/* New Event Dialog */}
      <AgendaNewEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveAppointment}
        defaultDate={dialogDefaults.date}
        defaultTime={dialogDefaults.time}
      />
    </div>
  );
}
