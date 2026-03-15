"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  UserRound,
  Phone,
  Calendar,
  Users,
  UserCheck,
  ChevronRight,
  Filter,
} from "lucide-react";

/**
 * Tipo que representa um cliente cadastrado no sistema.
 * Em produção, estes dados virão do banco de dados.
 */
export interface Cliente {
  id: string;
  nomeCompleto: string;
  cpf: string;
  tipoUsuario: "paciente" | "funcionario" | "admin" | "financeiro";
  profissionalResponsavel: string;
  telefonCel: string;
  dataNascimento: string;
  cidade: string;
  dataCadastro: string;
}

// ─────────────────────────────────────────────────────────
// Dados de exemplo (mock) — substituir por API/banco futuramente
// ─────────────────────────────────────────────────────────
const CLIENTES_MOCK: Cliente[] = [
  {
    id: "1",
    nomeCompleto: "Ana Paula Souza",
    cpf: "123.456.789-09",
    tipoUsuario: "paciente",
    profissionalResponsavel: "Aline Pereira",
    telefonCel: "(11) 98765-4321",
    dataNascimento: "15/03/1985",
    cidade: "São Paulo",
    dataCadastro: "10/01/2025",
  },
  {
    id: "2",
    nomeCompleto: "Carlos Eduardo Lima",
    cpf: "987.654.321-00",
    tipoUsuario: "paciente",
    profissionalResponsavel: "Amanda Augusta",
    telefonCel: "(11) 91234-5678",
    dataNascimento: "22/07/1990",
    cidade: "São Paulo",
    dataCadastro: "15/01/2025",
  },
  {
    id: "3",
    nomeCompleto: "Fernanda Costa",
    cpf: "456.789.123-45",
    tipoUsuario: "paciente",
    profissionalResponsavel: "Ana Carolina",
    telefonCel: "(11) 99876-5432",
    dataNascimento: "08/11/1978",
    cidade: "Guarulhos",
    dataCadastro: "20/01/2025",
  },
  {
    id: "4",
    nomeCompleto: "Roberto Alves Mendes",
    cpf: "321.654.987-12",
    tipoUsuario: "paciente",
    profissionalResponsavel: "Aline Pereira",
    telefonCel: "(11) 97654-3210",
    dataNascimento: "30/04/1965",
    cidade: "Osasco",
    dataCadastro: "25/01/2025",
  },
  {
    id: "5",
    nomeCompleto: "Juliana Martins",
    cpf: "654.321.098-76",
    tipoUsuario: "funcionario",
    profissionalResponsavel: "Amanda Augusta",
    telefonCel: "(11) 95432-1098",
    dataNascimento: "12/09/1992",
    cidade: "São Paulo",
    dataCadastro: "02/02/2025",
  },
  {
    id: "6",
    nomeCompleto: "Marcos Vinicius Rocha",
    cpf: "789.012.345-67",
    tipoUsuario: "paciente",
    profissionalResponsavel: "Ana Carolina",
    telefonCel: "(11) 93210-9876",
    dataNascimento: "05/06/2000",
    cidade: "São Paulo",
    dataCadastro: "10/02/2025",
  },
  {
    id: "7",
    nomeCompleto: "Patricia Oliveira",
    cpf: "012.345.678-90",
    tipoUsuario: "paciente",
    profissionalResponsavel: "Aline Pereira",
    telefonCel: "(11) 91098-7654",
    dataNascimento: "18/12/1988",
    cidade: "Mogi das Cruzes",
    dataCadastro: "14/02/2025",
  },
  {
    id: "8",
    nomeCompleto: "Bruna Ferreira Santos",
    cpf: "234.567.890-12",
    tipoUsuario: "financeiro",
    profissionalResponsavel: "Amanda Augusta",
    telefonCel: "(11) 98901-2345",
    dataNascimento: "27/02/1995",
    cidade: "São Paulo",
    dataCadastro: "18/02/2025",
  },
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  paciente: "Paciente",
  funcionario: "Funcionário",
  admin: "Admin",
  financeiro: "Financeiro",
};

const TIPO_COLOR: Record<string, string> = {
  paciente: "bg-emerald-100 text-emerald-700",
  funcionario: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  financeiro: "bg-amber-100 text-amber-700",
};

interface ClientesListagemProps {
  /** Chamado quando o usuário clica em "Novo Cadastro" */
  onNovoCadastro?: () => void;
  /** Chamado quando o usuário clica em "Ver / Editar" um cliente */
  onEditarCliente?: (cliente: Cliente) => void;
}

export default function ClientesListagem({
  onNovoCadastro,
  onEditarCliente,
}: ClientesListagemProps) {
  // ── Filtros ──────────────────────────────────────────
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCpf, setFiltroCpf] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // ── Dados filtrados ───────────────────────────────────
  const clientesFiltrados = useMemo(() => {
    return CLIENTES_MOCK.filter((c) => {
      const nomeOk =
        filtroNome.trim() === "" ||
        c.nomeCompleto
          .toLowerCase()
          .includes(filtroNome.trim().toLowerCase());

      const cpfDigits = filtroCpf.replace(/\D/g, "");
      const cpfOk =
        cpfDigits === "" ||
        c.cpf.replace(/\D/g, "").includes(cpfDigits);

      const tipoOk = filtroTipo === "todos" || c.tipoUsuario === filtroTipo;

      return nomeOk && cpfOk && tipoOk;
    });
  }, [filtroNome, filtroCpf, filtroTipo]);

  const limparFiltros = () => {
    setFiltroNome("");
    setFiltroCpf("");
    setFiltroTipo("todos");
  };

  const filtrosAtivos =
    filtroNome !== "" || filtroCpf !== "" || filtroTipo !== "todos";

  // ── Formatação de CPF durante digitação do filtro ────
  const handleFiltroCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    const formatted = digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setFiltroCpf(formatted);
  };

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Clientes Cadastrados
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {clientesFiltrados.length} de {CLIENTES_MOCK.length} clientes
            {filtrosAtivos && " (filtros aplicados)"}
          </p>
        </div>
        <Button
          onClick={onNovoCadastro}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
        >
          <UserCheck className="w-4 h-4" />
          Novo Cadastro
        </Button>
      </div>

      {/* ── Painel de Filtros ─────────────────────────── */}
      <Card className="p-5 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filtros de Busca</span>
          {filtrosAtivos && (
            <button
              onClick={limparFiltros}
              className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filtro: Nome Completo */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Nome Completo
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-9 text-sm"
              />
              {filtroNome && (
                <button
                  onClick={() => setFiltroNome("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro: CPF */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">
              CPF
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="000.000.000-00"
                value={filtroCpf}
                onChange={handleFiltroCpfChange}
                className="pl-9 text-sm"
                maxLength={14}
              />
              {filtroCpf && (
                <button
                  onClick={() => setFiltroCpf("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro: Tipo de Usuário */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Tipo de Usuário
            </Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Lista de Clientes ─────────────────────────── */}
      {clientesFiltrados.length === 0 ? (
        <Card className="p-12 border-slate-200 shadow-sm text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            Nenhum cliente encontrado
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Tente ajustar os filtros de busca.
          </p>
          {filtrosAtivos && (
            <Button
              variant="outline"
              size="sm"
              onClick={limparFiltros}
              className="mt-4"
            >
              Limpar filtros
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {clientesFiltrados.map((cliente) => (
            <Card
              key={cliente.id}
              className="border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-150 cursor-pointer group"
              onClick={() => onEditarCliente?.(cliente)}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <UserRound className="w-5 h-5 text-emerald-600" />
                </div>

                {/* Dados principais */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900 truncate">
                      {cliente.nomeCompleto}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        TIPO_COLOR[cliente.tipoUsuario]
                      }`}
                    >
                      {TIPO_LABEL[cliente.tipoUsuario]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="font-mono">{cliente.cpf}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {cliente.telefonCel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Nasc.: {cliente.dataNascimento}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      Responsável: {cliente.profissionalResponsavel}
                    </span>
                  </div>
                </div>

                {/* Data de cadastro + seta */}
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-slate-400">
                    Cadastro: {cliente.dataCadastro}
                  </span>
                  <span className="text-xs text-slate-400">
                    {cliente.cidade}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
