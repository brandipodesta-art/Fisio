"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus, RefreshCw, Search, X, CheckCircle2, Clock,
  AlertCircle, XCircle, Pencil, Trash2, Check, Eye, TriangleAlert, Repeat2, CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Pagamento, PagamentoInput, FormaPagamento } from "@/lib/types/financeiro";
import { FORMA_PAGAMENTO_LABEL, CATEGORIA_PAGAMENTO } from "@/lib/types/financeiro";

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
  pago:      { label: "Pago",      cor: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  pendente:  { label: "Pendente",  cor: "bg-blue-100 text-blue-700",       icon: Clock },
  atrasado:  { label: "Atrasado",  cor: "bg-orange-100 text-orange-700",   icon: AlertCircle },
  cancelado: { label: "Cancelado", cor: "bg-slate-100 text-slate-500",     icon: XCircle },
};

// ─── Formulário Modal ─────────────────────────────────────────────────────────

interface FormModalProps {
  inicial?: Pagamento | null;
  onSalvar: (dados: PagamentoInput, recorrencia?: { meses: number }) => Promise<void>;
  onFechar: () => void;
  salvando: boolean;
}

function FormModal({ inicial, onSalvar, onFechar, salvando }: FormModalProps) {
  const [form, setForm] = useState<PagamentoInput>({
    descricao:       inicial?.descricao       ?? "",
    categoria:       inicial?.categoria       ?? "",
    valor:           inicial?.valor           ?? 0,
    data_vencimento: inicial?.data_vencimento ?? "",
    data_pagamento:  inicial?.data_pagamento  ?? null,
    status:          inicial?.status          ?? "pendente",
    forma_pagamento: inicial?.forma_pagamento ?? null,
    fornecedor:      inicial?.fornecedor      ?? null,
    observacoes:     inicial?.observacoes     ?? null,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {inicial ? "Editar Pagamento" : "Novo Pagamento"}
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição *</label>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoria *</label>
              <Select value={form.categoria} onValueChange={v => set("categoria", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIA_PAGAMENTO.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fornecedor</label>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Vencimento *</label>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Status *</label>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Forma de Pagamento</label>
              <Select
                value={form.forma_pagamento ?? ""}
                onValueChange={v => set("forma_pagamento", v || null)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_PAGAMENTO_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Recorrência mensal — só na criação */}
          {!inicial && (
            <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={repete}
                    onChange={e => setRepete(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <Repeat2 className="w-4 h-4 text-slate-400" />
                  Repete mensalmente
                </label>
                {repete && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Gerar mais</span>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={meses}
                      onChange={e => setMeses(Math.max(1, Math.min(24, Number(e.target.value))))}
                      className="w-16 border border-slate-200 rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-500">mes(es)</span>
                  </div>
                )}
              </div>
              {repete && datasPreview().length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Datas que serão criadas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {datasPreview().map((d, i) => {
                      const [y, mo, di] = d.split("-");
                      return (
                        <span key={i} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Data do Pagamento</label>
            <Input
              type="date"
              value={form.data_pagamento ?? ""}
              onChange={e => set("data_pagamento", e.target.value || null)}
            />
          </div>
          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
              value={form.observacoes ?? ""}
              onChange={e => set("observacoes", e.target.value || null)}
              placeholder="Observações adicionais..."
            />
          </div>
          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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

export default function FinanceiroPagamentos() {
  const [itens, setItens]             = useState<Pagamento[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [erro, setErro]               = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando]       = useState<Pagamento | null>(null);
  const [visualizando, setVisualizando] = useState<Pagamento | null>(null);
  const [salvando, setSalvando]       = useState(false);
  const [excluindo, setExcluindo]     = useState<string | null>(null);

  // Controle de duplicidade
  const [duplicatas, setDuplicatas]   = useState<Pagamento[]>([]);
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
    if (filtroCategoria !== "todas") params.set("categoria", filtroCategoria);
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
  }, [filtroStatus, filtroCategoria, filtroBusca, filtroVencDe, filtroVencAte, filtroPagDe, filtroPagAte]);

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

  async function salvar(dados: PagamentoInput, recorrencia?: { meses: number }) {
    // Verificar duplicidade tanto na criação quanto na edição
    if (dados.categoria && dados.data_vencimento) {
      const resAll = await fetch("/api/pagamentos");
      const todos: Pagamento[] = resAll.ok ? await resAll.json() : [];
      const encontrados = todos.filter(
        p =>
          p.categoria === dados.categoria &&
          p.data_vencimento === dados.data_vencimento &&
          p.id !== editando?.id
      );
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
                // Limpar data de pagamento nas parcelas futuras
                data_pagamento: null,
                status: "pendente",
                // Numerar a descrição automaticamente
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
    if (!confirm("Confirmar exclusão deste pagamento?")) return;
    setExcluindo(id);
    await fetch(`/api/pagamentos/${id}`, { method: "DELETE" });
    setExcluindo(null);
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

  // Calcular quais IDs possuem duplicatas na lista completa carregada
  // (agrupa por categoria + data_vencimento e marca os que aparecem mais de uma vez)
  const idsDuplicados = useMemo(() => {
    const grupos = new Map<string, string[]>();
    itens.forEach(p => {
      const chave = `${p.categoria}||${p.data_vencimento}`;
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
          <h2 className="text-xl font-semibold text-slate-900">Pagamentos</h2>
          <p className="text-sm text-slate-500">Contas e despesas da clínica</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={buscar} disabled={carregando}>
            <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => { setEditando(null); setModalAberto(true); }}
          >
            <Plus className="w-4 h-4" /> Novo Pagamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
              {CATEGORIA_PAGAMENTO.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
          {/* Vencimento */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Vencimento</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filtroVencDe}
                onChange={e => setFiltroVencDe(e.target.value)}
                className="text-sm"
                title="De"
              />
              <span className="text-xs text-slate-400 shrink-0">até</span>
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
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                  title="Limpar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Data do Pagamento */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Data do Pagamento</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filtroPagDe}
                onChange={e => setFiltroPagDe(e.target.value)}
                className="text-sm"
                title="De"
              />
              <span className="text-xs text-slate-400 shrink-0">até</span>
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
                  className="shrink-0 text-slate-400 hover:text-slate-600"
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
        <div className="flex items-center justify-between text-sm text-slate-600 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>{itens.length} registro(s)</span>
            {idsDuplicados.size > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <TriangleAlert className="w-3.5 h-3.5" />
                {idsDuplicados.size} registro(s) com possível duplicidade
              </span>
            )}
          </div>
          <span className="font-semibold text-slate-800">Total: {fmt(totalFiltrado)}</span>
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
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </Card>
          ))}
        </div>
      ) : itens.length === 0 ? (
        <Card className="p-10 text-center border-slate-200 shadow-sm">
          <p className="text-slate-400 text-sm">Nenhum pagamento encontrado.</p>
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
                    : "border-slate-200"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cor}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {item.categoria}
                      </span>
                      {item.fornecedor && (
                        <span className="text-xs text-slate-500">{item.fornecedor}</span>
                      )}
                      {idsDuplicados.has(item.id) && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          <TriangleAlert className="w-3 h-3" /> Possível duplicata
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{item.descricao}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>Venc.: {fmtDate(item.data_vencimento)}</span>
                      {item.data_pagamento && <span>Pago: {fmtDate(item.data_pagamento)}</span>}
                      {item.forma_pagamento && (
                        <span>{FORMA_PAGAMENTO_LABEL[item.forma_pagamento as FormaPagamento]}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-bold text-slate-900">{fmt(Number(item.valor))}</span>
                    <div className="flex items-center gap-1">
                      {item.status === "pendente" && (
                        <button
                          onClick={() => marcarPago(item)}
                          title="Marcar como pago"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        title="Visualizar"
                        onClick={() => setVisualizando(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditando(item); setModalAberto(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => excluir(item.id)}
                        disabled={excluindo === item.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
        />
      )}

      {/* Modal de Alerta de Duplicidade */}
      {duplicatas.length > 0 && dadosPendentes && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-amber-100 bg-amber-50 rounded-t-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <TriangleAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Possível Duplicidade</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editando ? "Ao salvar esta edição, outro registro com a mesma categoria e data já existe" : "Já existe um pagamento com a mesma categoria e data"}
                </p>
              </div>
            </div>
            {/* Corpo */}
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600">
                Encontramos <strong>{duplicatas.length}</strong> registro(s) com a categoria
                {" "}<strong className="text-slate-900">&ldquo;{dadosPendentes.categoria}&rdquo;</strong>{" "}
                e vencimento em{" "}
                <strong className="text-slate-900">{fmtDate(dadosPendentes.data_vencimento)}</strong>:
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {duplicatas.map(d => {
                  const cfg = STATUS_CONFIG[d.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{d.descricao}</p>
                        <p className="text-xs text-slate-400">{d.fornecedor ?? "—"} &middot; Venc.: {fmtDate(d.data_vencimento)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{fmt(Number(d.valor))}</span>
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
            <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => { setDuplicatas([]); setDadosPendentes(null); }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                disabled={salvando}
                onClick={() => _persistirSalvar(dadosPendentes)}
              >
                {salvando ? "Salvando..." : "Salvar mesmo assim"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {visualizando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" /> Detalhes do Pagamento
              </h2>
              <button onClick={() => setVisualizando(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-500 mb-1">Descrição</p>
                  <p className="text-sm text-slate-900">{visualizando.descricao}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Categoria</p>
                  <p className="text-sm text-slate-900">{visualizando.categoria}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Valor</p>
                  <p className="text-sm font-semibold text-red-700">{fmt(Number(visualizando.valor))}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Status</p>
                  {(() => {
                    const cfg = STATUS_CONFIG[visualizando.status];
                    const Icon = cfg.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cor}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Fornecedor</p>
                  <p className="text-sm text-slate-900">{visualizando.fornecedor ?? <span className="italic text-slate-400">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Vencimento</p>
                  <p className="text-sm text-slate-900">{fmtDate(visualizando.data_vencimento)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Data do Pagamento</p>
                  <p className="text-sm text-slate-900">{visualizando.data_pagamento ? fmtDate(visualizando.data_pagamento) : <span className="italic text-slate-400">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Forma de Pagamento</p>
                  <p className="text-sm text-slate-900">{visualizando.forma_pagamento ? FORMA_PAGAMENTO_LABEL[visualizando.forma_pagamento as FormaPagamento] : <span className="italic text-slate-400">—</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Registrado em</p>
                  <p className="text-sm text-slate-900">{new Date(visualizando.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              {visualizando.observacoes && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Observações</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{visualizando.observacoes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
              <Button variant="outline" onClick={() => setVisualizando(null)}>Fechar</Button>
              <Button onClick={() => { setEditando(visualizando); setModalAberto(true); setVisualizando(null); }}
                className="bg-slate-800 hover:bg-slate-900 text-white gap-2">
                <Pencil className="w-4 h-4" /> Editar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
