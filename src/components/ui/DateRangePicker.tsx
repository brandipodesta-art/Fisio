"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

interface DateRangePickerProps {
  label?: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Placeholder shown in the trigger when no date is selected */
  placeholder?: string;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getPresets(): { label: string; from: string; to: string }[] {
  const today = new Date();
  const iso = toISO(today);

  // Start of this week (Monday)
  const weekStart = new Date(today);
  const day = today.getDay();
  weekStart.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  // End of this week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Last week
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekEnd);
  lastWeekEnd.setDate(weekEnd.getDate() - 7);

  // This month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: "Hoje", from: iso, to: iso },
    { label: "Esta semana", from: toISO(weekStart), to: toISO(weekEnd) },
    { label: "Semana passada", from: toISO(lastWeekStart), to: toISO(lastWeekEnd) },
    { label: "Este mês", from: toISO(monthStart), to: toISO(monthEnd) },
    { label: "Mês passado", from: toISO(lastMonthStart), to: toISO(lastMonthEnd) },
    { label: "Selecionar mês", from: "", to: "" },          // triggers month picker
    { label: "Período customizado", from: "", to: "" },     // allows free selection
  ];
}

// ─── Calendar ────────────────────────────────────────────────────────────────

interface CalendarProps {
  title: string;
  viewDate: Date;
  onPrev: () => void;
  onNext: () => void;
  selected: string;
  rangeFrom: string;
  rangeTo: string;
  onSelectDay: (iso: string) => void;
  isStart: boolean;
}

function Calendar({
  title, viewDate, onPrev, onNext, selected, rangeFrom, rangeTo, onSelectDay, isStart,
}: CalendarProps) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // First day of month (0=Sun)
  const firstDay = new Date(year, month, 1).getDay();
  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function cellISO(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isInRange(iso: string): boolean {
    if (!rangeFrom || !rangeTo) return false;
    return iso >= rangeFrom && iso <= rangeTo;
  }

  function isEdge(iso: string): boolean {
    return iso === rangeFrom || iso === rangeTo;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onPrev}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const iso = cellISO(day);
          const today = toISO(new Date());
          const isToday = iso === today;
          const edge = isEdge(iso);
          const inRange = isInRange(iso);
          const isSelected = iso === selected;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(iso)}
              className={[
                "relative text-xs h-8 w-full rounded-full flex items-center justify-center transition-all duration-100 select-none",
                edge
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : inRange
                    ? "bg-primary/15 text-primary rounded-none"
                    : isSelected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : isToday
                        ? "ring-1 ring-primary text-primary font-semibold"
                        : "text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Label */}
      <p className="text-center text-[10px] text-muted-foreground/60 mt-2 font-medium uppercase tracking-wide">
        {title}
      </p>
    </div>
  );
}

// ─── Month Picker ─────────────────────────────────────────────────────────────

interface MonthPickerProps {
  onSelect: (from: string, to: string) => void;
}

function MonthPicker({ onSelect }: MonthPickerProps) {
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setYear(y => y - 1)}
          className="p-1 rounded hover:bg-muted"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">{year}</span>
        <button
          type="button"
          onClick={() => setYear(y => y + 1)}
          className="p-1 rounded hover:bg-muted"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTH_NAMES.map((name, idx) => {
          const from = `${year}-${String(idx + 1).padStart(2, "0")}-01`;
          const to = toISO(new Date(year, idx + 1, 0));
          const current = new Date();
          const isCurrent = idx === current.getMonth() && year === current.getFullYear();
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(from, to)}
              className={[
                "text-xs py-2 px-3 rounded-lg transition-colors font-medium",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground",
              ].join(" ")}
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type PickerMode = "calendar" | "month-picker" | "custom";

export function DateRangePicker({
  label,
  value,
  onChange,
  placeholder = "Selecionar período",
  className = "",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("calendar");

  // Pending state — only committed on "Filtrar"
  const [pending, setPending] = useState<DateRange>(value);
  // For custom two-click selection
  const [customStep, setCustomStep] = useState<"from" | "to">("from");

  const [viewFrom, setViewFrom] = useState(() => {
    const d = value.from ? parseISO(value.from) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [viewTo, setViewTo] = useState(() => {
    const d = value.to ? parseISO(value.to) : new Date();
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return next;
  });

  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync pending when value changes externally
  useEffect(() => {
    setPending(value);
  }, [value]);

  function openPicker() {
    setPending(value);
    setMode("calendar");
    setCustomStep("from");
    setOpen(true);
  }

  function handlePreset(preset: { label: string; from: string; to: string }) {
    if (preset.label === "Selecionar mês") {
      setMode("month-picker");
      return;
    }
    if (preset.label === "Período customizado") {
      setMode("custom");
      setCustomStep("from");
      setPending({ from: "", to: "" });
      return;
    }
    setPending({ from: preset.from, to: preset.to });
    setMode("calendar");
  }

  function handleMonthSelect(from: string, to: string) {
    setPending({ from, to });
    setMode("calendar");
  }

  function handleDayClick(iso: string, side: "from" | "to") {
    if (mode === "custom") {
      if (customStep === "from") {
        setPending({ from: iso, to: "" });
        setCustomStep("to");
      } else {
        const sorted = iso >= pending.from
          ? { from: pending.from, to: iso }
          : { from: iso, to: pending.from };
        setPending(sorted);
        setCustomStep("from");
      }
    } else {
      // In preset/calendar mode, clicking adjusts the start or end
      if (side === "from") {
        setPending(p => ({ ...p, from: iso }));
      } else {
        setPending(p => ({ ...p, to: iso }));
      }
    }
  }

  function handleFilter() {
    onChange(pending);
    setOpen(false);
  }

  function handleClear() {
    const empty = { from: "", to: "" };
    setPending(empty);
    onChange(empty);
    setOpen(false);
  }

  // Display label
  const hasValue = value.from || value.to;
  const displayLabel = hasValue
    ? value.from && value.to
      ? value.from === value.to
        ? fmtDisplay(value.from)
        : `${fmtDisplay(value.from)} à ${fmtDisplay(value.to)}`
      : value.from
        ? `A partir de ${fmtDisplay(value.from)}`
        : `Até ${fmtDisplay(value.to)}`
    : placeholder;

  const presets = getPresets();

  // Active preset label
  const activePreset = presets.find(
    p => p.from === pending.from && p.to === pending.to && p.from !== ""
  );

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={openPicker}
        className={[
          "flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-sm transition-all",
          "bg-background hover:bg-muted/50",
          hasValue
            ? "border-primary/40 text-foreground"
            : "border-border text-muted-foreground",
          open ? "ring-2 ring-primary/20 border-primary/60" : "",
        ].join(" ")}
      >
        <CalendarDays className={`w-4 h-4 shrink-0 ${hasValue ? "text-primary" : "text-muted-foreground/60"}`} />
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        {hasValue && (
          <span
            role="button"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); handleClear(); }}
            onKeyDown={e => e.key === "Enter" && handleClear()}
            className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer rounded-full hover:bg-muted p-0.5"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
          style={{ minWidth: "560px" }}
        >
          <div className="flex">
            {/* ── Presets sidebar ── */}
            <div className="w-44 border-r border-border bg-muted/30 py-2 flex flex-col">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={[
                    "text-left px-4 py-2 text-sm transition-colors",
                    activePreset?.label === preset.label || (mode === "month-picker" && preset.label === "Selecionar mês") || (mode === "custom" && preset.label === "Período customizado")
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* ── Calendar area ── */}
            <div className="flex-1 p-4">
              {mode === "month-picker" ? (
                <MonthPicker onSelect={handleMonthSelect} />
              ) : (
                <div className="space-y-4">
                  {/* Custom mode hint */}
                  {mode === "custom" && (
                    <p className="text-xs text-center text-muted-foreground bg-muted/50 py-1.5 rounded-lg">
                      {customStep === "from"
                        ? "Clique para selecionar o início do período"
                        : "Agora clique para selecionar o fim do período"}
                    </p>
                  )}

                  {/* Single calendar for compact layout */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {mode === "custom" && customStep === "from" ? "Início do período" : "Início do período"}
                    </p>
                    {pending.from && (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold text-foreground px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                          {fmtDisplay(pending.from)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Calendar
                    title="Início do período"
                    viewDate={viewFrom}
                    onPrev={() => setViewFrom(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    onNext={() => setViewFrom(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    selected={pending.from}
                    rangeFrom={pending.from}
                    rangeTo={pending.to}
                    onSelectDay={iso => handleDayClick(iso, "from")}
                    isStart={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <div className="text-xs text-muted-foreground">
              {pending.from && pending.to ? (
                <span>
                  <strong>{fmtDisplay(pending.from)}</strong>
                  {pending.from !== pending.to && (
                    <> → <strong>{fmtDisplay(pending.to)}</strong></>
                  )}
                </span>
              ) : pending.from ? (
                <span>Início: <strong>{fmtDisplay(pending.from)}</strong></span>
              ) : (
                <span className="text-muted-foreground/50 italic">Nenhum período selecionado</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFilter}
                className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
