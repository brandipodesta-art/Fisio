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
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface PagamentoAtraso {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  fornecedor: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
}

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
  const [tipoRelatorio, setTipoRelatorio] = useState<"" | "clientes" | "funcionarios" | "atraso">("");
  const [clienteId, setClienteId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "confirmado" | "pendente">("todos");
  const [tipoInadimplencia, setTipoInadimplencia] = useState<"ambos" | "recebimentos" | "pagamentos">("ambos");

  // ── Dados auxiliares ───────────────────────────────────────────────────────
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loadingAux, setLoadingAux] = useState(true);

  // ── Resultado do relatório ─────────────────────────────────────────────────
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [pagamentosAtraso, setPagamentosAtraso] = useState<PagamentoAtraso[]>([]);
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
    if (!tipoRelatorio) return;
    // Para tipo "atraso" o período é opcional
    if (tipoRelatorio !== "atraso" && (!dataInicial || !dataFinal)) return;

    setLoadingRel(true);
    setGerado(false);
    setRecebimentos([]);
    setPagamentosAtraso([]);

    try {
      if (tipoRelatorio === "atraso") {
        // Data de hoje no formato ISO
        const hoje = new Date().toISOString().slice(0, 10);

        // Recebimentos em atraso (somente se filtro for ambos ou recebimentos)
        if (tipoInadimplencia === "ambos" || tipoInadimplencia === "recebimentos") {
          const qRec = `recebimentos?select=id,paciente_id,paciente_nome,descricao,valor,data_vencimento,data_pagamento,status,forma_pagamento,procedimento_id,profissional_id,confirmado_por&status=in.(pendente,atrasado)&data_vencimento=lt.${hoje}&order=data_vencimento.asc`;
          const dataRec = await get(qRec);
          setRecebimentos(Array.isArray(dataRec) ? dataRec : []);
        } else {
          setRecebimentos([]);
        }

        // Pagamentos em atraso (somente se filtro for ambos ou pagamentos)
        if (tipoInadimplencia === "ambos" || tipoInadimplencia === "pagamentos") {
          const resPag = await fetch(`/api/pagamentos`);
          const todosPag: PagamentoAtraso[] = resPag.ok ? await resPag.json() : [];
          const pagAtrasados = todosPag.filter(
            (p) =>
              (p.status === "atrasado" || p.status === "pendente") &&
              p.data_vencimento < hoje
          );
          pagAtrasados.sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));
          setPagamentosAtraso(pagAtrasados);
        } else {
          setPagamentosAtraso([]);
        }

        setGerado(true);
      } else {
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
      }
    } finally {
      setLoadingRel(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoRelatorio, dataInicial, dataFinal, clienteId, funcionarioId, filtroStatus, tipoInadimplencia, pacientes]);

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
          linhas.push([
            r.status === "recebido" || r.status === "pago" ? "Confirmado" : "Pendente",
            r.paciente_nome,
            fmtDate(r.data_vencimento),
            fmtDate(r.data_pagamento),
            _nomeProcLocal(r.procedimento_id),
            Number(r.valor),
            _nomeProfLocal(r.profissional_id ?? null),
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

    // ── Paleta sóbria: uma cor de marca + tons de cinza ──
    const COR_MARCA: [number, number, number]       = [22, 163, 74];   // verde da marca (apenas detalhes)
    const COR_TEXTO: [number, number, number]       = [30, 41, 59];    // slate-800
    const COR_TEXTO_MUTED: [number, number, number] = [100, 116, 139]; // slate-500
    const COR_LINHA: [number, number, number]       = [203, 213, 225]; // slate-300
    const COR_CINZA_HEADER: [number, number, number] = [241, 245, 249]; // slate-100
    const COR_CINZA_ALT: [number, number, number]   = [248, 250, 252]; // slate-50

    const titulo =
      tipoRelatorio === "clientes"
        ? "Relatório Financeiro - Clientes"
        : "Relatório Financeiro - Funcionários";

    // ── Cabeçalho do documento ──
    // Área à esquerda reservada para a logo da clínica (configurável futuramente);
    // enquanto não houver logo, exibe a marca textual.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...COR_TEXTO);
    doc.text("FisioSys", ML, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COR_TEXTO_MUTED);
    doc.text("Sistema de Gestão de Clínica", ML, 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COR_TEXTO);
    doc.text(titulo, PW - MR, 11, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COR_TEXTO_MUTED);
    doc.text(`Período: ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`, PW - MR, 16, { align: "right" });
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, PW - MR, 20.5, { align: "right" });

    // Linha fina na cor da marca separando o cabeçalho do conteúdo
    doc.setDrawColor(...COR_MARCA);
    doc.setLineWidth(0.8);
    doc.line(ML, 24, PW - MR, 24);
    doc.setLineWidth(0.2);
    doc.setDrawColor(...COR_LINHA);
    doc.setTextColor(...COR_TEXTO);

    let cursorY = 30;

    // ── Helper: título de seção (tipográfico, com linha fina) ──
    const drawSectionBanner = (y: number, label: string, count: number): number => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COR_TEXTO);
      doc.text(label.toUpperCase(), ML, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(`${count} registro(s)`, PW - MR, y + 4, { align: "right" });
      doc.setDrawColor(...COR_LINHA);
      doc.setLineWidth(0.2);
      doc.line(ML, y + 6, PW - MR, y + 6);
      doc.setTextColor(...COR_TEXTO);
      return y + 10;
    };

    // ── Helper: nome do profissional (texto em negrito, sem fundo) ──
    const drawProfBanner = (y: number, label: string): number => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COR_TEXTO);
      doc.text(label, ML, y + 4);
      return y + 6.5;
    };

    // ── Helper: linha de data do grupo ──
    const drawDateBanner = (y: number, label: string, count: number): number => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(label, ML, y + 3.5);
      doc.setFont("helvetica", "normal");
      doc.text(`${count} registro(s)`, PW - MR, y + 3.5, { align: "right" });
      doc.setTextColor(...COR_TEXTO);
      return y + 5.5;
    };

    // ── Helper: total alinhado à direita (linha fina + valor em negrito) ──
    const drawTotalBox = (y: number, label: string, valor: string, width = 90): number => {
      const x = ML + CW - width;
      doc.setDrawColor(...COR_LINHA);
      doc.setLineWidth(0.2);
      doc.line(x, y, ML + CW, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(label, x, y + 4.8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COR_TEXTO);
      doc.text(valor, ML + CW, y + 4.8, { align: "right" });
      doc.setTextColor(...COR_TEXTO);
      return y + 9;
    };

    // ── Helper: dois totais lado a lado ──
    const drawDoubleTotalBox = (
      y: number,
      label1: string, valor1: string,
      label2: string, valor2: string,
      width = 90
    ): number => {
      const gap = 10;
      const x2 = ML + CW - width;
      const x1 = x2 - width - gap;
      doc.setDrawColor(...COR_LINHA);
      doc.setLineWidth(0.2);
      doc.line(x1, y, ML + CW, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(label1, x1, y + 4.8);
      doc.text(label2, x2, y + 4.8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COR_TEXTO);
      doc.text(valor1, x2 - gap, y + 4.8, { align: "right" });
      doc.text(valor2, ML + CW, y + 4.8, { align: "right" });
      doc.setTextColor(...COR_TEXTO);
      return y + 9;
    };

    // ── Helper: faixa de resumo (caixas neutras com borda fina) ──
    const drawResumo = (items: { label: string; valor: string }[]) => {
      const cardW = (CW - 4 * (items.length - 1)) / items.length;
      const cardH = 14;
      items.forEach((it, i) => {
        const x = ML + i * (cardW + 4);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...COR_LINHA);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, cursorY, cardW, cardH, 1, 1, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...COR_TEXTO_MUTED);
        doc.text(it.label.toUpperCase(), x + 4, cursorY + 5);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...COR_TEXTO);
        doc.text(it.valor, x + 4, cursorY + 11);
      });
      doc.setTextColor(...COR_TEXTO);
      cursorY += cardH + 8;
    };

    // ── Helper: bloco de total geral no fim do relatório ──
    const drawTotalGeral = (linhas: { label: string; valor: string }[], registros: number) => {
      checkPage(12 + linhas.length * 8);
      doc.setDrawColor(...COR_MARCA);
      doc.setLineWidth(0.6);
      doc.line(ML, cursorY, ML + CW, cursorY);
      doc.setLineWidth(0.2);
      let y = cursorY + 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text(`${registros} registro(s)  -  ${fmtDate(dataInicial)} a ${fmtDate(dataFinal)}`, ML, y);
      linhas.forEach((l, i) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(i === 0 ? 8.5 : 8);
        doc.setTextColor(...COR_TEXTO_MUTED);
        doc.text(l.label, ML + CW - 75, y, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(i === 0 ? 13 : 10);
        doc.setTextColor(...COR_TEXTO);
        doc.text(l.valor, ML + CW, y, { align: "right" });
        y += i === 0 ? 8 : 6;
      });
      cursorY = y;
      doc.setTextColor(...COR_TEXTO);
    };

    // ── Helper: verifica se precisa de nova página ──
    const checkPage = (neededHeight: number) => {
      const pageH = 210; // A4 landscape height
      const marginBottom = 18; // reserva espaço para o rodapé
      if (cursorY + neededHeight > pageH - marginBottom) {
        doc.addPage();
        cursorY = 15;
      }
    };

    // ── Helper: renderiza tabela de itens por data ──
    const renderTabelaData = (
      data: string,
      itens: Recebimento[],
      tipo: "clientes" | "funcionarios"
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
          return [
            r.paciente_nome,
            fmtDate(r.data_vencimento),
            fmtDate(r.data_pagamento),
            _nomeProcLocal(r.procedimento_id),
            fmt(Number(r.valor)),
            _nomeProfLocal(r.profissional_id ?? null),
          ];
        });
        body.push([
          { content: "Subtotal do dia", colSpan: 4, styles: { fontStyle: "bold" as const, textColor: COR_TEXTO_MUTED, fillColor: COR_CINZA_HEADER } } as unknown as string,
          { content: fmt(subtotal), styles: { fontStyle: "bold" as const, halign: "right" as const, fillColor: COR_CINZA_HEADER } } as unknown as string,
          { content: "", styles: { fillColor: COR_CINZA_HEADER } } as unknown as string,
        ]);
        autoTable(doc, {
          head,
          body,
          startY: cursorY,
          margin: { left: ML, right: MR, bottom: 18 },
          styles: { fontSize: 7.5, cellPadding: 1.8, textColor: COR_TEXTO },
          headStyles: { fillColor: COR_CINZA_HEADER, textColor: COR_TEXTO, fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: COR_CINZA_ALT },
          columnStyles: { 4: { halign: "right" } },
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.1,
          didDrawPage: () => { cursorY = 15; },
        });
      } else {
        const head = [["Profissional", "Procedimento", "Data Proc.", "Data Pagto", "Valor", "Comissão", "Cliente"]];
        const body = itens.map((r) => {
          const com = _comissaoRec(r);
          const valorCom = com ? (Number(r.valor) * com.percentual) / 100 : null;
          return [
            _nomeProfLocal(r.profissional_id ?? null),
            _nomeProcLocal(r.procedimento_id),
            fmtDate(r.data_vencimento),
            fmtDate(r.data_pagamento),
            fmt(Number(r.valor)),
            valorCom !== null ? `${com!.percentual}% = ${fmt(valorCom)}` : "-",
            r.paciente_nome,
          ];
        });
        body.push([
          { content: "Subtotal do dia", colSpan: 4, styles: { fontStyle: "bold" as const, textColor: COR_TEXTO_MUTED, fillColor: COR_CINZA_HEADER } } as unknown as string,
          { content: fmt(subtotal), styles: { fontStyle: "bold" as const, halign: "right" as const, fillColor: COR_CINZA_HEADER } } as unknown as string,
          { content: fmt(subtotalCom), styles: { fontStyle: "bold" as const, halign: "right" as const, fillColor: COR_CINZA_HEADER } } as unknown as string,
          { content: "", styles: { fillColor: COR_CINZA_HEADER } } as unknown as string,
        ]);
        autoTable(doc, {
          head,
          body,
          startY: cursorY,
          margin: { left: ML, right: MR, bottom: 18 },
          styles: { fontSize: 7.5, cellPadding: 1.8, textColor: COR_TEXTO },
          headStyles: { fillColor: COR_CINZA_HEADER, textColor: COR_TEXTO, fontStyle: "bold", fontSize: 7 },
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

      // ── Faixa de resumo ──
      drawResumo([
        { label: "Confirmados", valor: fmt(totalConf) },
        { label: "Pendentes", valor: fmt(totalPend) },
        { label: "Total Geral", valor: fmt(totalGeral) },
      ]);

      // ── Seção Confirmados ──
      if (recConf.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, "Pagamentos Confirmados", recConf.length);
        const gruposConf = groupByDate(recConf);
        for (const [data, itens] of gruposConf.entries()) {
          renderTabelaData(data, itens, "clientes");
        }
        checkPage(12);
        cursorY = drawTotalBox(cursorY, "Total Confirmado", fmt(totalConf));
        cursorY += 4;
      }

      // ── Seção Pendentes ──
      if (recPend.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, "Pagamentos Pendentes", recPend.length);
        const gruposPend = groupByDate(recPend);
        for (const [data, itens] of gruposPend.entries()) {
          renderTabelaData(data, itens, "clientes");
        }
        checkPage(12);
        cursorY = drawTotalBox(cursorY, "Total Pendente", fmt(totalPend));
        cursorY += 4;
      }

      // ── Total geral final ──
      drawTotalGeral(
        [{ label: "Somatória total do período", valor: fmt(totalGeral) }],
        recebimentos.length
      );

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

      // ── Faixa de resumo ──
      drawResumo([
        { label: "Confirmados", valor: fmt(totalConf) },
        { label: "Pendentes", valor: fmt(totalPend) },
        { label: "Total Comissão", valor: fmt(totalGeralComissao) },
      ]);

      // ── Seção Confirmados por profissional ──
      if (recConf.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, "Pagamentos Confirmados", recConf.length);
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
            renderTabelaData(data, itens, "funcionarios");
          }
          checkPage(12);
          cursorY = drawDoubleTotalBox(
            cursorY,
            `Total ${profNome}`, fmt(totalValorProf),
            `Comissão ${profNome}`, fmt(totalComProf)
          );
          cursorY += 4;
          totalConfValor += totalValorProf;
          totalConfComissao += totalComProf;
        }
        checkPage(12);
        cursorY = drawDoubleTotalBox(
          cursorY,
          "Total Confirmado", fmt(totalConfValor),
          "Total Comissão", fmt(totalConfComissao)
        );
        cursorY += 6;
      }

      // ── Seção Pendentes por profissional ──
      if (recPend.length > 0) {
        checkPage(20);
        cursorY = drawSectionBanner(cursorY, "Pagamentos Pendentes", recPend.length);
        const gruposPorProfPend = groupByProfissional(recPend);
        let totalPendValor = 0;
        for (const [profSlug, dateMap] of gruposPorProfPend.entries()) {
          const profNome = _nomeProfLocal(profSlug);
          const todosItensProf = [...dateMap.values()].flat();
          const totalValorProf = todosItensProf.reduce((s, r) => s + Number(r.valor), 0);
          checkPage(20);
          cursorY = drawProfBanner(cursorY, `${profNome}  -  ${todosItensProf.length} registro(s)`);
          for (const [data, itens] of dateMap.entries()) {
            renderTabelaData(data, itens, "funcionarios");
          }
          checkPage(12);
          cursorY = drawTotalBox(cursorY, `Total Pendente ${profNome}`, fmt(totalValorProf));
          cursorY += 4;
          totalPendValor += totalValorProf;
        }
        checkPage(12);
        cursorY = drawTotalBox(cursorY, "Total Pendente Geral", fmt(totalPendValor));
        cursorY += 6;
      }

      // ── Total geral final ──
      drawTotalGeral(
        [
          { label: "Somatória total do período", valor: fmt(totalGeralValor) },
          { label: "Total de comissão", valor: fmt(totalGeralComissao) },
        ],
        recebimentos.length
      );
    }

    // ── Rodapé em todas as páginas ──
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...COR_LINHA);
      doc.setLineWidth(0.2);
      doc.line(ML, 198, PW - MR, 198);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COR_TEXTO_MUTED);
      doc.text("FisioSys  -  Sistema de Gestão de Clínica", ML, 202);
      doc.text(`Página ${i} de ${pageCount}`, PW - MR, 202, { align: "right" });
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

  // Retorna a comissão para um recebimento, usando o profissional que realizou o atendimento
  const comissaoDoItemRec = (r: Recebimento) => {
    if (!r.procedimento_id) return null;
    const profSlug = r.profissional_id ?? null;
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
  const recFuncionario = recebimentos;

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

  const podeGerar =
    tipoRelatorio !== "" &&
    (tipoRelatorio === "atraso" || (dataInicial !== "" && dataFinal !== ""));

  // ── Renderização de linha (clientes) ──────────────────────────────────────
  const renderLinhaCliente = (r: Recebimento) => {
    const profSlug = r.profissional_id ?? null;
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
    const profSlug = r.profissional_id ?? null;
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
                setTipoInadimplencia("ambos");
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
                <SelectItem value="atraso">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Inadimplência — Recebimentos e Pagamentos em Atraso
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoRelatorio === "atraso" && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo de Inadimplência</Label>
            <Select
              value={tipoInadimplencia}
              onValueChange={(v) => { setTipoInadimplencia(v as typeof tipoInadimplencia); setGerado(false); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ambos">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Recebimentos e Pagamentos em Atraso
                  </span>
                </SelectItem>
                <SelectItem value="recebimentos">
                  <span className="flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-red-600" />
                    Recebimentos em Atraso
                  </span>
                </SelectItem>
                <SelectItem value="pagamentos">
                  <span className="flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-orange-600" />
                    Pagamentos em Atraso
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          )}

          {tipoRelatorio !== "atraso" && (
          <div className="space-y-1.5 sm:col-span-2">
            <DateRangePicker
              label="Período"
              value={datePeriod}
              onChange={(range) => { setDatePeriod(range); setGerado(false); }}
              placeholder="Selecionar período do relatório"
            />
          </div>
          )}
        </div>

        {/* Linha 2: Status do Pagamento */}
        {tipoRelatorio !== "atraso" && (
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
        )}

        {/* Linha 3: Cliente ou Funcionário (opcional) */}
        {tipoRelatorio !== "" && tipoRelatorio !== "atraso" && (
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
            {gerado && (recebimentos.length > 0 || pagamentosAtraso.length > 0) && (
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
          {tipoRelatorio === "atraso" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(tipoInadimplencia === "ambos" || tipoInadimplencia === "recebimentos") && (
              <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/10">
                <div className="flex items-center gap-3">
                  <ArrowDownCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Recebimentos em Atraso</p>
                    <p className="text-lg font-bold text-red-600">
                      {fmt(recebimentos.reduce((s, r) => s + Number(r.valor), 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">{recebimentos.length} registro(s)</p>
                  </div>
                </div>
              </Card>
              )}
              {(tipoInadimplencia === "ambos" || tipoInadimplencia === "pagamentos") && (
              <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                <div className="flex items-center gap-3">
                  <ArrowUpCircle className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pagamentos em Atraso</p>
                    <p className="text-lg font-bold text-orange-600">
                      {fmt(pagamentosAtraso.reduce((s, p) => s + Number(p.valor), 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">{pagamentosAtraso.length} registro(s)</p>
                  </div>
                </div>
              </Card>
              )}
              <Card className="p-4 border-rose-200 bg-rose-50 dark:bg-rose-900/10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {tipoInadimplencia === "recebimentos" ? "Total Recebimentos em Atraso" :
                       tipoInadimplencia === "pagamentos" ? "Total Pagamentos em Atraso" :
                       "Total em Aberto"}
                    </p>
                    <p className="text-lg font-bold text-rose-600">
                      {fmt(
                        recebimentos.reduce((s, r) => s + Number(r.valor), 0) +
                        pagamentosAtraso.reduce((s, p) => s + Number(p.valor), 0)
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
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
          )}

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
                        {new Set(recFuncionario.map((r) => r.paciente_id)).size} paciente(s) atendido(s) · Período:{" "}
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

          {/* RELATÓRIO 3: INADIMPLÊNCIA / EM ATRASO */}
          {tipoRelatorio === "atraso" && (
            <div className="space-y-6">

              {/* Recebimentos em atraso */}
              {(tipoInadimplencia === "ambos" || tipoInadimplencia === "recebimentos") && (
              <Card className="p-5 shadow-sm border-red-200">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  Recebimentos em Atraso ({recebimentos.length})
                </h3>
                {recebimentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum recebimento em atraso.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Cliente</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Procedimento</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Profissional</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Vencimento</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-right">Valor</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recebimentos.map((r, i) => (
                            <tr key={r.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                              <td className="py-2 px-3 text-sm">{r.paciente_nome}</td>
                              <td className="py-2 px-3 text-sm">{nomeProcedimento(r.procedimento_id)}</td>
                              <td className="py-2 px-3 text-sm">{nomeProfissionalBySlug(r.profissional_id ?? null)}</td>
                              <td className="py-2 px-3 text-sm text-red-600 font-medium">{fmtDate(r.data_vencimento)}</td>
                              <td className="py-2 px-3 text-sm text-right font-semibold">{fmt(Number(r.valor))}</td>
                              <td className="py-2 px-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  {r.status === "atrasado" ? "Atrasado" : "Pendente"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-3 text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Total Recebimentos em Atraso</p>
                        <p className="text-xl font-bold text-red-600">
                          {fmt(recebimentos.reduce((s, r) => s + Number(r.valor), 0))}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </Card>
              )}

              {/* Pagamentos em atraso */}
              {(tipoInadimplencia === "ambos" || tipoInadimplencia === "pagamentos") && (
              <Card className="p-5 shadow-sm border-orange-200">
                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-orange-600" />
                  Pagamentos em Atraso ({pagamentosAtraso.length})
                </h3>
                {pagamentosAtraso.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum pagamento em atraso.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Descrição</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Categoria</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Fornecedor</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Vencimento</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-right">Valor</th>
                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagamentosAtraso.map((p, i) => (
                            <tr key={p.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                              <td className="py-2 px-3 text-sm">{p.descricao}</td>
                              <td className="py-2 px-3 text-sm">{p.categoria ?? "—"}</td>
                              <td className="py-2 px-3 text-sm">{p.fornecedor ?? "—"}</td>
                              <td className="py-2 px-3 text-sm text-orange-600 font-medium">{fmtDate(p.data_vencimento)}</td>
                              <td className="py-2 px-3 text-sm text-right font-semibold">{fmt(Number(p.valor))}</td>
                              <td className="py-2 px-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                  {p.status === "atrasado" ? "Atrasado" : "Pendente"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-5 py-3 text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Total Pagamentos em Atraso</p>
                        <p className="text-xl font-bold text-orange-600">
                          {fmt(pagamentosAtraso.reduce((s, p) => s + Number(p.valor), 0))}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </Card>
              )}

              {/* Total geral em aberto */}
              <div className="flex justify-end">
                <div className="bg-card border border-rose-300 rounded-xl px-6 py-4 text-right shadow-sm min-w-[300px]">
                  <p className="text-xs text-muted-foreground mb-1">
                    {tipoInadimplencia === "recebimentos" ? "Total Recebimentos em Atraso" :
                     tipoInadimplencia === "pagamentos" ? "Total Pagamentos em Atraso" :
                     "Total Geral em Aberto"}
                  </p>
                  <p className="text-2xl font-bold text-rose-600">
                    {fmt(
                      recebimentos.reduce((s, r) => s + Number(r.valor), 0) +
                      pagamentosAtraso.reduce((s, p) => s + Number(p.valor), 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gerado em {new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sem dados */}
          {gerado && tipoRelatorio !== "atraso" && recebimentos.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Nenhum registro encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar os filtros de data ou selecionar outro cliente/funcionário.
              </p>
            </Card>
          )}
          {gerado && tipoRelatorio === "atraso" && recebimentos.length === 0 && pagamentosAtraso.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Nenhum item em atraso!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os recebimentos e pagamentos estão em dia.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
