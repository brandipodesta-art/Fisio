"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Users, FileText, History, List } from "lucide-react";
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
 * Fluxo de edição:
 *  1. Usuário clica em um card na aba "Clientes"
 *  2. CadastroLayout armazena o pacienteId selecionado
 *  3. Navega para a aba "Cadastro" passando o pacienteId ao CadastroForm
 *  4. CadastroForm carrega os dados via GET /api/pacientes/[id] e entra em modo edição
 *  5. Ao salvar, volta automaticamente para a aba "Clientes"
 */

interface CadastroLayoutProps {
  onTabChange?: (tab: string) => void;
}

export default function CadastroLayout({ onTabChange }: CadastroLayoutProps) {
  const [activeTab, setActiveTab] = useState("clientes");

  /**
   * ID do paciente sendo editado.
   * null  → modo de criação (novo cadastro)
   * string → modo de edição
   */
  const [pacienteEditandoId, setPacienteEditandoId] = useState<string | null>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  /** Abre o formulário em modo de criação */
  const handleNovoCadastro = () => {
    setPacienteEditandoId(null);
    handleTabChange("cadastro");
  };

  /** Abre o formulário em modo de edição com os dados do paciente selecionado */
  const handleEditarCliente = (cliente: PacienteResumo) => {
    setPacienteEditandoId(cliente.id);
    handleTabChange("cadastro");
  };

  /** Após salvar com sucesso, volta para a listagem */
  const handleSalvoComSucesso = () => {
    setPacienteEditandoId(null);
    handleTabChange("clientes");
  };

  /** Ao cancelar, volta para a listagem sem limpar o ID (permite re-editar) */
  const handleCancelar = () => {
    setPacienteEditandoId(null);
    handleTabChange("clientes");
  };

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

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            // Ao navegar manualmente para a aba Cadastro, reseta o modo de edição
            if (val === "cadastro") setPacienteEditandoId(null);
            handleTabChange(val);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-slate-200 rounded-lg p-1">
            {/* Aba: Clientes (listagem) */}
            <TabsTrigger
              value="clientes"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>

            {/* Aba: Cadastro (formulário) */}
            <TabsTrigger
              value="cadastro"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">
                {pacienteEditandoId ? "Editar" : "Cadastro"}
              </span>
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
          </TabsList>

          {/* ── Tab Content: Clientes (listagem) ── */}
          <TabsContent value="clientes" className="space-y-6">
            <ClientesListagem
              onNovoCadastro={handleNovoCadastro}
              onEditarCliente={handleEditarCliente}
            />
          </TabsContent>

          {/* ── Tab Content: Cadastro / Edição ── */}
          <TabsContent value="cadastro" className="space-y-6">
            <CadastroForm
              pacienteId={pacienteEditandoId}
              onSalvoComSucesso={handleSalvoComSucesso}
              onCancelar={handleCancelar}
            />
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
        </Tabs>
      </div>
    </div>
  );
}
