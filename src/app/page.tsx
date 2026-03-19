"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import CadastroLayout from "@/components/CadastroLayout";
import AgendaPage from "@/components/AgendaPage";
import FinanceiroPage from "@/components/FinanceiroPage";
import ConfiguracoesPage from "@/components/ConfiguracoesPage";

export default function Page() {
  const [activePage, setActivePage] = useState("cadastro");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 animate-fade-in" key={activePage}>
        {activePage === "cadastro" && <CadastroLayout />}
        {activePage === "agenda" && (
          <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 py-8">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie os agendamentos de pacientes e horarios da clinica
              </p>
            </div>
            <AgendaPage />
          </div>
        )}
        {activePage === "financeiro" && <FinanceiroPage />}
        {activePage === "configuracoes" && <ConfiguracoesPage />}
      </main>
    </div>
  );
}
