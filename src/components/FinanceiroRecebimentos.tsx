"use client";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, RefreshCw, Search, X, CheckCircle2, Clock,
  AlertCircle, XCircle, Pencil, Trash2, Check, Eye, Repeat2, CalendarDays, MoreHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const sb = useMemo(() => createClient(), []);
  useEffect(() => {
    sb.from("formas_pagamento")
      .select("id, nome, tipo")
      .in("tipo", ["recebimento", "ambos"])
      .order("nome")
      .then(({ data }) => { if (data) setFormas(data as FormaPagamentoItem[]); });
  }, [sb]);
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
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function buscar() {
      try {
        const { data } = await supabase
          .from("procedimentos")
          .select("id, nome, valor_padrao")
          .eq("ativo", true)
          .order("nome");
        if (data) setProcedimentos(data.map((p: { id: string; nome: string; valor_padrao: number | null }) => ({
          id: p.id,
          nome: p.nome,
          valor_padrao: p.valor_padrao ?? null,
        })));
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, [supabase]);

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

// ─── Autocomplete de Pacientes ───────────────────────────────────────────────

interface PacienteSugestao { id: string; nome_completo: string; }

function AutocompletePaciente({
  value, pacienteId, onChange
}: {
  value: string;
  pacienteId: string | null;
  onChange: (nome: string, id: string | null) => void;
}) {
  const [query, setQuery]           = useState(value);
  const [sugestoes, setSugestoes]   = useState<PacienteSugestao[]>([]);
  const [aberto, setAberto]         = useState(false);
  const [buscando, setBuscando]     = useState(false);
  const timer                       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef                  = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Busca com debounce
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v, null); // reseta o id ao digitar
    if (timer.current) clearTimeout(timer.current);
    if (v.length < 2) { setSugestoes([]); setAberto(false); return; }
    timer.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/pacientes?nome=${encodeURIComponent(v)}&limit=8`);
        const data = await res.json();
        setSugestoes(data.map((p: { id: string; nome_completo: string }) => ({ id: p.id, nome: p.nome_completo })).map((p: { id: string; nome: string }) => ({ id: p.id, nome_completo: p.nome })));
        setAberto(true);
      } finally {
        setBuscando(false);
      }
    }, 300);
  }

  function selecionar(p: PacienteSugestao) {
    setQuery(p.nome_completo);
    onChange(p.nome_completo, p.id);
    setSugestoes([]);
    setAberto(false);
  }

  function limpar() {
    setQuery("");
    onChange("", null);
    setSugestoes([]);
    setAberto(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="Digite o nome do paciente..."
          className="w-full pl-9 pr-8 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={limpar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {buscando && (
        <p className="text-xs text-muted-foreground/60 mt-1 pl-1">Buscando...</p>
      )}
      {pacienteId && (
        <p className="text-xs text-primary mt-1 pl-1">✓ Paciente vinculado</p>
      )}
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {sugestoes.map(p => (
            <li
              key={p.id}
              onMouseDown={() => selecionar(p)}
              className="px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-primary cursor-pointer"
            >
              {p.nome_completo}
            </li>
          ))}
        </ul>
      )}
      {aberto && sugestoes.length === 0 && !buscando && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground/60">
          Nenhum paciente encontrado
        </div>
      )}
    </div>
  );
}

// ─── Formulário Modal ─────────────────────────────────────────────────────────

function FormModal({ inicial, onSalvar, onFechar, salvando, formas }: FormModalProps) {
  const { procedimentos, carregando: carregandoProc } = useProcedimentos();

  // Extrai o procedimento base removendo numeração de parcelas: "Acupuntura (2/4)" → "Acupuntura"
  const procedimentoBase = inicial?.descricao
    ? inicial.descricao.replace(/\s*\(\d+\/\d+\)$/, "").trim()
    : "";

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
    observacoes:         inicial?.observacoes         ?? null,
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
    await onSalvar(form, repete ? { meses } : undefined);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" style={{position:'fixed',top:0,left:0,right:0,bottom:0}}>
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
            <label className="block text-xs font-medium text-muted-foreground mb-1">Nome do Paciente</label>
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
              <Select value={form.status} onValueChange={v => set("status", v)}>
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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Forma de Pagamento</label>
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
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FinanceiroRecebimentos() {
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
  const [salvando, setSalvando]   = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [excluirDialogId, setExcluirDialogId] = useState<string | null>(null);

  // Filtros
  const [filtroStatus,        setFiltroStatus]        = useState("todos");
  const [filtroPaciente,      setFiltroPaciente]      = useState("");
  const [filtroProcedimento,  setFiltroProcedimento]  = useState("todos");
  const [filtroVencDe,        setFiltroVencDe]        = useState("");
  const [filtroVencAte,       setFiltroVencAte]       = useState("");
  const [filtroPagDe,         setFiltroPagDe]         = useState("");
  const [filtroPagAte,        setFiltroPagAte]        = useState("");

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
      body: JSON.stringify({ ...item, status: "recebido", data_pagamento: new Date().toISOString().slice(0, 10) }),
    });
    buscar();
  }

  // Filtragem local por procedimento, vencimento e data de pagamento
  const itensFiltrados = itens.filter(r => {
    if (filtroProcedimento !== "todos") {
      // Compara ignorando numeração de parcelas: "Acupuntura (2/4)" → base "Acupuntura"
      const base = r.descricao.replace(/\s*\(\d+\/\d+\)$/, "").trim();
      if (base !== filtroProcedimento && r.descricao !== filtroProcedimento) return false;
    }
    if (filtroVencDe  && r.data_vencimento < filtroVencDe)  return false;
    if (filtroVencAte && r.data_vencimento > filtroVencAte) return false;
    if (filtroPagDe  && (!r.data_pagamento || r.data_pagamento < filtroPagDe))  return false;
    if (filtroPagAte && (!r.data_pagamento || r.data_pagamento > filtroPagAte)) return false;
    return true;
  });

  const totalFiltrado = itensFiltrados.reduce((s, r) => s + Number(r.valor), 0);

  // Verifica se algum filtro extra está ativo
  const filtrosExtrasAtivos = filtroProcedimento !== "todos" || filtroVencDe || filtroVencAte || filtroPagDe || filtroPagAte;

  function limparFiltrosExtras() {
    setFiltroProcedimento("todos");
    setFiltroVencDe("");
    setFiltroVencAte("");
    setFiltroPagDe("");
    setFiltroPagAte("");
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

        {/* Linha 2: procedimento */}
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

          {/* Vencimento de/até */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Vencimento — de / até</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={filtroVencDe}
                onChange={e => setFiltroVencDe(e.target.value)}
                className="text-xs"
                title="Vencimento a partir de"
              />
              <span className="text-muted-foreground/60 text-xs shrink-0">até</span>
              <Input
                type="date"
                value={filtroVencAte}
                onChange={e => setFiltroVencAte(e.target.value)}
                className="text-xs"
                title="Vencimento até"
              />
            </div>
          </div>

          {/* Data de Pagamento de/até */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Data Pagamento — de / até</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={filtroPagDe}
                onChange={e => setFiltroPagDe(e.target.value)}
                className="text-xs"
                title="Pagamento a partir de"
              />
              <span className="text-muted-foreground/60 text-xs shrink-0">até</span>
              <Input
                type="date"
                value={filtroPagAte}
                onChange={e => setFiltroPagAte(e.target.value)}
                className="text-xs"
                title="Pagamento até"
              />
            </div>
          </div>
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
                          onClick={() => setVisualizando(item)}
                          className="cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { setEditando(item); setModalAberto(true); }}
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
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" style={{position:'fixed',top:0,left:0,right:0,bottom:0}}>
          <div className="bg-popover rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" /> Detalhes do Recebimento
              </h2>
              <button onClick={() => setVisualizando(null)} className="text-muted-foreground/60 hover:text-muted-foreground">
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
              {visualizando.observacoes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm text-foreground/80 bg-muted/50 rounded-lg p-3">{visualizando.observacoes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border/60">
              <Button variant="outline" onClick={() => setVisualizando(null)}>Fechar</Button>
              <Button onClick={() => { setEditando(visualizando); setModalAberto(true); setVisualizando(null); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Pencil className="w-4 h-4" /> Editar
              </Button>
            </div>
          </div>
        </div>
      )}

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
