"use client";

import { DollarSign, TrendingUp, Receipt, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function FinanceiroPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Financeiro</h1>
        <p className="text-slate-600">
          Controle financeiro da clínica — receitas, despesas e relatórios
        </p>
      </div>

      {/* Placeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Receitas</p>
              <p className="text-2xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50">
              <Receipt className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Despesas</p>
              <p className="text-2xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Saldo</p>
              <p className="text-2xl font-bold text-slate-900">—</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Em desenvolvimento */}
      <Card className="p-12 border-slate-200 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
            <DollarSign className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Módulo em Desenvolvimento
          </h2>
          <p className="text-slate-500 max-w-md">
            O módulo financeiro está sendo construído. Em breve você poderá
            gerenciar receitas, despesas, pagamentos e gerar relatórios
            financeiros.
          </p>
        </div>
      </Card>
    </div>
  );
}
