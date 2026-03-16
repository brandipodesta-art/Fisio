"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle,
  Clock, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ResumoFinanceiro } from "@/lib/types/financeiro";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Gráfico de barras simples (sem lib externa) ──────────────────────────────

interface BarChartProps {
  recebimentos: { mes: string; valor: number }[];
  pagamentos:   { mes: string; valor: number }[];
}

function BarChart({ recebimentos, pagamentos }: BarChartProps) {
  const maxValor = Math.max(
    ...recebimentos.map(r => r.valor),
    ...pagamentos.map(p => p.valor),
    1
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Legenda */}
        <div className="flex items-center gap-6 mb-4 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Recebimentos
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
            Pagamentos
          </span>
        </div>
        {/* Barras */}
        <div className="flex items-end gap-1 h-40">
          {recebimentos.map((r, i) => {
            const altRec = maxValor > 0 ? (r.valor / maxValor) * 100 : 0;
            const altPag = maxValor > 0 ? (pagamentos[i].valor / maxValor) * 100 : 0;
            return (
              <div key={r.mes} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end gap-0.5 h-32">
                  {/* Barra recebimento */}
                  <div
                    className="flex-1 bg-emerald-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${altRec}%`, minHeight: altRec > 0 ? 2 : 0 }}
                    title={`Recebido: ${fmt(r.valor)}`}
                  />
                  {/* Barra pagamento */}
                  <div
                    className="flex-1 bg-red-400 rounded-t-sm transition-all duration-500"
                    style={{ height: `${altPag}%`, minHeight: altPag > 0 ? 2 : 0 }}
                    title={`Pago: ${fmt(pagamentos[i].valor)}`}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1">{r.mes}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FinanceiroResumo() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscarResumo = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/recebimentos/resumo?ano=${ano}`);
      if (!res.ok) throw new Error("Erro ao carregar resumo");
      setResumo(await res.json());
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }, [ano]);

  useEffect(() => { buscarResumo(); }, [buscarResumo]);

  // ── Cards de totais ──────────────────────────────────────────────────────────

  const cards = resumo
    ? [
        {
          label: "Total Recebido",
          valor: resumo.totalRecebido,
          icon: TrendingUp,
          cor: "bg-emerald-50",
          iconCor: "text-emerald-600",
          textCor: "text-emerald-700",
        },
        {
          label: "A Receber (Pendente)",
          valor: resumo.totalPendente,
          icon: Clock,
          cor: "bg-blue-50",
          iconCor: "text-blue-500",
          textCor: "text-blue-700",
        },
        {
          label: "Recebimentos Atrasados",
          valor: resumo.totalAtrasado,
          icon: AlertCircle,
          cor: "bg-orange-50",
          iconCor: "text-orange-500",
          textCor: "text-orange-700",
        },
        {
          label: "Total Pago (Despesas)",
          valor: resumo.totalPago,
          icon: TrendingDown,
          cor: "bg-red-50",
          iconCor: "text-red-500",
          textCor: "text-red-700",
        },
        {
          label: "Despesas Pendentes",
          valor: resumo.totalDespesasPendentes,
          icon: AlertCircle,
          cor: "bg-yellow-50",
          iconCor: "text-yellow-600",
          textCor: "text-yellow-700",
        },
        {
          label: "Saldo Líquido",
          valor: resumo.saldoLiquido,
          icon: DollarSign,
          cor: resumo.saldoLiquido >= 0 ? "bg-emerald-50" : "bg-red-50",
          iconCor: resumo.saldoLiquido >= 0 ? "text-emerald-600" : "text-red-500",
          textCor: resumo.saldoLiquido >= 0 ? "text-emerald-700" : "text-red-700",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho com seletor de ano */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Resumo Financeiro</h2>
          <p className="text-sm text-slate-500">Visão geral do fluxo financeiro da clínica</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAno(a => a - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-slate-700 w-12 text-center">{ano}</span>
          <Button variant="outline" size="sm" onClick={() => setAno(a => a + 1)} disabled={ano >= anoAtual}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={buscarResumo} disabled={carregando}>
            <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {erro}
        </div>
      )}

      {/* Cards de totais */}
      {carregando ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-7 bg-slate-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : resumo ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(({ label, valor, icon: Icon, cor, iconCor, textCor }) => (
            <Card key={label} className="p-5 border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-1">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${cor}`}>
                  <Icon className={`w-5 h-5 ${iconCor}`} />
                </div>
                <p className="text-xs text-slate-500 leading-tight">{label}</p>
              </div>
              <p className={`text-xl font-bold ${textCor} mt-2`}>{fmt(valor)}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Gráfico mensal */}
      {resumo && !carregando && (
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Recebimentos vs. Pagamentos — {ano}
          </h3>
          <BarChart
            recebimentos={resumo.recebimentosPorMes}
            pagamentos={resumo.pagamentosPorMes}
          />
        </Card>
      )}

      {/* Estado vazio */}
      {resumo && !carregando &&
        resumo.totalRecebido === 0 && resumo.totalPago === 0 && (
        <Card className="p-10 border-slate-200 shadow-sm text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mx-auto mb-3">
            <DollarSign className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">
            Nenhum lançamento financeiro em {ano}. Use as abas{" "}
            <strong>Recebimentos</strong> e <strong>Pagamentos</strong> para registrar.
          </p>
        </Card>
      )}
    </div>
  );
}
