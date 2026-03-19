"use client";

import { useState } from "react";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import FinanceiroResumo       from "@/components/FinanceiroResumo";
import FinanceiroRecebimentos from "@/components/FinanceiroRecebimentos";
import FinanceiroPagamentos   from "@/components/FinanceiroPagamentos";

type Aba = "resumo" | "recebimentos" | "pagamentos";

const ABAS: { key: Aba; label: string; icon: React.ElementType }[] = [
  { key: "resumo",       label: "Resumo",      icon: BarChart2    },
  { key: "recebimentos", label: "Recebimentos", icon: TrendingUp   },
  { key: "pagamentos",   label: "Pagamentos",   icon: TrendingDown },
];

export default function FinanceiroPage() {
  const [aba, setAba] = useState<Aba>("resumo");

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
      {/* Cabecalho da pagina */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Controle de recebimentos, pagamentos e fluxo de caixa
        </p>
      </div>

      {/* Abas de navegacao — estilo premium */}
      <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 mb-8 w-full border border-border">
        {ABAS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              text-sm font-medium transition-premium cursor-pointer
              ${
                aba === key
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Conteudo da aba ativa */}
      <div className="animate-fade-in" key={aba}>
        {aba === "resumo"       && <FinanceiroResumo />}
        {aba === "recebimentos" && <FinanceiroRecebimentos />}
        {aba === "pagamentos"   && <FinanceiroPagamentos />}
      </div>
    </div>
  );
}
