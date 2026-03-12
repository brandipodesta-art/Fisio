"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import CadastroLayout from "@/components/CadastroLayout";
import AgendaPage from "@/components/AgendaPage";
import FinanceiroPage from "@/components/FinanceiroPage";

/**
 * Page - Página principal com navegação via Top Bar
 * Seções: Cadastro, Agenda, Financeiro
 */
export default function Page() {
  const [activePage, setActivePage] = useState("cadastro");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <TopBar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1">
        {activePage === "cadastro" && <CadastroLayout />}
        {activePage === "agenda" && (
          <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Agenda</h1>
              <p className="text-slate-600">
                Gerencie os agendamentos de pacientes e horários da clínica
              </p>
            </div>
            <AgendaPage />
          </div>
        )}
        {activePage === "financeiro" && <FinanceiroPage />}
      </main>
    </div>
  );
}
