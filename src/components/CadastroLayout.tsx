"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileText, History, List } from "lucide-react";
import { useState } from "react";
import CadastroForm from "./CadastroForm";
import EvolucaoField from "./EvolucaoField";
import HistoricoCliente from "./HistoricoCliente";
import ClientesListagem from "./ClientesListagem";
import PacienteVisualizacao from "./PacienteVisualizacao";
import type { PacienteResumo } from "@/lib/types/paciente";

/**
 * CadastroLayout - Componente principal que organiza o cadastro em abas
 * Design: Healthcare Minimal - Cards com abas, layout responsivo
 *
 * Abas visíveis: Clientes | Evolução | Histórico
 *
 * O formulário e a visualização não são abas — são painéis que substituem
 * o conteúdo da aba Clientes conforme o modo ativo:
 *
 *  modo = "listagem"     → listagem normal
 *  modo = "novo"         → formulário de criação
 *  modo = "editar:uuid"  → formulário de edição
 *  modo = "ver:uuid"     → visualização somente leitura
 */

type Modo =
  | { tipo: "listagem" }
  | { tipo: "novo" }
  | { tipo: "editar"; id: string }
  | { tipo: "ver"; id: string };

interface CadastroLayoutProps {
  onTabChange?: (tab: string) => void;
}

export default function CadastroLayout({ onTabChange }: CadastroLayoutProps) {
  const [activeTab, setActiveTab] = useState("clientes");
  const [modo, setModo] = useState<Modo>({ tipo: "listagem" });

  const handleTabChange = (value: string) => {
    setModo({ tipo: "listagem" });
    setActiveTab(value);
    onTabChange?.(value);
  };

  const handleNovoCadastro = () => setModo({ tipo: "novo" });

  const handleEditarCliente = (cliente: PacienteResumo) =>
    setModo({ tipo: "editar", id: cliente.id });

  const handleVisualizarCliente = (cliente: PacienteResumo) =>
    setModo({ tipo: "ver", id: cliente.id });

  const handleSalvoComSucesso = () => setModo({ tipo: "listagem" });
  const handleCancelar = () => setModo({ tipo: "listagem" });
  const handleVoltarDaVisualizacao = () => setModo({ tipo: "listagem" });

  const handleEditarDaVisualizacao = () => {
    if (modo.tipo === "ver") {
      setModo({ tipo: "editar", id: modo.id });
    }
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
            {modo.tipo === "listagem" && (
              <ClientesListagem
                onNovoCadastro={handleNovoCadastro}
                onEditarCliente={handleEditarCliente}
                onVisualizarCliente={handleVisualizarCliente}
              />
            )}

            {(modo.tipo === "novo" || modo.tipo === "editar") && (
              <CadastroForm
                pacienteId={modo.tipo === "editar" ? modo.id : null}
                onSalvoComSucesso={handleSalvoComSucesso}
                onCancelar={handleCancelar}
              />
            )}

            {modo.tipo === "ver" && (
              <PacienteVisualizacao
                pacienteId={modo.id}
                onVoltar={handleVoltarDaVisualizacao}
                onEditar={handleEditarDaVisualizacao}
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
