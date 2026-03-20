"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FileText, History, UserRound, ChevronRight } from "lucide-react";
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
 * Modos de exibicao:
 *  - "listagem"     -> Apenas a listagem de clientes (sem cabecalho, sem abas)
 *  - "novo"         -> Formulario de criacao (sem abas de Evolucao/Historico)
 *  - "editar:id"    -> Abas: Cadastro | Evolucao | Historico  (dentro do cliente)
 *  - "ver:id"       -> Abas: Visualizar | Evolucao | Historico (dentro do cliente)
 */

type Modo =
  | { tipo: "listagem" }
  | { tipo: "novo" }
  | { tipo: "editar"; id: string; nome?: string; tipoUsuario?: string }
  | { tipo: "ver"; id: string; nome?: string; tipoUsuario?: string };

export default function CadastroLayout() {
  const [modo, setModo] = useState<Modo>({ tipo: "listagem" });
  const [abaCliente, setAbaCliente] = useState("dados");

  const handleNovoCadastro = () => {
    setModo({ tipo: "novo" });
    setAbaCliente("dados");
  };

  const handleEditarCliente = (cliente: PacienteResumo) => {
    setModo({ tipo: "editar", id: cliente.id, nome: cliente.nome_completo, tipoUsuario: cliente.tipo_usuario });
    setAbaCliente("dados");
  };

  const handleVisualizarCliente = (cliente: PacienteResumo) => {
    setModo({ tipo: "ver", id: cliente.id, nome: cliente.nome_completo, tipoUsuario: cliente.tipo_usuario });
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

  // ── MODO EDITAR / VISUALIZAR (com abas Evolucao e Historico) ─────────────
  const nomeCliente =
    modo.tipo === "editar" || modo.tipo === "ver" ? (modo.nome ?? "Cliente") : "";

  const idCliente = modo.tipo === "editar" || modo.tipo === "ver" ? modo.id : "";

  const tipoUsuarioCliente = modo.tipo === "editar" || modo.tipo === "ver" ? (modo.tipoUsuario ?? "paciente") : "paciente";

  return (
    <div className="py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Breadcrumb premium com chevron */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <button
            onClick={() => setModo({ tipo: "listagem" })}
            className="hover:text-primary transition-premium font-medium"
          >
            Clientes
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-foreground font-medium flex items-center gap-1.5">
            <UserRound className="w-3.5 h-3.5 text-primary" />
            {nomeCliente}
          </span>
        </nav>

        {/* Abas do cliente: Dados | Evolucao | Historico */}
        <Tabs
          value={abaCliente}
          onValueChange={setAbaCliente}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/60 border border-border rounded-xl p-1 h-auto">
            <TabsTrigger
              value="dados"
              className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-premium"
            >
              <UserRound className="w-4 h-4" />
              <span className="hidden sm:inline">
                {modo.tipo === "ver" ? "Visualizar" : "Cadastro"}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="evolucao"
              className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-premium"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Evolucao</span>
            </TabsTrigger>

            <TabsTrigger
              value="historico"
              className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-premium"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historico</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba: Dados do cliente (Visualizar ou Editar) */}
          <TabsContent value="dados" className="space-y-6 animate-fade-in">
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

          {/* Aba: Evolucao */}
          <TabsContent value="evolucao" className="space-y-6 animate-fade-in">
            <Card className="p-6 border-border shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                Evolucao Clinica
              </h2>
              <EvolucaoField />
            </Card>
          </TabsContent>

          {/* Aba: Histórico */}
          <TabsContent value="historico" className="space-y-6 animate-fade-in">
            <HistoricoCliente
              pacienteId={idCliente}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
