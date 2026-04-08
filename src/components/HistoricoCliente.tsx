"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Ban, DollarSign, Calendar, Stethoscope, Users, AlertTriangle, MoreHorizontal, Eye, Check, Pencil, X } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmActionDialog from "@/components/ui/ConfirmActionDialog";
import ModalPortal from "@/components/ui/ModalPortal";
import { usePermissoes } from "@/lib/auth/usePermissoes";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * HistoricoCliente — Aba de Histórico do cliente
 *
 * Dois modos de operação:
 *  - Paciente: exibe procedimentos, frequência, financeiro e evolução do próprio paciente
 *  - Funcionário/Financeiro: exibe os pacientes vinculados ao profissional,
 *    seus procedimentos com porcentagem de comissão e os recebimentos (incluindo pendentes)
 */

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface RecebimentoRaw {
  id: string;
  paciente_id: string | null;
  paciente_nome: string | null;
  procedimento_id: string | null;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
}

interface ProcedimentoResumo {
  nome: string;
  procedimento_id: string | null;
  total: number;
  pagos: number;
  pendentes: number;
  canceladas: number;
  valorTotal: number;
  valorPago: number;
  comissaoPercentual: number;
  comissaoValor: number;
  ultimaData: string;
}

interface FrequenciaSession {
  date: string;
  status: "concluido" | "faltou" | "cancelado";
  procedimentoNome: string | null;
}

interface Frequencia {
  mes: string;
  presencas: number;
  faltas: number;
  cancelamentos: number;
  sessoes: FrequenciaSession[];
}

interface FinanceiroItem {
  id: string;
  paciente_nome: string | null;
  descricao: string;
  valor: number;
  data: string;
  data_vencimento: string;
  status: "pago" | "pendente" | "atrasado" | "cancelado";
}

interface Evolucao {
  id: string;
  data: string;
  descricao: string;
}

interface ComissaoMap {
  // chave: procedimento_id
  [procedimentoId: string]: number; // percentual
}

interface PacienteVinculado {
  id: string;
  nome_completo: string;
}

interface HistoricoClienteProps {
  pacienteId?: string;
  tipoUsuario?: string;
  nomeCompleto?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extrairProcedimentoBase(descricao: string): string {
  return descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
}

function formatarData(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return iso;
  }
}

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slugFromNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── Helpers de Frequência ────────────────────────────────────────────────────

function formatMesNome(mes: string): string {
  const [year, month] = mes.split("-");
  const nomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${nomes[parseInt(month) - 1]} ${year}`;
}

function TaxaBadge({ taxa }: { taxa: number }) {
  if (taxa >= 85)
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
        <span>✓</span> Ótima ({taxa}%)
      </span>
    );
  if (taxa >= 70)
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
        <span>⚠</span> Regular ({taxa}%)
      </span>
    );
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
      <span>✗</span> Baixa ({taxa}%)
    </span>
  );
}

function BarraPresenca({ taxa, showLabel }: { taxa: number; showLabel?: boolean }) {
  const color = taxa >= 85 ? "bg-green-500" : taxa >= 70 ? "bg-amber-400" : "bg-destructive";
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Taxa de Presença</span>
          <span className="font-semibold text-foreground">{taxa}%</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${taxa}%` }}
        />
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function HistoricoCliente({
  pacienteId,
  tipoUsuario = "paciente",
  nomeCompleto = "",
}: HistoricoClienteProps) {
  const isFuncionario = tipoUsuario === "funcionario" || tipoUsuario === "financeiro";
  const { podeConfirmarPagamento, podeAlterarRecebimento } = usePermissoes();
  const { usuario } = useAuth();

  const [recebimentosRaw, setRecebimentosRaw] = useState<RecebimentoRaw[]>([]);
  const [frequencia, setFrequencia]           = useState<Frequencia[]>([]);
  const [evolucoes, setEvolucoes]             = useState<Evolucao[]>([]);
  const [comissoes, setComissoes]             = useState<ComissaoMap>({});
  const [pacientesVinculados, setPacientesVinculados] = useState<PacienteVinculado[]>([]);
  const [isLoading, setIsLoading]             = useState(true);

  // Estados para ações nos itens financeiros
  const [visualizandoItem, setVisualizandoItem] = useState<FinanceiroItem | null>(null);
  const [confirmandoItem, setConfirmandoItem]   = useState<FinanceiroItem | null>(null);
  const [alterandoItem, setAlterandoItem]       = useState<FinanceiroItem | null>(null);
  const [salvandoAcao, setSalvandoAcao]         = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const headers = { apikey: key, Authorization: `Bearer ${key}` };

      const get = (path: string) =>
        fetch(`${url}/rest/v1/${path}`, { headers }).then(r => r.json());

      try {
        if (isFuncionario && nomeCompleto) {
          // ── Modo Funcionário ───────────────────────────────────────────────────────────────────
          const slug = slugFromNome(nomeCompleto);

          // 1. Buscar pacientes vinculados ao profissional
          const pacientes: { id: string; nome_completo: string }[] = await get(
            `pacientes?profissional_responsavel=eq.${encodeURIComponent(slug)}&ativo=eq.true&select=id,nome_completo`
          );

          const listaPacientes: PacienteVinculado[] = Array.isArray(pacientes)
            ? pacientes.map(p => ({ id: p.id, nome_completo: p.nome_completo }))
            : [];
          setPacientesVinculados(listaPacientes);

          if (listaPacientes.length === 0) { setIsLoading(false); return; }

          const ids = listaPacientes.map(p => p.id).join(",");

          // 2. Buscar recebimentos dos pacientes vinculados
          const recebimentos: RecebimentoRaw[] = await get(
            `recebimentos?paciente_id=in.(${ids})&order=data_vencimento.desc&select=id,paciente_id,paciente_nome,procedimento_id,descricao,valor,data_vencimento,data_pagamento,status`
          );
          setRecebimentosRaw(Array.isArray(recebimentos) ? recebimentos : []);

          // 3. Buscar comissões do profissional
          const comissoesData: { procedimento_id: string; percentual: number }[] = await get(
            `comissoes_profissional?profissional_id=eq.${encodeURIComponent(slug)}&select=procedimento_id,percentual`
          );
          const mapa: ComissaoMap = {};
          if (Array.isArray(comissoesData)) {
            comissoesData.forEach(c => { mapa[c.procedimento_id] = c.percentual; });
          }
          setComissoes(mapa);

        } else if (pacienteId) {
          // ── Modo Paciente ────────────────────────────────────────────────────────────────────
          const [recebimentos, agendamentosFreq, evols] = await Promise.all([
            get(`recebimentos?paciente_id=eq.${pacienteId}&order=data_vencimento.desc&select=id,paciente_id,paciente_nome,procedimento_id,descricao,valor,data_vencimento,data_pagamento,status`),
            // Frequências calculadas direto dos agendamentos — nunca desatualizado
            get(`agendamentos?paciente_id=eq.${pacienteId}&status=in.(concluido,faltou,cancelado)&select=date,status,procedimentos(nome)&order=date.desc`),
            get(`evolucoes?paciente_id=eq.${pacienteId}&order=created_at.desc&select=*`),
          ]);

          if (Array.isArray(recebimentos)) setRecebimentosRaw(recebimentos as RecebimentoRaw[]);
          if (Array.isArray(agendamentosFreq)) {
            // Agrupa por mês: conta presencas (concluido) e faltas (faltou)
            type AptFreq = { date: string; status: string; procedimentos?: { nome: string } | null };
            const byMonth: Record<string, { presencas: number; faltas: number; cancelamentos: number; sessoes: FrequenciaSession[] }> = {};
            for (const apt of agendamentosFreq as AptFreq[]) {
              const mes = apt.date.substring(0, 7);
              if (!byMonth[mes]) byMonth[mes] = { presencas: 0, faltas: 0, cancelamentos: 0, sessoes: [] };
              if (apt.status === "concluido") byMonth[mes].presencas++;
              else if (apt.status === "faltou") byMonth[mes].faltas++;
              else if (apt.status === "cancelado") byMonth[mes].cancelamentos++;
              byMonth[mes].sessoes.push({
                date: apt.date,
                status: apt.status as "concluido" | "faltou" | "cancelado",
                procedimentoNome: apt.procedimentos?.nome ?? null,
              });
            }
            setFrequencia(
              Object.entries(byMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([mes, data]) => ({ mes, ...data }))
            );
          }
          if (Array.isArray(evols)) {
            setEvolucoes(evols.map((e: { id: string; data_salva: string; texto: string }) => ({
              id: e.id, data: e.data_salva, descricao: e.texto,
            })));
          }
        }
      } catch (err) {
        console.error("HistoricoCliente fetchData error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [pacienteId, isFuncionario, nomeCompleto]);

  // ── Agrupa recebimentos por procedimento base ─────────────────────────────
  const procedimentos = useMemo<ProcedimentoResumo[]>(() => {
    const mapa = new Map<string, ProcedimentoResumo>();

    for (const r of recebimentosRaw) {
      const nome = extrairProcedimentoBase(r.descricao);
      const procId = r.procedimento_id ?? null;
      const statusNorm = r.status === "recebido" ? "pago" : r.status;
      const valorNum = Number(r.valor);
      const percentual = procId ? (comissoes[procId] ?? 0) : 0;
      const existing = mapa.get(nome);

      if (existing) {
        existing.total += 1;
        existing.valorTotal += valorNum;
        if (statusNorm === "pago") {
          existing.pagos += 1;
          existing.valorPago += valorNum;
        }
        if (statusNorm === "pendente" || statusNorm === "atrasado") existing.pendentes += 1;
        if (statusNorm === "cancelado") existing.canceladas += 1;
        if (r.data_vencimento > existing.ultimaData) existing.ultimaData = r.data_vencimento;
        // Recalcula comissão
        existing.comissaoValor = existing.valorPago * existing.comissaoPercentual / 100;
      } else {
        const valorPago = statusNorm === "pago" ? valorNum : 0;
        mapa.set(nome, {
          nome,
          procedimento_id: procId,
          total: 1,
          pagos: statusNorm === "pago" ? 1 : 0,
          pendentes: (statusNorm === "pendente" || statusNorm === "atrasado") ? 1 : 0,
          canceladas: statusNorm === "cancelado" ? 1 : 0,
          valorTotal: valorNum,
          valorPago,
          comissaoPercentual: percentual,
          comissaoValor: valorPago * percentual / 100,
          ultimaData: r.data_vencimento,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [recebimentosRaw, comissoes]);

  // ── Lista financeira ──────────────────────────────────────────────────────
  const financeiro = useMemo<FinanceiroItem[]>(() => {
    return recebimentosRaw.map(r => ({
      id: r.id,
      paciente_nome: r.paciente_nome,
      descricao: r.descricao,
      valor: Number(r.valor),
      data: r.data_pagamento ?? r.data_vencimento,
      data_vencimento: r.data_vencimento,
      status: (r.status === "recebido" ? "pago" : r.status) as FinanceiroItem["status"],
    }));
  }, [recebimentosRaw]);

  const financeiroOrdenado = useMemo(() => {
    return [...financeiro].sort((a, b) => {
      // Pendentes primeiro, depois por data de vencimento
      if (a.status === "pendente" && b.status !== "pendente") return -1;
      if (a.status !== "pendente" && b.status === "pendente") return 1;
      return a.data_vencimento.localeCompare(b.data_vencimento);
    });
  }, [financeiro]);

  const pendentes = useMemo(() => financeiro.filter(f => f.status === "pendente" || f.status === "atrasado"), [financeiro]);
  const totalRecebido = useMemo(() => financeiro.filter(f => f.status === "pago").reduce((s, f) => s + f.valor, 0), [financeiro]);
  const totalPendente = useMemo(() => pendentes.reduce((s, f) => s + f.valor, 0), [pendentes]);
  const totalComissao = useMemo(() => procedimentos.reduce((s, p) => s + p.comissaoValor, 0), [procedimentos]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pendente":  return "bg-amber-100 text-amber-800";
      case "atrasado":  return "bg-orange-100 text-orange-800";
      case "cancelado": return "bg-muted text-foreground";
      default:          return "bg-muted text-foreground";
    }
  };

  // ─── Funções de ação nos itens financeiros ──────────────────────────────

  async function confirmarPagamento(item: FinanceiroItem) {
    setSalvandoAcao(true);
    try {
      // Busca o recebimento completo para não perder campos ao fazer PUT
      const recAtual = await fetch(`/api/recebimentos/${item.id}`).then(r => r.json());

      const res = await fetch(`/api/recebimentos/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recAtual,
          status: "recebido",
          data_pagamento: new Date().toISOString().slice(0, 10),
          confirmado_por: usuario?.nome_completo ?? usuario?.nome_acesso ?? null,
          confirmado_por_id: usuario?.id ?? null,
        }),
      });

      if (res.ok) {
        // Atualiza localmente para resposta imediata na UI
        setRecebimentosRaw(prev =>
          prev.map(r => r.id === item.id
            ? { ...r, status: "recebido", data_pagamento: new Date().toISOString().slice(0, 10) }
            : r
          )
        );
      }
    } catch (err) {
      console.warn("Erro ao confirmar pagamento:", err);
    } finally {
      setSalvandoAcao(false);
      setConfirmandoItem(null);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5 shadow-sm border-border bg-gradient-to-r from-card to-accent/40 dark:to-accent/20">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {isFuncionario ? "Histórico do Profissional" : "Histórico do Cliente"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isFuncionario
            ? "Procedimentos e financeiro dos pacientes vinculados a este profissional"
            : "Visualize procedimentos, frequência, dados financeiros e evolução clínica"}
        </p>

        {/* Pacientes vinculados (modo funcionário) */}
        {isFuncionario && pacientesVinculados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Pacientes vinculados:
            </span>
            {pacientesVinculados.map(p => (
              <span key={p.id} className="text-xs bg-accent text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                {p.nome_completo}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Abas */}
      <Tabs defaultValue={isFuncionario ? "procedimentos" : "frequencia"} className="w-full">
        <TabsList className={`grid w-full bg-muted border border-border rounded-lg p-1 ${isFuncionario ? "grid-cols-2" : "grid-cols-3"}`}>
          {/* Procedimentos: somente para funcionário/financeiro */}
          {isFuncionario && (
            <TabsTrigger
              value="procedimentos"
              className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Procedimentos</span>
            </TabsTrigger>
          )}
          {/* Frequência: somente para paciente */}
          {!isFuncionario && (
            <TabsTrigger
              value="frequencia"
              className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Frequência</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="financeiro"
            className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          {!isFuncionario && (
            <TabsTrigger
              value="evolucao"
              className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-primary"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Evolução</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Tab: Procedimentos (somente funcionário/financeiro) ─────────── */}
        {isFuncionario && <TabsContent value="procedimentos" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Carregando procedimentos...</p>
            </Card>
          ) : isFuncionario && pacientesVinculados.length === 0 ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Nenhum paciente vinculado a este profissional.</p>
            </Card>
          ) : procedimentos.length === 0 ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Nenhum procedimento registrado</p>
            </Card>
          ) : (
            <>
              {/* Resumo geral */}
              <Card className="p-5 border-border shadow-sm bg-muted/50">
                <div className={`grid gap-4 ${isFuncionario ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Procedimentos distintos</p>
                    <p className="text-2xl font-bold text-foreground">{procedimentos.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total de sessões</p>
                    <p className="text-2xl font-bold text-foreground">
                      {procedimentos.reduce((s, p) => s + p.total, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sessões pendentes</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {procedimentos.reduce((s, p) => s + p.pendentes, 0)}
                    </p>
                  </div>
                  {isFuncionario && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Comissão total</p>
                      <p className="text-2xl font-bold text-primary">{fmt(totalComissao)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Cards por procedimento */}
              {procedimentos.map((proc) => (
                <Card key={proc.nome} className="p-5 border-border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="font-semibold text-foreground">{proc.nome}</h3>
                      {isFuncionario && proc.comissaoPercentual > 0 && (
                        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                          {proc.comissaoPercentual}% comissão
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60">
                      Último: {formatarData(proc.ultimaData)}
                    </span>
                  </div>

                  <div className={`grid gap-3 text-center ${proc.canceladas > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-xl font-bold text-foreground">{proc.total}</p>
                    </div>
                    <div className="bg-accent rounded-lg p-3 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">Pagas</p>
                      <p className="text-xl font-bold text-primary">{proc.pagos}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs text-muted-foreground mb-1">Pendentes</p>
                      <p className="text-xl font-bold text-amber-700">{proc.pendentes}</p>
                    </div>
                    {proc.canceladas > 0 && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-muted-foreground mb-1">Canceladas</p>
                        <p className="text-xl font-bold text-red-600">{proc.canceladas}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/60 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Valor total do procedimento</span>
                      <span className="text-sm font-semibold text-foreground">{fmt(proc.valorTotal)}</span>
                    </div>
                    {isFuncionario && proc.comissaoPercentual > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Comissão ({proc.comissaoPercentual}% sobre {fmt(proc.valorPago)} recebido)
                        </span>
                        <span className="text-sm font-semibold text-primary">{fmt(proc.comissaoValor)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>}

        {/* ── Tab: Frequência (somente paciente) ─────────────────────────── */}
        {!isFuncionario && (
          <TabsContent value="frequencia" className="space-y-4">
            {isLoading ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Carregando frequência...</p>
              </Card>
            ) : frequencia.length === 0 ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Nenhum registro de frequência ainda</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Aparece aqui após sessões concluídas ou faltas registradas</p>
              </Card>
            ) : (
              <>
                {/* ── Resumo geral (aparece com 2+ meses) ── */}
                {frequencia.length > 1 && (() => {
                  const totalPresencas     = frequencia.reduce((s, f) => s + f.presencas, 0);
                  const totalFaltas        = frequencia.reduce((s, f) => s + f.faltas, 0);
                  const totalCancelamentos = frequencia.reduce((s, f) => s + f.cancelamentos, 0);
                  const totalSessoes       = totalPresencas + totalFaltas; // cancelamentos não entram na taxa
                  const taxaGeral          = totalSessoes > 0 ? Math.round((totalPresencas / totalSessoes) * 100) : 0;
                  return (
                    <Card className="p-5 border-border shadow-sm bg-gradient-to-br from-primary/5 to-accent">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" />
                          Resumo Geral
                        </h3>
                        <TaxaBadge taxa={taxaGeral} />
                      </div>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="text-center bg-background/60 rounded-lg p-3 border border-border">
                          <p className="text-2xl font-bold text-primary">{totalPresencas}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Presenças</p>
                        </div>
                        <div className="text-center bg-background/60 rounded-lg p-3 border border-border">
                          <p className="text-2xl font-bold text-destructive">{totalFaltas}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Faltas</p>
                        </div>
                        <div className="text-center bg-background/60 rounded-lg p-3 border border-border">
                          <p className="text-2xl font-bold text-slate-500">{totalCancelamentos}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Cancelamentos</p>
                        </div>
                        <div className="text-center bg-background/60 rounded-lg p-3 border border-border">
                          <p className="text-2xl font-bold text-foreground">{totalSessoes}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
                        </div>
                      </div>
                      <BarraPresenca taxa={taxaGeral} showLabel />
                    </Card>
                  );
                })()}

                {/* ── Gráfico de evolução mensal (aparece com 2+ meses) ── */}
                {frequencia.length > 1 && (
                  <Card className="p-5 border-border shadow-sm">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Evolução Mensal
                    </h3>
                    <div className="flex items-end gap-2" style={{ height: "96px" }}>
                      {[...frequencia].reverse().map((freq, i) => {
                        const total = freq.presencas + freq.faltas;
                        const taxa  = total > 0 ? Math.round((freq.presencas / total) * 100) : 0;
                        const barColor =
                          taxa >= 85 ? "bg-green-500" :
                          taxa >= 70 ? "bg-amber-400" :
                          "bg-destructive";
                        const heightPct = `${Math.max(8, taxa)}%`;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                            <span className="text-[10px] font-semibold text-foreground/80">{taxa}%</span>
                            <div className="flex-1 w-full relative">
                              <div
                                className={`absolute bottom-0 w-full rounded-t-sm ${barColor} transition-all duration-500`}
                                style={{ height: heightPct }}
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground">
                              {freq.mes.substring(5, 7)}/{freq.mes.substring(2, 4)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />≥ 85% Ótima</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />70–84% Regular</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-destructive inline-block" />&lt; 70% Baixa</span>
                    </div>
                  </Card>
                )}

                {/* ── Cards mensais individuais ── */}
                {frequencia.map((freq, index) => {
                  const total = freq.presencas + freq.faltas;
                  const taxa  = total > 0 ? Math.round((freq.presencas / total) * 100) : 0;
                  return (
                    <Card key={index} className="p-5 border-border shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">{formatMesNome(freq.mes)}</h3>
                        <TaxaBadge taxa={taxa} />
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* Presenças */}
                        <div className="bg-accent rounded-lg p-3 border border-primary/20 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Presenças</p>
                            <p className="text-2xl font-bold text-primary leading-tight">{freq.presencas}</p>
                          </div>
                        </div>
                        {/* Faltas */}
                        <div className={`rounded-lg p-3 border flex items-center gap-3 ${
                          freq.faltas > 0
                            ? "bg-destructive/10 border-destructive/20"
                            : "bg-accent border-border"
                        }`}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            freq.faltas > 0 ? "bg-destructive/10" : "bg-muted"
                          }`}>
                            <X className={`w-4 h-4 ${freq.faltas > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Faltas</p>
                            <p className={`text-2xl font-bold leading-tight ${freq.faltas > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                              {freq.faltas}
                            </p>
                          </div>
                        </div>
                        {/* Cancelamentos */}
                        <div className={`rounded-lg p-3 border flex items-center gap-3 ${
                          freq.cancelamentos > 0
                            ? "bg-slate-50 border-slate-200"
                            : "bg-accent border-border"
                        }`}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            freq.cancelamentos > 0 ? "bg-slate-100" : "bg-muted"
                          }`}>
                            <Ban className={`w-4 h-4 ${freq.cancelamentos > 0 ? "text-slate-500" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cancelamentos</p>
                            <p className={`text-2xl font-bold leading-tight ${freq.cancelamentos > 0 ? "text-slate-500" : "text-muted-foreground"}`}>
                              {freq.cancelamentos}
                            </p>
                          </div>
                        </div>
                      </div>
                      <BarraPresenca taxa={taxa} showLabel />
                      {taxa < 70 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Frequência abaixo do recomendado. Conversar com o paciente.
                        </div>
                      )}
                      {/* Lista de sessões individuais */}
                      {freq.sessoes.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Sessões do mês</p>
                          {[...freq.sessoes].sort((a, b) => a.date.localeCompare(b.date)).map((s, i) => {
                            const [, mm, dd] = s.date.split("-");
                            const concluido = s.status === "concluido";
                            const cancelado = s.status === "cancelado";
                            const bgClass = concluido ? "bg-green-50/60" : cancelado ? "bg-slate-50" : "bg-red-50/60";
                            const iconClass = concluido ? "text-green-600" : cancelado ? "text-slate-400" : "text-destructive";
                            const textClass = concluido ? "text-foreground" : cancelado ? "text-muted-foreground" : "text-destructive/80";
                            const icon = concluido ? "✓" : cancelado ? "–" : "✗";
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm ${bgClass}`}
                              >
                                <span className={`font-bold text-xs w-4 text-center ${iconClass}`}>
                                  {icon}
                                </span>
                                <span className="text-xs text-muted-foreground w-10 shrink-0">{dd}/{mm}</span>
                                <span className={`text-xs font-medium ${textClass}`}>
                                  {s.procedimentoNome ?? <span className="italic text-muted-foreground/60">Sem procedimento</span>}
                                </span>
                                {cancelado && (
                                  <span className="ml-auto text-[10px] text-slate-400 font-normal">Cancelado</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </>
            )}
          </TabsContent>
        )}

        {/* ── Tab: Financeiro ────────────────────────────────────────────── */}
        <TabsContent value="financeiro" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Carregando financeiro...</p>
            </Card>
          ) : financeiro.length === 0 ? (
            <Card className="p-6 border-border shadow-sm text-center">
              <p className="text-muted-foreground">Nenhum registro financeiro</p>
            </Card>
          ) : (
            <>
              {/* Resumo financeiro */}
              <Card className="p-5 border-border shadow-sm bg-muted/50">
                <div className={`grid gap-4 ${isFuncionario ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Recebido</p>
                    <p className="text-2xl font-bold text-primary">{fmt(totalRecebido)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pendente</p>
                    <p className="text-2xl font-bold text-amber-700">{fmt(totalPendente)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Geral</p>
                    <p className="text-2xl font-bold text-foreground">
                      {fmt(financeiro.reduce((s, f) => s + f.valor, 0))}
                    </p>
                  </div>
                  {isFuncionario && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Comissão Total</p>
                      <p className="text-2xl font-bold text-primary">{fmt(totalComissao)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Seção de pendentes — destaque */}
              {pendentes.length > 0 && (
                <Card className="p-5 border-amber-200 bg-amber-50 dark:bg-amber-900/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                      Pendentes de Pagamento ({pendentes.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {pendentes.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white dark:bg-card rounded-lg px-3 py-2 border border-amber-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {isFuncionario && item.paciente_nome && (
                              <span className="font-medium text-foreground/70">{item.paciente_nome}</span>
                            )}
                            <span>Venc.: {formatarData(item.data_vencimento)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold text-amber-700">{fmt(item.valor)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                              {item.status === "atrasado" ? "Atrasado" : "Pendente"}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-amber-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem
                                onClick={() => setVisualizandoItem(item)}
                                className="cursor-pointer"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              {(podeConfirmarPagamento || podeAlterarRecebimento) && <DropdownMenuSeparator />}
                              {podeConfirmarPagamento && (
                                <DropdownMenuItem
                                  onClick={() => setConfirmandoItem(item)}
                                  className="text-emerald-700 cursor-pointer focus:text-emerald-700"
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Confirmar Pagamento
                                </DropdownMenuItem>
                              )}
                              {podeAlterarRecebimento && (
                                <DropdownMenuItem
                                  onClick={() => setAlterandoItem(item)}
                                  className="cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Alterar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Histórico completo */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">Histórico Completo</h3>
                {financeiroOrdenado.map((item) => (
                  <Card key={item.id} className="p-4 border-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground text-sm">{item.descricao}</h3>
                          {isFuncionario && item.paciente_nome && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {item.paciente_nome}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.status === "pago" ? "Pago em" : "Venc.:"} {formatarData(item.data)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-foreground mb-1">{fmt(item.valor)}</p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {item.status === "pago" ? "Pago" :
                             item.status === "pendente" ? "Pendente" :
                             item.status === "atrasado" ? "Atrasado" : "Cancelado"}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => setVisualizandoItem(item)}
                              className="cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            {(item.status === "pendente" || item.status === "atrasado") && (podeConfirmarPagamento || podeAlterarRecebimento) && (
                              <>
                                <DropdownMenuSeparator />
                                {podeConfirmarPagamento && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmandoItem(item)}
                                    className="text-emerald-700 cursor-pointer focus:text-emerald-700"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirmar Pagamento
                                  </DropdownMenuItem>
                                )}
                                {podeAlterarRecebimento && (
                                  <DropdownMenuItem
                                    onClick={() => setAlterandoItem(item)}
                                    className="cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Alterar
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Tab: Evolução (somente paciente) ───────────────────────────── */}
        {!isFuncionario && (
          <TabsContent value="evolucao" className="space-y-4">
            {isLoading ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Carregando evolução...</p>
              </Card>
            ) : evolucoes.length === 0 ? (
              <Card className="p-6 border-border shadow-sm text-center">
                <p className="text-muted-foreground">Nenhuma evolução registrada</p>
              </Card>
            ) : (
              evolucoes.map((evo) => (
                <Card key={evo.id} className="p-6 border-border shadow-sm">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground">{evo.data}</p>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed">{evo.descricao}</p>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ── Modal: Visualizar item financeiro ─────────────────────────── */}
      {visualizandoItem && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-popover rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-500" /> Detalhes do Recebimento
                </h2>
                <button onClick={() => setVisualizandoItem(null)} className="text-muted-foreground/60 hover:text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Procedimento</p>
                    <p className="text-sm text-foreground">{visualizandoItem.descricao}</p>
                  </div>
                  {visualizandoItem.paciente_nome && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Paciente</p>
                      <p className="text-sm text-foreground">{visualizandoItem.paciente_nome}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Valor</p>
                    <p className="text-sm font-semibold text-primary">{fmt(visualizandoItem.valor)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(visualizandoItem.status)}`}>
                      {visualizandoItem.status === "pago" ? "Pago" :
                       visualizandoItem.status === "pendente" ? "Pendente" :
                       visualizandoItem.status === "atrasado" ? "Atrasado" : "Cancelado"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Vencimento</p>
                    <p className="text-sm text-foreground">{formatarData(visualizandoItem.data_vencimento)}</p>
                  </div>
                  {visualizandoItem.status === "pago" && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Data do Pagamento</p>
                      <p className="text-sm text-foreground">{formatarData(visualizandoItem.data)}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-border/60">
                <button
                  onClick={() => setVisualizandoItem(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted"
                >
                  Fechar
                </button>
                {(visualizandoItem.status === "pendente" || visualizandoItem.status === "atrasado") && (
                  <button
                    onClick={() => { setConfirmandoItem(visualizandoItem); setVisualizandoItem(null); }}
                    className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Confirmar Pagamento
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Modal: Alterar item financeiro ─────────────────────────────── */}
      {alterandoItem && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-popover rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-500" /> Alterar Recebimento
                </h2>
                <button onClick={() => setAlterandoItem(null)} className="text-muted-foreground/60 hover:text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 font-medium">
                    Para alterar os dados completos deste recebimento, acesse o módulo <strong>Financeiro &gt; Recebimentos</strong> e localize o registro de <strong>{alterandoItem.descricao}</strong>.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Procedimento</p>
                    <p className="text-foreground">{alterandoItem.descricao}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Valor</p>
                    <p className="font-semibold text-primary">{fmt(alterandoItem.valor)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Vencimento</p>
                    <p className="text-foreground">{formatarData(alterandoItem.data_vencimento)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alterandoItem.status)}`}>
                      {alterandoItem.status === "pendente" ? "Pendente" : "Atrasado"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-5 border-t border-border/60">
                <button
                  onClick={() => setAlterandoItem(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── Dialog: Confirmar Pagamento ─────────────────────────────────── */}
      <ConfirmActionDialog
        open={!!confirmandoItem}
        onOpenChange={(open) => { if (!open) setConfirmandoItem(null); }}
        onConfirm={() => { if (confirmandoItem) confirmarPagamento(confirmandoItem); }}
        titulo="Confirmar Pagamento"
        mensagem={`Confirmar o recebimento de ${confirmandoItem ? fmt(confirmandoItem.valor) : ""} referente a "${confirmandoItem?.descricao ?? ""}"? A data de pagamento será registrada como hoje.`}
        labelConfirmar="Confirmar Pagamento"
        loading={salvandoAcao}
        variante="warning"
      />
    </div>
  );
}
