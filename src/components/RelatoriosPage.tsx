"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
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
  profissional_id: string | null;
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
    const key =
      item.status === "recebido" || item.status === "pago"
        ? (item.data_pagamento ?? item.data_vencimento)
        : item.data_vencimento;
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  }
  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

// Agrupa recebimentos por profissional (profissional_id) e dentro de cada profissional por data
function groupByProfissional(
  items: Recebimento[]
): Map<string, Map<string, Recebimento[]>> {
  const map = new Map<string, Map<string, Recebimento[]>>();
  for (const item of items) {
    const profSlug = item.profissional_id ?? "sem-profissional";
    const dateKey =
      item.status === "recebido" || item.status === "pago"
        ? (item.data_pagamento ?? item.data_vencimento)
        : item.data_vencimento;
    if (!map.has(profSlug)) map.set(profSlug, new Map());
    const dateMap = map.get(profSlug)!;
    const existing = dateMap.get(dateKey) ?? [];
    existing.push(item);
    dateMap.set(dateKey, existing);
  }
  // Ordena profissionais e datas
  const sorted = new Map(
    [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  );
  for (const [prof, dateMap] of sorted.entries()) {
    sorted.set(
      prof,
      new Map([...dateMap.entries()].sort((a, b) => a[0].localeCompare(b[0])))
    );
  }
  return sorted;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  const get = (path: string) =>
    fetch(`${SUPA_URL}/rest/v1/${path}`, { headers }).then((r) => r.json());

  // ── Estados de filtro ──────────────────────────────────────────────────────
  const [datePeriod, setDatePeriod] = useState<DateRange>({ from: "", to: "" });
  const dataInicial = datePeriod.from;
  const dataFinal   = datePeriod.to;
  const [tipoRelatorio, setTipoRelatorio] = useState<"" | "clientes" | "funcionarios">("");
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

  // ── Ref (DEVE ficar antes de qualquer return condicional) ──────────────────
  const relatorioRef = useRef<HTMLDivElement>(null);

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

  // ── Gerar relatório ────────────────────────────────────────────────────────
  const gerarRelatorio = useCallback(async () => {
    if (!tipoRelatorio || !dataInicial || !dataFinal) return;

    setLoadingRel(true);
    setGerado(false);

    try {
      let query = `recebimentos?select=id,paciente_id,paciente_nome,descricao,valor,data_vencimento,data_pagamento,status,forma_pagamento,procedimento_id,profissional_id,confirmado_por`;
      query += `&data_vencimento=gte.${dataInicial}&data_vencimento=lte.${dataFinal}`;

      if (tipoRelatorio === "clientes" && clienteId && clienteId !== "todos") {
        query += `&paciente_id=eq.${clienteId}`;
      } else if (tipoRelatorio === "funcionarios" && funcionarioId && funcionarioId !== "todos") {
        // Filtra diretamente por profissional_id — sem depender do cadastro de paciente
        query += `&profissional_id=eq.${funcionarioId}`;
      }

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

  // ── Helpers locais para exportação ────────────────────────────────────────────
  const _nomeProcLocal = (id: string | null) =>
    id ? (procedimentos.find((p) => p.id === id)?.nome ?? "—") : "—";
  const _nomeProfLocal = (slug: string | null) =>
    slug ? (profissionais.find((p) => p.id === slug)?.name ?? slug) : "—";
  const _comissaoRec = (r: Recebimento) => {
    if (!r.procedimento_id) return null;
    const profSlug = r.profissional_id ?? null;
    if (!profSlug) return null;
    return comissoes.find(
      (c) => c.profissional_id === profSlug && c.procedimento_id === r.procedimento_id
    ) ?? null;
  };

  // ── Exportar para Excel (DEVE ficar antes de qualquer return condicional) ──
  const exportarExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const linhas: (string | number)[][] = [];

    const titulo =
      tipoRelatorio === "clientes"
        ? "Financeiro (Clientes) — Pagamentos Mensais"
        : "Financeiro (Funcionários) — Pagamentos Mensais";
    linhas.push([titulo]);
    linhas.push([`Período: ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`]);
    linhas.push([]);

    if (tipoRelatorio === "clientes") {
      // ── Clientes: agrupado por data ──
      const grupos = groupByDate(recebimentos);
      linhas.push(["Status", "Cliente", "Vencimento", "Data Pagamento", "Procedimento", "Valor (R$)", "Profissional"]);
      for (const [data, itens] of grupos.entries()) {
        linhas.push([`Data: ${fmtDate(data)}`]);
        for (const r of itens) {
          const pac = pacientes.find((p) => p.id === r.paciente_id);
          linhas.push([
            r.status === "recebido" || r.status === "pago" ? "Confirmado" : "Pendente",
            r.paciente_nome,
            fmtDate(r.data_vencimento),
            fmtDate(r.data_pagamento),
            _nomeProcLocal(r.procedimento_id),
            Number(r.valor),
            _nomeProfLocal(pac?.profissional_responsavel ?? null),
          ]);
        }
        const subtotal = itens.reduce((s, r) => s + Number(r.valor), 0);
        linhas.push(["", "", "", "", "Subtotal do dia", subtotal, ""]);
        linhas.push([]);
      }
      const total = recebimentos.reduce((s, r) => s + Number(r.valor), 0);
      linhas.push(["", "", "", "", "TOTAL GERAL", total, ""]);
    } else {
      // ── Funcionários: agrupado por profissional → data ──
      linhas.push(["Status", "Profissional", "Procedimento", "Data Proc.", "Data Pagto", "Valor (R$)", "Comissão (R$)", "Cliente"]);
      const grupos = groupByProfissional(recebimentos);
      let totalGeralValor = 0;
      let totalGeralComissao = 0;
      for (const [profSlug, dateMap] of grupos.entries()) {
        const profNome = _nomeProfLocal(profSlug);
        linhas.push([`Profissional: ${profNome}`]);
        let totalProfValor = 0;
        let totalProfComissao = 0;
        for (const [data, itens] of dateMap.entries()) {
          linhas.push([`  Data: ${fmtDate(data)}`]);
          for (const r of itens) {
            const com = _comissaoRec(r);
            const valorCom = com ? (Number(r.valor) * com.percentual) / 100 : 0;
            linhas.push([
              r.status === "recebido" || r.status === "pago" ? "Confirmado" : "Pendente",
              profNome,
              _nomeProcLocal(r.procedimento_id),
              fmtDate(r.data_vencimento),
              fmtDate(r.data_pagamento),
              Number(r.valor),
              valorCom,
              r.paciente_nome,
            ]);
            totalProfValor += Number(r.valor);
            totalProfComissao += valorCom;
          }
          const subtotalItens = itens.reduce((s, r) => s + Number(r.valor), 0);
          const subtotalCom = itens.reduce((s, r) => {
            const c = _comissaoRec(r);
            return c ? s + (Number(r.valor) * c.percentual) / 100 : s;
          }, 0);
          linhas.push(["", "", "", "", "Subtotal do dia", subtotalItens, subtotalCom, ""]);
        }
        linhas.push(["", "", "", "", `Total ${profNome}`, totalProfValor, totalProfComissao, ""]);
        linhas.push([]);
        totalGeralValor += totalProfValor;
        totalGeralComissao += totalProfComissao;
      }
      linhas.push(["", "", "", "", "TOTAL GERAL", totalGeralValor, totalGeralComissao, ""]);
    }

    const ws = XLSX.utils.aoa_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio_${tipoRelatorio}_${dataInicial}_${dataFinal}.xlsx`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoRelatorio, dataInicial, dataFinal, recebimentos, pacientes, profissionais, procedimentos, comissoes, funcionarioId]);

  // ── Exportar para PDF (DEVE ficar antes de qualquer return condicional) ────
  const exportarPDF = useCallback(async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const PW = 297; // largura A4 landscape
    const ML = 14;  // margem esquerda
    const MR = 14;  // margem direita
    const CW = PW - ML - MR; // largura útil

    // ── Paleta de cores ──
    const COR_VERDE_HEADER: [number, number, number]  = [22, 163, 74];   // green-600
    const COR_VERDE_LIGHT: [number, number, number]   = [240, 253, 244]; // green-50
    const COR_VERDE_MED: [number, number, number]     = [220, 252, 231]; // green-100
    const COR_VERDE_DARK: [number, number, number]    = [187, 247, 208]; // green-200
    const COR_VERDE_TOTAL: [number, number, number]   = [134, 239, 172]; // green-300
    const COR_AMBER_HEADER: [number, number, number]  = [217, 119, 6];   // amber-600
    const COR_AMBER_LIGHT: [number, number, number]   = [255, 251, 235]; // amber-50
    const COR_AMBER_MED: [number, number, number]     = [254, 243, 199]; // amber-100
    const COR_AMBER_DARK: [number, number, number]    = [253, 230, 138]; // amber-200
    const COR_AZUL_PROF: [number, number, number]     = [219, 234, 254]; // blue-100
    const COR_AZUL_TEXT: [number, number, number]     = [30, 64, 175];   // blue-800
    const COR_EMERALD_TOTAL: [number, number, number] = [16, 185, 129];  // emerald-500
    const COR_CINZA_HEADER: [number, number, number]  = [248, 250, 252]; // slate-50
    const COR_CINZA_ALT: [number, number, number]     = [241, 245, 249]; // slate-100
    const COR_TEXTO: [number, number, number]         = [15, 23, 42];    // slate-900
    const COR_TEXTO_MUTED: [number, number, number]   = [100, 116, 139]; // slate-500
    const COR_BRANCO: [number, number, number]        = [255, 255, 255];

    const titulo =
      tipoRelatorio === "clientes"
        ? "Relatorio Financeiro - Clientes"
        : "Relatorio Financeiro - Funcionarios";

    // ── Cabeçalho do documento ──
    doc.setFillColor(...COR_VERDE_HEADER);
    doc.rect(0, 0, PW, 22, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COR_BRANCO);
    doc.text(titulo, ML, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Periodo: ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`, ML, 17);
    doc.setTextColor(...COR_TEXTO);

    // ── Linha de geração ──
    const agora = new Date().toLocaleString("pt-BR");
    doc.setFontSize(7);
    doc.setTextColor(...COR_TEXTO_MUTED);
    doc.text(`Gerado em: ${agora}`, PW - MR, 17, { align: "right" });
    doc.setTextColor(...COR_TEXTO);

    let cursorY = 26;

    // ── Helper: desenha um banner de seção ──
    const drawSectionBanner = (
      y: number,
      label: string,
      cor: [number, number, number],
      corTexto: [number, number, number] = COR_BRANCO
    ): number => {
      doc.setFillColor(...cor);
      doc.roundedRect(ML, y, CW, 8, 1.5, 1.5, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...corTexto);
      doc.text(label, ML + 3, y + 5.5);
      doc.setTextColor(...COR_TEXTO);
      return y + 11;
    };

    // ── Helper: desenha um banner de profissional ──
    const drawProfBanner = (y: number, label: string): number => {
      doc.setFillColor(...COR_AZUL_PROF);
      doc.roundedRect(ML, y, CW, 7, 1, 1, "F");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COR_AZUL_TEXT);
      doc.text(`>> ${label}`, ML + 3, y + 4.8);
      doc.setTextColor(...COR_TEXTO);
      return y + 9;
    };

    // ── Helper: desenha um banner de data ──
    const drawDateBanner = (y: number, label: string, count: number): number => {
      doc.setFillColor(...COR_CINZA_HEADER);
      doc.rect(ML, y, CW, 6, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(`Data: ${label}`, ML + 3, y + 4.2);
      doc.text(`${count} registro(s)`, ML + CW - 3, y + 4.2, { align: "right" });
      doc.setTextColor(...COR_TEXTO);
      return y + 7;
    };

    // ── Helper: desenha caixa de total alinhada à direita ──
    const drawTotalBox = (
      y: number,
      label: string,
      valor: string,
      cor: [number, number, number],
      corTexto: [number, number, number],
      width = 70
    ): number => {
      const x = ML + CW - width;
      doc.setFillColor(...cor);
      doc.roundedRect(x, y, width, 12, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(label, x + width - 3, y + 4.5, { align: "right" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...corTexto);
      doc.text(valor, x + width - 3, y + 10, { align: "right" });
      doc.setTextColor(...COR_TEXTO);
      return y + 15;
    };

    // ── Helper: desenha duas caixas de total lado a lado ──
    const drawDoubleTotalBox = (
      y: number,
      label1: string, valor1: string, cor1: [number, number, number], corT1: [number, number, number],
      label2: string, valor2: string, cor2: [number, number, number], corT2: [number, number, number],
      width = 70
    ): number => {
      const gap = 4;
      const x2 = ML + CW - width;
      const x1 = x2 - width - gap;
      doc.setFillColor(...cor1);
      doc.roundedRect(x1, y, width, 12, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(label1, x1 + width - 3, y + 4.5, { align: "right" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...corT1);
      doc.text(valor1, x1 + width - 3, y + 10, { align: "right" });

      doc.setFillColor(...cor2);
      doc.roundedRect(x2, y, width, 12, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(label2, x2 + width - 3, y + 4.5, { align: "right" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...corT2);
      doc.text(valor2, x2 + width - 3, y + 10, { align: "right" });
      doc.setTextColor(...COR_TEXTO);
      return y + 15;
    };

    // ── Helper: verifica se precisa de nova página ──
    const checkPage = (neededHeight: number) => {
      const pageH = 210; // A4 landscape height
      const marginBottom = 15;
      if (cursorY + neededHeight > pageH - marginBottom) {
        doc.addPage();
        cursorY = 15;
      }
    };

    // ── Helper: renderiza tabela de itens por data ──
    const renderTabelaData = (
      data: string,
      itens: Recebimento[],
      tipo: "clientes" | "funcionarios",
      corSubtotal: [number, number, number]
    ) => {
      checkPage(30);
      cursorY = drawDateBanner(cursorY, fmtDate(data), itens.length);

      const subtotal = itens.reduce((s, r) => s + Number(r.valor), 0);
      const subtotalCom = tipo === "funcionarios"
        ? itens.reduce((s, r) => {
            const c = _comissaoRec(r);
            return c ? s + (Number(r.valor) * c.percentual) / 100 : s;
          }, 0)
        : 0;

      if (tipo === "clientes") {
        const head = [["Cliente", "Vencimento", "Pagamento", "Procedimento", "Valor", "Profissional"]];
        const body = itens.map((r) => {
          const pac = pacientes.find((p) => p.id === r.paciente_id);
          return [
            r.paciente_nome,
            fmtDate(r.data_vencimento),
            fmtDate(r.data_pagamento),
            _nomeProcLocal(r.procedimento_id),
            fmt(Number(r.valor)),
            _nomeProfLocal(pac?.profissional_responsavel ?? null),
          ];
        });
        body.push([
          { content: "Subtotal do dia", colSpan: 4, styles: { fontStyle: "bold" as const, textColor: COR_TEXTO_MUTED, fillColor: corSubtotal } } as unknown as string,
          { content: fmt(subtotal), styles: { fontStyle: "bold" as const, halign: "right" as const, fillColor: corSubtotal } } as unknown as string,
          { content: "", styles: { fillColor: corSubtotal } } as unknown as string,
        ]);
        autoTable(doc, {
          head,
          body,
          startY: cursorY,
          margin: { left: ML, right: MR },
          styles: { fontSize: 7.5, cellPadding: 1.8, textColor: COR_TEXTO },
          headStyles: { fillColor: COR_CINZA_HEADER, textColor: COR_TEXTO_MUTED, fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: COR_CINZA_ALT },
          columnStyles: { 4: { halign: "right" } },
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.1,
          didDrawPage: () => { cursorY = 15; },
        });
      } else {
        const head = [["Profissional", "Procedimento", "Data Proc.", "Data Pagto", "Valor", "Comissao", "Cliente"]];
        const body = itens.map((r) => {
          const com = _comissaoRec(r);
          const valorCom = com ? (Number(r.valor) * com.percentual) / 100 : null;
          const pac = pacientes.find((p) => p.id === r.paciente_id);
          return [
            _nomeProfLocal(pac?.profissional_responsavel ?? null),
            _nomeProcLocal(r.procedimento_id),
            fmtDate(r.data_vencimento),
            fmtDate(r.data_pagamento),
            fmt(Number(r.valor)),
            valorCom !== null ? `${com!.percentual}% = ${fmt(valorCom)}` : "-",
            r.paciente_nome,
          ];
        });
        body.push([
          { content: "Subtotal do dia", colSpan: 4, styles: { fontStyle: "bold" as const, textColor: COR_TEXTO_MUTED, fillColor: corSubtotal } } as unknown as string,
          { content: fmt(subtotal), styles: { fontStyle: "bold" as const, halign: "right" as const, fillColor: corSubtotal } } as unknown as string,
          { content: fmt(subtotalCom), styles: { fontStyle: "bold" as const, halign: "right" as const, fillColor: corSubtotal, textColor: COR_EMERALD_TOTAL } } as unknown as string,
          { content: "", styles: { fillColor: corSubtotal } } as unknown as string,
        ]);
        autoTable(doc, {
          head,
          body,
          startY: cursorY,
          margin: { left: ML, right: MR },
          styles: { fontSize: 7.5, cellPadding: 1.8, textColor: COR_TEXTO },
          headStyles: { fillColor: COR_CINZA_HEADER, textColor: COR_TEXTO_MUTED, fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: COR_CINZA_ALT },
          columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.1,
          didDrawPage: () => { cursorY = 15; },
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cursorY = (doc as any).lastAutoTable.finalY + 4;
    };

    // ════════════════════════════════════════════════════════════
    // RELATÓRIO CLIENTES
    // ════════════════════════════════════════════════════════════
    if (tipoRelatorio === "clientes") {
      const recConf = recebimentos.filter((r) => r.status === "recebido" || r.status === "pago");
      const recPend = recebimentos.filter((r) => r.status === "pendente" || r.status === "atrasado");
      const totalConf = recConf.reduce((s, r) => s + Number(r.valor), 0);
      const totalPend = recPend.reduce((s, r) => s + Number(r.valor), 0);
      const totalGeral = recebimentos.reduce((s, r) => s + Number(r.valor), 0);

      // ── Cards de resumo ──
      const cardW = (CW - 8) / 3;
      const cardH = 14;
      // Card Confirmados
      doc.setFillColor(...COR_VERDE_LIGHT);
      doc.roundedRect(ML, cursorY, cardW, cardH, 2, 2, "F");
      doc.setDrawColor(...COR_VERDE_HEADER);
      doc.roundedRect(ML, cursorY, cardW, cardH, 2, 2, "S");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Confirmados", ML + 3, cursorY + 5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_VERDE_HEADER);
      doc.text(fmt(totalConf), ML + 3, cursorY + 11);
      // Card Pendentes
      const cx2 = ML + cardW + 4;
      doc.setFillColor(...COR_AMBER_LIGHT);
      doc.roundedRect(cx2, cursorY, cardW, cardH, 2, 2, "F");
      doc.setDrawColor(...COR_AMBER_HEADER);
      doc.roundedRect(cx2, cursorY, cardW, cardH, 2, 2, "S");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Pendentes", cx2 + 3, cursorY + 5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_AMBER_HEADER);
      doc.text(fmt(totalPend), cx2 + 3, cursorY + 11);
      // Card Total Geral
      const cx3 = ML + (cardW + 4) * 2;
      doc.setFillColor(...COR_CINZA_HEADER);
      doc.roundedRect(cx3, cursorY, cardW, cardH, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cx3, cursorY, cardW, cardH, 2, 2, "S");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Total Geral", cx3 + 3, cursorY + 5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_TEXTO);
      doc.text(fmt(totalGeral), cx3 + 3, cursorY + 11);
      doc.setTextColor(...COR_TEXTO);
      doc.setDrawColor(0);
      cursorY += cardH + 6;

      // ── Seção Confirmados ──
      if (recConf.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, `Pagamentos Confirmados  (${recConf.length} registro(s))`, COR_VERDE_HEADER);
        const gruposConf = groupByDate(recConf);
        for (const [data, itens] of gruposConf.entries()) {
          renderTabelaData(data, itens, "clientes", COR_VERDE_MED);
        }
        checkPage(18);
        cursorY = drawTotalBox(cursorY, "Total Confirmado", fmt(totalConf), COR_VERDE_LIGHT, COR_VERDE_HEADER);
        cursorY += 4;
      }

      // ── Seção Pendentes ──
      if (recPend.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, `Pagamentos Pendentes  (${recPend.length} registro(s))`, COR_AMBER_HEADER);
        const gruposPend = groupByDate(recPend);
        for (const [data, itens] of gruposPend.entries()) {
          renderTabelaData(data, itens, "clientes", COR_AMBER_MED);
        }
        checkPage(18);
        cursorY = drawTotalBox(cursorY, "Total Pendente", fmt(totalPend), COR_AMBER_LIGHT, COR_AMBER_HEADER);
        cursorY += 4;
      }

      // ── Total geral final ──
      checkPage(20);
      doc.setFillColor(...COR_CINZA_HEADER);
      doc.roundedRect(ML, cursorY, CW, 16, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(ML, cursorY, CW, 16, 2, 2, "S");
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Somatoria Total do Periodo", ML + CW - 3, cursorY + 5.5, { align: "right" });
      doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_TEXTO);
      doc.text(fmt(totalGeral), ML + CW - 3, cursorY + 13, { align: "right" });
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(`${recebimentos.length} registro(s) - ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`, ML + 3, cursorY + 9);
      doc.setTextColor(...COR_TEXTO);
      doc.setDrawColor(0);

    // ════════════════════════════════════════════════════════════
    // RELATÓRIO FUNCIONÁRIOS
    // ════════════════════════════════════════════════════════════
    } else {
      const recConf = recebimentos.filter((r) => r.status === "recebido" || r.status === "pago");
      const recPend = recebimentos.filter((r) => r.status === "pendente" || r.status === "atrasado");
      const totalConf = recConf.reduce((s, r) => s + Number(r.valor), 0);
      const totalPend = recPend.reduce((s, r) => s + Number(r.valor), 0);
      const totalGeralValor = recebimentos.reduce((s, r) => s + Number(r.valor), 0);
      const totalGeralComissao = recConf.reduce((s, r) => {
        const c = _comissaoRec(r);
        return c ? s + (Number(r.valor) * c.percentual) / 100 : s;
      }, 0);

      // ── Cards de resumo ──
      const cardW = (CW - 8) / 3;
      const cardH = 14;
      // Card Confirmados
      doc.setFillColor(...COR_VERDE_LIGHT);
      doc.roundedRect(ML, cursorY, cardW, cardH, 2, 2, "F");
      doc.setDrawColor(...COR_VERDE_HEADER);
      doc.roundedRect(ML, cursorY, cardW, cardH, 2, 2, "S");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Confirmados", ML + 3, cursorY + 5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_VERDE_HEADER);
      doc.text(fmt(totalConf), ML + 3, cursorY + 11);
      // Card Pendentes
      const cx2 = ML + cardW + 4;
      doc.setFillColor(...COR_AMBER_LIGHT);
      doc.roundedRect(cx2, cursorY, cardW, cardH, 2, 2, "F");
      doc.setDrawColor(...COR_AMBER_HEADER);
      doc.roundedRect(cx2, cursorY, cardW, cardH, 2, 2, "S");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Pendentes", cx2 + 3, cursorY + 5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_AMBER_HEADER);
      doc.text(fmt(totalPend), cx2 + 3, cursorY + 11);
      // Card Total Comissão
      const cx3 = ML + (cardW + 4) * 2;
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.roundedRect(cx3, cursorY, cardW, cardH, 2, 2, "F");
      doc.setDrawColor(...COR_EMERALD_TOTAL);
      doc.roundedRect(cx3, cursorY, cardW, cardH, 2, 2, "S");
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Total Comissao", cx3 + 3, cursorY + 5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_EMERALD_TOTAL);
      doc.text(fmt(totalGeralComissao), cx3 + 3, cursorY + 11);
      doc.setTextColor(...COR_TEXTO);
      doc.setDrawColor(0);
      cursorY += cardH + 6;

      // ── Seção Confirmados por profissional ──
      if (recConf.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, `Pagamentos Confirmados  (${recConf.length} registro(s))`, COR_VERDE_HEADER);
        const gruposPorProf = groupByProfissional(recConf);
        let totalConfValor = 0;
        let totalConfComissao = 0;
        for (const [profSlug, dateMap] of gruposPorProf.entries()) {
          const profNome = _nomeProfLocal(profSlug);
          const todosItensProf = [...dateMap.values()].flat();
          const totalValorProf = todosItensProf.reduce((s, r) => s + Number(r.valor), 0);
          const totalComProf = todosItensProf.reduce((s, r) => {
            const c = _comissaoRec(r);
            return c ? s + (Number(r.valor) * c.percentual) / 100 : s;
          }, 0);
          checkPage(20);
          cursorY = drawProfBanner(cursorY, `${profNome}  -  ${todosItensProf.length} registro(s)`);
          for (const [data, itens] of dateMap.entries()) {
            renderTabelaData(data, itens, "funcionarios", COR_VERDE_MED);
          }
          checkPage(18);
          cursorY = drawDoubleTotalBox(
            cursorY,
            `Total ${profNome}`, fmt(totalValorProf), COR_VERDE_LIGHT, COR_VERDE_HEADER,
            `Comissão ${profNome}`, fmt(totalComProf), [236, 253, 245], COR_EMERALD_TOTAL
          );
          cursorY += 4;
          totalConfValor += totalValorProf;
          totalConfComissao += totalComProf;
        }
        checkPage(18);
        cursorY = drawDoubleTotalBox(
          cursorY,
          "Total Confirmado", fmt(totalConfValor), COR_VERDE_DARK, COR_VERDE_HEADER,
          "Total Comissão", fmt(totalConfComissao), COR_VERDE_TOTAL, [20, 83, 45]
        );
        cursorY += 6;
      }

      // ── Seção Pendentes por profissional ──
      if (recPend.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, `Pagamentos Pendentes  (${recPend.length} registro(s))`, COR_AMBER_HEADER);
        const gruposPorProfPend = groupByProfissional(recPend);
        let totalPendValor = 0;
        for (const [profSlug, dateMap] of gruposPorProfPend.entries()) {
          const profNome = _nomeProfLocal(profSlug);
          const todosItensProf = [...dateMap.values()].flat();
          const totalValorProf = todosItensProf.reduce((s, r) => s + Number(r.valor), 0);
          checkPage(20);
          // Banner de profissional em âmbar
          doc.setFillColor(...COR_AMBER_LIGHT);
          doc.roundedRect(ML, cursorY, CW, 7, 1, 1, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...COR_AMBER_HEADER);
          doc.text(`>> ${profNome}  -  ${todosItensProf.length} registro(s)`, ML + 3, cursorY + 4.8);
          doc.setTextColor(...COR_TEXTO);
          cursorY += 9;
          for (const [data, itens] of dateMap.entries()) {
            renderTabelaData(data, itens, "funcionarios", COR_AMBER_MED);
          }
          checkPage(18);
          cursorY = drawTotalBox(
            cursorY,
            `Total Pendente ${profNome}`, fmt(totalValorProf), COR_AMBER_LIGHT, COR_AMBER_HEADER
          );
          cursorY += 4;
          totalPendValor += totalValorProf;
        }
        checkPage(18);
        cursorY = drawTotalBox(cursorY, "Total Pendente Geral", fmt(totalPendValor), COR_AMBER_DARK, COR_AMBER_HEADER);
        cursorY += 6;
      }

      // ── Total geral final ──
      checkPage(22);
      doc.setFillColor(...COR_CINZA_HEADER);
      doc.roundedRect(ML, cursorY, CW, 20, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(ML, cursorY, CW, 20, 2, 2, "S");
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Somatoria Total do Periodo", ML + CW - 3, cursorY + 5.5, { align: "right" });
      doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_TEXTO);
      doc.text(fmt(totalGeralValor), ML + CW - 3, cursorY + 12, { align: "right" });
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("Total de Comissao", ML + CW - 3, cursorY + 16.5, { align: "right" });
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...COR_EMERALD_TOTAL);
      doc.text(fmt(totalGeralComissao), ML + CW - 3, cursorY + 20, { align: "right" });
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(`${recebimentos.length} registro(s) - ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`, ML + 3, cursorY + 9);
      doc.setTextColor(...COR_TEXTO);
      doc.setDrawColor(0);
    }

    doc.save(`relatorio_${tipoRelatorio}_${dataInicial}_${dataFinal}.pdf`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoRelatorio, dataInicial, dataFinal, recebimentos, pacientes, profissionais, procedimentos, comissoes, funcionarioId]);

  // ── Helpers de lookup ──────────────────────────────────────────────────────
  const nomeProcedimento = (id: string | null) => {
    if (!id) return "—";
    return procedimentos.find((p) => p.id === id)?.nome ?? "—";
  };

  const nomeProfissionalBySlug = (slug: string | null) => {
    if (!slug) return "—";
    return profissionais.find((p) => p.id === slug)?.name ?? slug;
  };

  // Retorna a comissão para um recebimento, usando o profissional do paciente
  const comissaoDoItemRec = (r: Recebimento) => {
    if (!r.procedimento_id) return null;
    const pac = pacientes.find((p) => p.id === r.paciente_id);
    const profSlug = pac?.profissional_responsavel ?? null;
    if (!profSlug) return null;
    return comissoes.find(
      (c) => c.profissional_id === profSlug && c.procedimento_id === r.procedimento_id
    ) ?? null;
  };

  // Mantido para compatibilidade com filtro de profissional específico
  const comissaoDoItem = (profId: string, procId: string | null) => {
    if (!procId) return null;
    return comissoes.find(
      (c) => c.profissional_id === profId && c.procedimento_id === procId
    ) ?? null;
  };

  // ── Dados derivados ────────────────────────────────────────────────────────
  const pacientesClientes = pacientes.filter((p) => p.tipo_usuario === "paciente");

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

  const profSelecionado = profissionais.find((p) => p.id === funcionarioId);
  const pacientesProfissional = pacientes.filter(
    (p) => p.profissional_responsavel === funcionarioId
  );

  const recFuncionario =
    funcionarioId && funcionarioId !== "todos"
      ? recebimentos.filter((r) =>
          pacientesProfissional.some((p) => p.id === r.paciente_id)
        )
      : recebimentos;

  const recFuncConfirmados = recFuncionario.filter(
    (r) => r.status === "recebido" || r.status === "pago"
  );
  const recFuncPendentes = recFuncionario.filter(
    (r) => r.status === "pendente" || r.status === "atrasado"
  );

  const totalComissao = recFuncConfirmados.reduce((s, r) => {
    const com = comissaoDoItemRec(r);
    if (!com) return s;
    return s + (Number(r.valor) * com.percentual) / 100;
  }, 0);

  const gruposFuncConfirmados = groupByDate(recFuncConfirmados);
  const gruposFuncPendentes = groupByDate(recFuncPendentes);

  // Agrupamento por profissional (usado quando "todos" estão selecionados)
  const todosProfissionais = !funcionarioId || funcionarioId === "todos";
  const gruposPorProfConfirmados = todosProfissionais
    ? groupByProfissional(recFuncConfirmados)
    : null;
  const gruposPorProfPendentes = todosProfissionais
    ? groupByProfissional(recFuncPendentes)
    : null;

  const podeGerar = tipoRelatorio !== "" && dataInicial !== "" && dataFinal !== "";

  // ── Renderização de linha (clientes) ──────────────────────────────────────
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

  // ── Renderização de linha (funcionários) ──────────────────────────────────
  const renderLinhaFuncionario = (r: Recebimento) => {
    const com = comissaoDoItemRec(r);
    const valorComissao = com ? (Number(r.valor) * com.percentual) / 100 : null;
    const paciente = pacientes.find((p) => p.id === r.paciente_id);
    const profSlug = paciente?.profissional_responsavel ?? null;
    return (
      <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
        <td className="py-2.5 px-3 text-sm text-foreground">{nomeProfissionalBySlug(profSlug)}</td>
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

  // ── Componente de seção por data ───────────────────────────────────────────
  const SecaoData = ({
    data,
    itens,
    tipo,
  }: {
    data: string;
    itens: Recebimento[];
    tipo: "clientes" | "funcionarios";
  }) => {
    const subtotal = itens.reduce((s, r) => s + Number(r.valor), 0);
    const subtotalComissao =
      tipo === "funcionarios"
        ? itens.reduce((s, r) => {
            const com = comissaoDoItemRec(r);
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
  };

  // ── Early return de loading (APÓS todos os hooks) ─────────────────────────
  if (loadingAux) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando dados...</span>
      </div>
    );
  }

  // ── Render principal ───────────────────────────────────────────────────────
  return (
    <div ref={relatorioRef} className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Geração de relatórios financeiros</p>
        </div>
      </div>

      {/* Painel de filtros */}
      <Card className="p-6 shadow-sm border-border">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Filtros do Relatório
        </h2>

        {/* Linha 1: Tipo de Relatório + Datas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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

          <div className="space-y-1.5 sm:col-span-2">
            <DateRangePicker
              label="Período"
              value={datePeriod}
              onChange={(range) => { setDatePeriod(range); setGerado(false); }}
              placeholder="Selecionar período do relatório"
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
            {tipoRelatorio === "clientes" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Cliente{" "}
                  <span className="text-xs text-muted-foreground">
                    (opcional — deixe em branco para todos)
                  </span>
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

            {tipoRelatorio === "funcionarios" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Funcionário / Profissional{" "}
                  <span className="text-xs text-muted-foreground">
                    (opcional — deixe em branco para todos)
                  </span>
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

        {/* Botões */}
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

      {/* Resultado */}
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
                    {tipoRelatorio === "clientes"
                      ? fmt(totalConfirmado)
                      : fmt(recFuncConfirmados.reduce((s, r) => s + Number(r.valor), 0))}
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
                    {tipoRelatorio === "clientes"
                      ? fmt(totalPendente)
                      : fmt(recFuncPendentes.reduce((s, r) => s + Number(r.valor), 0))}
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

          {/* RELATÓRIO 1: CLIENTES */}
          {tipoRelatorio === "clientes" && (
            <div className="space-y-6">
              <Card className="p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Pagamentos Confirmados ({recebimentosConfirmados.length})
                </h3>
                {recebimentosConfirmados.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum pagamento confirmado no período.
                  </p>
                ) : (
                  <>
                    {[...gruposConfirmados.entries()].map(([data, itens]) => (
                      <SecaoData key={data} data={data} itens={itens} tipo="clientes" />
                    ))}
                    <div className="mt-4 flex justify-end">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg px-5 py-3 text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Total Confirmado</p>
                        <p className="text-xl font-bold text-green-600">{fmt(totalConfirmado)}</p>
                      </div>
                    </div>
                  </>
                )}
              </Card>

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

          {/* RELATÓRIO 2: FUNCIONÁRIOS */}
          {tipoRelatorio === "funcionarios" && (
            <div className="space-y-6">
              {/* Cabeçalho do profissional selecionado (quando não é "todos") */}
              {profSelecionado && (
                <Card className="p-4 bg-muted/30 border-border">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-base font-semibold text-foreground">{profSelecionado.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pacientesProfissional.length} paciente(s) vinculado(s) · Período:{" "}
                        {fmtDate(dataInicial)} a {fmtDate(dataFinal)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── MODO: TODOS OS PROFISSIONAIS (agrupado por profissional) ── */}
              {todosProfissionais ? (
                <>
                  {/* Confirmados por profissional */}
                  <Card className="p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Pagamentos Confirmados ({recFuncConfirmados.length})
                    </h3>
                    {recFuncConfirmados.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Nenhum pagamento confirmado no período.
                      </p>
                    ) : (
                      <>
                        {[...(gruposPorProfConfirmados ?? new Map()).entries()].map(([profSlug, dateMap]) => {
                          const profNome = nomeProfissionalBySlug(profSlug);
                          const todosItensProf = [...dateMap.values()].flat();
                          const totalValorProf = todosItensProf.reduce((s, r) => s + Number(r.valor), 0);
                          const totalComProf = todosItensProf.reduce((s, r) => {
                            const com = comissaoDoItemRec(r);
                            return com ? s + (Number(r.valor) * com.percentual) / 100 : s;
                          }, 0);
                          return (
                            <div key={profSlug} className="mb-6">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
                                <UserCheck className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-primary">{profNome}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{todosItensProf.length} registro(s)</span>
                              </div>
                              {[...dateMap.entries()].map(([data, itens]) => (
                                <SecaoData key={data} data={data} itens={itens} tipo="funcionarios" />
                              ))}
                              <div className="mt-2 flex justify-end gap-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-right">
                                  <p className="text-xs text-muted-foreground">Total {profNome}</p>
                                  <p className="text-base font-bold text-green-600">{fmt(totalValorProf)}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-right">
                                  <p className="text-xs text-muted-foreground">Comissão {profNome}</p>
                                  <p className="text-base font-bold text-emerald-600">{fmt(totalComProf)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div className="mt-4 flex justify-end gap-4">
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg px-5 py-3 text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">Total Confirmado</p>
                            <p className="text-xl font-bold text-green-600">
                              {fmt(recFuncConfirmados.reduce((s, r) => s + Number(r.valor), 0))}
                            </p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg px-5 py-3 text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">Total Comissão</p>
                            <p className="text-xl font-bold text-emerald-600">{fmt(totalComissao)}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>

                  {/* Pendentes por profissional */}
                  {recFuncPendentes.length > 0 && (
                    <Card className="p-5 shadow-sm border-amber-200">
                      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        Pagamentos Pendentes ({recFuncPendentes.length})
                      </h3>
                      {[...(gruposPorProfPendentes ?? new Map()).entries()].map(([profSlug, dateMap]) => {
                        const profNome = nomeProfissionalBySlug(profSlug);
                        const todosItensProf = [...dateMap.values()].flat();
                        const totalValorProf = todosItensProf.reduce((s, r) => s + Number(r.valor), 0);
                        return (
                          <div key={profSlug} className="mb-6">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200">
                              <UserCheck className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-bold text-amber-700">{profNome}</span>
                              <span className="ml-auto text-xs text-muted-foreground">{todosItensProf.length} registro(s)</span>
                            </div>
                            {[...dateMap.entries()].map(([data, itens]) => (
                              <SecaoData key={data} data={data} itens={itens} tipo="funcionarios" />
                            ))}
                            <div className="mt-2 flex justify-end">
                              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-right">
                                <p className="text-xs text-muted-foreground">Total Pendente {profNome}</p>
                                <p className="text-base font-bold text-amber-600">{fmt(totalValorProf)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-4 flex justify-end">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg px-5 py-3 text-right">
                          <p className="text-xs text-muted-foreground mb-0.5">Total Pendente Geral</p>
                          <p className="text-xl font-bold text-amber-600">
                            {fmt(recFuncPendentes.reduce((s, r) => s + Number(r.valor), 0))}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                /* ── MODO: PROFISSIONAL ESPECÍFICO (agrupado por data) ── */
                <>
                  <Card className="p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Pagamentos Confirmados ({recFuncConfirmados.length})
                    </h3>
                    {recFuncConfirmados.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Nenhum pagamento confirmado no período.
                      </p>
                    ) : (
                      <>
                        {[...gruposFuncConfirmados.entries()].map(([data, itens]) => (
                          <SecaoData key={data} data={data} itens={itens} tipo="funcionarios" />
                        ))}
                        <div className="mt-4 flex justify-end gap-4">
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg px-5 py-3 text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">Total Confirmado</p>
                            <p className="text-xl font-bold text-green-600">
                              {fmt(recFuncConfirmados.reduce((s, r) => s + Number(r.valor), 0))}
                            </p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg px-5 py-3 text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">Total Comissão</p>
                            <p className="text-xl font-bold text-emerald-600">{fmt(totalComissao)}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>

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
                          <p className="text-xl font-bold text-amber-600">
                            {fmt(recFuncPendentes.reduce((s, r) => s + Number(r.valor), 0))}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Somatória total */}
              <div className="flex justify-end">
                <div className="bg-card border border-border rounded-xl px-6 py-4 text-right shadow-sm min-w-[300px]">
                  <p className="text-xs text-muted-foreground mb-1">Somatória Total do Período</p>
                  <p className="text-2xl font-bold text-foreground">
                    {fmt(recFuncionario.reduce((s, r) => s + Number(r.valor), 0))}
                  </p>
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
