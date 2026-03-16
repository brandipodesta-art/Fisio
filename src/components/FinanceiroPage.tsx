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
      {/* Abas de navegação */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-8 w-full">
        {ABAS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              text-sm font-medium transition-all duration-150 cursor-pointer
              ${
                aba === key
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo da aba ativa */}
      {aba === "resumo"       && <FinanceiroResumo />}
      {aba === "recebimentos" && <FinanceiroRecebimentos />}
      {aba === "pagamentos"   && <FinanceiroPagamentos />}
    </div>
  );
}
