"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  Loader2,
  Users,
  UserCheck,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Paciente {
  id: string;
  nome_completo: string;
  tipo_usuario: string;
  profissional_responsavel: string | null;
}

interface Profissional {
  id: string;
  name: string;
}

interface Procedimento {
  id: string;
  nome: string;
}

interface Comissao {
  profissional_id: string;
  procedimento_id: string;
  percentual: number;
}

interface Recebimento {
  id: string;
  paciente_id: string;
  paciente_nome: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  forma_pagamento: string | null;
  procedimento_id: string | null;
  confirmado_por: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

function groupByDate<T extends { data_vencimento: string; data_pagamento: string | null; status: string }>(
  items: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.status === "recebido" || item.status === "pago"
      ? (item.data_pagamento ?? item.data_vencimento)
      : item.data_vencimento;
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  }
  // Ordena as chaves
  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  const get = (path: string) =>
    fetch(`${SUPA_URL}/rest/v1/${path}`, { headers }).then((r) => r.json());

  // ── Estados de filtro ──────────────────────────────────────────────────────
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState<"" | "clientes" | "funcionarios">("");
  const [tipoSelecionado, setTipoSelecionado] = useState<"" | "cliente" | "funcionario">("");
  const [clienteId, setClienteId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "confirmado" | "pendente">("todos");

  // ── Dados auxiliares ───────────────────────────────────────────────────────
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loadingAux, setLoadingAux] = useState(true);

  // ── Resultado do relatório ─────────────────────────────────────────────────
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [loadingRel, setLoadingRel] = useState(false);
  const [gerado, setGerado] = useState(false);

  // ── Carrega dados auxiliares ───────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingAux(true);
      try {
        const [pacs, profs, procs, comis] = await Promise.all([
          get("pacientes?ativo=eq.true&select=id,nome_completo,tipo_usuario,profissional_responsavel&order=nome_completo.asc"),
          get("profissionais?select=id,name&order=name.asc"),
          get("procedimentos?ativo=eq.true&select=id,nome&order=nome.asc"),
          get("comissoes_profissional?select=profissional_id,procedimento_id,percentual"),
        ]);
        if (Array.isArray(pacs)) setPacientes(pacs);
        if (Array.isArray(profs)) setProfissionais(profs);
        if (Array.isArray(procs)) setProcedimentos(procs);
        if (Array.isArray(comis)) setComissoes(comis);
      } finally {
        setLoadingAux(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pacientesClientes = pacientes.filter((p) => p.tipo_usuario === "paciente");

  // ── Gerar relatório ────────────────────────────────────────────────────────
  const gerarRelatorio = useCallback(async () => {
    if (!tipoRelatorio || !dataInicial || !dataFinal) return;

    setLoadingRel(true);
    setGerado(false);

    try {
      let query = `recebimentos?select=id,paciente_id,paciente_nome,descricao,valor,data_vencimento,data_pagamento,status,forma_pagamento,procedimento_id,confirmado_por`;

      // Filtro de data: usa data_vencimento como base
      query += `&data_vencimento=gte.${dataInicial}&data_vencimento=lte.${dataFinal}`;

      if (tipoRelatorio === "clientes" && clienteId && clienteId !== "todos") {
        query += `&paciente_id=eq.${clienteId}`;
      } else if (tipoRelatorio === "funcionarios" && funcionarioId && funcionarioId !== "todos") {
        // Busca pacientes do profissional
        const pacsProfissional = pacientes.filter(
          (p) => p.profissional_responsavel === funcionarioId
        );
        if (pacsProfissional.length === 0) {
          setRecebimentos([]);
          setGerado(true);
          setLoadingRel(false);
          return;
        }
        const ids = pacsProfissional.map((p) => p.id).join(",");
        query += `&paciente_id=in.(${ids})`;
      }

      // Filtro de status
      if (filtroStatus === "confirmado") {
        query += `&status=in.(recebido,pago)`;
      } else if (filtroStatus === "pendente") {
        query += `&status=in.(pendente,atrasado)`;
      }

      query += `&order=data_vencimento.asc`;

      const data = await get(query);
      setRecebimentos(Array.isArray(data) ? data : []);
      setGerado(true);
    } finally {
      setLoadingRel(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoRelatorio, dataInicial, dataFinal, clienteId, funcionarioId, filtroStatus, pacientes]);

  // ── Helpers de lookup ──────────────────────────────────────────────────────
  const nomeProcedimento = (id: string | null) => {
    if (!id) return "—";
    return procedimentos.find((p) => p.id === id)?.nome ?? "—";
  };

  const nomeProfissionalBySlug = (slug: string | null) => {
    if (!slug) return "—";
    return profissionais.find((p) => p.id === slug)?.name ?? slug;
  };

  const comissaoDoItem = (profId: string, procId: string | null) => {
    if (!procId) return null;
    return comissoes.find(
      (c) => c.profissional_id === profId && c.procedimento_id === procId
    ) ?? null;
  };

  // ── Dados derivados para relatório de clientes ─────────────────────────────
  const recebimentosConfirmados = recebimentos.filter(
    (r) => r.status === "recebido" || r.status === "pago"
  );
  const recebimentosPendentes = recebimentos.filter(
    (r) => r.status === "pendente" || r.status === "atrasado"
  );

  const totalConfirmado = recebimentosConfirmados.reduce((s, r) => s + Number(r.valor), 0);
  const totalPendente = recebimentosPendentes.reduce((s, r) => s + Number(r.valor), 0);
  const totalGeral = recebimentos.reduce((s, r) => s + Number(r.valor), 0);

  const gruposConfirmados = groupByDate(recebimentosConfirmados);
  const gruposPendentes = groupByDate(recebimentosPendentes);

  // ── Relatório de funcionários ──────────────────────────────────────────────
  const profSelecionado = profissionais.find((p) => p.id === funcionarioId);
  const pacientesProfissional = pacientes.filter(
    (p) => p.profissional_responsavel === funcionarioId
  );
  const idsPacientesProfissional = new Set(pacientesProfissional.map((p) => p.id));

  const recFuncionario = recebimentos.filter((r) =>
    idsPacientesProfissional.has(r.paciente_id)
  );
  const recFuncConfirmados = recFuncionario.filter(
    (r) => r.status === "recebido" || r.status === "pago"
  );
  const recFuncPendentes = recFuncionario.filter(
    (r) => r.status === "pendente" || r.status === "atrasado"
  );

  // Calcula comissão total do profissional
  const totalComissao = recFuncConfirmados.reduce((s, r) => {
    const com = comissaoDoItem(funcionarioId, r.procedimento_id);
    if (!com) return s;
    return s + (Number(r.valor) * com.percentual) / 100;
  }, 0);

  const gruposFuncConfirmados = groupByDate(recFuncConfirmados);
  const gruposFuncPendentes = groupByDate(recFuncPendentes);

  // ── Renderização de uma linha de recebimento (clientes) ────────────────────
  const renderLinhaCliente = (r: Recebimento) => {
    const paciente = pacientes.find((p) => p.id === r.paciente_id);
    const profSlug = paciente?.profissional_responsavel ?? null;
    return (
      <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
        <td className="py-2.5 px-3 text-sm text-foreground">{r.paciente_nome}</td>
        <td className="py-2.5 px-3 text-sm text-muted-foreground">{fmtDate(r.data_vencimento)}</td>
        <td className="py-2.5 px-3 text-sm text-muted-foreground">{fmtDate(r.data_pagamento)}</td>
        <td className="py-2.5 px-3 text-sm text-foreground">{nomeProcedimento(r.procedimento_id)}</td>
        <td className="py-2.5 px-3 text-sm font-medium text-foreground text-right">{fmt(Number(r.valor))}</td>
        <td className="py-2.5 px-3 text-sm text-muted-foreground">{nomeProfissionalBySlug(profSlug)}</td>
      </tr>
    );
  };

  // ── Renderização de uma linha de recebimento (funcionários) ───────────────
  const renderLinhaFuncionario = (r: Recebimento) => {
    const com = comissaoDoItem(funcionarioId, r.procedimento_id);
    const valorComissao = com ? (Number(r.valor) * com.percentual) / 100 : null;
    return (
      <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
        <td className="py-2.5 px-3 text-sm text-foreground">{profSelecionado?.name ?? funcionarioId}</td>
        <td className="py-2.5 px-3 text-sm text-foreground">{nomeProcedimento(r.procedimento_id)}</td>
        <td className="py-2.5 px-3 text-sm text-muted-foreground">{fmtDate(r.data_vencimento)}</td>
        <td className="py-2.5 px-3 text-sm text-muted-foreground">{fmtDate(r.data_pagamento)}</td>
        <td className="py-2.5 px-3 text-sm font-medium text-foreground text-right">{fmt(Number(r.valor))}</td>
        {com ? (
          <td className="py-2.5 px-3 text-sm text-right">
            <span className="text-muted-foreground text-xs">{com.percentual}% = </span>
            <span className="font-semibold text-emerald-600">{fmt(valorComissao!)}</span>
          </td>
        ) : (
          <td className="py-2.5 px-3 text-sm text-muted-foreground text-right">—</td>
        )}
        <td className="py-2.5 px-3 text-sm text-muted-foreground">{r.paciente_nome}</td>
      </tr>
    );
  };

  // ── Seção de grupo de data ─────────────────────────────────────────────────
  function SecaoData({
    data,
    itens,
    tipo,
  }: {
    data: string;
    itens: Recebimento[];
    tipo: "clientes" | "funcionarios";
  }) {
    const subtotal = itens.reduce((s, r) => s + Number(r.valor), 0);
    const subtotalComissao = tipo === "funcionarios"
      ? itens.reduce((s, r) => {
          const com = comissaoDoItem(funcionarioId, r.procedimento_id);
          return com ? s + (Number(r.valor) * com.percentual) / 100 : s;
        }, 0)
      : 0;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{fmtDate(data)}</span>
          <span className="ml-auto text-xs text-muted-foreground">{itens.length} registro(s)</span>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                {tipo === "clientes" ? (
                  <>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Cliente</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Vencimento</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Pagamento</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Procedimento</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-right">Valor</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Profissional</th>
                  </>
                ) : (
                  <>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Profissional</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Procedimento</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Data Proc.</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Data Pagto</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-right">Valor</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-right">Comissão</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Cliente</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tipo === "clientes"
                ? itens.map((r) => renderLinhaCliente(r))
                : itens.map((r) => renderLinhaFuncionario(r))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 border-t border-border">
                {tipo === "clientes" ? (
                  <>
                    <td colSpan={4} className="py-2 px-3 text-xs font-semibold text-muted-foreground">
                      Subtotal do dia
                    </td>
                    <td className="py-2 px-3 text-sm font-bold text-foreground text-right">{fmt(subtotal)}</td>
                    <td />
                  </>
                ) : (
                  <>
                    <td colSpan={4} className="py-2 px-3 text-xs font-semibold text-muted-foreground">
                      Subtotal do dia
                    </td>
                    <td className="py-2 px-3 text-sm font-bold text-foreground text-right">{fmt(subtotal)}</td>
                    <td className="py-2 px-3 text-sm font-bold text-emerald-600 text-right">{fmt(subtotalComissao)}</td>
                    <td />
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingAux) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  const podeGerar =
    tipoRelatorio !== "" &&
    dataInicial !== "" &&
    dataFinal !== "";

  const relatorioRef = useRef<HTMLDivElement>(null);

  // ── Exportar para Excel ────────────────────────────────────────────────────
  const exportarExcel = useCallback(async () => {
    const XLSX = (await import("xlsx")).default;
    const linhas: (string | number)[][] = [];

    const titulo = tipoRelatorio === "clientes"
      ? "Financeiro (Clientes) — Pagamentos Mensais"
      : "Financeiro (Funcionários) — Pagamentos Mensais";
    linhas.push([titulo]);
    linhas.push([`Período: ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`]);
    linhas.push([]);

    if (tipoRelatorio === "clientes") {
      linhas.push(["Status", "Cliente", "Vencimento", "Data Pagamento", "Procedimento", "Valor (R$)", "Profissional"]);
      for (const r of recebimentos) {
        const paciente = pacientes.find((p) => p.id === r.paciente_id);
        const profSlug = paciente?.profissional_responsavel ?? null;
        linhas.push([
          r.status === "recebido" || r.status === "pago" ? "Confirmado" : "Pendente",
          r.paciente_nome,
          fmtDate(r.data_vencimento),
          fmtDate(r.data_pagamento),
          nomeProcedimento(r.procedimento_id),
          Number(r.valor),
          nomeProfissionalBySlug(profSlug),
        ]);
      }
    } else {
      linhas.push(["Status", "Profissional", "Procedimento", "Data Proc.", "Data Pagto", "Valor (R$)", "Comissão (R$)", "Cliente"]);
      const lista = funcionarioId ? recFuncionario : recebimentos;
      for (const r of lista) {
        const com = comissaoDoItem(funcionarioId || "", r.procedimento_id);
        const valorCom = com ? (Number(r.valor) * com.percentual) / 100 : 0;
        const paciente = pacientes.find((p) => p.id === r.paciente_id);
        const profSlug = paciente?.profissional_responsavel ?? null;
        linhas.push([
          r.status === "recebido" || r.status === "pago" ? "Confirmado" : "Pendente",
          nomeProfissionalBySlug(profSlug),
          nomeProcedimento(r.procedimento_id),
          fmtDate(r.data_vencimento),
          fmtDate(r.data_pagamento),
          Number(r.valor),
          valorCom,
          r.paciente_nome,
        ]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio_${tipoRelatorio}_${dataInicial}_${dataFinal}.xlsx`);
  }, [tipoRelatorio, dataInicial, dataFinal, recebimentos, recFuncionario, pacientes, profissionais, procedimentos, comissoes, funcionarioId]);

  // ── Exportar para PDF ──────────────────────────────────────────────────────
  const exportarPDF = useCallback(async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const titulo = tipoRelatorio === "clientes"
      ? "Financeiro (Clientes) — Pagamentos Mensais"
      : "Financeiro (Funcionários) — Pagamentos Mensais";

    doc.setFontSize(14);
    doc.text(titulo, 14, 15);
    doc.setFontSize(9);
    doc.text(`Período: ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`, 14, 22);

    let head: string[][];
    let body: (string | number)[][];

    if (tipoRelatorio === "clientes") {
      head = [["Status", "Cliente", "Vencimento", "Data Pagamento", "Procedimento", "Valor", "Profissional"]];
      body = recebimentos.map((r) => {
        const paciente = pacientes.find((p) => p.id === r.paciente_id);
        const profSlug = paciente?.profissional_responsavel ?? null;
        return [
          r.status === "recebido" || r.status === "pago" ? "Confirmado" : "Pendente",
          r.paciente_nome,
          fmtDate(r.data_vencimento),
          fmtDate(r.data_pagamento),
          nomeProcedimento(r.procedimento_id),
          fmt(Number(r.valor)),
          nomeProfissionalBySlug(profSlug),
        ];
      });
    } else {
      head = [["Status", "Profissional", "Procedimento", "Data Proc.", "Data Pagto", "Valor", "Comissão", "Cliente"]];
      const lista = funcionarioId ? recFuncionario : recebimentos;
      body = lista.map((r) => {
        const com = comissaoDoItem(funcionarioId || "", r.procedimento_id);
        const valorCom = com ? (Number(r.valor) * com.percentual) / 100 : 0;
        const paciente = pacientes.find((p) => p.id === r.paciente_id);
        const profSlug = paciente?.profissional_responsavel ?? null;
        return [
          r.status === "recebido" || r.status === "pago" ? "Confirmado" : "Pendente",
          nomeProfissionalBySlug(profSlug),
          nomeProcedimento(r.procedimento_id),
          fmtDate(r.data_vencimento),
          fmtDate(r.data_pagamento),
          fmt(Number(r.valor)),
          valorCom > 0 ? fmt(valorCom) : "—",
          r.paciente_nome,
        ];
      });
    }

    autoTable(doc, {
      head,
      body,
      startY: 27,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`relatorio_${tipoRelatorio}_${dataInicial}_${dataFinal}.pdf`);
  }, [tipoRelatorio, dataInicial, dataFinal, recebimentos, recFuncionario, pacientes, profissionais, procedimentos, comissoes, funcionarioId]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Geração de relatórios financeiros</p>
        </div>
      </div>

      {/* ── Painel de filtros ─────────────────────────────────────────────── */}
      <Card className="p-6 shadow-sm border-border">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Filtros do Relatório
        </h2>

        {/* Linha 1: Tipo de Relatório + Datas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

          {/* Tipo de Relatório */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo de Relatório</Label>
            <Select
              value={tipoRelatorio}
              onValueChange={(v) => {
                setTipoRelatorio(v as typeof tipoRelatorio);
                setClienteId("");
                setFuncionarioId("");
                setGerado(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clientes">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Financeiro (Clientes) — Pagamentos Mensais
                  </span>
                </SelectItem>
                <SelectItem value="funcionarios">
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Financeiro (Funcionários) — Pagamentos Mensais
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Inicial */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Data Inicial</Label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => { setDataInicial(e.target.value); setGerado(false); }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Data Final */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Data Final</Label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => { setDataFinal(e.target.value); setGerado(false); }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Linha 2: Status do Pagamento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Status do Pagamento</Label>
            <Select
              value={filtroStatus}
              onValueChange={(v) => { setFiltroStatus(v as typeof filtroStatus); setGerado(false); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="confirmado">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Confirmados
                  </span>
                </SelectItem>
                <SelectItem value="pendente">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Pendentes
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Linha 3: Cliente ou Funcionário (opcional) */}
        {tipoRelatorio !== "" && (
          <div className="grid grid-cols-1 gap-4 mb-4">

            {/* Seleção de Cliente (opcional) */}
            {tipoRelatorio === "clientes" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Cliente <span className="text-xs text-muted-foreground">(opcional — deixe em branco para todos)</span>
                </Label>
                <Select
                  value={clienteId}
                  onValueChange={(v) => { setClienteId(v); setGerado(false); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os clientes</SelectItem>
                    {pacientesClientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Seleção de Funcionário (opcional) */}
            {tipoRelatorio === "funcionarios" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Funcionário / Profissional <span className="text-xs text-muted-foreground">(opcional — deixe em branco para todos)</span>
                </Label>
                <Select
                  value={funcionarioId}
                  onValueChange={(v) => { setFuncionarioId(v); setGerado(false); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os profissionais..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os profissionais</SelectItem>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            {gerado && recebimentos.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={exportarPDF}
                  className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={exportarExcel}
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </Button>
              </>
            )}
          </div>
          <Button
            onClick={gerarRelatorio}
            disabled={!podeGerar || loadingRel}
            className="gap-2"
          >
            {loadingRel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            {loadingRel ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </div>
      </Card>

      {/* ── Resultado ─────────────────────────────────────────────────────── */}
      {gerado && (
        <div className="space-y-6">

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Confirmados</p>
                  <p className="text-lg font-bold text-green-600">
                    {tipoRelatorio === "clientes" ? fmt(totalConfirmado) : fmt(recFuncConfirmados.reduce((s, r) => s + Number(r.valor), 0))}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/10">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-lg font-bold text-amber-600">
                    {tipoRelatorio === "clientes" ? fmt(totalPendente) : fmt(recFuncPendentes.reduce((s, r) => s + Number(r.valor), 0))}
                  </p>
                </div>
              </div>
            </Card>
            {tipoRelatorio === "clientes" ? (
              <Card className="p-4 border-border">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Geral</p>
                    <p className="text-lg font-bold text-foreground">{fmt(totalGeral)}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Comissão</p>
                    <p className="text-lg font-bold text-emerald-600">{fmt(totalComissao)}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ── RELATÓRIO 1: CLIENTES ─────────────────────────────────────── */}
          {tipoRelatorio === "clientes" && (
            <div className="space-y-6">

              {/* Pagamentos Confirmados */}
              <Card className="p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Pagamentos Confirmados ({recebimentosConfirmados.length})
                </h3>
                {recebimentosConfirmados.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pagamento confirmado no período.</p>
                ) : (
                  <>
                    {[...gruposConfirmados.entries()].map(([data, itens]) => (
                      <SecaoData key={data} data={data} itens={itens} tipo="clientes" />
                    ))}
                    {/* Somatória total */}
                    <div className="mt-4 flex justify-end">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg px-5 py-3 text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Total Confirmado</p>
                        <p className="text-xl font-bold text-green-600">{fmt(totalConfirmado)}</p>
                      </div>
                    </div>
                  </>
                )}
              </Card>

              {/* Pagamentos Pendentes */}
              {recebimentosPendentes.length > 0 && (
                <Card className="p-5 shadow-sm border-amber-200">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Pagamentos Pendentes ({recebimentosPendentes.length})
                  </h3>
                  {[...gruposPendentes.entries()].map(([data, itens]) => (
                    <SecaoData key={data} data={data} itens={itens} tipo="clientes" />
                  ))}
                  <div className="mt-4 flex justify-end">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg px-5 py-3 text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">Total Pendente</p>
                      <p className="text-xl font-bold text-amber-600">{fmt(totalPendente)}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Somatória geral */}
              <div className="flex justify-end">
                <div className="bg-card border border-border rounded-xl px-6 py-4 text-right shadow-sm min-w-[260px]">
                  <p className="text-xs text-muted-foreground mb-1">Somatória Total do Período</p>
                  <p className="text-2xl font-bold text-foreground">{fmt(totalGeral)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {recebimentos.length} registro(s) — {fmtDate(dataInicial)} a {fmtDate(dataFinal)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── RELATÓRIO 2: FUNCIONÁRIOS ─────────────────────────────────── */}
          {tipoRelatorio === "funcionarios" && (
            <div className="space-y-6">

              {/* Cabeçalho do profissional */}
              {profSelecionado && (
                <Card className="p-4 bg-muted/30 border-border">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-base font-semibold text-foreground">{profSelecionado.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pacientesProfissional.length} paciente(s) vinculado(s) · Período: {fmtDate(dataInicial)} a {fmtDate(dataFinal)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Pagamentos Confirmados */}
              <Card className="p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Pagamentos Confirmados ({recFuncConfirmados.length})
                </h3>
                {recFuncConfirmados.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pagamento confirmado no período.</p>
                ) : (
                  <>
                    {[...gruposFuncConfirmados.entries()].map(([data, itens]) => (
                      <SecaoData key={data} data={data} itens={itens} tipo="funcionarios" />
                    ))}
                    <div className="mt-4 flex justify-end gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg px-5 py-3 text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Total Confirmado</p>
                        <p className="text-xl font-bold text-green-600">{fmt(recFuncConfirmados.reduce((s, r) => s + Number(r.valor), 0))}</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg px-5 py-3 text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Total Comissão</p>
                        <p className="text-xl font-bold text-emerald-600">{fmt(totalComissao)}</p>
                      </div>
                    </div>
                  </>
                )}
              </Card>

              {/* Pagamentos Pendentes */}
              {recFuncPendentes.length > 0 && (
                <Card className="p-5 shadow-sm border-amber-200">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Pagamentos Pendentes ({recFuncPendentes.length})
                  </h3>
                  {[...gruposFuncPendentes.entries()].map(([data, itens]) => (
                    <SecaoData key={data} data={data} itens={itens} tipo="funcionarios" />
                  ))}
                  <div className="mt-4 flex justify-end">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg px-5 py-3 text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">Total Pendente</p>
                      <p className="text-xl font-bold text-amber-600">{fmt(recFuncPendentes.reduce((s, r) => s + Number(r.valor), 0))}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Somatória geral */}
              <div className="flex justify-end">
                <div className="bg-card border border-border rounded-xl px-6 py-4 text-right shadow-sm min-w-[300px]">
                  <p className="text-xs text-muted-foreground mb-1">Somatória Total do Período</p>
                  <p className="text-2xl font-bold text-foreground">{fmt(recFuncionario.reduce((s, r) => s + Number(r.valor), 0))}</p>
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Total de Comissão</p>
                    <p className="text-lg font-bold text-emerald-600">{fmt(totalComissao)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {recFuncionario.length} registro(s) — {fmtDate(dataInicial)} a {fmtDate(dataFinal)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sem dados */}
          {gerado && recebimentos.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Nenhum registro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar os filtros de data ou selecionar outro cliente/funcionário.
              </p>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
