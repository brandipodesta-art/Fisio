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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  X,
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
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { PacienteResumo } from "@/lib/types/paciente";
import { TIPO_USUARIO_LABEL, TIPO_USUARIO_COLOR } from "@/lib/types/paciente";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Formata a data ISO do Supabase para DD/MM/AAAA */
function formatarData(iso: string): string {
  if (!iso) return "\u2014";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return iso;
  }
}

/** Gera iniciais a partir do nome */
function getIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return nome.slice(0, 2).toUpperCase();
}

/** Gera uma cor baseada no hash do nome */
function getAvatarColor(nome: string): string {
  const cores = [
    "from-emerald-500 to-emerald-700",
    "from-blue-500 to-blue-700",
    "from-violet-500 to-violet-700",
    "from-amber-500 to-amber-700",
    "from-rose-500 to-rose-700",
    "from-cyan-500 to-cyan-700",
    "from-indigo-500 to-indigo-700",
    "from-teal-500 to-teal-700",
  ];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cores[Math.abs(hash) % cores.length];
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

  // ── Alternar status ativo/inativo ────────────────────────────────────
  const alternarStatus = async (cliente: PacienteResumo) => {
    try {
      const res = await fetch(`/api/pacientes/${cliente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !cliente.ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
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

  // Busca inicial
  useEffect(() => {
    buscarClientes("", "", "todos", "", "todos");
  }, [buscarClientes]);

  // Debounce ao alterar filtros
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
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Clientes Cadastrados
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando...
              </span>
            ) : (
              <>
                <span className="font-medium text-foreground">{clientes.length}</span>
                {" de "}
                <span className="font-medium text-foreground">{totalGeral}</span>
                {" clientes"}
                {filtrosAtivos && (
                  <span className="ml-1.5 text-xs font-medium text-primary bg-accent px-2 py-0.5 rounded-full">
                    filtros aplicados
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => buscarClientes(filtroNome, filtroCpf, filtroTipo, filtroProfissional)}
            className="gap-1.5 text-muted-foreground"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button
            onClick={onNovoCadastro}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* Painel de Filtros */}
      <Card className="p-5 border-border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground/80">
            Filtros de Busca
          </span>
          {filtrosAtivos && (
            <button
              onClick={limparFiltros}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-premium"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Filtro: Nome Completo */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Nome Completo
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
              <Input
                placeholder="Buscar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-9 text-sm"
              />
              {filtroNome && (
                <button
                  onClick={() => setFiltroNome("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-premium"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro: CPF */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              CPF
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-premium"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro: Tipo de Usuario */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Tipo de Usuario
            </Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="funcionario">Funcionario</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro: Profissional Responsavel */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Profissional Responsavel
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
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
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
        <Card className="p-6 border-destructive/30 bg-destructive/5 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-destructive font-medium text-sm">
                Erro ao carregar clientes
              </p>
              <p className="text-destructive/70 text-xs mt-0.5">{erro}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => buscarClientes(filtroNome, filtroCpf, filtroTipo, filtroProfissional)}
              className="ml-auto border-destructive/30 text-destructive hover:bg-destructive/10"
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
            <Card key={i} className="p-4 border-border animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lista vazia */}
      {!loading && !erro && clientes.length === 0 && (
        <Card className="p-12 border-border shadow-sm text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <p className="text-foreground font-medium">
            {filtrosAtivos
              ? "Nenhum cliente encontrado com esses filtros"
              : "Nenhum cliente cadastrado ainda"}
          </p>
          <p className="text-muted-foreground text-sm mt-1.5">
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

      {/* Lista de clientes */}
      {!loading && !erro && clientes.length > 0 && (
        <div className="space-y-2">
          {clientes.map((cliente) => (
            <Card
              key={cliente.id}
              className={`hover-lift shadow-sm ${
                cliente.ativo
                  ? "border-border"
                  : "border-border bg-muted/30 opacity-70"
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Avatar com iniciais */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold shadow-sm bg-gradient-to-br ${
                    cliente.ativo ? getAvatarColor(cliente.nome_completo) : "from-gray-400 to-gray-500"
                  }`}
                >
                  {getIniciais(cliente.nome_completo)}
                </div>

                {/* Dados principais */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`font-semibold text-sm truncate ${
                      cliente.ativo ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {cliente.nome_completo}
                    </span>
                    {!cliente.ativo && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        Inativo
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        TIPO_USUARIO_COLOR[cliente.tipo_usuario] ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {TIPO_USUARIO_LABEL[cliente.tipo_usuario] ??
                        cliente.tipo_usuario}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
                        Responsavel:{" "}
                        {cliente.profissional_responsavel
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>

                {/* Data de cadastro + cidade */}
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] text-muted-foreground/60">
                    Cadastro: {formatarData(cliente.created_at)}
                  </span>
                  {cliente.cidade && (
                    <span className="text-[11px] text-muted-foreground/60">
                      {cliente.cidade}
                    </span>
                  )}
                </div>

                {/* Menu de acoes (tres pontos) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-premium outline-none">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => onVisualizarCliente?.(cliente)}
                      className="gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-info" />
                      <span>Visualizar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEditarCliente?.(cliente)}
                      className="gap-2 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => alternarStatus(cliente)}
                      className="gap-2 cursor-pointer"
                    >
                      {cliente.ativo ? (
                        <>
                          <ToggleLeft className="w-4 h-4 text-warning" />
                          <span>Desativar</span>
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-4 h-4 text-success" />
                          <span>Ativar</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
