"use client";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import ModalPortal from "@/components/ui/ModalPortal";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus, RefreshCw, Search, X, CheckCircle2, Clock,
  AlertCircle, XCircle, Pencil, Trash2, Check, Eye, TriangleAlert, Repeat2, CalendarDays, MoreHorizontal,
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
import type {
  Pagamento, PagamentoInput, FormaPagamento,
  FormaPagamentoItem, CategoriaPagamentoItem,
} from "@/lib/types/financeiro";
import { createClient } from "@/lib/supabase/client";
import { FORMA_PAGAMENTO_LABEL } from "@/lib/types/financeiro";

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
  pago:      { label: "Pago",      cor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  pendente:  { label: "Pendente",  cor: "bg-blue-100 text-blue-700",       icon: Clock },
  atrasado:  { label: "Atrasado",  cor: "bg-orange-100 text-orange-700",   icon: AlertCircle },
  cancelado: { label: "Cancelado", cor: "bg-muted text-muted-foreground",     icon: XCircle },
};

// ─── Hook para carregar formas de pagamento e categorias do banco ─────────────

function useLookups() {
  const [formas, setFormas]       = useState<FormaPagamentoItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPagamentoItem[]>([]);
  const sb = useMemo(() => createClient(), []);

  useEffect(() => {
    sb.from("formas_pagamento")
      .select("id, nome, tipo")
      .in("tipo", ["pagamento", "ambos"])
      .order("nome")
      .then(({ data }) => { if (data) setFormas(data as FormaPagamentoItem[]); });

    sb.from("categorias_pagamento")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => { if (data) setCategorias(data as CategoriaPagamentoItem[]); });
  }, [sb]);

  return { formas, categorias };
}

// ─── Formulário Modal ─────────────────────────────────────────────────────────

interface FormModalProps {
  inicial?: Pagamento | null;
  onSalvar: (dados: PagamentoInput, recorrencia?: { meses: number }) => Promise<void>;
  onFechar: () => void;
  salvando: boolean;
  formas: FormaPagamentoItem[];
  categorias: CategoriaPagamentoItem[];
}

function FormModal({ inicial, onSalvar, onFechar, salvando, formas, categorias }: FormModalProps) {
  const [form, setForm] = useState<PagamentoInput>({
    descricao:        inicial?.descricao        ?? "",
    categoria:        inicial?.categoria        ?? null,
    categoria_id:     inicial?.categoria_id     ?? null,
    valor:            inicial?.valor            ?? 0,
    data_vencimento:  inicial?.data_vencimento  ?? "",
    data_pagamento:   inicial?.data_pagamento   ?? null,
    status:           inicial?.status           ?? "pendente",
    forma_pagamento:  inicial?.forma_pagamento  ?? null,
    forma_pagamento_id: inicial?.forma_pagamento_id ?? null,
    fornecedor:       inicial?.fornecedor       ?? null,
    observacoes:      inicial?.observacoes      ?? null,
  });
  const [repete, setRepete]   = useState(false);
  const [meses, setMeses]     = useState(3);

  function set(campo: keyof PagamentoInput, valor: unknown) {
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

  // Rótulo da categoria para exibição no modal de visualização
  const categoriaLabel = form.categoria_id
    ? (categorias.find(c => c.id === form.categoria_id)?.nome ?? form.categoria ?? "—")
    : (form.categoria ?? "—");

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-popover rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {inicial ? "Editar Pagamento" : "Novo Pagamento"}
          </h2>
          <button onClick={onFechar} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição *</label>
            <Input
              required
              value={form.descricao}
              onChange={e => set("descricao", e.target.value)}
              placeholder="Ex: Aluguel da clínica — março"
            />
          </div>
          {/* Categoria + Fornecedor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Categoria *</label>
              <Select
                value={form.categoria_id ?? ""}
                onValueChange={v => {
                  const cat = categorias.find(c => c.id === v);
                  set("categoria_id", v || null);
                  set("categoria", cat?.nome ?? null);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categorias.length === 0 ? (
                    <SelectItem value="__loading" disabled>Carregando...</SelectItem>
                  ) : (
                    categorias.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Fornecedor</label>
              <Input
                value={form.fornecedor ?? ""}
                onChange={e => set("fornecedor", e.target.value || null)}
                placeholder="Nome do fornecedor"
              />
            </div>
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
                  <SelectItem value="pago">Pago</SelectItem>
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
                <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={repete}
                    onChange={e => setRepete(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <Repeat2 className="w-4 h-4 text-muted-foreground/60" />
                  Repete mensalmente
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
          {/* Exibição de debug da categoria selecionada (apenas dev) */}
          <p className="hidden">{categoriaLabel}</p>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
// ─── Utilitário: nome da forma de pagamento → slug legadoo ─────────────────────
// Mantém compatibilidade com o campo TEXT legado ao gravar novos registros

function slugFromNome(nome: string): FormaPagamento | null {
  const map: Record<string, FormaPagamento> = {
    "Dinheiro":              "dinheiro",
    "PIX":                   "pix",
    "Cartão de Crédito":     "cartao_credito",
    "Cartão de Débito":      "cartao_debito",
    "Transferência":         "transferencia",
    "Boleto":                "boleto",
    "Cheque":                "cheque",
  };
  return map[nome] ?? null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FinanceiroPagamentos() {
  const { formas, categorias } = useLookups();

  const [itens, setItens]             = useState<Pagamento[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [erro, setErro]               = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando]       = useState<Pagamento | null>(null);
  const [visualizando, setVisualizando] = useState<Pagamento | null>(null);
  const [salvando, setSalvando]       = useState(false);
  const [excluindo, setExcluindo]     = useState<string | null>(null);
  const [excluirDialogId, setExcluirDialogId] = useState<string | null>(null);

  // Controle de duplicidade
  const [duplicatas, setDuplicatas]         = useState<Pagamento[]>([]);
  const [dadosPendentes, setDadosPendentes] = useState<PagamentoInput | null>(null);

  // Filtros
  const [filtroStatus,    setFiltroStatus]    = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroBusca,     setFiltroBusca]     = useState("");
  const [filtroVencDe,    setFiltroVencDe]    = useState("");
  const [filtroVencAte,   setFiltroVencAte]   = useState("");
  const [filtroPagDe,     setFiltroPagDe]     = useState("");
  const [filtroPagAte,    setFiltroPagAte]    = useState("");

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const params = new URLSearchParams();
    if (filtroStatus !== "todos") params.set("status", filtroStatus);
    // Filtro de categoria: passa o nome (campo legado) para a API
    if (filtroCategoria !== "todas") {
      const cat = categorias.find(c => c.id === filtroCategoria);
      if (cat) params.set("categoria", cat.nome);
    }
    try {
      const res = await fetch(`/api/pagamentos?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar pagamentos");
      const data: Pagamento[] = await res.json();
      // Filtros locais
      const filtrado = data.filter(p => {
        if (filtroBusca) {
          const q = filtroBusca.toLowerCase();
          if (!p.descricao.toLowerCase().includes(q) && !(p.fornecedor ?? "").toLowerCase().includes(q)) return false;
        }
        if (filtroVencDe  && p.data_vencimento < filtroVencDe)  return false;
        if (filtroVencAte && p.data_vencimento > filtroVencAte) return false;
        if (filtroPagDe  && (!p.data_pagamento || p.data_pagamento < filtroPagDe))  return false;
        if (filtroPagAte && (!p.data_pagamento || p.data_pagamento > filtroPagAte)) return false;
        return true;
      });
      setItens(filtrado);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro");
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroCategoria, filtroBusca, filtroVencDe, filtroVencAte, filtroPagDe, filtroPagAte, categorias]);

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

  // Rótulo da categoria para exibição na lista
  function categoriaLabel(item: Pagamento): string {
    if (item.categoria_id) {
      return categorias.find(c => c.id === item.categoria_id)?.nome ?? item.categoria ?? "—";
    }
    return item.categoria ?? "—";
  }

  // Rótulo da forma de pagamento para exibição na lista
  function formaLabel(item: Pagamento): string | null {
    if (item.forma_pagamento_id) {
      return formas.find(f => f.id === item.forma_pagamento_id)?.nome ?? null;
    }
    if (item.forma_pagamento) {
      return FORMA_PAGAMENTO_LABEL[item.forma_pagamento as FormaPagamento] ?? null;
    }
    return null;
  }

  async function salvar(dados: PagamentoInput, recorrencia?: { meses: number }) {
    // Verificar duplicidade: usa categoria_id ou nome legado
    const catNome = dados.categoria_id
      ? (categorias.find(c => c.id === dados.categoria_id)?.nome ?? dados.categoria)
      : dados.categoria;

    if (catNome && dados.data_vencimento) {
      const resAll = await fetch("/api/pagamentos");
      const todos: Pagamento[] = resAll.ok ? await resAll.json() : [];
      const encontrados = todos.filter(p => {
        const pCat = p.categoria_id
          ? (categorias.find(c => c.id === p.categoria_id)?.nome ?? p.categoria)
          : p.categoria;
        return pCat === catNome &&
          p.data_vencimento === dados.data_vencimento &&
          p.id !== editando?.id;
      });
      if (encontrados.length > 0) {
        setDuplicatas(encontrados);
        setDadosPendentes(dados);
        return;
      }
    }
    await _persistirSalvar(dados, recorrencia);
  }

  async function _persistirSalvar(dados: PagamentoInput, recorrencia?: { meses: number }) {
    setSalvando(true);
    try {
      const url    = editando ? `/api/pagamentos/${editando.id}` : "/api/pagamentos";
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
            fetch("/api/pagamentos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...dados,
                data_vencimento: data,
                data_pagamento: null,
                status: "pendente",
                descricao: `${dados.descricao} (${idx + 2}/${recorrencia.meses + 1})`,
              }),
            })
          )
        );
      }

      setModalAberto(false);
      setEditando(null);
      setDuplicatas([]);
      setDadosPendentes(null);
      buscar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    setExcluindo(id);
    await fetch(`/api/pagamentos/${id}`, { method: "DELETE" });
    setExcluindo(null);
    setExcluirDialogId(null);
    buscar();
  }

  async function marcarPago(item: Pagamento) {
    await fetch(`/api/pagamentos/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status: "pago", data_pagamento: new Date().toISOString().slice(0, 10) }),
    });
    buscar();
  }

  const totalFiltrado = itens.reduce((s, p) => s + Number(p.valor), 0);

  // Calcular quais IDs possuem duplicatas na lista
  const idsDuplicados = useMemo(() => {
    const grupos = new Map<string, string[]>();
    itens.forEach(p => {
      const catKey = p.categoria_id ?? p.categoria ?? "";
      const chave = `${catKey}||${p.data_vencimento}`;
      const grupo = grupos.get(chave) ?? [];
      grupo.push(p.id);
      grupos.set(chave, grupo);
    });
    const ids = new Set<string>();
    grupos.forEach(grupo => {
      if (grupo.length > 1) grupo.forEach(id => ids.add(id));
    });
    return ids;
  }, [itens]);

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Pagamentos</h2>
          <p className="text-sm text-muted-foreground">Contas e despesas da clínica</p>
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
            <Plus className="w-4 h-4" /> Novo Pagamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 border-border shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              className="pl-9"
              placeholder="Buscar por descrição ou fornecedor..."
              value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)}
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/60">
          {/* Vencimento */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Vencimento</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filtroVencDe}
                onChange={e => setFiltroVencDe(e.target.value)}
                className="text-sm"
                title="De"
              />
              <span className="text-xs text-muted-foreground/60 shrink-0">até</span>
              <Input
                type="date"
                value={filtroVencAte}
                onChange={e => setFiltroVencAte(e.target.value)}
                className="text-sm"
                title="Até"
              />
              {(filtroVencDe || filtroVencAte) && (
                <button
                  onClick={() => { setFiltroVencDe(""); setFiltroVencAte(""); }}
                  className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground"
                  title="Limpar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Data do Pagamento */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Data do Pagamento</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filtroPagDe}
                onChange={e => setFiltroPagDe(e.target.value)}
                className="text-sm"
                title="De"
              />
              <span className="text-xs text-muted-foreground/60 shrink-0">até</span>
              <Input
                type="date"
                value={filtroPagAte}
                onChange={e => setFiltroPagAte(e.target.value)}
                className="text-sm"
                title="Até"
              />
              {(filtroPagDe || filtroPagAte) && (
                <button
                  onClick={() => { setFiltroPagDe(""); setFiltroPagAte(""); }}
                  className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground"
                  title="Limpar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Total + aviso de duplicatas */}
      {!carregando && itens.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>{itens.length} registro(s)</span>
            {idsDuplicados.size > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <TriangleAlert className="w-3.5 h-3.5" />
                {idsDuplicados.size} registro(s) com possível duplicidade
              </span>
            )}
          </div>
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
      ) : itens.length === 0 ? (
        <Card className="p-10 text-center border-border shadow-sm">
          <p className="text-muted-foreground/60 text-sm">Nenhum pagamento encontrado.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {itens.map(item => {
            const cfg = STATUS_CONFIG[item.status];
            const Icon = cfg.icon;
            return (
              <Card key={item.id} className={`p-4 shadow-sm hover:shadow-md transition-shadow ${
                  idsDuplicados.has(item.id)
                    ? "border-amber-300 bg-amber-50/40"
                    : "border-border"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cor}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
                        {categoriaLabel(item)}
                      </span>
                      {item.fornecedor && (
                        <span className="text-xs text-muted-foreground">{item.fornecedor}</span>
                      )}
                      {idsDuplicados.has(item.id) && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          <TriangleAlert className="w-3 h-3" /> Possível duplicata
                        </span>
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
                              onClick={() => marcarPago(item)}
                              className="text-primary cursor-pointer"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Marcar Pago
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
          categorias={categorias}
        />
      )}

      {/* Modal de Alerta de Duplicidade */}
      {duplicatas.length > 0 && dadosPendentes && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-popover rounded-xl shadow-2xl w-full max-w-md border border-border">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-amber-100 bg-amber-50 rounded-t-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <TriangleAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Possível Duplicidade</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editando ? "Ao salvar esta edição, outro registro com a mesma categoria e data já existe" : "Já existe um pagamento com a mesma categoria e data"}
                </p>
              </div>
            </div>
            {/* Corpo */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Encontramos <strong>{duplicatas.length}</strong> registro(s) com a categoria
                {" "}<strong className="text-foreground">&ldquo;{
                  dadosPendentes.categoria_id
                    ? (categorias.find(c => c.id === dadosPendentes.categoria_id)?.nome ?? dadosPendentes.categoria)
                    : dadosPendentes.categoria
                }&rdquo;</strong>{" "}
                e vencimento em{" "}
                <strong className="text-foreground">{fmtDate(dadosPendentes.data_vencimento)}</strong>:
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {duplicatas.map(d => {
                  const cfg = STATUS_CONFIG[d.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={d.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 border border-border/60">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.descricao}</p>
                        <p className="text-xs text-muted-foreground/60">{d.fornecedor ?? "—"} &middot; Venc.: {fmtDate(d.data_vencimento)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                        <span className="text-sm font-semibold text-foreground/80">{fmt(Number(d.valor))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                {editando
                  ? "Deseja salvar as alterações mesmo assim ou voltar para corrigir?"
                  : "Deseja salvar mesmo assim ou cancelar o registro?"}
              </p>
            </div>
            {/* Rodapé */}
            <div className="flex justify-end gap-3 p-5 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => { setDuplicatas([]); setDadosPendentes(null); }}
              >
                {editando ? "Voltar e corrigir" : "Cancelar"}
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => { if (dadosPendentes) _persistirSalvar(dadosPendentes); }}
              >
                Salvar mesmo assim
              </Button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
      {/* Modal de Visualização */}
      {visualizando && (
        <ModalPortal>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-popover rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" /> Detalhes do Pagamento
              </h2>
              <button onClick={() => setVisualizando(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm text-foreground">{visualizando.descricao}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Categoria</p>
                  <p className="text-sm text-foreground">{categoriaLabel(visualizando)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Valor</p>
                  <p className="text-sm font-semibold text-red-700">{fmt(Number(visualizando.valor))}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[visualizando.status].cor}`}>
                    {STATUS_CONFIG[visualizando.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Vencimento</p>
                  <p className="text-sm text-foreground">{fmtDate(visualizando.data_vencimento)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Data do Pagamento</p>
                  <p className="text-sm text-foreground">{visualizando.data_pagamento ? fmtDate(visualizando.data_pagamento) : <span className="italic text-muted-foreground/60">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Forma de Pagamento</p>
                  <p className="text-sm text-foreground">{formaLabel(visualizando) ?? <span className="italic text-muted-foreground/60">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Fornecedor</p>
                  <p className="text-sm text-foreground">{visualizando.fornecedor ?? <span className="italic text-muted-foreground/60">—</span>}</p>
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
              <Button
                onClick={() => { setEditando(visualizando); setModalAberto(true); setVisualizando(null); }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Pencil className="w-4 h-4" /> Editar
              </Button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDeleteDialog
        open={!!excluirDialogId}
        onOpenChange={(open) => { if (!open) setExcluirDialogId(null); }}
        onConfirm={() => { if (excluirDialogId) excluir(excluirDialogId); }}
        titulo="Excluir Pagamento"
        mensagem="Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita."
        loading={!!excluindo}
      />
    </div>
  );
}
