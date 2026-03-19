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

// ─── Grafico de barras premium (sem lib externa) ──────────────────────────────

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
        <div className="flex items-center gap-6 mb-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-success inline-block" />
            Recebimentos
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-destructive/70 inline-block" />
            Pagamentos
          </span>
        </div>
        {/* Grid lines + Barras */}
        <div className="relative">
          {/* Grid lines horizontais sutis */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="border-t border-border/40" />
            ))}
          </div>
          <div className="flex items-end gap-1.5 h-44 relative z-10">
            {recebimentos.map((r, i) => {
              const altRec = maxValor > 0 ? (r.valor / maxValor) * 100 : 0;
              const altPag = maxValor > 0 ? (pagamentos[i].valor / maxValor) * 100 : 0;
              return (
                <div key={r.mes} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex items-end gap-1 h-36">
                    {/* Barra recebimento */}
                    <div
                      className="flex-1 bg-success/80 rounded-t-md transition-all duration-500 hover:bg-success"
                      style={{ height: `${altRec}%`, minHeight: altRec > 0 ? 2 : 0 }}
                      title={`Recebido: ${fmt(r.valor)}`}
                    />
                    {/* Barra pagamento */}
                    <div
                      className="flex-1 bg-destructive/50 rounded-t-md transition-all duration-500 hover:bg-destructive/70"
                      style={{ height: `${altPag}%`, minHeight: altPag > 0 ? 2 : 0 }}
                      title={`Pago: ${fmt(pagamentos[i].valor)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">{r.mes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card individual ─────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  valor: number;
  icon: React.ElementType;
  variant: "success" | "info" | "warning" | "destructive" | "neutral";
}

function KpiCard({ label, valor, icon: Icon, variant }: KpiCardProps) {
  const variantStyles = {
    success:     { bg: "bg-success/10", icon: "text-success", text: "text-success" },
    info:        { bg: "bg-info/10", icon: "text-info", text: "text-info" },
    warning:     { bg: "bg-warning/10", icon: "text-warning", text: "text-warning" },
    destructive: { bg: "bg-destructive/10", icon: "text-destructive", text: "text-destructive" },
    neutral:     { bg: "bg-muted", icon: "text-muted-foreground", text: "text-foreground" },
  };
  const s = variantStyles[variant];

  return (
    <Card className="p-5 border-border shadow-sm hover-lift">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${s.bg}`}>
          <Icon className={`w-[18px] h-[18px] ${s.icon}`} />
        </div>
        <p className="text-xs text-muted-foreground leading-tight font-medium">{label}</p>
      </div>
      <p className={`text-xl font-bold ${valor >= 0 ? s.text : "text-destructive"} mt-1`}>
        {fmt(valor)}
      </p>
    </Card>
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

  // ── Cards KPI ──────────────────────────────────────────────────────────

  const cards: KpiCardProps[] = resumo
    ? [
        { label: "Total Recebido",         valor: resumo.totalRecebido, icon: TrendingUp,   variant: "success" },
        { label: "A Receber (Pendente)",    valor: resumo.totalPendente, icon: Clock,        variant: "info" },
        { label: "Recebimentos Atrasados",  valor: resumo.totalAtrasado, icon: AlertCircle,  variant: "warning" },
        { label: "Total Pago (Despesas)",   valor: resumo.totalPago,    icon: TrendingDown,  variant: "destructive" },
        { label: "Despesas Pendentes",      valor: resumo.totalDespesasPendentes, icon: AlertCircle, variant: "warning" },
        {
          label: "Saldo Liquido",
          valor: resumo.saldoLiquido,
          icon: DollarSign,
          variant: resumo.saldoLiquido >= 0 ? "success" : "destructive",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Cabecalho com seletor de ano */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Resumo Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Visao geral do fluxo financeiro da clinica</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setAno(a => a - 1)} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground w-12 text-center tabular-nums">{ano}</span>
          <Button variant="outline" size="sm" onClick={() => setAno(a => a + 1)} disabled={ano >= anoAtual} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={buscarResumo} disabled={carregando} className="h-8 w-8 p-0 ml-1">
            <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm">
          {erro}
        </div>
      )}

      {/* Cards KPI */}
      {carregando ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-3" />
              <div className="h-7 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : resumo ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>
      ) : null}

      {/* Grafico mensal */}
      {resumo && !carregando && (
        <Card className="p-6 border-border shadow-sm">
          <h3 className="text-sm font-semibold text-foreground/80 mb-5">
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
        <Card className="p-10 border-border shadow-sm text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted mx-auto mb-4">
            <DollarSign className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-foreground font-medium">
            Nenhum lancamento financeiro em {ano}
          </p>
          <p className="text-muted-foreground text-sm mt-1.5">
            Use as abas <strong>Recebimentos</strong> e <strong>Pagamentos</strong> para registrar.
          </p>
        </Card>
      )}
    </div>
  );
}
