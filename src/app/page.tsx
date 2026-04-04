"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import CadastroLayout from "@/components/CadastroLayout";
import AgendaPage from "@/components/AgendaPage";
import FinanceiroPage from "@/components/FinanceiroPage";
import ConfiguracoesPage from "@/components/ConfiguracoesPage";
import LoginPage from "@/components/LoginPage";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissoes } from "@/lib/auth/usePermissoes";
import { Loader2 } from "lucide-react";

export default function Page() {
  const [activePage, setActivePage] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("fisio_active_page") ?? "cadastro")
      : "cadastro"
  );
  const { usuario, isLoading } = useAuth();
  const { podeVerFinanceiro, podeVerConfiguracoes } = usePermissoes();

  // Redireciona para cadastro se a página salva não é permitida para o perfil atual
  useEffect(() => {
    if (isLoading) return;
    if (activePage === "financeiro" && !podeVerFinanceiro) setActivePage("cadastro");
    if (activePage === "configuracoes" && !podeVerConfiguracoes) setActivePage("cadastro");
  }, [activePage, podeVerFinanceiro, podeVerConfiguracoes, isLoading]);

  useEffect(() => {
    localStorage.setItem("fisio_active_page", activePage);
  }, [activePage]);

  // Aguarda restauração da sessão do sessionStorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  // Não autenticado → exibe tela de Login
  if (!usuario) {
    return <LoginPage />;
  }

  // Autenticado → exibe a aplicação
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
        {activePage === "financeiro" && podeVerFinanceiro && <FinanceiroPage />}
        {activePage === "configuracoes" && podeVerConfiguracoes && <ConfiguracoesPage />}
      </main>
    </div>
  );
}
