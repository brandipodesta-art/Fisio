"use client";

import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import ConfirmActionDialog from "@/components/ui/ConfirmActionDialog";
import ModalPortal from "@/components/ui/ModalPortal";
import { AutocompletePaciente } from "@/components/ui/AutocompletePaciente";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, RefreshCw, Search, X, CheckCircle2, Clock,
  AlertCircle, XCircle, Pencil, Trash2, Check, Eye, Repeat2, CalendarDays, MoreHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Recebimento, RecebimentoInput, FormaPagamento, FormaPagamentoItem } from "@/lib/types/financeiro";
import { FORMA_PAGAMENTO_LABEL } from "@/lib/types/financeiro";

/** Hook para carregar formas de pagamento do tipo recebimento/ambos */
function useFormasPagamento() {
  const [formas, setFormas] = useState<FormaPagamentoItem[]>([]);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    fetch(`${url}/rest/v1/formas_pagamento?tipo=in.(recebimento,ambos)&ativo=eq.true&order=nome`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFormas(data as FormaPagamentoItem[]); })
      .catch(() => {});
  }, []);
  return { formas };
}

/** Converte nome da forma de pagamento para slug legado */
function slugFromNome(nome: string): FormaPagamento | null {
  const map: Record<string, FormaPagamento> = {
    "Dinheiro":          "dinheiro",
    "PIX":               "pix",
    "Cartão de Crédito": "cartao_credito",
    "Cartão de Débito":  "cartao_debito",
    "Transferência":     "transferencia",
    "Boleto":            "boleto",
    "Cheque":            "cheque",
  };
  return map[nome] ?? null;
}

/** Hook para buscar procedimentos dinamicamente do Supabase */
interface ProcedimentoOpcao {
  id: string;
  nome: string;
  valor_padrao: number | null;
}

function useProcedimentos() {
  const [procedimentos, setProcedimentos] = useState<ProcedimentoOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    fetch(`${url}/rest/v1/procedimentos?ativo=eq.true&order=nome&select=id,nome,valor_padrao`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProcedimentos(data.map((p: { id: string; nome: string; valor_padrao: number | null }) => ({
            id: p.id,
            nome: p.nome,
            valor_padrao: p.valor_padrao ?? null,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  return { procedimentos, carregando };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const STATUS_CONFIG = {
  recebido:  { label: "Recebido",  cor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  pendente:  { label: "Pendente",  cor: "bg-blue-100 text-blue-700",       icon: Clock },
  atrasado:  { label: "Atrasado",  cor: "bg-orange-100 text-orange-700",   icon: AlertCircle },
  cancelado: { label: "Cancelado", cor: "bg-muted text-muted-foreground",     icon: XCircle },
};

// ─── Formulário Modal ─────────────────────────────────────────────────────────

interface FormModalProps {
  inicial?: Recebimento | null;
  onSalvar: (dados: RecebimentoInput, recorrencia?: { meses: number }) => Promise<void>;
  onFechar: () => void;
  salvando: boolean;
  formas: FormaPagamentoItem[];
}

// ─── Formulário Modal ─────────────────────────────────────────────────────────

function FormModal({ inicial, onSalvar, onFechar, salvando, formas }: FormModalProps) {
  const { procedimentos, carregando: carregandoProc } = useProcedimentos();

  // Extrai o procedimento base removendo numeração de parcelas: "Acupuntura (2/4)" → "Acupuntura"
  const procedimentoBase = inicial?.descricao
    ? inicial.descricao.replace(/\s*\(\d+\/\d+\)$/, "").trim()
    : "";

  // Preserva a chave interna de idempotência (agendamento:{uuid}) para recolocar ao salvar
  const agendamentoRef = inicial?.observacoes?.match(/agendamento:[a-f0-9-]+/i)?.[0] ?? null;
  const obsLimpa = (inicial?.observacoes ?? "").replace(/agendamento:[a-f0-9-]+/gi, "").trim() || null;

  const [form, setForm] = useState<RecebimentoInput>({
    paciente_id:      inicial?.paciente_id      ?? null,
    paciente_nome:    inicial?.paciente_nome    ?? "",
    procedimento_id:  inicial?.procedimento_id  ?? null,
    descricao:        procedimentoBase,
    valor:            inicial?.valor            ?? 0,
    data_vencimento:  inicial?.data_vencimento  ?? "",
    data_pagamento:   inicial?.data_pagamento   ?? null,
    status:              inicial?.status              ?? "pendente",
    forma_pagamento:     inicial?.forma_pagamento     ?? null,
    forma_pagamento_id:  inicial?.forma_pagamento_id  ?? null,
    observacoes:         obsLimpa,
    confirmado_por:      inicial?.confirmado_por      ?? null,
    confirmado_por_id:   inicial?.confirmado_por_id   ?? null,
  });
  const [repete, setRepete] = useState(false);
  const [meses, setMeses]   = useState(3);

  function set(campo: keyof RecebimentoInput, valor: unknown) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  // Pré-visualização das datas futuras
  function datasPreview(): string[] {
    if (!form.data_vencimento || !repete) return [];
    const datas: string[] = [];
    const [y, m, d] = form.data_vencimento.split("-").map(Number);
    for (let i = 1; i <= meses; i++) {
      let nm = m + i;
      let ny = y;
      while (nm > 12) { nm -= 12; ny++; }
      const maxDia = new Date(ny, nm, 0).getDate();
      const dia = Math.min(d, maxDia);
      datas.push(`${String(ny).padStart(4,"0")}-${String(nm).padStart(2,"0")}-${String(dia).padStart(2,"0")}`);
    }
    return datas;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.paciente_id) {
      toast.error("Selecione o paciente antes de salvar.");
      return;
    }
    if (!form.forma_pagamento_id) {
      toast.error("Selecione a forma de pagamento antes de salvar.");
      return;
    }
    // Recolocar a chave interna de idempotência (agendamento:{uuid}) nas observações ao salvar
    const dadosFinais = agendamentoRef
      ? { ...form, observacoes: [agendamentoRef, form.observacoes].filter(Boolean).join(" ") }
      : form;
    await onSalvar(dadosFinais, repete ? { meses } : undefined);
  }

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-popover rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {inicial ? "Editar Recebimento" : "Novo Recebimento"}
          </h2>
          <button onClick={onFechar} className="text-muted-foreground/60 hover:text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Paciente — Autocomplete */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Nome do Paciente <span className="text-red-500">*</span></label>
            <AutocompletePaciente
              value={form.paciente_nome ?? ""}
              pacienteId={form.paciente_id}
              onChange={(nome, id) => setForm(f => ({ ...f, paciente_nome: nome, paciente_id: id }))}
            />
          </div>
          {/* Procedimento */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Procedimento *</label>
            <Select
              value={form.procedimento_id ?? ""}
              onValueChange={v => {
                const proc = procedimentos.find(p => p.id === v);
                set("procedimento_id", v || null);
                set("descricao", proc?.nome ?? "");
                // Preenche o valor automaticamente com o valor_padrao do procedimento
                if (proc && proc.valor_padrao !== null && proc.valor_padrao > 0) {
                  set("valor", proc.valor_padrao);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o procedimento..." />
              </SelectTrigger>
              <SelectContent>
                {carregandoProc ? (
                  <SelectItem value="__loading" disabled>Carregando...</SelectItem>
                ) : procedimentos.length === 0 ? (
                  <SelectItem value="__empty" disabled>Nenhum procedimento cadastrado</SelectItem>
                ) : (
                  procedimentos.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {/* Valor + Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$) *</label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.valor || ""}
                onChange={e => set("valor", parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Vencimento *</label>
              <Input
                required
                type="date"
                value={form.data_vencimento}
                onChange={e => set("data_vencimento", e.target.value)}
              />
            </div>
          </div>
          {/* Status + Forma de Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status *</label>
              <Select value={form.status} onValueChange={v => {
                set("status", v);
                if (v === "recebido" && !form.data_pagamento) {
                  set("data_pagamento", new Date().toISOString().slice(0, 10));
                }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Forma de Pagamento <span className="text-red-500">*</span></label>
              <Select
                value={form.forma_pagamento_id ?? ""}
                onValueChange={v => {
                  const fp = formas.find(f => f.id === v);
                  set("forma_pagamento_id", v || null);
                  set("forma_pagamento", fp ? slugFromNome(fp.nome) : null);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {formas.length === 0 ? (
                    <SelectItem value="__loading" disabled>Carregando...</SelectItem>
                  ) : (
                    formas.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Recorrência mensal — só na criação */}
          {!inicial && (
            <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <label className={`flex items-center gap-2 text-sm font-medium select-none ${
                  form.data_vencimento ? "text-foreground/80 cursor-pointer" : "text-muted-foreground/60 cursor-not-allowed"
                }`}>
                  <input
                    type="checkbox"
                    checked={repete}
                    disabled={!form.data_vencimento}
                    onChange={e => setRepete(e.target.checked)}
                    className="w-4 h-4 accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <Repeat2 className={`w-4 h-4 ${form.data_vencimento ? "text-muted-foreground/60" : "text-muted-foreground/30"}`} />
                  Repete mensalmente
                  {!form.data_vencimento && (
                    <span className="text-xs font-normal text-muted-foreground/60">(preencha o vencimento primeiro)</span>
                  )}
                </label>
                {repete && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Gerar mais</span>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={meses}
                      onChange={e => setMeses(Math.max(1, Math.min(24, Number(e.target.value))))}
                      className="w-16 border border-border rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">mes(es)</span>
                  </div>
                )}
              </div>
              {repete && datasPreview().length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Datas que serão criadas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {datasPreview().map((d, i) => {
                      const [y, mo, di] = d.split("-");
                      return (
                        <span key={i} className="text-xs bg-accent text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                          {di}/{mo}/{y}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data de Pagamento */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Data do Pagamento</label>
            <Input
              type="date"
              value={form.data_pagamento ?? ""}
              onChange={e => set("data_pagamento", e.target.value || null)}
            />
          </div>
          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Observações</label>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              value={form.observacoes ?? ""}
              onChange={e => set("observacoes", e.target.value || null)}
              placeholder="Observações adicionais..."
            />
          </div>
          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={salvando} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {salvando
                ? "Salvando..."
                : inicial
                  ? "Salvar Alterações"
                  : repete
                    ? `Registrar + ${meses} parcela(s)`
                    : "Registrar"}
            </Button>
          </div>
         </form>
      </div>
    </div>
    </ModalPortal>
  );
}
// ─── Componente principal ─────────────────────────────────────────────────────

export default function FinanceiroRecebimentos() {
  const { usuario } = useAuth();
  const { procedimentos } = useProcedimentos();
  const { formas } = useFormasPagamento();

  // Rótulo da forma de pagamento para exibição (prefere UUID, fallback para slug legado)
  function formaLabel(item: Recebimento): string | null {
    if (item.forma_pagamento_id) {
      return formas.find(f => f.id === item.forma_pagamento_id)?.nome ?? null;
    }
    if (item.forma_pagamento) {
      return FORMA_PAGAMENTO_LABEL[item.forma_pagamento as FormaPagamento] ?? null;
    }
    return null;
  }
  const [itens, setItens]         = useState<Recebimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando]   = useState<Recebimento | null>(null);
  const [visualizando, setVisualizando] = useState<Recebimento | null>(null);
  const [profissionalModal, setProfissionalModal] = useState<string | null>(null);
  const [salvando, setSalvando]   = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [excluirDialogId, setExcluirDialogId] = useState<string | null>(null);
  const [editarDialogId, setEditarDialogId]   = useState<Recebimento | null>(null);

  // Filtros
  const [filtroStatus,        setFiltroStatus]        = useState("todos");
  const [filtroPaciente,      setFiltroPaciente]      = useState("");
  const [filtroProcedimento,  setFiltroProcedimento]  = useState("todos");
  const [rangeVenc,           setRangeVenc]           = useState<DateRange>({ from: "", to: "" });
  const [rangePag,            setRangePag]            = useState<DateRange>({ from: "", to: "" });

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const params = new URLSearchParams();
    if (filtroStatus !== "todos") params.set("status", filtroStatus);
    if (filtroPaciente) params.set("paciente", filtroPaciente);
    try {
      const res = await fetch(`/api/recebimentos?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar recebimentos");
      setItens(await res.json());
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroPaciente]);

  useEffect(() => { buscar(); }, [buscar]);

  // Gera lista de datas mensais futuras a partir de uma data base
  function gerarDatasRecorrentes(base: string, qtd: number): string[] {
    const [y, m, d] = base.split("-").map(Number);
    const datas: string[] = [];
    for (let i = 1; i <= qtd; i++) {
      let nm = m + i;
      let ny = y;
      while (nm > 12) { nm -= 12; ny++; }
      const maxDia = new Date(ny, nm, 0).getDate();
      const dia = Math.min(d, maxDia);
      datas.push(`${String(ny).padStart(4,"0")}-${String(nm).padStart(2,"0")}-${String(dia).padStart(2,"0")}`);
    }
    return datas;
  }

  async function salvar(dados: RecebimentoInput, recorrencia?: { meses: number }) {
    setSalvando(true);
    try {
      // Auto-preencher data_pagamento e confirmado_por ao salvar com status recebido
      if (dados.status === "recebido") {
        if (!dados.data_pagamento) {
          dados = { ...dados, data_pagamento: new Date().toISOString().slice(0, 10) };
        }
        if (!dados.confirmado_por) {
          dados = {
            ...dados,
            confirmado_por:    usuario?.nome_completo ?? usuario?.nome_acesso ?? null,
            confirmado_por_id: usuario?.id ?? null,
          };
        }
      }
      const url    = editando ? `/api/recebimentos/${editando.id}` : "/api/recebimentos";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error("Erro ao salvar");

        // Criar parcelas recorrentes (somente na criação)
      if (!editando && recorrencia && recorrencia.meses > 0 && dados.data_vencimento) {
        const datas = gerarDatasRecorrentes(dados.data_vencimento, recorrencia.meses);
        await Promise.all(
          datas.map((data, idx) =>
            fetch("/api/recebimentos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...dados,
                data_vencimento: data,
                data_pagamento: null,
                status: "pendente",
                descricao: `${dados.descricao} (${idx + 2}/${recorrencia.meses + 1})`,
                procedimento_id: dados.procedimento_id ?? null,
              }),
            })
          )
        );
      }

      setModalAberto(false);
      setEditando(null);
      buscar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    setExcluindo(id);
    await fetch(`/api/recebimentos/${id}`, { method: "DELETE" });
    setExcluindo(null);
    setExcluirDialogId(null);
    buscar();
  }

  async function marcarRecebido(item: Recebimento) {
    await fetch(`/api/recebimentos/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        status: "recebido",
        data_pagamento: new Date().toISOString().slice(0, 10),
        confirmado_por: usuario?.nome_completo ?? usuario?.nome_acesso ?? null,
        confirmado_por_id: usuario?.id ?? null,
      }),
    });
    buscar();
  }

  // Filtragem local por procedimento, vencimento e data de pagamento
  const itensFiltrados = itens.filter(r => {
    if (filtroProcedimento !== "todos") {
      const base = r.descricao.replace(/\s*\(\d+\/\d+\)$/, "").trim();
      if (base !== filtroProcedimento && r.descricao !== filtroProcedimento) return false;
    }
    if (rangeVenc.from  && r.data_vencimento < rangeVenc.from)  return false;
    if (rangeVenc.to    && r.data_vencimento > rangeVenc.to)    return false;
    if (rangePag.from  && (!r.data_pagamento || r.data_pagamento < rangePag.from))  return false;
    if (rangePag.to    && (!r.data_pagamento || r.data_pagamento > rangePag.to))    return false;
    return true;
  });

  const totalFiltrado = itensFiltrados.reduce((s, r) => s + Number(r.valor), 0);

  // Verifica se algum filtro extra está ativo
  const filtrosExtrasAtivos = filtroProcedimento !== "todos" || rangeVenc.from || rangeVenc.to || rangePag.from || rangePag.to;

  function limparFiltrosExtras() {
    setFiltroProcedimento("todos");
    setRangeVenc({ from: "", to: "" });
    setRangePag({ from: "", to: "" });
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Recebimentos</h2>
          <p className="text-sm text-muted-foreground">Pagamentos recebidos e a receber dos clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={buscar} disabled={carregando}>
            <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            onClick={() => { setEditando(null); setModalAberto(true); }}
          >
            <Plus className="w-4 h-4" /> Novo Recebimento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 border-border shadow-sm space-y-3">
        {/* Linha 1: busca + status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              className="pl-9"
              placeholder="Buscar por paciente..."
              value={filtroPaciente}
              onChange={e => setFiltroPaciente(e.target.value)}
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Linha 2: procedimento + filtros de data com DateRangePicker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Procedimento</label>
            <Select value={filtroProcedimento} onValueChange={setFiltroProcedimento}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os procedimentos</SelectItem>
                {procedimentos.map(p => (
                  <SelectItem key={p.nome} value={p.nome}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateRangePicker
            label="Vencimento"
            value={rangeVenc}
            onChange={setRangeVenc}
            placeholder="Qualquer vencimento"
          />

          <DateRangePicker
            label="Data Pagamento"
            value={rangePag}
            onChange={setRangePag}
            placeholder="Qualquer data de pagto."
          />
        </div>

        {/* Botão limpar filtros extras */}
        {filtrosExtrasAtivos && (
          <div className="flex justify-end">
            <button
              onClick={limparFiltrosExtras}
              className="text-xs text-muted-foreground hover:text-red-600 flex items-center gap-1 underline underline-offset-2"
            >
              <X className="w-3 h-3" /> Limpar filtros extras
            </button>
          </div>
        )}
      </Card>

      {/* Total */}
      {!carregando && itensFiltrados.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>
            {itensFiltrados.length} registro(s)
            {filtrosExtrasAtivos && itens.length !== itensFiltrados.length && (
              <span className="text-muted-foreground/60 ml-1">(de {itens.length})</span>
            )}
          </span>
          <span className="font-semibold text-foreground">Total: {fmt(totalFiltrado)}</span>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{erro}</div>
      )}

      {/* Lista */}
      {carregando ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </Card>
          ))}
        </div>
      ) : itensFiltrados.length === 0 ? (
        <Card className="p-10 text-center border-border shadow-sm">
          <p className="text-muted-foreground/60 text-sm">Nenhum recebimento encontrado.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {itensFiltrados.map(item => {
            const cfg = STATUS_CONFIG[item.status];
            const Icon = cfg.icon;
            return (
              <Card key={item.id} className="p-4 border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cor}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {item.paciente_nome && (
                        <span className="text-xs text-muted-foreground">{item.paciente_nome}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{item.descricao}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Venc.: {fmtDate(item.data_vencimento)}</span>
                      {item.data_pagamento && <span>Pago: {fmtDate(item.data_pagamento)}</span>}
                      {formaLabel(item) && (
                        <span>{formaLabel(item)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-bold text-foreground">{fmt(Number(item.valor))}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {item.status === "pendente" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => marcarRecebido(item)}
                              className="text-primary cursor-pointer"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Marcar Recebido
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={async () => {
                            setVisualizando(item);
                            setProfissionalModal(null);
                            // Busca o profissional via agendamento vinculado (observacoes = "agendamento:{id}")
                            const match = item.observacoes?.match(/agendamento:([a-f0-9-]+)/i);
                            if (match?.[1]) {
                              const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
                              const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
                              try {
                                const res = await fetch(
                                  `${url}/rest/v1/agendamentos?id=eq.${match[1]}&select=professional_id,profissionais(name)`,
                                  { headers: { apikey: key, Authorization: `Bearer ${key}` } }
                                );
                                const data = await res.json();
                                if (Array.isArray(data) && data[0]?.profissionais?.name) {
                                  setProfissionalModal(data[0].profissionais.name);
                                }
                              } catch (_) {}
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditarDialogId(item)}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setExcluirDialogId(item.id)}
                          disabled={excluindo === item.id}
                          className="text-red-600 cursor-pointer focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <FormModal
          inicial={editando}
          onSalvar={salvar}
          onFechar={() => { setModalAberto(false); setEditando(null); }}
          salvando={salvando}
          formas={formas}
        />
      )}

      {/* Modal de Visualização */}
      {visualizando && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-popover rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" /> Detalhes do Recebimento
              </h2>
              <button onClick={() => { setVisualizando(null); setProfissionalModal(null); }} className="text-muted-foreground/60 hover:text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Paciente</p>
                  <p className="text-sm text-foreground">{visualizando.paciente_nome || <span className="italic text-muted-foreground/60">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Procedimento</p>
                  <p className="text-sm text-foreground">
                    {visualizando.descricao.replace(/\s*\(\d+\/\d+\)$/, "").trim()}
                    {/\(\d+\/\d+\)$/.test(visualizando.descricao) && (
                      <span className="ml-1.5 text-xs text-muted-foreground/60 font-normal">
                        {visualizando.descricao.match(/(\(\d+\/\d+\))$/)?.[1]}
                      </span>
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Profissional</p>
                  <p className="text-sm text-foreground">
                    {profissionalModal ?? <span className="italic text-muted-foreground/60">—</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Valor</p>
                  <p className="text-sm font-semibold text-primary">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(visualizando.valor)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    visualizando.status === 'recebido' ? 'bg-green-100 text-green-700' :
                    visualizando.status === 'atrasado' ? 'bg-red-100 text-red-700' :
                    visualizando.status === 'cancelado' ? 'bg-muted text-muted-foreground' :
                    'bg-amber-100 text-amber-700'
                  }`}>{visualizando.status.charAt(0).toUpperCase() + visualizando.status.slice(1)}</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Vencimento</p>
                  <p className="text-sm text-foreground">{new Date(visualizando.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Data do Pagamento</p>
                  <p className="text-sm text-foreground">{visualizando.data_pagamento ? new Date(visualizando.data_pagamento + 'T12:00:00').toLocaleDateString('pt-BR') : <span className="italic text-muted-foreground/60">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Forma de Pagamento</p>
                  <p className="text-sm text-foreground">{formaLabel(visualizando) ?? <span className="italic text-muted-foreground/60">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Registrado em</p>
                  <p className="text-sm text-foreground">{new Date(visualizando.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              {/* Confirmado por — exibido apenas quando status = recebido e campo preenchido */}
              {visualizando.status === 'recebido' && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Confirmado por</p>
                  <p className="text-sm text-foreground">
                    {visualizando.confirmado_por
                      ? <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                            {visualizando.confirmado_por.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                          {visualizando.confirmado_por}
                        </span>
                      : <span className="italic text-muted-foreground/60">Não registrado</span>}
                  </p>
                </div>
              )}
              {(() => {
                // Remove a referência interna "agendamento:{uuid}" usada como chave de idempotência
                const obsLimpa = (visualizando.observacoes ?? "")
                  .replace(/agendamento:[a-f0-9-]+/gi, "")
                  .trim();
                return obsLimpa ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm text-foreground/80 bg-muted/50 rounded-lg p-3">{obsLimpa}</p>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border/60">
              <Button variant="outline" onClick={() => { setVisualizando(null); setProfissionalModal(null); }}>Fechar</Button>
              <Button onClick={() => { setEditarDialogId(visualizando); setVisualizando(null); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Pencil className="w-4 h-4" /> Editar
              </Button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Dialog de Confirmação de Edição */}
      <ConfirmActionDialog
        open={!!editarDialogId}
        onOpenChange={(open) => { if (!open) setEditarDialogId(null); }}
        onConfirm={() => { if (editarDialogId) { setEditando(editarDialogId); setModalAberto(true); setEditarDialogId(null); } }}
        titulo="Editar Recebimento"
        mensagem={`Deseja editar o recebimento de "${editarDialogId?.descricao ?? ""}" no valor de ${editarDialogId ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(editarDialogId.valor)) : ""}?`}
        labelConfirmar="Editar"
        variante="warning"
      />

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDeleteDialog
        open={!!excluirDialogId}
        onOpenChange={(open) => { if (!open) setExcluirDialogId(null); }}
        onConfirm={() => { if (excluirDialogId) excluir(excluirDialogId); }}
        titulo="Excluir Recebimento"
        mensagem="Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita."
        loading={!!excluindo}
      />
    </div>
  );
}
