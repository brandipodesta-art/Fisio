"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, DollarSign, Calendar, Stethoscope,
  Users, AlertCircle, CheckCircle2, Clock, XCircle,
} from "lucide-react";

/**
 * HistoricoCliente — Aba de Histórico do cliente/funcionário
 *
 * Modos de operação:
 *  - Paciente  → exibe procedimentos e financeiro do próprio paciente
 *  - Funcionário/Financeiro → exibe procedimentos e financeiro dos pacientes
 *    vinculados a este profissional, com porcentagens de comissão
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface RecebimentoRaw {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  paciente_id: string | null;
  paciente_nome?: string | null;
}

interface ProcedimentoResumo {
  nome: string;
  total: number;
  pagos: number;
  pendentes: number;
  canceladas: number;
  valorTotal: number;
  valorPendente: number;
  ultimaData: string;
  // Apenas para funcionários
  percentual?: number;
  valorComissao?: number;
}

interface Frequencia {
  mes: string;
  presencas: number;
  faltas: number;
}

interface Evolucao {
  id: string;
  data: string;
  descricao: string;
}

interface ComissaoProfissional {
  procedimento_id: string;
  percentual: number;
  procedimentos?: { nome: string } | { nome: string }[] | null;
}

interface HistoricoClienteProps {
  pacienteId?: string;
  tipoUsuario?: string;
  nomeCompleto?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai o nome base do procedimento removendo numeração de parcelas, ex: "Acupuntura (2/4)" → "Acupuntura" */
function extrairProcedimentoBase(descricao: string): string {
  return descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
}

/** Formata data ISO para DD/MM/AAAA */
function formatarData(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return iso;
  }
}

/** Gera o slug do profissional a partir do nome completo */
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_CONFIG = {
  pago:      { label: "Pago",      cor: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  recebido:  { label: "Recebido",  cor: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  pendente:  { label: "Pendente",  cor: "bg-amber-100 text-amber-800",     icon: Clock },
  atrasado:  { label: "Atrasado",  cor: "bg-orange-100 text-orange-800",   icon: AlertCircle },
  cancelado: { label: "Cancelado", cor: "bg-slate-100 text-slate-600",     icon: XCircle },
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function HistoricoCliente({
  pacienteId,
  tipoUsuario = "paciente",
  nomeCompleto = "",
}: HistoricoClienteProps) {
  const isFuncionario = tipoUsuario === "funcionario" || tipoUsuario === "financeiro";

  const [recebimentosRaw, setRecebimentosRaw] = useState<RecebimentoRaw[]>([]);
  const [frequencia, setFrequencia]           = useState<Frequencia[]>([]);
  const [evolucoes, setEvolucoes]             = useState<Evolucao[]>([]);
  const [comissoes, setComissoes]             = useState<ComissaoProfissional[]>([]);
  const [pacientesVinculados, setPacientesVinculados] = useState<{ id: string; nome_completo: string }[]>([]);
  const [isLoading, setIsLoading]             = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!pacienteId) return;

    async function fetchData() {
      setIsLoading(true);

      if (isFuncionario) {
        // ── Modo Funcionário ──────────────────────────────────────────────────
        const slug = gerarSlug(nomeCompleto);

        // 1. Buscar pacientes vinculados a este profissional
        const { data: pacientes } = await supabase
          .from("pacientes")
          .select("id, nome_completo")
          .eq("profissional_responsavel", slug)
          .eq("ativo", true);

        const vinculados = pacientes ?? [];
        setPacientesVinculados(vinculados);

        if (vinculados.length === 0) {
          setRecebimentosRaw([]);
          setComissoes([]);
          setIsLoading(false);
          return;
        }

        const ids = vinculados.map((p) => p.id);

        // 2. Buscar recebimentos de todos os pacientes vinculados
        const { data: recs } = await supabase
          .from("recebimentos")
          .select("id, descricao, valor, data_vencimento, data_pagamento, status, paciente_id")
          .in("paciente_id", ids)
          .order("data_vencimento", { ascending: false });

        // Enriquecer com nome do paciente
        const recsEnriquecidos = (recs ?? []).map((r) => ({
          ...r,
          paciente_nome: vinculados.find((p) => p.id === r.paciente_id)?.nome_completo ?? null,
        }));
        setRecebimentosRaw(recsEnriquecidos);

        // 3. Buscar comissões do profissional
        const { data: comissoesData } = await supabase
          .from("comissoes_profissional")
          .select("procedimento_id, percentual, procedimentos(nome)")
          .eq("profissional_id", slug);

        setComissoes((comissoesData ?? []) as ComissaoProfissional[]);
      } else {
        // ── Modo Paciente ─────────────────────────────────────────────────────
        const [resRecebimentos, resFrequencia, resEvolucoes] = await Promise.all([
          supabase
            .from("recebimentos")
            .select("id, descricao, valor, data_vencimento, data_pagamento, status, paciente_id")
            .eq("paciente_id", pacienteId)
            .order("data_vencimento", { ascending: false }),
          supabase.from("frequencias").select("*"),
          supabase
            .from("evolucoes")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

        setRecebimentosRaw(resRecebimentos.data ?? []);

        setFrequencia(
          (resFrequencia.data ?? []).map(
            (f: { mes: string; presencas: number; faltas: number }) => ({
              mes: f.mes,
              presencas: f.presencas,
              faltas: f.faltas,
            })
          )
        );

        setEvolucoes(
          (resEvolucoes.data ?? []).map(
            (e: { id: string; data_salva: string; texto: string }) => ({
              id: e.id,
              data: e.data_salva,
              descricao: e.texto,
            })
          )
        );
      }

      setIsLoading(false);
    }

    fetchData();
  }, [supabase, pacienteId, isFuncionario, nomeCompleto]);

  // ─── Agrupamento de procedimentos ─────────────────────────────────────────

  const procedimentos = useMemo<ProcedimentoResumo[]>(() => {
    const mapa = new Map<string, ProcedimentoResumo>();

    for (const r of recebimentosRaw) {
      const nome = extrairProcedimentoBase(r.descricao);
      const statusNorm = r.status === "recebido" ? "pago" : r.status;
      const valor = Number(r.valor);

      // Buscar percentual de comissão pelo nome do procedimento (para funcionários)
      let percentual: number | undefined;
      if (isFuncionario && comissoes.length > 0) {
        const comissao = comissoes.find((c) => {
          const proc = c.procedimentos;
          if (!proc) return false;
          if (Array.isArray(proc)) return proc[0]?.nome === nome;
          return (proc as { nome: string }).nome === nome;
        });
        percentual = comissao?.percentual;
      }

      const existing = mapa.get(nome);
      if (existing) {
        existing.total += 1;
        existing.valorTotal += valor;
        if (statusNorm === "pago") {
          existing.pagos += 1;
          if (percentual !== undefined) {
            existing.valorComissao = (existing.valorComissao ?? 0) + valor * (percentual / 100);
          }
        }
        if (statusNorm === "pendente" || statusNorm === "atrasado") {
          existing.pendentes += 1;
          existing.valorPendente += valor;
        }
        if (statusNorm === "cancelado") existing.canceladas += 1;
        if (r.data_vencimento > existing.ultimaData) {
          existing.ultimaData = r.data_vencimento;
        }
      } else {
        mapa.set(nome, {
          nome,
          total: 1,
          pagos: statusNorm === "pago" ? 1 : 0,
          pendentes: (statusNorm === "pendente" || statusNorm === "atrasado") ? 1 : 0,
          canceladas: statusNorm === "cancelado" ? 1 : 0,
          valorTotal: valor,
          valorPendente: (statusNorm === "pendente" || statusNorm === "atrasado") ? valor : 0,
          ultimaData: r.data_vencimento,
          percentual,
          valorComissao: statusNorm === "pago" && percentual !== undefined
            ? valor * (percentual / 100)
            : 0,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [recebimentosRaw, comissoes, isFuncionario]);

  // ─── Financeiro: separar pendentes e histórico ────────────────────────────

  const financeiroTodos = useMemo(() => {
    return recebimentosRaw.map((r) => ({
      id: r.id,
      descricao: r.descricao,
      valor: Number(r.valor),
      data: r.data_pagamento ?? r.data_vencimento,
      data_vencimento: r.data_vencimento,
      status: (r.status === "recebido" ? "pago" : r.status) as
        "pago" | "pendente" | "atrasado" | "cancelado",
      paciente_nome: r.paciente_nome ?? null,
    }));
  }, [recebimentosRaw]);

  const financeiroPendentes = useMemo(
    () => financeiroTodos.filter((f) => f.status === "pendente" || f.status === "atrasado"),
    [financeiroTodos]
  );

  // ─── Totais ───────────────────────────────────────────────────────────────

  const totalPago     = financeiroTodos.filter((f) => f.status === "pago").reduce((s, f) => s + f.valor, 0);
  const totalPendente = financeiroPendentes.reduce((s, f) => s + f.valor, 0);
  const totalComissao = procedimentos.reduce((s, p) => s + (p.valorComissao ?? 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border-slate-200 shadow-sm bg-gradient-to-r from-slate-50 to-emerald-50">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Histórico do Cliente</h2>
        <p className="text-slate-600 text-sm">
          {isFuncionario
            ? `Procedimentos e financeiro dos pacientes vinculados a ${nomeCompleto}`
            : "Visualize procedimentos, frequência, dados financeiros e evolução clínica"}
        </p>
        {isFuncionario && pacientesVinculados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {pacientesVinculados.length} paciente(s) vinculado(s):
            </span>
            {pacientesVinculados.map((p) => (
              <span key={p.id} className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                {p.nome_completo}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Abas */}
      <Tabs defaultValue="procedimentos" className="w-full">
        <TabsList className={`grid w-full bg-white border border-slate-200 rounded-lg p-1 ${isFuncionario ? "grid-cols-2" : "grid-cols-4"}`}>
          <TabsTrigger
            value="procedimentos"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <Stethoscope className="w-4 h-4" />
            <span className="hidden sm:inline">Procedimentos</span>
          </TabsTrigger>
          {!isFuncionario && (
            <TabsTrigger
              value="frequencia"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Frequência</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="financeiro"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          {!isFuncionario && (
            <TabsTrigger
              value="evolucao"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Evolução</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Tab: Procedimentos ─────────────────────────────────────────── */}
        <TabsContent value="procedimentos" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 text-center border-slate-200 shadow-sm">
              <p className="text-slate-500">Carregando procedimentos...</p>
            </Card>
          ) : isFuncionario && pacientesVinculados.length === 0 ? (
            <Card className="p-8 text-center border-slate-200 shadow-sm">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum paciente vinculado</p>
              <p className="text-slate-400 text-sm mt-1">
                Vincule pacientes a este profissional no cadastro para visualizar os procedimentos.
              </p>
            </Card>
          ) : procedimentos.length === 0 ? (
            <Card className="p-6 text-center border-slate-200 shadow-sm">
              <p className="text-slate-500">Nenhum procedimento registrado</p>
            </Card>
          ) : (
            <>
              {/* Resumo geral */}
              <Card className="p-5 border-slate-200 shadow-sm bg-slate-50">
                <div className={`grid gap-4 ${isFuncionario ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Procedimentos distintos</p>
                    <p className="text-2xl font-bold text-slate-900">{procedimentos.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total de sessões</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {procedimentos.reduce((s, p) => s + p.total, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Sessões pendentes</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {procedimentos.reduce((s, p) => s + p.pendentes, 0)}
                    </p>
                  </div>
                  {isFuncionario && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Comissão total</p>
                      <p className="text-2xl font-bold text-emerald-700">{fmt(totalComissao)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Cards por procedimento */}
              {procedimentos.map((proc) => (
                <Card key={proc.nome} className="p-5 border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
                      <h3 className="font-semibold text-slate-900">{proc.nome}</h3>
                      {isFuncionario && proc.percentual !== undefined && (
                        <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                          {proc.percentual}% comissão
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      Último: {formatarData(proc.ultimaData)}
                    </span>
                  </div>

                  <div className={`grid gap-3 text-center ${proc.canceladas > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Total</p>
                      <p className="text-xl font-bold text-slate-900">{proc.total}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <p className="text-xs text-slate-500 mb-1">Pagas</p>
                      <p className="text-xl font-bold text-emerald-700">{proc.pagos}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs text-slate-500 mb-1">Pendentes</p>
                      <p className="text-xl font-bold text-amber-700">{proc.pendentes}</p>
                    </div>
                    {proc.canceladas > 0 && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-slate-500 mb-1">Canceladas</p>
                        <p className="text-xl font-bold text-red-600">{proc.canceladas}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Valor total do procedimento</span>
                      <span className="text-sm font-semibold text-slate-900">{fmt(proc.valorTotal)}</span>
                    </div>
                    {proc.valorPendente > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-amber-600">Valor pendente</span>
                        <span className="text-sm font-semibold text-amber-700">{fmt(proc.valorPendente)}</span>
                      </div>
                    )}
                    {isFuncionario && proc.percentual !== undefined && proc.valorComissao !== undefined && proc.valorComissao > 0 && (
                      <div className="flex justify-between items-center bg-violet-50 rounded-lg px-3 py-1.5 border border-violet-100">
                        <span className="text-xs text-violet-600">Comissão ({proc.percentual}% sobre pago)</span>
                        <span className="text-sm font-bold text-violet-700">{fmt(proc.valorComissao)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* ── Tab: Frequência (apenas paciente) ──────────────────────────── */}
        {!isFuncionario && (
          <TabsContent value="frequencia" className="space-y-4">
            {isLoading ? (
              <Card className="p-6 text-center border-slate-200 shadow-sm">
                <p className="text-slate-500">Carregando frequência...</p>
              </Card>
            ) : frequencia.length === 0 ? (
              <Card className="p-6 text-center border-slate-200 shadow-sm">
                <p className="text-slate-500">Nenhum registro de frequência</p>
              </Card>
            ) : (
              frequencia.map((freq, index) => (
                <Card key={index} className="p-6 border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4">{freq.mes}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <p className="text-sm text-slate-600 mb-1">Presenças</p>
                      <p className="text-3xl font-bold text-emerald-700">{freq.presencas}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-slate-600 mb-1">Faltas</p>
                      <p className="text-3xl font-bold text-red-700">{freq.faltas}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Taxa de Presença:{" "}
                      <span className="font-semibold text-slate-900">
                        {Math.round((freq.presencas / (freq.presencas + freq.faltas)) * 100)}%
                      </span>
                    </p>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        )}

        {/* ── Tab: Financeiro ────────────────────────────────────────────── */}
        <TabsContent value="financeiro" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 text-center border-slate-200 shadow-sm">
              <p className="text-slate-500">Carregando financeiro...</p>
            </Card>
          ) : isFuncionario && pacientesVinculados.length === 0 ? (
            <Card className="p-8 text-center border-slate-200 shadow-sm">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhum paciente vinculado</p>
            </Card>
          ) : financeiroTodos.length === 0 ? (
            <Card className="p-6 text-center border-slate-200 shadow-sm">
              <p className="text-slate-500">Nenhum registro financeiro</p>
            </Card>
          ) : (
            <>
              {/* Resumo financeiro */}
              <Card className="p-5 border-slate-200 shadow-sm bg-slate-50">
                <div className={`grid gap-4 ${isFuncionario ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Recebido</p>
                    <p className="text-xl font-bold text-emerald-700">{fmt(totalPago)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Pendente</p>
                    <p className="text-xl font-bold text-amber-700">{fmt(totalPendente)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Geral</p>
                    <p className="text-xl font-bold text-slate-900">{fmt(totalPago + totalPendente)}</p>
                  </div>
                  {isFuncionario && (
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                      <p className="text-xs text-violet-600 mb-1">Comissão total</p>
                      <p className="text-xl font-bold text-violet-700">{fmt(totalComissao)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Seção: Pendentes de pagamento */}
              {financeiroPendentes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-700">
                      Pendentes de Pagamento ({financeiroPendentes.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {financeiroPendentes.map((item) => {
                      const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendente;
                      const Icon = cfg.icon;
                      return (
                        <Card key={item.id} className="p-4 border-amber-200 bg-amber-50/40 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{item.descricao}</p>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                                {isFuncionario && item.paciente_nome && (
                                  <span className="text-emerald-700 font-medium">{item.paciente_nome}</span>
                                )}
                                <span>Venc.: {formatarData(item.data_vencimento)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-bold text-slate-900">{fmt(item.valor)}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seção: Histórico completo */}
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3">
                  Histórico Completo ({financeiroTodos.length})
                </h3>
                <div className="space-y-2">
                  {financeiroTodos.map((item) => {
                    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pendente;
                    const Icon = cfg.icon;
                    return (
                      <Card key={item.id} className="p-4 border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{item.descricao}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                              {isFuncionario && item.paciente_nome && (
                                <span className="text-emerald-700 font-medium">{item.paciente_nome}</span>
                              )}
                              <span>{formatarData(item.data)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-bold text-slate-900">{fmt(item.valor)}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Tab: Evolução (apenas paciente) ────────────────────────────── */}
        {!isFuncionario && (
          <TabsContent value="evolucao" className="space-y-4">
            {isLoading ? (
              <Card className="p-6 text-center border-slate-200 shadow-sm">
                <p className="text-slate-500">Carregando evolução...</p>
              </Card>
            ) : evolucoes.length === 0 ? (
              <Card className="p-6 text-center border-slate-200 shadow-sm">
                <p className="text-slate-500">Nenhuma evolução registrada</p>
              </Card>
            ) : (
              evolucoes.map((evo) => (
                <Card key={evo.id} className="p-6 border-slate-200 shadow-sm">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-slate-900">{evo.data}</p>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{evo.descricao}</p>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
