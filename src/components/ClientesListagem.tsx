"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Eye,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { PacienteResumo } from "@/lib/types/paciente";
import { TIPO_USUARIO_LABEL, TIPO_USUARIO_COLOR } from "@/lib/types/paciente";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Formata a data ISO do Supabase para DD/MM/AAAA */
function formatarData(iso: string): string {
  if (!iso) return "—";
  // Se já está no formato DD/MM/AAAA, retorna direto
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────
interface ClientesListagemProps {
  onNovoCadastro?: () => void;
  onEditarCliente?: (cliente: PacienteResumo) => void;
  onVisualizarCliente?: (cliente: PacienteResumo) => void;
}

export default function ClientesListagem({
  onNovoCadastro,
  onEditarCliente,
  onVisualizarCliente,
}: ClientesListagemProps) {
  // ── Estado ────────────────────────────────────────────
  const [clientes, setClientes] = useState<PacienteResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
   const [totalGeral, setTotalGeral] = useState(0);

  // ── Filtros ──────────────────────────────────────────────────────
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroCpf, setFiltroCpf] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroProfissional, setFiltroProfissional] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [profissionaisList, setProfissionaisList] = useState<{ id: string; name: string }[]>([]);

  // Carrega profissionais dinamicamente
  useEffect(() => {
    const sb = createClient();
    sb.from("profissionais").select("id, name").order("name").then(({ data }) => {
      if (data) setProfissionaisList(data as { id: string; name: string }[]);
    });
  }, []);

  // Refs para debounce dos filtros de texto
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Busca de dados ──────────────────────────────────
  // ── Alternar status ativo/inativo ────────────────────────────────────
  const alternarStatus = async (cliente: PacienteResumo) => {
    try {
      const res = await fetch(`/api/pacientes/${cliente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !cliente.ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      // Atualiza localmente sem recarregar tudo
      setClientes((prev) =>
        prev.map((c) =>
          c.id === cliente.id ? { ...c, ativo: !cliente.ativo } : c
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const buscarClientes = useCallback(
    async (nome: string, cpf: string, tipo: string, profissional: string, status: string = "todos") => {
      setLoading(true);
      setErro(null);
      try {
        const params = new URLSearchParams();
        if (nome.trim()) params.set("nome", nome.trim());
        if (cpf.trim()) params.set("cpf", cpf.replace(/\D/g, ""));
        if (tipo && tipo !== "todos") params.set("tipo", tipo);
        if (profissional && profissional !== "todos") params.set("profissional", profissional);
        if (status && status !== "todos") params.set("status", status);

        const res = await fetch(`/api/pacientes?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Erro ao buscar dados");
        }
        const data: PacienteResumo[] = await res.json();
        setClientes(data);

        // Atualiza o total geral apenas quando não há filtros ativos
        if (!nome.trim() && !cpf.trim() && (!tipo || tipo === "todos") && (!profissional || profissional === "todos") && (!status || status === "todos")) {
          setTotalGeral(data.length);
        }
      } catch (e: unknown) {
        setErro(e instanceof Error ? e.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Busca inicial (sem filtros) para obter o total
  useEffect(() => {
    buscarClientes("", "", "todos", "", "todos");
  }, [buscarClientes]);

  // Dispara nova busca com debounce ao alterar filtros
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      buscarClientes(filtroNome, filtroCpf, filtroTipo, filtroProfissional, filtroStatus);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filtroNome, filtroCpf, filtroTipo, filtroProfissional, filtroStatus, buscarClientes]);

  // ── Handlers ──────────────────────────────────────────
  const limparFiltros = () => {
    setFiltroNome("");
    setFiltroCpf("");
    setFiltroTipo("todos");
    setFiltroProfissional("todos");
    setFiltroStatus("todos");
  };

  const handleFiltroCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    const formatted = digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setFiltroCpf(formatted);
  };

  const filtrosAtivos =
    filtroNome !== "" || filtroCpf !== "" || filtroTipo !== "todos" || filtroProfissional !== "todos" || filtroStatus !== "todos";

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Clientes Cadastrados
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando...
              </span>
            ) : (
              <>
                {clientes.length} de {totalGeral} clientes
                {filtrosAtivos && " (filtros aplicados)"}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => buscarClientes(filtroNome, filtroCpf, filtroTipo, filtroProfissional)}
            className="gap-1.5 text-slate-600"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            onClick={onNovoCadastro}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
          >
            <UserCheck className="w-4 h-4" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Painel de Filtros */}
      <Card className="p-5 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            Filtros de Busca
          </span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

          {/* Filtro: Profissional Responsável */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Profissional Responsável
            </Label>
            <Select value={filtroProfissional} onValueChange={setFiltroProfissional}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos os profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os profissionais</SelectItem>
                  {profissionaisList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro: Status */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">
              Status
            </Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Estado de erro */}
      {erro && (
        <Card className="p-6 border-red-200 bg-red-50 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-red-700 font-medium text-sm">
                Erro ao carregar clientes
              </p>
              <p className="text-red-500 text-xs mt-0.5">{erro}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => buscarClientes(filtroNome, filtroCpf, filtroTipo, filtroProfissional)}
              className="ml-auto border-red-300 text-red-600 hover:bg-red-100"
            >
              Tentar novamente
            </Button>
          </div>
        </Card>
      )}

      {/* Estado de carregamento */}
      {loading && !erro && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 border-slate-200 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lista de clientes */}
      {!loading && !erro && clientes.length === 0 && (
        <Card className="p-12 border-slate-200 shadow-sm text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {filtrosAtivos
              ? "Nenhum cliente encontrado com esses filtros"
              : "Nenhum cliente cadastrado ainda"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {filtrosAtivos
              ? "Tente ajustar os filtros de busca."
              : "Clique em \"Novo Cadastro\" para adicionar o primeiro cliente."}
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
      )}

      {!loading && !erro && clientes.length > 0 && (
        <div className="space-y-2">
          {clientes.map((cliente) => (
            <Card
              key={cliente.id}
              className={`shadow-sm hover:shadow-md transition-all duration-150 ${
                cliente.ativo
                  ? "border-slate-200 hover:border-slate-300"
                  : "border-slate-200 bg-slate-50 opacity-75 hover:border-slate-300"
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    cliente.ativo ? "bg-emerald-100" : "bg-slate-200"
                  }`}
                >
                  <UserRound
                    className={`w-5 h-5 ${
                      cliente.ativo ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                </div>

                {/* Dados principais */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-semibold truncate ${
                      cliente.ativo ? "text-slate-900" : "text-slate-400"
                    }`}>
                      {cliente.nome_completo}
                    </span>
                    {!cliente.ativo && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                        Inativo
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        TIPO_USUARIO_COLOR[cliente.tipo_usuario] ??
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {TIPO_USUARIO_LABEL[cliente.tipo_usuario] ??
                        cliente.tipo_usuario}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-mono">{cliente.cpf}</span>
                    {cliente.telefone_cel && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {cliente.telefone_cel}
                      </span>
                    )}
                    {cliente.data_nascimento && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Nasc.: {formatarData(cliente.data_nascimento)}
                      </span>
                    )}
                    {cliente.profissional_responsavel && (
                      <span className="hidden sm:inline">
                        Responsável:{" "}
                        {cliente.profissional_responsavel
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data de cadastro + cidade */}
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-slate-400">
                    Cadastro: {formatarData(cliente.created_at)}
                  </span>
                  {cliente.cidade && (
                    <span className="text-xs text-slate-400">
                      {cliente.cidade}
                    </span>
                  )}
                </div>

                {/* Ícones de ação */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Visualizar"
                    onClick={() => onVisualizarCliente?.(cliente)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    title="Editar"
                    onClick={() => onEditarCliente?.(cliente)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
