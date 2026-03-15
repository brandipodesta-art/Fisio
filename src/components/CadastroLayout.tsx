"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileText, History, List } from "lucide-react";
import { useState } from "react";
import CadastroForm from "./CadastroForm";
import EvolucaoField from "./EvolucaoField";
import HistoricoCliente from "./HistoricoCliente";
import ClientesListagem from "./ClientesListagem";
import type { PacienteResumo } from "@/lib/types/paciente";

/**
 * CadastroLayout - Componente principal que organiza o cadastro em abas
 * Design: Healthcare Minimal - Cards com abas, layout responsivo
 *
 * Abas visíveis: Clientes | Evolução | Histórico
 *
 * O formulário de cadastro/edição não é uma aba — ele é exibido como
 * um painel que substitui o conteúdo da aba Clientes quando:
 *  - O usuário clica em "Novo Cadastro"
 *  - O usuário clica em um card de paciente para editar
 */

interface CadastroLayoutProps {
  onTabChange?: (tab: string) => void;
}

export default function CadastroLayout({ onTabChange }: CadastroLayoutProps) {
  const [activeTab, setActiveTab] = useState("clientes");

  /**
   * null     → listagem visível (modo normal)
   * ""       → formulário de novo cadastro
   * "uuid"   → formulário de edição do paciente com esse ID
   */
  const [modoFormulario, setModoFormulario] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    // Ao trocar de aba, fecha o formulário
    setModoFormulario(null);
    setActiveTab(value);
    onTabChange?.(value);
  };

  /** Abre o formulário em modo de criação */
  const handleNovoCadastro = () => {
    setModoFormulario("");
  };

  /** Abre o formulário em modo de edição */
  const handleEditarCliente = (cliente: PacienteResumo) => {
    setModoFormulario(cliente.id);
  };

  /** Após salvar, fecha o formulário e volta para a listagem */
  const handleSalvoComSucesso = () => {
    setModoFormulario(null);
  };

  /** Ao cancelar, fecha o formulário sem salvar */
  const handleCancelar = () => {
    setModoFormulario(null);
  };

  const exibirFormulario = modoFormulario !== null;

  return (
    <div className="py-8">
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

        {/* Tabs Navigation — apenas 3 abas visíveis */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-slate-200 rounded-lg p-1">
            {/* Aba: Clientes */}
            <TabsTrigger
              value="clientes"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>

            {/* Aba: Evolução */}
            <TabsTrigger
              value="evolucao"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Evolução</span>
            </TabsTrigger>

            {/* Aba: Histórico */}
            <TabsTrigger
              value="historico"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Tab Content: Clientes ── */}
          <TabsContent value="clientes" className="space-y-6">
            {exibirFormulario ? (
              /* Formulário de cadastro / edição (substitui a listagem) */
              <CadastroForm
                pacienteId={modoFormulario || null}
                onSalvoComSucesso={handleSalvoComSucesso}
                onCancelar={handleCancelar}
              />
            ) : (
              /* Listagem normal */
              <ClientesListagem
                onNovoCadastro={handleNovoCadastro}
                onEditarCliente={handleEditarCliente}
              />
            )}
          </TabsContent>

          {/* ── Tab Content: Evolução ── */}
          <TabsContent value="evolucao" className="space-y-6">
            <Card className="p-6 border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Evolução Clínica
              </h2>
              <EvolucaoField />
            </Card>
          </TabsContent>

          {/* ── Tab Content: Histórico ── */}
          <TabsContent value="historico" className="space-y-6">
            <HistoricoCliente />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
