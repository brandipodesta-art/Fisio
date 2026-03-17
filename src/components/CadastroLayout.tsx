"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileText, History, UserRound } from "lucide-react";
import { useState } from "react";
import CadastroForm from "./CadastroForm";
import EvolucaoField from "./EvolucaoField";
import HistoricoCliente from "./HistoricoCliente";
import ClientesListagem from "./ClientesListagem";
import PacienteVisualizacao from "./PacienteVisualizacao";
import type { PacienteResumo } from "@/lib/types/paciente";

/**
 * CadastroLayout
 *
 * Modos de exibição:
 *  - "listagem"     → Apenas a listagem de clientes (sem cabeçalho, sem abas)
 *  - "novo"         → Formulário de criação (sem abas de Evolução/Histórico)
 *  - "editar:id"    → Abas: Cadastro | Evolução | Histórico  (dentro do cliente)
 *  - "ver:id"       → Abas: Visualizar | Evolução | Histórico (dentro do cliente)
 */

type Modo =
  | { tipo: "listagem" }
  | { tipo: "novo" }
  | { tipo: "editar"; id: string; nome?: string }
  | { tipo: "ver"; id: string; nome?: string };

interface CadastroLayoutProps {
  onTabChange?: (tab: string) => void;
}

export default function CadastroLayout({ onTabChange }: CadastroLayoutProps) {
  const [modo, setModo] = useState<Modo>({ tipo: "listagem" });
  const [abaCliente, setAbaCliente] = useState("dados");

  const handleNovoCadastro = () => {
    setModo({ tipo: "novo" });
    setAbaCliente("dados");
  };

  const handleEditarCliente = (cliente: PacienteResumo) => {
    setModo({ tipo: "editar", id: cliente.id, nome: cliente.nome_completo });
    setAbaCliente("dados");
  };

  const handleVisualizarCliente = (cliente: PacienteResumo) => {
    setModo({ tipo: "ver", id: cliente.id, nome: cliente.nome_completo });
    setAbaCliente("dados");
  };

  const handleSalvoComSucesso = () => setModo({ tipo: "listagem" });
  const handleCancelar = () => setModo({ tipo: "listagem" });
  const handleVoltarDaVisualizacao = () => setModo({ tipo: "listagem" });

  const handleEditarDaVisualizacao = () => {
    if (modo.tipo === "ver") {
      setModo({ tipo: "editar", id: modo.id, nome: modo.nome });
      setAbaCliente("dados");
    }
  };

  // ── MODO LISTAGEM ─────────────────────────────────────────────────────────
  if (modo.tipo === "listagem") {
    return (
      <div className="py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <ClientesListagem
            onNovoCadastro={handleNovoCadastro}
            onEditarCliente={handleEditarCliente}
            onVisualizarCliente={handleVisualizarCliente}
          />
        </div>
      </div>
    );
  }

  // ── MODO NOVO CADASTRO ────────────────────────────────────────────────────
  if (modo.tipo === "novo") {
    return (
      <div className="py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <CadastroForm
            pacienteId={null}
            onSalvoComSucesso={handleSalvoComSucesso}
            onCancelar={handleCancelar}
          />
        </div>
      </div>
    );
  }

  // ── MODO EDITAR / VISUALIZAR (com abas Evolução e Histórico) ─────────────
  const nomeCliente =
    modo.tipo === "editar" || modo.tipo === "ver" ? (modo.nome ?? "Cliente") : "";

  const idCliente = modo.tipo === "editar" || modo.tipo === "ver" ? modo.id : "";

  return (
    <div className="py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Breadcrumb / identificação do cliente */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => setModo({ tipo: "listagem" })}
            className="hover:text-emerald-600 transition-colors"
          >
            Clientes
          </button>
          <span>/</span>
          <span className="text-slate-800 font-medium flex items-center gap-1">
            <UserRound className="w-3.5 h-3.5" />
            {nomeCliente}
          </span>
        </div>

        {/* Abas do cliente: Dados | Evolução | Histórico */}
        <Tabs
          value={abaCliente}
          onValueChange={setAbaCliente}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border border-slate-200 rounded-lg p-1">
            <TabsTrigger
              value="dados"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
            >
              <UserRound className="w-4 h-4" />
              <span className="hidden sm:inline">
                {modo.tipo === "ver" ? "Visualizar" : "Cadastro"}
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

          {/* Aba: Dados do cliente (Visualizar ou Editar) */}
          <TabsContent value="dados" className="space-y-6">
            {modo.tipo === "ver" ? (
              <PacienteVisualizacao
                pacienteId={idCliente}
                onVoltar={handleVoltarDaVisualizacao}
                onEditar={handleEditarDaVisualizacao}
              />
            ) : (
              <CadastroForm
                pacienteId={idCliente}
                onSalvoComSucesso={handleSalvoComSucesso}
                onCancelar={handleCancelar}
              />
            )}
          </TabsContent>

          {/* Aba: Evolução */}
          <TabsContent value="evolucao" className="space-y-6">
            <Card className="p-6 border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Evolução Clínica
              </h2>
              <EvolucaoField />
            </Card>
          </TabsContent>

          {/* Aba: Histórico */}
          <TabsContent value="historico" className="space-y-6">
            <HistoricoCliente pacienteId={idCliente} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
