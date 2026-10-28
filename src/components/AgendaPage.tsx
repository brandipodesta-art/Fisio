"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, Cake } from "lucide-react";
import type { Appointment, AppointmentStatus, Professional, ViewMode } from "./agendaTypes";
import {
  mapDbProfessional,
  gerarTimeSlots,
  horarioAgenda,
  formatDateFull,
  formatDateISO,
  getDayName,
  getWeekDays,
  getMonthDays,
  getMonthName,
} from "./agendaData";
import AgendaEventCard from "./AgendaEventCard";
import AgendaNewEventDialog from "./AgendaNewEventDialog";
import ListaEsperaDrawer from "./ListaEsperaDrawer";
import { usePermissoes } from "@/lib/auth/usePermissoes";
import { ehAniversario, fetchPacientesComNascimento, normalizarNome } from "@/lib/aniversario";
import { useClinicaConfig } from "@/lib/useClinicaConfig";
import { idAgendamentoSalvo, pacienteMudou, planoExclusaoAgendamento, proximosDaSerie } from "@/lib/agendamentoExclusao";

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

  // Lista de Espera
  const { podeVerListaEspera } = usePermissoes();
  const [listaEsperaOpen, setListaEsperaOpen] = useState(false);
  const [listaEsperaCount, setListaEsperaCount] = useState(0);
  const [listaEsperaAlta, setListaEsperaAlta] = useState(0);

  const supabase = createClient();

  // Buscar contadores da lista de espera
  useEffect(() => {
    async function fetchListaEsperaCount() {
      const { data } = await supabase
        .from("lista_espera")
        .select("urgencia")
        .eq("status", "aguardando");
      if (data) {
        setListaEsperaCount(data.length);
        setListaEsperaAlta(data.filter((i) => i.urgencia === "alta").length);
      }
    }
    if (podeVerListaEspera) fetchListaEsperaCount();
  }, [podeVerListaEspera, listaEsperaOpen]);

  // Datas de nascimento dos pacientes (por id e por nome) para sinalizar aniversariantes
  const [nascimentos, setNascimentos] = useState<{
    porId: Map<string, string>;
    porNome: Map<string, string>;
  }>({ porId: new Map(), porNome: new Map() });

  useEffect(() => {
    fetchPacientesComNascimento().then((pacientes) => {
      const porId = new Map<string, string>();
      const porNome = new Map<string, string>();
      for (const p of pacientes) {
        if (!p.data_nascimento) continue;
        porId.set(p.id, p.data_nascimento);
        porNome.set(normalizarNome(p.nome_completo), p.data_nascimento);
      }
      setNascimentos({ porId, porNome });
    });
  }, []);

  /** Paciente faz aniversário na data do agendamento */
  const isBirthday = (apt: Appointment) => {
    const nascimento =
      (apt.pacienteId && nascimentos.porId.get(apt.pacienteId)) ||
      nascimentos.porNome.get(normalizarNome(apt.patientName));
    if (!nascimento) return false;
    const [ano, mes, dia] = apt.date.split("-").map(Number);
    return ehAniversario(nascimento, new Date(ano, mes - 1, dia));
  };

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
        const mapped: Appointment[] = data.map((d: any) => {
          let rawNotes = d.notes || "";
          let gerarCobranca = true;
          if (rawNotes.includes("[NO_BILLING]")) {
            gerarCobranca = false;
            rawNotes = rawNotes.replace("[NO_BILLING]", "").trim();
          }
          return {
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
            notes: rawNotes || undefined,
            gerarCobranca,
          };
        });
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
      notes: apt.gerarCobranca === false ? (rest.notes ? `${rest.notes} [NO_BILLING]` : "[NO_BILLING]") : (rest.notes || null),
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

      // Lista de Espera: criar entrada vinculada ao agendamento
      if (apt.addToWaitlist && apt.pacienteId) {
        try {
          const { data: pacData } = await supabase
            .from("pacientes")
            .select("telefone_cel")
            .eq("id", apt.pacienteId)
            .maybeSingle();

          await supabase.from("lista_espera").insert({
            paciente_id: apt.pacienteId,
            paciente_nome: apt.patientName,
            telefone: pacData?.telefone_cel ?? null,
            profissional_preferido_id: apt.professionalId,
            procedimento_id: apt.procedimentoId ?? null,
            motivo: apt.notes ?? null,
            urgencia: apt.waitlistUrgencia ?? "media",
            agendamento_atual_id: data.id,
            status: "aguardando",
          });
          toast.success("Paciente adicionado à Lista de Espera");
          // Atualiza contador
          setListaEsperaCount((c) => c + 1);
          if (apt.waitlistUrgencia === "alta") setListaEsperaAlta((c) => c + 1);
        } catch (err) {
          console.warn("Erro ao adicionar à lista de espera:", err);
        }
      }
    }
  };

  // Save multiple appointments (recurring weekly)
  const handleSaveMultipleAppointments = async (apts: Appointment[]) => {
    const backup = [...appointments];
    setAppointments((prev) => [...prev, ...apts]); // optimistic

    const rows = apts.map((apt) => ({
      patient_name: apt.patientName,
      paciente_id: apt.pacienteId || null,
      professional_id: apt.professionalId,
      procedimento_id: apt.procedimentoId || null,
      date: apt.date,
      start_time: apt.startTime,
      end_time: apt.endTime,
      duration: apt.duration,
      status: apt.status,
      notes: apt.gerarCobranca === false ? (apt.notes ? `${apt.notes} [NO_BILLING]` : "[NO_BILLING]") : (apt.notes || null),
    }));

    const { data, error } = await supabase
      .from("agendamentos")
      .insert(rows)
      .select("id");

    if (error) {
      toast.error("Erro ao salvar agendamentos. Tente novamente.");
      setAppointments(backup);
      return;
    }

    // Substituir IDs temporários pelos UUIDs reais
    if (data && data.length > 0) {
      setAppointments((prev) => {
        const tempIds = apts.map((a) => a.id);
        let updated = [...prev];
        data.forEach((row, idx) => {
          if (tempIds[idx]) {
            updated = updated.map((a) =>
              a.id === tempIds[idx] ? { ...a, id: row.id } : a
            );
          }
        });
        return updated;
      });
    }
  };

  // Frequência do paciente no mês ("YYYY-MM"): recontada do zero a partir dos agendamentos (idempotente)
  const recalcularFrequencia = async (pacienteId: string, mes: string) => {
    const [{ count: presencas }, { count: faltas }] = await Promise.all([
      supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq("paciente_id", pacienteId)
        .in("status", ["atendido", "reposicao"])
        .like("date", `${mes}-%`),
      supabase
        .from("agendamentos")
        .select("*", { count: "exact", head: true })
        .eq("paciente_id", pacienteId)
        .in("status", ["nao_atendido", "falta_sem_reposicao"])
        .like("date", `${mes}-%`),
    ]);

    const { data: freq } = await supabase
      .from("frequencias")
      .select("id")
      .eq("paciente_id", pacienteId)
      .eq("mes", mes)
      .maybeSingle();

    if (freq) {
      await supabase
        .from("frequencias")
        .update({ presencas: presencas ?? 0, faltas: faltas ?? 0 })
        .eq("id", freq.id);
    } else if ((presencas ?? 0) > 0 || (faltas ?? 0) > 0) {
      await supabase.from("frequencias").insert({
        paciente_id: pacienteId,
        mes,
        presencas: presencas ?? 0,
        faltas: faltas ?? 0,
      });
    }
  };

  // Side effects when status changes (frequency + financial integration)
  const runStatusSideEffects = async (
    appointment: Appointment,
    prevStatus: AppointmentStatus,
    newStatus: AppointmentStatus
  ) => {
    const statusNaoTerminal = ["agendado", "presenca_confirmada", "atendimento_individual", "falta_com_reposicao"];
    const statusTerminal    = ["atendido", "nao_atendido", "falta_sem_reposicao", "reposicao"];

    // ── Frequências: recomputa do zero a partir dos agendamentos (idempotente) ──
    if (
      appointment.pacienteId &&
      (statusTerminal.includes(newStatus) || statusTerminal.includes(prevStatus))
    ) {
      await recalcularFrequencia(appointment.pacienteId, appointment.date.substring(0, 7));
    }

    // ── Recebimento ao confirmar presença ──
    if (newStatus === "presenca_confirmada" && appointment.pacienteId && appointment.gerarCobranca !== false) {
      const { data: existingConf } = await supabase
        .from("recebimentos")
        .select("id")
        .ilike("observacoes", `%agendamento:${appointment.id}%`)
        .maybeSingle();

      if (!existingConf) {
        let valorConf = 0;
        if (appointment.procedimentoId) {
          const { data: proc } = await supabase
            .from("procedimentos")
            .select("valor_padrao")
            .eq("id", appointment.procedimentoId)
            .maybeSingle();
          valorConf = proc?.valor_padrao ?? 0;
        }
        const descricaoConf = appointment.procedimentoNome ?? appointment.notes ?? "Atendimento";
        if (valorConf > 0) {
          await supabase.from("recebimentos").insert({
            paciente_id: appointment.pacienteId,
            paciente_nome: appointment.patientName,
            procedimento_id: appointment.procedimentoId ?? null,
            profissional_id: appointment.professionalId ?? null,
            descricao: descricaoConf,
            valor: valorConf,
            data_vencimento: appointment.date,
            status: "pendente",
            observacoes: `agendamento:${appointment.id}`,
          });
        } else {
          toast.error("Procedimento sem valor cadastrado — recebimento não criado. Cadastre o valor em Configurações.");
        }
      }
    }

    // ── Recebimentos: fallback na conclusão / atendimento (idempotente) ──
    // Apenas "atendido" gera cobrança nova — "reposicao" não cria (paciente já foi cobrado na sessão original)
    if (
      newStatus === "atendido" &&
      appointment.pacienteId &&
      statusNaoTerminal.includes(prevStatus) &&
      appointment.gerarCobranca !== false
    ) {
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
            profissional_id: appointment.professionalId ?? null,
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
    }

    // ── Recebimento: cancelar quando paciente faltou (sem reposição) ou não foi atendido ──
    // OBS: "falta_com_reposicao" mantém o recebimento pendente — paciente vai repor a sessão
    if (newStatus === "falta_sem_reposicao" || newStatus === "nao_atendido") {
      const { data: recFaltou } = await supabase
        .from("recebimentos")
        .select("id, status")
        .ilike("observacoes", `%agendamento:${appointment.id}%`)
        .maybeSingle();

      if (recFaltou && (recFaltou.status === "pendente" || recFaltou.status === "atrasado")) {
        await supabase
          .from("recebimentos")
          .update({ status: "cancelado" })
          .eq("id", recFaltou.id);
      }
    }

    // ── Recebimento: reabrir quando agendamento é reagendado (faltas → agendado) ──
    if (newStatus === "agendado" && (prevStatus === "falta_sem_reposicao" || prevStatus === "nao_atendido")) {
      const { data: recReabrir } = await supabase
        .from("recebimentos")
        .select("id, status")
        .ilike("observacoes", `%agendamento:${appointment.id}%`)
        .maybeSingle();

      if (recReabrir && recReabrir.status === "cancelado") {
        await supabase
          .from("recebimentos")
          .update({ status: "pendente", data_vencimento: appointment.date })
          .eq("id", recReabrir.id);
      }
    }
  };

  // Update existing appointment
  const handleUpdateAppointment = async (apt: Appointment) => {
    const prev = appointments.find((a) => a.id === apt.id);
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
        notes: apt.gerarCobranca === false ? (apt.notes ? `${apt.notes} [NO_BILLING]` : "[NO_BILLING]") : (apt.notes || null),
      })
      .eq("id", apt.id);

    if (error) {
      toast.error("Erro ao atualizar agendamento. Tente novamente.");
      setAppointments(backup);
      return;
    }

    // Paciente trocado (ex.: lançado no paciente errado): as cobranças geradas por este
    // agendamento passam para o paciente certo
    if (prev && pacienteMudou(prev, apt)) {
      const { error: erroReceb } = await supabase
        .from("recebimentos")
        .update({ paciente_id: apt.pacienteId ?? null, paciente_nome: apt.patientName })
        .ilike("observacoes", `%agendamento:${apt.id}%`);
      if (erroReceb) {
        toast.error("Agendamento salvo, mas a cobrança ligada a ele não mudou de paciente. Corrija no Financeiro.");
      }
    }
    // Paciente ou data mudou: frequências do antes e do depois são recontadas
    if (prev && (pacienteMudou(prev, apt) || prev.date !== apt.date)) {
      if (prev.pacienteId) await recalcularFrequencia(prev.pacienteId, prev.date.substring(0, 7));
      if (apt.pacienteId) await recalcularFrequencia(apt.pacienteId, apt.date.substring(0, 7));
    }

    // Disparar side effects se o status mudou
    if (prev && prev.status !== apt.status) {
      await runStatusSideEffects(apt, prev.status, apt.status);
    }

    // Lista de Espera: criar entrada vinculada ao agendamento (igual ao fluxo de criação)
    if (apt.addToWaitlist && apt.pacienteId) {
      try {
        // Evitar duplicar: já existe entrada aguardando para este paciente?
        const { data: existente } = await supabase
          .from("lista_espera")
          .select("id")
          .eq("paciente_id", apt.pacienteId)
          .eq("status", "aguardando")
          .maybeSingle();

        if (existente) {
          toast.info("Paciente já está na Lista de Espera");
          return;
        }

        const { data: pacData } = await supabase
          .from("pacientes")
          .select("telefone_cel")
          .eq("id", apt.pacienteId)
          .maybeSingle();

        await supabase.from("lista_espera").insert({
          paciente_id: apt.pacienteId,
          paciente_nome: apt.patientName,
          telefone: pacData?.telefone_cel ?? null,
          profissional_preferido_id: apt.professionalId,
          procedimento_id: apt.procedimentoId ?? null,
          motivo: apt.notes ?? null,
          urgencia: apt.waitlistUrgencia ?? "media",
          agendamento_atual_id: apt.id,
          status: "aguardando",
        });
        toast.success("Paciente adicionado à Lista de Espera");
        setListaEsperaCount((c) => c + 1);
        if (apt.waitlistUrgencia === "alta") setListaEsperaAlta((c) => c + 1);
      } catch (err) {
        console.warn("Erro ao adicionar à lista de espera:", err);
      }
    }
  };

  // Exclui um agendamento sem avisar o usuário; quem chama decide a mensagem.
  // Cobrança pendente gerada por ele sai junto; cobrança já paga bloqueia a exclusão.
  type ResultadoExclusao =
    | { ok: true; apagouCobranca: boolean; erroCobranca: boolean }
    | { ok: false; motivo: "nao_salvo" | "erro_financeiro" | "pago" | "erro" };

  const excluirAgendamento = async (apt: Appointment): Promise<ResultadoExclusao> => {
    if (!idAgendamentoSalvo(apt.id)) return { ok: false, motivo: "nao_salvo" };

    const { data: recebs, error: erroBusca } = await supabase
      .from("recebimentos")
      .select("id, status")
      .ilike("observacoes", `%agendamento:${apt.id}%`);
    if (erroBusca) return { ok: false, motivo: "erro_financeiro" };

    const plano = planoExclusaoAgendamento(recebs ?? []);
    if (plano.bloqueado) return { ok: false, motivo: "pago" };

    // A lista de espera pode apontar para o agendamento: solta o vínculo antes de excluir
    await supabase
      .from("lista_espera")
      .update({ agendamento_atual_id: null })
      .eq("agendamento_atual_id", apt.id);

    // .select() devolve o que foi excluído: se uma regra do banco barrar a exclusão, o Supabase
    // não dá erro, só exclui nada — sem esta conferência o agendamento sumiria só da tela
    const { data: excluidos, error } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", apt.id)
      .select("id");
    if (error || !excluidos || excluidos.length === 0) return { ok: false, motivo: "erro" };
    setAppointments((lista) => lista.filter((a) => a.id !== apt.id));

    let erroCobranca = false;
    if (plano.apagarRecebimentos.length > 0) {
      const { error: erroReceb } = await supabase
        .from("recebimentos")
        .delete()
        .in("id", plano.apagarRecebimentos);
      erroCobranca = !!erroReceb;
    }

    return { ok: true, apagouCobranca: plano.apagarRecebimentos.length > 0 && !erroCobranca, erroCobranca };
  };

  /** Próximos agendamentos da mesma série semanal (para "excluir este e os próximos") */
  const getProximosDaSerie = (apt: Appointment) => proximosDaSerie(apt, appointments);

  // Excluir agendamento (ex.: lançado no paciente errado) e, se pedido, os próximos da mesma
  // série semanal. Retorna true quando o agendamento aberto foi excluído.
  const handleDeleteAppointment = async (apt: Appointment, incluirProximos = false): Promise<boolean> => {
    const alvos = incluirProximos ? [apt, ...getProximosDaSerie(apt)] : [apt];

    const excluidos: Appointment[] = [];
    const bloqueadosPorPagamento: Appointment[] = [];
    let falhas = 0;
    let errosCobranca = 0;
    let cobrancasApagadas = 0;
    let primeiroMotivo: string | null = null;

    for (const alvo of alvos) {
      const r = await excluirAgendamento(alvo);
      if (r.ok) {
        excluidos.push(alvo);
        if (r.apagouCobranca) cobrancasApagadas++;
        if (r.erroCobranca) errosCobranca++;
      } else if (r.motivo === "pago") {
        bloqueadosPorPagamento.push(alvo);
      } else {
        falhas++;
        if (alvo.id === apt.id) primeiroMotivo = r.motivo;
      }
    }

    // Frequência recalculada uma vez por paciente e mês afetados
    const mesesAfetados = new Set(
      excluidos.filter((a) => a.pacienteId).map((a) => `${a.pacienteId}|${a.date.substring(0, 7)}`)
    );
    for (const chave of mesesAfetados) {
      const [pacienteId, mes] = chave.split("|");
      await recalcularFrequencia(pacienteId, mes);
    }

    const dataBR = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

    if (alvos.length === 1) {
      if (excluidos.length === 1) {
        if (errosCobranca > 0) {
          toast.error("Agendamento excluído, mas a cobrança pendente ligada a ele continua no Financeiro. Exclua-a por lá.");
        } else {
          toast.success(cobrancasApagadas > 0 ? "Agendamento excluído, junto com a cobrança pendente." : "Agendamento excluído.");
        }
        return true;
      }
      if (bloqueadosPorPagamento.length > 0) {
        toast.error(
          "Este agendamento já tem pagamento confirmado no Financeiro. Para excluí-lo, estorne ou exclua o recebimento no Financeiro primeiro."
        );
      } else if (primeiroMotivo === "nao_salvo") {
        toast.error("O agendamento ainda está sendo salvo. Aguarde um instante e tente de novo.");
      } else if (primeiroMotivo === "erro_financeiro") {
        toast.error("Não foi possível verificar o financeiro deste agendamento. Tente novamente.");
      } else {
        toast.error("Não foi possível excluir o agendamento. Tente novamente.");
      }
      return false;
    }

    // Série: um resumo só
    if (excluidos.length > 0) {
      toast.success(
        `${excluidos.length} agendamento${excluidos.length > 1 ? "s excluídos" : " excluído"}` +
          (cobrancasApagadas > 0 ? `, junto com ${cobrancasApagadas} cobrança${cobrancasApagadas > 1 ? "s pendentes" : " pendente"}.` : ".")
      );
    }
    if (bloqueadosPorPagamento.length > 0) {
      toast.error(
        `Não excluídos por já terem pagamento confirmado: ${bloqueadosPorPagamento.map((a) => dataBR(a.date)).join(", ")}. Resolva no Financeiro primeiro.`
      );
    }
    if (falhas > 0) {
      toast.error(`${falhas} agendamento${falhas > 1 ? "s não puderam" : " não pôde"} ser excluído${falhas > 1 ? "s" : ""}. Tente novamente.`);
    }
    if (errosCobranca > 0) {
      toast.error(`${errosCobranca} cobrança${errosCobranca > 1 ? "s pendentes continuam" : " pendente continua"} no Financeiro. Exclua por lá.`);
    }
    return excluidos.some((a) => a.id === apt.id);
  };

  // Change appointment status
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    const prevStatus = appointment?.status ?? "agendado";
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

    if (!appointment) return;
    await runStatusSideEffects(appointment, prevStatus, newStatus);
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
  // Horário da grade: o configurado pela clínica, ampliado se houver agendamento fora dele
  const clinicaConfig = useClinicaConfig();
  const timeSlots = useMemo(() => {
    let { inicio, fim } = horarioAgenda(clinicaConfig?.hora_inicio_agenda, clinicaConfig?.hora_fim_agenda);
    for (const apt of filteredAppointments) {
      const hora = Number(apt.startTime.split(":")[0]);
      if (Number.isInteger(hora)) {
        inicio = Math.min(inicio, hora);
        fim = Math.max(fim, hora);
      }
    }
    return gerarTimeSlots(inicio, fim);
  }, [clinicaConfig?.hora_inicio_agenda, clinicaConfig?.hora_fim_agenda, filteredAppointments]);

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
            {podeVerListaEspera && (
              <Button
                variant="outline"
                onClick={() => setListaEsperaOpen(true)}
                className="text-sm relative gap-1.5"
                title="Lista de Espera"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden md:inline">Lista de Espera</span>
                {listaEsperaCount > 0 && (
                  <span
                    className={`ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                      listaEsperaAlta > 0
                        ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {listaEsperaCount}
                  </span>
                )}
              </Button>
            )}
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
                              {isBirthday(apt) && (
                                <Cake aria-label="Aniversariante" className="inline-block align-[-1px] mr-0.5 w-2.5 h-2.5 text-pink-500" />
                              )}
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
            {timeSlots.map((slot) => (
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
                          isBirthday={isBirthday(apt)}
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
                            isBirthday={isBirthday(apt)}
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

      {/* Lista de Espera Drawer */}
      {podeVerListaEspera && (
        <ListaEsperaDrawer
          open={listaEsperaOpen}
          onOpenChange={setListaEsperaOpen}
          professionals={professionals}
        />
      )}

      {/* New/Edit Event Dialog */}
      <AgendaNewEventDialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) setEditingAppointment(null);
        }}
        onSave={handleSaveAppointment}
        onSaveMultiple={handleSaveMultipleAppointments}
        onUpdate={handleUpdateAppointment}
        onDelete={handleDeleteAppointment}
        getProximosDaSerie={getProximosDaSerie}
        appointmentToEdit={editingAppointment}
        defaultDate={dialogDefaults.date}
        defaultTime={dialogDefaults.time}
        professionals={professionals}
      />
    </div>
  );
}
