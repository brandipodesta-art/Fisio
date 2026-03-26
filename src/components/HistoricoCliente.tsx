"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, DollarSign, Calendar, Stethoscope, Users, AlertTriangle } from "lucide-react";

/**
 * HistoricoCliente — Aba de Histórico do cliente
 *
 * Dois modos de operação:
 *  - Paciente: exibe procedimentos, frequência, financeiro e evolução do próprio paciente
 *  - Funcionário/Financeiro: exibe os pacientes vinculados ao profissional,
 *    seus procedimentos com porcentagem de comissão e os recebimentos (incluindo pendentes)
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface RecebimentoRaw {
  id: string;
  paciente_id: string | null;
  paciente_nome: string | null;
  procedimento_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
}

interface ProcedimentoResumo {
  nome: string;
  procedimento_id: string | null;
  total: number;
  pagos: number;
  pendentes: number;
  canceladas: number;
  valorTotal: number;
  valorPago: number;
  comissaoPercentual: number;
  comissaoValor: number;
  ultimaData: string;
}

interface Frequencia {
  mes: string;
  presencas: number;
  faltas: number;
}

interface FinanceiroItem {
  id: string;
  paciente_nome: string | null;
  descricao: string;
  valor: number;
  data: string;
  data_vencimento: string;
  status: "pago" | "pendente" | "atrasado" | "cancelado";
}

interface Evolucao {
  id: string;
  data: string;
  descricao: string;
}

interface ComissaoMap {
  // chave: procedimento_id
  [procedimentoId: string]: number; // percentual
}

interface PacienteVinculado {
  id: string;
  nome_completo: string;
}

interface HistoricoClienteProps {
  pacienteId?: string;
  tipoUsuario?: string;
  nomeCompleto?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extrairProcedimentoBase(descricao: string): string {
  return descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
}

function formatarData(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return iso;
  }
}

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slugFromNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

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
  const [comissoes, setComissoes]             = useState<ComissaoMap>({});
  const [pacientesVinculados, setPacientesVinculados] = useState<PacienteVinculado[]>([]);
  const [isLoading, setIsLoading]             = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      if (isFuncionario && nomeCompleto) {
        // ── Modo Funcionário ──────────────────────────────────────────────────
        const slug = slugFromNome(nomeCompleto);

        // 1. Buscar pacientes vinculados ao profissional
        const { data: pacientes } = await supabase
          .from("pacientes")
          .select("id, nome_completo")
          .eq("profissional_responsavel", slug)
          .eq("ativo", true);

        const listaPacientes: PacienteVinculado[] = (pacientes ?? []).map(
          (p: { id: string; nome_completo: string }) => ({
            id: p.id,
            nome_completo: p.nome_completo,
          })
        );
        setPacientesVinculados(listaPacientes);

        if (listaPacientes.length === 0) {
          setIsLoading(false);
          return;
        }

        const ids = listaPacientes.map(p => p.id);

        // 2. Buscar recebimentos dos pacientes vinculados
        const { data: recebimentos } = await supabase
          .from("recebimentos")
          .select("id, paciente_id, paciente_nome, procedimento_id, descricao, valor, data_vencimento, data_pagamento, status")
          .in("paciente_id", ids)
          .order("data_vencimento", { ascending: false });

        setRecebimentosRaw((recebimentos ?? []) as RecebimentoRaw[]);

        // 3. Buscar comissões do profissional
        const { data: comissoesData } = await supabase
          .from("comissoes_profissional")
          .select("procedimento_id, percentual")
          .eq("profissional_id", slug);

        const mapa: ComissaoMap = {};
        (comissoesData ?? []).forEach(
          (c: { procedimento_id: string; percentual: number }) => {
            mapa[c.procedimento_id] = c.percentual;
          }
        );
        setComissoes(mapa);

      } else if (pacienteId) {
        // ── Modo Paciente ─────────────────────────────────────────────────────
        const [resRecebimentos, resFrequencia, resEvolucoes] = await Promise.all([
          supabase
            .from("recebimentos")
            .select("id, paciente_id, paciente_nome, procedimento_id, descricao, valor, data_vencimento, data_pagamento, status")
            .eq("paciente_id", pacienteId)
            .order("data_vencimento", { ascending: false }),
          supabase.from("frequencias").select("*"),
          supabase
            .from("evolucoes")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

        if (resRecebimentos.data) setRecebimentosRaw(resRecebimentos.data as RecebimentoRaw[]);
        if (resFrequencia.data) {
          setFrequencia(
            resFrequencia.data.map((f: { mes: string; presencas: number; faltas: number }) => ({
              mes: f.mes,
              presencas: f.presencas,
              faltas: f.faltas,
            }))
          );
        }
        if (resEvolucoes.data) {
          setEvolucoes(
            resEvolucoes.data.map((e: { id: string; data_salva: string; texto: string }) => ({
              id: e.id,
              data: e.data_salva,
              descricao: e.texto,
            }))
          );
        }
      }

      setIsLoading(false);
    }

    fetchData();
  }, [supabase, pacienteId, isFuncionario, nomeCompleto]);

  // ── Agrupa recebimentos por procedimento base ─────────────────────────────
  const procedimentos = useMemo<ProcedimentoResumo[]>(() => {
    const mapa = new Map<string, ProcedimentoResumo>();

    for (const r of recebimentosRaw) {
      const nome = extrairProcedimentoBase(r.descricao);
      const procId = r.procedimento_id ?? null;
      const statusNorm = r.status === "recebido" ? "pago" : r.status;
      const valorNum = Number(r.valor);
      const percentual = procId ? (comissoes[procId] ?? 0) : 0;
      const existing = mapa.get(nome);

      if (existing) {
        existing.total += 1;
        existing.valorTotal += valorNum;
        if (statusNorm === "pago") {
          existing.pagos += 1;
          existing.valorPago += valorNum;
        }
        if (statusNorm === "pendente" || statusNorm === "atrasado") existing.pendentes += 1;
        if (statusNorm === "cancelado") existing.canceladas += 1;
        if (r.data_vencimento > existing.ultimaData) existing.ultimaData = r.data_vencimento;
        // Recalcula comissão
        existing.comissaoValor = existing.valorPago * existing.comissaoPercentual / 100;
      } else {
        const valorPago = statusNorm === "pago" ? valorNum : 0;
        mapa.set(nome, {
          nome,
          procedimento_id: procId,
          total: 1,
          pagos: statusNorm === "pago" ? 1 : 0,
          pendentes: (statusNorm === "pendente" || statusNorm === "atrasado") ? 1 : 0,
          canceladas: statusNorm === "cancelado" ? 1 : 0,
          valorTotal: valorNum,
          valorPago,
          comissaoPercentual: percentual,
          comissaoValor: valorPago * percentual / 100,
          ultimaData: r.data_vencimento,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [recebimentosRaw, comissoes]);

  // ── Lista financeira ──────────────────────────────────────────────────────
  const financeiro = useMemo<FinanceiroItem[]>(() => {
    return recebimentosRaw.map(r => ({
      id: r.id,
      paciente_nome: r.paciente_nome,
      descricao: r.descricao,
      valor: Number(r.valor),
      data: r.data_pagamento ?? r.data_vencimento,
      data_vencimento: r.data_vencimento,
      status: (r.status === "recebido" ? "pago" : r.status) as FinanceiroItem["status"],
    }));
  }, [recebimentosRaw]);

  const financeiroOrdenado = useMemo(() => {
    return [...financeiro].sort((a, b) => {
      // Pendentes primeiro, depois por data de vencimento
      if (a.status === "pendente" && b.status !== "pendente") return -1;
      if (a.status !== "pendente" && b.status === "pendente") return 1;
      return a.data_vencimento.localeCompare(b.data_vencimento);
    });
  }, [financeiro]);

  const pendentes = useMemo(() => financeiro.filter(f => f.status === "pendente" || f.status === "atrasado"), [financeiro]);
  const totalRecebido = useMemo(() => financeiro.filter(f => f.status === "pago").reduce((s, f) => s + f.valor, 0), [financeiro]);
  const totalPendente = useMemo(() => pendentes.reduce((s, f) => s + f.valor, 0), [pendentes]);
  const totalComissao = useMemo(() => procedimentos.reduce((s, p) => s + p.comissaoValor, 0), [procedimentos]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pendente":  return "bg-amber-100 text-amber-800";
      case "atrasado":  return "bg-orange-100 text-orange-800";
      case "cancelado": return "bg-muted text-foreground";
      default:          return "bg-muted text-foreground";
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5 shadow-sm border-border bg-gradient-to-r from-card to-accent/40 dark:to-accent/20">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {isFuncionario ? "Histórico do Profissional" : "Histórico do Cliente"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isFuncionario
            ? "Procedimentos e financeiro dos pacientes vinculados a este profissional"
            : "Visualize procedimentos, frequência, dados financeiros e evolução clínica"}
        </p>

        {/* Pacientes vinculados (modo funcionário) */}
        {isFuncionario && pacientesVinculados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Pacientes vinculados:
            </span>
            {pacientesVinculados.map(p => (
              <span key={p.id} className="text-xs bg-accent text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                {p.nome_completo}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Abas */}
      <Tabs defaultValue="procedimentos" className="w-full">
        <TabsList className={`grid w-full bg-muted border border-border rounded-lg p-1 ${isFuncionario ? "grid-cols-2" : "grid-cols-4"}`}>
          <TabsTrigger
            value="procedimentos"
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            <Stethoscope className="w-4 h-4" />
            <span className="hidden sm:inline">Procedimentos</span>
          </TabsTrigger>
          {!isFuncionario && (
            <TabsTrigger
              value="frequencia"
              className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Frequência</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="financeiro"
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          {!isFuncionario && (
            <TabsTrigger
              value="evolucao"
              className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Evolução</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Tab: Procedimentos ──────────────────────────────────────────── */}
        <TabsContent value="procedimentos" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Carregando procedimentos...</p>
            </Card>
          ) : isFuncionario && pacientesVinculados.length === 0 ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Nenhum paciente vinculado a este profissional.</p>
            </Card>
          ) : procedimentos.length === 0 ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Nenhum procedimento registrado</p>
            </Card>
          ) : (
            <>
              {/* Resumo geral */}
              <Card className="p-5 border-border shadow-sm bg-muted/50">
                <div className={`grid gap-4 ${isFuncionario ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Procedimentos distintos</p>
                    <p className="text-2xl font-bold text-foreground">{procedimentos.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total de sessões</p>
                    <p className="text-2xl font-bold text-foreground">
                      {procedimentos.reduce((s, p) => s + p.total, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sessões pendentes</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {procedimentos.reduce((s, p) => s + p.pendentes, 0)}
                    </p>
                  </div>
                  {isFuncionario && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Comissão total</p>
                      <p className="text-2xl font-bold text-primary">{fmt(totalComissao)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Cards por procedimento */}
              {procedimentos.map((proc) => (
                <Card key={proc.nome} className="p-5 border-border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-foreground">{proc.nome}</h3>
                      {isFuncionario && proc.comissaoPercentual > 0 && (
                        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                          {proc.comissaoPercentual}% comissão
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60">
                      Último: {formatarData(proc.ultimaData)}
                    </span>
                  </div>

                  <div className={`grid gap-3 text-center ${proc.canceladas > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-xl font-bold text-foreground">{proc.total}</p>
                    </div>
                    <div className="bg-accent rounded-lg p-3 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Pagas</p>
                      <p className="text-xl font-bold text-primary">{proc.pagos}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
                      <p className="text-xl font-bold text-amber-700">{proc.pendentes}</p>
                    </div>
                    {proc.canceladas > 0 && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-muted-foreground mb-1">Canceladas</p>
                        <p className="text-xl font-bold text-red-600">{proc.canceladas}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/60 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Valor total do procedimento</span>
                      <span className="text-sm font-semibold text-foreground">{fmt(proc.valorTotal)}</span>
                    </div>
                    {isFuncionario && proc.comissaoPercentual > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Comissão ({proc.comissaoPercentual}% sobre {fmt(proc.valorPago)} recebido)
                        </span>
                        <span className="text-sm font-semibold text-primary">{fmt(proc.comissaoValor)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* ── Tab: Frequência (somente paciente) ─────────────────────────── */}
        {!isFuncionario && (
          <TabsContent value="frequencia" className="space-y-4">
            {isLoading ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Carregando frequência...</p>
              </Card>
            ) : frequencia.length === 0 ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Nenhum registro de frequência</p>
              </Card>
            ) : (
              frequencia.map((freq, index) => (
                <Card key={index} className="p-6 border-border shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">{freq.mes}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-accent rounded-lg p-4 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Presenças</p>
                      <p className="text-3xl font-bold text-primary">{freq.presencas}</p>
                    </div>
                    <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                      <p className="text-sm text-muted-foreground mb-1">Faltas</p>
                      <p className="text-3xl font-bold text-destructive">{freq.faltas}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Taxa de Presença:{" "}
                      <span className="font-semibold text-foreground">
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
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Carregando financeiro...</p>
            </Card>
          ) : financeiro.length === 0 ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Nenhum registro financeiro</p>
            </Card>
          ) : (
            <>
              {/* Resumo financeiro */}
              <Card className="p-5 border-border shadow-sm bg-muted/50">
                <div className={`grid gap-4 ${isFuncionario ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Recebido</p>
                    <p className="text-2xl font-bold text-primary">{fmt(totalRecebido)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pendente</p>
                    <p className="text-2xl font-bold text-amber-700">{fmt(totalPendente)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Geral</p>
                    <p className="text-2xl font-bold text-foreground">
                      {fmt(financeiro.reduce((s, f) => s + f.valor, 0))}
                    </p>
                  </div>
                  {isFuncionario && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Comissão Total</p>
                      <p className="text-2xl font-bold text-primary">{fmt(totalComissao)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Seção de pendentes — destaque */}
              {pendentes.length > 0 && (
                <Card className="p-5 border-amber-200 bg-amber-50 dark:bg-amber-900/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                      Pendentes de Pagamento ({pendentes.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {pendentes.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white dark:bg-card rounded-lg px-3 py-2 border border-amber-200">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {isFuncionario && item.paciente_nome && (
                              <span className="font-medium text-foreground/70">{item.paciente_nome}</span>
                            )}
                            <span>Venc.: {formatarData(item.data_vencimento)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-700">{fmt(item.valor)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                            {item.status === "atrasado" ? "Atrasado" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Histórico completo */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">Histórico Completo</h3>
                {financeiroOrdenado.map((item) => (
                  <Card key={item.id} className="p-4 border-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground text-sm">{item.descricao}</h3>
                          {isFuncionario && item.paciente_nome && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {item.paciente_nome}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.status === "pago" ? "Pago em" : "Venc.:"} {formatarData(item.data)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground mb-1">{fmt(item.valor)}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status === "pago" ? "Pago" :
                           item.status === "pendente" ? "Pendente" :
                           item.status === "atrasado" ? "Atrasado" : "Cancelado"}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Tab: Evolução (somente paciente) ───────────────────────────── */}
        {!isFuncionario && (
          <TabsContent value="evolucao" className="space-y-4">
            {isLoading ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Carregando evolução...</p>
              </Card>
            ) : evolucoes.length === 0 ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Nenhuma evolução registrada</p>
              </Card>
            ) : (
              evolucoes.map((evo) => (
                <Card key={evo.id} className="p-6 border-border shadow-sm">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground">{evo.data}</p>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed">{evo.descricao}</p>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
