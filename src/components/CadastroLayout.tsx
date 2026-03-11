"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Users, FileText, History, CalendarDays } from "lucide-react";
import { useState } from "react";
import CadastroForm from "./CadastroForm";
import EvolucaoField from "./EvolucaoField";
import HistoricoCliente from "./HistoricoCliente";
import AgendaPage from "./AgendaPage";

/**
 * CadastroLayout - Componente principal que organiza o cadastro em abas
 * Design: Healthcare Minimal - Cards com abas, layout responsivo
 * Tipografia: Geist Sans com hierarquia clara
 */

interface CadastroLayoutProps {
  onTabChange?: (tab: string) => void;
}

export default function CadastroLayout({ onTabChange }: CadastroLayoutProps) {
  const [activeTab, setActiveTab] = useState("cadastro");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Cadastro de Pacientes
          </h1>
          <p className="text-slate-600">
            Gerencie informações de pacientes, evolução clínica e histórico de atendimentos
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-slate-200 rounded-lg p-1">
            <TabsTrigger
              value="cadastro"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Cadastro</span>
            </TabsTrigger>
            <TabsTrigger
              value="evolucao"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Evolução</span>
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger
              value="agenda"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Cadastro */}
          <TabsContent value="cadastro" className="space-y-6">
            <CadastroForm />
          </TabsContent>

          {/* Tab Content - Evolução */}
          <TabsContent value="evolucao" className="space-y-6">
            <Card className="p-6 border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Evolução Clínica
              </h2>
              <EvolucaoField />
            </Card>
          </TabsContent>

          {/* Tab Content - Histórico */}
          <TabsContent value="historico" className="space-y-6">
            <HistoricoCliente />
          </TabsContent>

          {/* Tab Content - Agenda */}
          <TabsContent value="agenda" className="space-y-6">
            <AgendaPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
