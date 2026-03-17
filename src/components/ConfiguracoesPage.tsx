"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Settings, ChevronDown, ChevronRight, Plus, Pencil, Trash2,
  Check, X, Stethoscope, DollarSign, CreditCard, Tag, Users, Percent,
  AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Procedimento {
  id: string;
  nome: string;
  valor_padrao: number | null;
  ativo: boolean;
}
interface FormaPagamentoConfig {
  id: string;
  nome: string;
  tipo: "recebimento" | "pagamento" | "ambos";
  ativo: boolean;
}
interface CategoriaPagamentoConfig {
  id: string;
  nome: string;
  ativo: boolean;
}
interface Profissional {
  id: string;
  name: string;
  short_name?: string;
  color?: string;
  bg_color?: string;
  border_color?: string;
  text_color?: string;
}
interface ComissaoProfissional {
  id: string;
  profissional_id: string;
  procedimento_id: string;
  percentual: number;
  profissional_nome?: string;
  procedimento_nome?: string;
}

// ─── Hook genérico de CRUD ────────────────────────────────────────────────────
function useCrud<T extends { id: string }>(tabela: string, select = "*", orderBy = "nome") {
  const supabase = createClient();
  const [itens, setItens] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    const { data, error } = await supabase.from(tabela).select(select).order(orderBy);
    if (error) setErro(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else setItens((data ?? []) as unknown as T[]);
    setCarregando(false);
  }, [tabela, select, orderBy]);

  useEffect(() => { carregar(); }, [carregar]);

  const inserir = async (dados: Omit<T, "id">) => {
    const { error } = await supabase.from(tabela).insert(dados as Record<string, unknown>);
    if (error) throw new Error(error.message);
    await carregar();
  };

  const atualizar = async (id: string, dados: Partial<T>) => {
    const { error } = await supabase.from(tabela).update(dados as Record<string, unknown>).eq("id", id);
    if (error) throw new Error(error.message);
    await carregar();
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from(tabela).delete().eq("id", id);
    if (error) throw new Error(error.message);
    await carregar();
  };

  return { itens, carregando, erro, carregar, inserir, atualizar, excluir };
}

// ─── Componente de Seção Expansível ──────────────────────────────────────────
function Secao({ titulo, icone: Icone, cor, children }: {
  titulo: string;
  icone: React.ElementType;
  cor: string;
  children: React.ReactNode;
}) {
  const [aberta, setAberta] = useState(true);
  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm">
      <button
        onClick={() => setAberta(v => !v)}
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${cor}`}>
            <Icone className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-semibold text-slate-900">{titulo}</span>
        </div>
        {aberta ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>
      {aberta && <div className="border-t border-slate-100">{children}</div>}
    </Card>
  );
}

// ─── Linha de Item com edição inline ─────────────────────────────────────────
function ItemLinha({
  label,
  sublabel,
  onEditar,
  onExcluir,
  inativo,
  mensagemExclusao,
}: {
  label: string;
  sublabel?: string;
  onEditar: () => void;
  onExcluir: () => void;
  inativo?: boolean;
  mensagemExclusao?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const msgConfirm = mensagemExclusao ?? "Confirmar exclusão?";
  return (
    <div className={`flex items-center justify-between px-5 py-3 border-b border-slate-100 last:border-0 group ${inativo ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {inativo && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inativo</span>}
      </div>
      <div className="flex items-center gap-3">
        {sublabel && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            {sublabel}
          </span>
        )}
        {confirmando ? (
          <>
            <span className="text-xs text-red-600 mr-2">{msgConfirm}</span>
            <button onClick={() => { onExcluir(); setConfirmando(false); }} className="p-1.5 rounded text-red-600 hover:bg-red-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setConfirmando(false)} className="p-1.5 rounded text-slate-500 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEditar} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setConfirmando(true)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Formulário inline de adição/edição ──────────────────────────────────────
function FormInline({
  campos,
  valores,
  onChange,
  onSalvar,
  onCancelar,
  salvando,
  titulo,
}: {
  campos: { key: string; label: string; tipo?: string; placeholder?: string }[];
  valores: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onSalvar: () => void;
  onCancelar: () => void;
  salvando: boolean;
  titulo: string;
}) {
  return (
    <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">{titulo}</p>
      <div className="flex flex-wrap gap-3 items-end">
        {campos.map(c => (
          <div key={c.key} className="flex-1 min-w-[160px]">
            <label className="text-xs text-slate-500 mb-1 block">{c.label}</label>
            <Input
              type={c.tipo ?? "text"}
              placeholder={c.placeholder ?? c.label}
              value={valores[c.key] ?? ""}
              onChange={e => onChange(c.key, e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button size="sm" onClick={onSalvar} disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span className="ml-1">Salvar</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelar} className="h-9">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente de Confirmação de Exclusão ──────────────────────────────────
function ConfirmarExclusao({
  mensagem,
  onConfirmar,
  tamanho = "sm",
}: {
  mensagem: string;
  onConfirmar: () => void;
  tamanho?: "sm" | "md";
}) {
  const [confirmando, setConfirmando] = useState(false);
  const iconSize = tamanho === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnClass = tamanho === "sm"
    ? "p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
    : "p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50";
  if (confirmando) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-600 whitespace-nowrap">{mensagem}</span>
        <button onClick={() => { onConfirmar(); setConfirmando(false); }}
          className="p-1 rounded text-red-600 hover:bg-red-50">
          <Check className={iconSize} />
        </button>
        <button onClick={() => setConfirmando(false)}
          className="p-1 rounded text-slate-500 hover:bg-slate-100">
          <X className={iconSize} />
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => setConfirmando(true)} className={btnClass}>
      <Trash2 className={iconSize} />
    </button>
  );
}

// ─── Linha customizada para Procedimentos ───────────────────────────────────
function ProcedimentoLinha({
  item,
  onEditar,
  onExcluir,
}: {
  item: Procedimento;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const valorFormatado = item.valor_padrao != null
    ? item.valor_padrao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";

  return (
    <div className={`flex items-center justify-between px-5 py-3 border-b border-slate-100 last:border-0 group ${!item.ativo ? "opacity-50" : ""}`}>
      {/* Nome */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-slate-800 truncate">{item.nome}</span>
        {!item.ativo && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex-shrink-0">Inativo</span>}
      </div>
      {/* Valor + ações */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Valor padrão com lápis ao lado */}
        <button
          onClick={onEditar}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
          title="Clique para editar o valor"
        >
          <Pencil className="w-3 h-3" />
          {valorFormatado}
        </button>
        {/* Excluir */}
        {confirmando ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-red-600">Excluir?</span>
            <button onClick={() => { onExcluir(); setConfirmando(false); }} className="p-1.5 rounded text-red-600 hover:bg-red-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setConfirmando(false)} className="p-1.5 rounded text-slate-500 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="p-1.5 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Seção: Procedimentos ─────────────────────────────────────────────────────
function SecaoProcedimentos() {
  const { itens, carregando, erro, inserir, atualizar, excluir } = useCrud<Procedimento>(
    "procedimentos", "*", "nome"
  );
  const [mostrando, setMostrando] = useState<"nenhum" | "novo" | string>("nenhum");
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const campos = [
    { key: "nome", label: "Nome do Procedimento", placeholder: "Ex: Pilates" },
    { key: "valor_padrao", label: "Valor Padrão (R$)", tipo: "number", placeholder: "0,00" },
  ];

  const abrirNovo = () => { setForm({}); setErroForm(null); setMostrando("novo"); };
  const abrirEditar = (item: Procedimento) => {
    setForm({ nome: item.nome, valor_padrao: item.valor_padrao?.toString() ?? "" });
    setErroForm(null);
    setMostrando(item.id);
  };

  const salvar = async () => {
    if (!form.nome?.trim()) { setErroForm("O nome é obrigatório."); return; }
    setSalvando(true);
    setErroForm(null);
    try {
      const dados = {
        nome: form.nome.trim(),
        valor_padrao: form.valor_padrao ? parseFloat(form.valor_padrao) : null,
        ativo: true,
      };
      if (mostrando === "novo") await inserir(dados);
      else await atualizar(mostrando, dados);
      setMostrando("nenhum");
    } catch (e: unknown) {
      setErroForm(e instanceof Error ? e.message : "Erro ao salvar.");
    }
    setSalvando(false);
  };

  return (
    <Secao titulo="Tipos de Procedimentos" icone={Stethoscope} cor="bg-emerald-600">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <span className="text-xs text-slate-500">{itens.length} procedimento(s) cadastrado(s)</span>
        <Button size="sm" onClick={abrirNovo} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Procedimento
        </Button>
      </div>
      {mostrando === "novo" && (
        <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo="Novo Procedimento" />
      )}
      {erroForm && <p className="px-5 py-2 text-xs text-red-600 bg-red-50">{erroForm}</p>}
      {carregando && <p className="px-5 py-4 text-sm text-slate-400">Carregando...</p>}
      {erro && <p className="px-5 py-4 text-sm text-red-500">{erro}</p>}
      {!carregando && itens.map(item => (
        <div key={item.id}>
          {mostrando === item.id ? (
            <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
              onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo={`Editar: ${item.nome}`} />
          ) : (
            <ProcedimentoLinha
              item={item}
              onEditar={() => abrirEditar(item)}
              onExcluir={() => excluir(item.id)}
            />
          )}
        </div>
      ))}
      {!carregando && itens.length === 0 && !erro && (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhum procedimento cadastrado.</p>
      )}
    </Secao>
  );
}

// ─── Seção: Formas de Pagamento (Recebimentos) ────────────────────────────────
function SecaoFormasPagamentoRecebimento() {
  const { itens, carregando, erro, inserir, atualizar, excluir } = useCrud<FormaPagamentoConfig>(
    "formas_pagamento", "*", "nome"
  );
  const itensFiltrados = itens.filter(i => i.tipo === "recebimento" || i.tipo === "ambos");
  const [mostrando, setMostrando] = useState<"nenhum" | "novo" | string>("nenhum");
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const campos = [{ key: "nome", label: "Forma de Pagamento", placeholder: "Ex: PIX" }];

  const abrirNovo = () => { setForm({}); setErroForm(null); setMostrando("novo"); };
  const abrirEditar = (item: FormaPagamentoConfig) => {
    setForm({ nome: item.nome });
    setErroForm(null);
    setMostrando(item.id);
  };

  const salvar = async () => {
    if (!form.nome?.trim()) { setErroForm("O nome é obrigatório."); return; }
    const nomeNormalizado = form.nome.trim().toLowerCase();
    const duplicado = itens.some(i =>
      i.nome.toLowerCase() === nomeNormalizado && i.id !== mostrando
    );
    if (duplicado) { setErroForm(`Já existe uma forma de pagamento com o nome "${form.nome.trim()}".`); return; }
    setSalvando(true);
    setErroForm(null);
    try {
      if (mostrando === "novo") await inserir({ nome: form.nome.trim(), tipo: "recebimento", ativo: true });
      else await atualizar(mostrando, { nome: form.nome.trim() });
      setMostrando("nenhum");
    } catch (e: unknown) {
      setErroForm(e instanceof Error ? e.message : "Erro ao salvar.");
    }
    setSalvando(false);
  };

  return (
    <Secao titulo="Formas de Pagamento — Recebimentos" icone={CreditCard} cor="bg-blue-600">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <span className="text-xs text-slate-500">{itensFiltrados.length} forma(s) cadastrada(s)</span>
        <Button size="sm" onClick={abrirNovo} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova Forma
        </Button>
      </div>
      {mostrando === "novo" && (
        <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo="Nova Forma de Pagamento" />
      )}
      {erroForm && <p className="px-5 py-2 text-xs text-red-600 bg-red-50">{erroForm}</p>}
      {carregando && <p className="px-5 py-4 text-sm text-slate-400">Carregando...</p>}
      {erro && <p className="px-5 py-4 text-sm text-red-500">{erro}</p>}
      {!carregando && itensFiltrados.map(item => (
        <div key={item.id}>
          {mostrando === item.id ? (
            <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
              onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo={`Editar: ${item.nome}`} />
          ) : (
            <ItemLinha label={item.nome} inativo={!item.ativo}
              onEditar={() => abrirEditar(item)} onExcluir={() => excluir(item.id)} />
          )}
        </div>
      ))}
      {!carregando && itensFiltrados.length === 0 && !erro && (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhuma forma de pagamento cadastrada.</p>
      )}
    </Secao>
  );
}

// ─── Seção: Categorias de Pagamento ──────────────────────────────────────────
function SecaoCategoriasPagamento() {
  const { itens, carregando, erro, inserir, atualizar, excluir } = useCrud<CategoriaPagamentoConfig>(
    "categorias_pagamento", "*", "nome"
  );
  const [mostrando, setMostrando] = useState<"nenhum" | "novo" | string>("nenhum");
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const campos = [{ key: "nome", label: "Categoria", placeholder: "Ex: Aluguel" }];

  const abrirNovo = () => { setForm({}); setErroForm(null); setMostrando("novo"); };
  const abrirEditar = (item: CategoriaPagamentoConfig) => {
    setForm({ nome: item.nome });
    setErroForm(null);
    setMostrando(item.id);
  };

  const salvar = async () => {
    if (!form.nome?.trim()) { setErroForm("O nome é obrigatório."); return; }
    const nomeNormalizado = form.nome.trim().toLowerCase();
    const duplicado = itens.some(i =>
      i.nome.toLowerCase() === nomeNormalizado && i.id !== mostrando
    );
    if (duplicado) { setErroForm(`Já existe uma categoria com o nome "${form.nome.trim()}".`); return; }
    setSalvando(true);
    setErroForm(null);
    try {
      if (mostrando === "novo") await inserir({ nome: form.nome.trim(), ativo: true });
      else await atualizar(mostrando, { nome: form.nome.trim() });
      setMostrando("nenhum");
    } catch (e: unknown) {
      setErroForm(e instanceof Error ? e.message : "Erro ao salvar.");
    }
    setSalvando(false);
  };

  return (
    <Secao titulo="Categorias de Pagamento" icone={Tag} cor="bg-violet-600">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <span className="text-xs text-slate-500">{itens.length} categoria(s) cadastrada(s)</span>
        <Button size="sm" onClick={abrirNovo} className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova Categoria
        </Button>
      </div>
      {mostrando === "novo" && (
        <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo="Nova Categoria" />
      )}
      {erroForm && <p className="px-5 py-2 text-xs text-red-600 bg-red-50">{erroForm}</p>}
      {carregando && <p className="px-5 py-4 text-sm text-slate-400">Carregando...</p>}
      {erro && <p className="px-5 py-4 text-sm text-red-500">{erro}</p>}
      {!carregando && itens.map(item => (
        <div key={item.id}>
          {mostrando === item.id ? (
            <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
              onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo={`Editar: ${item.nome}`} />
          ) : (
            <ItemLinha label={item.nome} inativo={!item.ativo}
              onEditar={() => abrirEditar(item)} onExcluir={() => excluir(item.id)} />
          )}
        </div>
      ))}
      {!carregando && itens.length === 0 && !erro && (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhuma categoria cadastrada.</p>
      )}
    </Secao>
  );
}

// ─── Seção: Formas de Pagamento (Pagamentos/Despesas) ────────────────────────
function SecaoFormasPagamentoDespesa() {
  const { itens, carregando, erro, inserir, atualizar, excluir } = useCrud<FormaPagamentoConfig>(
    "formas_pagamento", "*", "nome"
  );
  const itensFiltrados = itens.filter(i => i.tipo === "pagamento" || i.tipo === "ambos");
  const [mostrando, setMostrando] = useState<"nenhum" | "novo" | string>("nenhum");
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const campos = [{ key: "nome", label: "Forma de Pagamento", placeholder: "Ex: Boleto" }];

  const abrirNovo = () => { setForm({}); setErroForm(null); setMostrando("novo"); };
  const abrirEditar = (item: FormaPagamentoConfig) => {
    setForm({ nome: item.nome });
    setErroForm(null);
    setMostrando(item.id);
  };

  const salvar = async () => {
    if (!form.nome?.trim()) { setErroForm("O nome é obrigatório."); return; }
    const nomeNormalizado = form.nome.trim().toLowerCase();
    const duplicado = itens.some(i =>
      i.nome.toLowerCase() === nomeNormalizado && i.id !== mostrando
    );
    if (duplicado) { setErroForm(`Já existe uma forma de pagamento com o nome "${form.nome.trim()}".`); return; }
    setSalvando(true);
    setErroForm(null);
    try {
      if (mostrando === "novo") await inserir({ nome: form.nome.trim(), tipo: "pagamento", ativo: true });
      else await atualizar(mostrando, { nome: form.nome.trim() });
      setMostrando("nenhum");
    } catch (e: unknown) {
      setErroForm(e instanceof Error ? e.message : "Erro ao salvar.");
    }
    setSalvando(false);
  };

  return (
    <Secao titulo="Formas de Pagamento — Despesas" icone={DollarSign} cor="bg-orange-600">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <span className="text-xs text-slate-500">{itensFiltrados.length} forma(s) cadastrada(s)</span>
        <Button size="sm" onClick={abrirNovo} className="bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova Forma
        </Button>
      </div>
      {mostrando === "novo" && (
        <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo="Nova Forma de Pagamento" />
      )}
      {erroForm && <p className="px-5 py-2 text-xs text-red-600 bg-red-50">{erroForm}</p>}
      {carregando && <p className="px-5 py-4 text-sm text-slate-400">Carregando...</p>}
      {erro && <p className="px-5 py-4 text-sm text-red-500">{erro}</p>}
      {!carregando && itensFiltrados.map(item => (
        <div key={item.id}>
          {mostrando === item.id ? (
            <FormInline campos={campos} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
              onSalvar={salvar} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo={`Editar: ${item.nome}`} />
          ) : (
            <ItemLinha label={item.nome} inativo={!item.ativo}
              onEditar={() => abrirEditar(item)} onExcluir={() => excluir(item.id)} />
          )}
        </div>
      ))}
      {!carregando && itensFiltrados.length === 0 && !erro && (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhuma forma de pagamento cadastrada.</p>
      )}
    </Secao>
  );
}

// ─── Seção: Profissionais e Comissões ─────────────────────────────────────────
function SecaoProfissionais() {
  const { itens: profissionais, carregando: carregandoProf, erro: erroProf, inserir: inserirProf, atualizar: atualizarProf, excluir: excluirProf } = useCrud<Profissional>("profissionais", "*", "name");
  const { itens: procedimentos } = useCrud<Procedimento>("procedimentos", "*", "nome");
  const { itens: comissoes, carregando: carregandoCom, inserir: inserirCom, atualizar: atualizarCom, excluir: excluirCom } = useCrud<ComissaoProfissional>(
    "comissoes_profissional",
    "id,profissional_id,procedimento_id,percentual,profissionais(name),procedimentos(nome)",
    "profissional_id"
  );

  const [mostrando, setMostrando] = useState<"nenhum" | "novo" | string>("nenhum");
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [profSelecionado, setProfSelecionado] = useState<string | null>(null);
  const [mostraComissao, setMostraComissao] = useState<"nenhum" | string>("nenhum");
  const [formCom, setFormCom] = useState<Record<string, string>>({});
  const [salvandoCom, setSalvandoCom] = useState(false);
  const [erroComissao, setErroComissao] = useState<string | null>(null);

  const camposProf = [{ key: "name", label: "Nome do Profissional", placeholder: "Ex: Ana Carolina" }];

  const abrirNovo = () => { setForm({}); setErroForm(null); setMostrando("novo"); };
  const abrirEditar = (item: Profissional) => {
    setForm({ name: item.name });
    setErroForm(null);
    setMostrando(item.id);
  };

  const salvarProf = async () => {
    if (!form.name?.trim()) { setErroForm("O nome é obrigatório."); return; }
    setSalvando(true);
    setErroForm(null);
    try {
      if (mostrando === "novo") await inserirProf({ name: form.name.trim() });
      else await atualizarProf(mostrando, { name: form.name.trim() });
      setMostrando("nenhum");
    } catch (e: unknown) {
      setErroForm(e instanceof Error ? e.message : "Erro ao salvar.");
    }
    setSalvando(false);
  };

  const comissoesDoProfissional = (profId: string) =>
    comissoes.filter(c => c.profissional_id === profId);

  const salvarComissao = async (profId: string) => {
    setErroComissao(null);
    if (!formCom.percentual) { setErroComissao("Informe o percentual de comissão."); return; }
    if (mostraComissao === "novo" && !formCom.procedimento_id) { setErroComissao("Selecione um procedimento."); return; }
    const perc = parseFloat(formCom.percentual);
    if (isNaN(perc) || perc < 0) { setErroComissao("O percentual deve ser um número positivo."); return; }
    if (perc > 100) { setErroComissao("O percentual não pode ser superior a 100%."); return; }
    setSalvandoCom(true);
    try {
      if (mostraComissao === "novo") {
        await inserirCom({
          profissional_id: profId,
          procedimento_id: formCom.procedimento_id,
          percentual: perc,
        });
      } else {
        await atualizarCom(mostraComissao, { percentual: perc });
      }
      setMostraComissao("nenhum");
      setFormCom({});
      setErroComissao(null);
    } catch (e: unknown) {
      setErroComissao(e instanceof Error ? e.message : "Erro ao salvar comissão.");
    }
    setSalvandoCom(false);
  };

  return (
    <Secao titulo="Profissionais e Comissões" icone={Users} cor="bg-rose-600">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <span className="text-xs text-slate-500">{profissionais.length} profissional(is) cadastrado(s)</span>
        <Button size="sm" onClick={abrirNovo} className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo Profissional
        </Button>
      </div>
      {mostrando === "novo" && (
        <FormInline campos={camposProf} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
          onSalvar={salvarProf} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo="Novo Profissional" />
      )}
      {erroForm && <p className="px-5 py-2 text-xs text-red-600 bg-red-50">{erroForm}</p>}
      {carregandoProf && <p className="px-5 py-4 text-sm text-slate-400">Carregando...</p>}
      {erroProf && <p className="px-5 py-4 text-sm text-red-500">{erroProf}</p>}

      {!carregandoProf && profissionais.map(prof => (
        <div key={prof.id} className="border-b border-slate-100 last:border-0">
          {mostrando === prof.id ? (
            <FormInline campos={camposProf} valores={form} onChange={(k, v) => setForm(f => ({ ...f, [k]: v }))}
              onSalvar={salvarProf} onCancelar={() => setMostrando("nenhum")} salvando={salvando} titulo={`Editar: ${prof.name}`} />
          ) : (
            <div className="group">
              <div className="flex items-center justify-between px-5 py-3">
                <button
                  onClick={() => setProfSelecionado(profSelecionado === prof.id ? null : prof.id)}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-emerald-700"
                >
                  {profSelecionado === prof.id
                    ? <ChevronDown className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                  }
                  {prof.name}
                  <span className="text-xs text-slate-400 font-normal">
                    ({comissoesDoProfissional(prof.id).length} comissão/ões)
                  </span>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirEditar(prof)} className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <ConfirmarExclusao
                    mensagem={`Excluir ${prof.name}? Todas as comissões vinculadas serão removidas.`}
                    onConfirmar={() => excluirProf(prof.id)}
                  />
                </div>
              </div>

              {profSelecionado === prof.id && (
                <div className="ml-8 mr-4 mb-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5" /> Comissões por Procedimento
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => { setMostraComissao("novo"); setFormCom({ profissional_id: prof.id }); }}
                      className="h-7 text-xs text-emerald-700 hover:bg-emerald-50">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>

                  {mostraComissao === "novo" && formCom.profissional_id === prof.id && (
                    <div className="px-4 py-3 border-b border-slate-200 bg-white">
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">Procedimento</label>
                          <select
                            value={formCom.procedimento_id ?? ""}
                            onChange={e => setFormCom(f => ({ ...f, procedimento_id: e.target.value }))}
                            className="w-full h-9 text-sm border border-slate-200 rounded-md px-2 bg-white"
                          >
                            <option value="">Selecione...</option>
                            {procedimentos
                              .filter(p => !comissoesDoProfissional(prof.id).some(c => c.procedimento_id === p.id))
                              .map(p => <option key={p.id} value={p.id}>{p.nome}</option>)
                            }
                          </select>
                        </div>
                        <div className="w-28">
                          <label className="text-xs text-slate-500 mb-1 block">% Comissão</label>
                          <Input type="number" min="0" max="100" placeholder="0"
                            value={formCom.percentual ?? ""}
                            onChange={e => setFormCom(f => ({ ...f, percentual: e.target.value }))}
                            className="h-9 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => salvarComissao(prof.id)} disabled={salvandoCom}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                            {salvandoCom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setMostraComissao("nenhum"); setFormCom({}); }} className="h-9">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {erroComissao && mostraComissao === "novo" && formCom.profissional_id === prof.id && (
                        <p className="mt-2 text-xs text-red-600">{erroComissao}</p>
                      )}
                    </div>
                  )}

                  {carregandoCom && <p className="px-4 py-3 text-xs text-slate-400">Carregando...</p>}
                  {comissoesDoProfissional(prof.id).length === 0 && !carregandoCom && (
                    <p className="px-4 py-3 text-xs text-slate-400">Nenhuma comissão cadastrada.</p>
                  )}
                  {comissoesDoProfissional(prof.id).map(com => {
                    const procNome = procedimentos.find(p => p.id === com.procedimento_id)?.nome ?? com.procedimento_id;
                    return (
                      <div key={com.id} className="flex items-center justify-between px-4 py-2 border-b border-slate-100 last:border-0 group/com">
                        {mostraComissao === com.id ? (
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex gap-3 items-end">
                              <div className="w-28">
                                <label className="text-xs text-slate-500 mb-1 block">% Comissão</label>
                                <Input type="number" min="0" max="100"
                                  value={formCom.percentual ?? com.percentual.toString()}
                                  onChange={e => setFormCom(f => ({ ...f, percentual: e.target.value }))}
                                  className="h-9 text-sm" />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => salvarComissao(prof.id)} disabled={salvandoCom}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-9">
                                  {salvandoCom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setMostraComissao("nenhum"); setFormCom({}); setErroComissao(null); }} className="h-9">
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {erroComissao && mostraComissao === com.id && (
                              <p className="text-xs text-red-600">{erroComissao}</p>
                            )}
                          </div>
                        ) : (
                          <>
                            <span className="text-xs text-slate-700">{procNome}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {com.percentual}%
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover/com:opacity-100 transition-opacity">
                                <button onClick={() => { setMostraComissao(com.id); setFormCom({ percentual: com.percentual.toString() }); setErroComissao(null); }}
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <ConfirmarExclusao
                                  mensagem={`Excluir comissão de ${procNome}?`}
                                  onConfirmar={() => excluirCom(com.id)}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {!carregandoProf && profissionais.length === 0 && !erroProf && (
        <p className="px-5 py-6 text-sm text-slate-400 text-center">Nenhum profissional cadastrado.</p>
      )}
    </Secao>
  );
}

// ─── Aviso de tabelas pendentes ───────────────────────────────────────────────
function AvisoSQL() {
  const [visivel, setVisivel] = useState(true);
  if (!visivel) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-amber-800">
        <p className="font-semibold mb-1">Configuração inicial necessária</p>
        <p>Execute o SQL de configuração no Supabase para criar as tabelas necessárias antes de usar esta página.</p>
      </div>
      <button onClick={() => setVisivel(false)} className="text-amber-500 hover:text-amber-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────
export default function ConfiguracoesPage() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        </div>
        <p className="text-slate-500 ml-13">Gerencie procedimentos, formas de pagamento, categorias e profissionais da clínica.</p>
      </div>

      {/* Grid de duas colunas: Recebimentos | Pagamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Coluna Esquerda: Recebimentos */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Recebimentos</h2>
          <div className="space-y-4">
            <SecaoProcedimentos />
            <SecaoFormasPagamentoRecebimento />
          </div>
        </div>

        {/* Coluna Direita: Pagamentos */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Pagamentos</h2>
          <div className="space-y-4">
            <SecaoCategoriasPagamento />
            <SecaoFormasPagamentoDespesa />
          </div>
        </div>
      </div>

      {/* Linha completa: Profissionais */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Profissionais</h2>
        <SecaoProfissionais />
      </div>
    </div>
  );
}