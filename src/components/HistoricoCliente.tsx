"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, DollarSign, Calendar, Stethoscope } from "lucide-react";

/**
 * HistoricoCliente - Aba de Histórico do cliente
 * Design: Healthcare Minimal - Cards com abas internas para diferentes tipos de histórico
 * Seções: Procedimentos, Frequência, Financeiro, Evolução
 */

interface RecebimentoRaw {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
}

interface ProcedimentoResumo {
  nome: string;
  total: number;
  pagos: number;
  pendentes: number;
  canceladas: number;
  valorTotal: number;
  ultimaData: string;
}

interface Frequencia {
  mes: string;
  presencas: number;
  faltas: number;
}

interface Financeiro {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  status: "pago" | "pendente" | "atrasado" | "cancelado";
}

interface Evolucao {
  id: string;
  data: string;
  descricao: string;
}

interface HistoricoClienteProps {
  pacienteId?: string;
}

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

export default function HistoricoCliente({ pacienteId }: HistoricoClienteProps) {
  const [recebimentosRaw, setRecebimentosRaw] = useState<RecebimentoRaw[]>([]);
  const [frequencia, setFrequencia] = useState<Frequencia[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);
  const [evolucoes, setEvolucoes] = useState<Evolucao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      let queryRecebimentos = supabase
        .from("recebimentos")
        .select("id, descricao, valor, data_vencimento, data_pagamento, status")
        .order("data_vencimento", { ascending: false });
      if (pacienteId) {
        queryRecebimentos = queryRecebimentos.eq("paciente_id", pacienteId);
      }

      const [resRecebimentos, resFrequencia, resEvolucoes] = await Promise.all([
        queryRecebimentos,
        supabase.from("frequencias").select("*"),
        supabase.from("evolucoes").select("*").order("created_at", { ascending: false }),
      ]);

      if (resRecebimentos.data) {
        const raw = resRecebimentos.data as RecebimentoRaw[];
        setRecebimentosRaw(raw);

        // Monta lista financeira
        setFinanceiro(
          raw.map((f) => ({
            id: f.id,
            descricao: f.descricao,
            valor: Number(f.valor),
            data: f.data_pagamento ?? f.data_vencimento,
            status: (f.status === "recebido" ? "pago" : f.status) as
              | "pago"
              | "pendente"
              | "atrasado"
              | "cancelado",
          }))
        );
      }

      if (resFrequencia.data) {
        setFrequencia(
          resFrequencia.data.map(
            (f: { mes: string; presencas: number; faltas: number }) => ({
              mes: f.mes,
              presencas: f.presencas,
              faltas: f.faltas,
            })
          )
        );
      }

      if (resEvolucoes.data) {
        setEvolucoes(
          resEvolucoes.data.map(
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
  }, [supabase, pacienteId]);

  // Agrupa recebimentos por procedimento base
  const procedimentos = useMemo<ProcedimentoResumo[]>(() => {
    const mapa = new Map<string, ProcedimentoResumo>();

    for (const r of recebimentosRaw) {
      const nome = extrairProcedimentoBase(r.descricao);
      const statusNorm = r.status === "recebido" ? "pago" : r.status;
      const existing = mapa.get(nome);

      if (existing) {
        existing.total += 1;
        existing.valorTotal += Number(r.valor);
        if (statusNorm === "pago") existing.pagos += 1;
        if (statusNorm === "pendente" || statusNorm === "atrasado") existing.pendentes += 1;
        if (statusNorm === "cancelado") existing.canceladas += 1;
        // Mantém a data mais recente
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
          valorTotal: Number(r.valor),
          ultimaData: r.data_vencimento,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [recebimentosRaw]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pendente":
        return "bg-amber-100 text-amber-800";
      case "atrasado":
        return "bg-orange-100 text-orange-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Histórico */}
      <Card className="p-5 shadow-sm border-border bg-gradient-to-r from-card to-accent/40 dark:to-accent/20">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Histórico do Cliente
        </h2>
        <p className="text-sm text-muted-foreground">
          Visualize procedimentos, frequência, dados financeiros e evolução clínica
        </p>
      </Card>

      {/* Abas de Histórico */}
      <Tabs defaultValue="procedimentos" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted border border-border rounded-lg p-1">
          <TabsTrigger
            value="procedimentos"
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            <Stethoscope className="w-4 h-4" />
            <span className="hidden sm:inline">Procedimentos</span>
          </TabsTrigger>
          <TabsTrigger
            value="frequencia"
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Frequência</span>
          </TabsTrigger>
          <TabsTrigger
            value="financeiro"
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger
            value="evolucao"
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Evolução</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Procedimentos */}
        <TabsContent value="procedimentos" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Carregando procedimentos...</p>
            </Card>
          ) : procedimentos.length === 0 ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Nenhum procedimento registrado</p>
            </Card>
          ) : (
            <>
              {/* Resumo geral */}
              <Card className="p-5 border-border shadow-sm bg-muted/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                </div>
              </Card>

              {/* Cards por procedimento */}
              {procedimentos.map((proc) => (
                <Card key={proc.nome} className="p-5 border-border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-foreground">{proc.nome}</h3>
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

                  <div className="mt-3 pt-3 border-t border-border/60 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Valor total do procedimento</span>
                    <span className="text-sm font-semibold text-foreground">
                      R$ {proc.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Tab: Frequência */}
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
            <>
              {frequencia.map((freq, index) => (
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
                        {Math.round(
                          (freq.presencas / (freq.presencas + freq.faltas)) * 100
                        )}
                        %
                      </span>
                    </p>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Tab: Financeiro */}
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
              <Card className="p-6 border-border shadow-sm bg-muted/50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Pago</p>
                    <p className="text-2xl font-bold text-primary">
                      R${" "}
                      {financeiro
                        .filter((f) => f.status === "pago")
                        .reduce((sum, f) => sum + f.valor, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pendente</p>
                    <p className="text-2xl font-bold text-amber-700">
                      R${" "}
                      {financeiro
                        .filter((f) => f.status === "pendente")
                        .reduce((sum, f) => sum + f.valor, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Geral</p>
                    <p className="text-2xl font-bold text-foreground">
                      R${" "}
                      {financeiro.reduce((sum, f) => sum + f.valor, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>

              {financeiro.map((item) => (
                <Card key={item.id} className="p-6 border-border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.descricao}</h3>
                      <p className="text-sm text-muted-foreground">{formatarData(item.data)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground mb-2">
                        R$ {item.valor.toFixed(2)}
                      </p>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status === "pago"
                          ? "Pago"
                          : item.status === "pendente"
                          ? "Pendente"
                          : item.status === "atrasado"
                          ? "Atrasado"
                          : "Cancelado"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Tab: Evolução */}
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
      </Tabs>
    </div>
  );
}
