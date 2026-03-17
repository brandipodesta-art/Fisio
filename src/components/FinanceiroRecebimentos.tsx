"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, RefreshCw, Search, X, CheckCircle2, Clock,
  AlertCircle, XCircle, Pencil, Trash2, Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Recebimento, RecebimentoInput, FormaPagamento } from "@/lib/types/financeiro";
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
  recebido:  { label: "Recebido",  cor: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  pendente:  { label: "Pendente",  cor: "bg-blue-100 text-blue-700",       icon: Clock },
  atrasado:  { label: "Atrasado",  cor: "bg-orange-100 text-orange-700",   icon: AlertCircle },
  cancelado: { label: "Cancelado", cor: "bg-slate-100 text-slate-500",     icon: XCircle },
};

// ─── Formulário Modal ─────────────────────────────────────────────────────────

interface FormModalProps {
  inicial?: Recebimento | null;
  onSalvar: (dados: RecebimentoInput) => Promise<void>;
  onFechar: () => void;
  salvando: boolean;
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="Digite o nome do paciente..."
          className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {query && (
          <button
            type="button"
            onClick={limpar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {buscando && (
        <p className="text-xs text-slate-400 mt-1 pl-1">Buscando...</p>
      )}
      {pacienteId && (
        <p className="text-xs text-emerald-600 mt-1 pl-1">✓ Paciente vinculado</p>
      )}
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {sugestoes.map(p => (
            <li
              key={p.id}
              onMouseDown={() => selecionar(p)}
              className="px-4 py-2.5 text-sm text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
            >
              {p.nome_completo}
            </li>
          ))}
        </ul>
      )}
      {aberto && sugestoes.length === 0 && !buscando && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm text-slate-400">
          Nenhum paciente encontrado
        </div>
      )}
    </div>
  );
}

// ─── Formulário Modal ─────────────────────────────────────────────────────────

function FormModal({ inicial, onSalvar, onFechar, salvando }: FormModalProps) {
  const [form, setForm] = useState<RecebimentoInput>({
    paciente_id:      inicial?.paciente_id      ?? null,
    paciente_nome:    inicial?.paciente_nome    ?? "",
    descricao:        inicial?.descricao        ?? "",
    valor:            inicial?.valor            ?? 0,
    data_vencimento:  inicial?.data_vencimento  ?? "",
    data_pagamento:   inicial?.data_pagamento   ?? null,
    status:           inicial?.status           ?? "pendente",
    forma_pagamento:  inicial?.forma_pagamento  ?? null,
    observacoes:      inicial?.observacoes      ?? null,
  });

  function set(campo: keyof RecebimentoInput, valor: unknown) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSalvar(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {inicial ? "Editar Recebimento" : "Novo Recebimento"}
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Paciente — Autocomplete */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome do Paciente</label>
            <AutocompletePaciente
              value={form.paciente_nome ?? ""}
              pacienteId={form.paciente_id}
              onChange={(nome, id) => setForm(f => ({ ...f, paciente_nome: nome, paciente_id: id }))}
            />
          </div>
          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição *</label>
            <Input
              required
              value={form.descricao}
              onChange={e => set("descricao", e.target.value)}
              placeholder="Ex: Sessão de fisioterapia — março"
            />
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
                  <SelectItem value="recebido">Recebido</SelectItem>
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
              {salvando ? "Salvando..." : inicial ? "Salvar Alterações" : "Registrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FinanceiroRecebimentos() {
  const [itens, setItens]         = useState<Recebimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]           = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando]   = useState<Recebimento | null>(null);
  const [salvando, setSalvando]   = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);

  // Filtros
  const [filtroStatus,   setFiltroStatus]   = useState("todos");
  const [filtroPaciente, setFiltroPaciente] = useState("");

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

  async function salvar(dados: RecebimentoInput) {
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
    if (!confirm("Confirmar exclusão deste recebimento?")) return;
    setExcluindo(id);
    await fetch(`/api/recebimentos/${id}`, { method: "DELETE" });
    setExcluindo(null);
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

  const totalFiltrado = itens.reduce((s, r) => s + Number(r.valor), 0);

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Recebimentos</h2>
          <p className="text-sm text-slate-500">Pagamentos recebidos e a receber dos clientes</p>
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
            <Plus className="w-4 h-4" /> Novo Recebimento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4 border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
      </Card>

      {/* Total */}
      {!carregando && itens.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-600 px-1">
          <span>{itens.length} registro(s)</span>
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
          <p className="text-slate-400 text-sm">Nenhum recebimento encontrado.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {itens.map(item => {
            const cfg = STATUS_CONFIG[item.status];
            const Icon = cfg.icon;
            return (
              <Card key={item.id} className="p-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cor}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {item.paciente_nome && (
                        <span className="text-xs text-slate-500">{item.paciente_nome}</span>
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
                          onClick={() => marcarRecebido(item)}
                          title="Marcar como recebido"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
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
    </div>
  );
}
