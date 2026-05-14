"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Search,
  Plus,
  Phone,
  Clock,
  AlertCircle,
  Check,
  Trash2,
  CalendarClock,
  Pencil,
  PhoneCall,
  UserPlus,
} from "lucide-react";
import { usePermissoes } from "@/lib/auth/usePermissoes";
import { useAuth } from "@/lib/auth/AuthContext";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type UrgenciaListaEspera = "alta" | "media" | "baixa";
export type StatusListaEspera =
  | "aguardando"
  | "contactado"
  | "atendido"
  | "desistiu";

export interface ListaEsperaItem {
  id: string;
  paciente_id: string | null;
  paciente_nome: string;
  telefone: string | null;
  profissional_preferido_id: string | null;
  procedimento_id: string | null;
  motivo: string | null;
  urgencia: UrgenciaListaEspera;
  agendamento_atual_id: string | null;
  status: StatusListaEspera;
  observacoes: string | null;
  created_at: string;
  contacted_at: string | null;
  contacted_by: string | null;
}

interface ListaEsperaDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionals: { id: string; name: string; shortName?: string }[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const URGENCIA_CONFIG: Record<
  UrgenciaListaEspera,
  { label: string; classes: string; dot: string; ordem: number }
> = {
  alta: {
    label: "Alta",
    classes: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    ordem: 0,
  },
  media: {
    label: "Média",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    ordem: 1,
  },
  baixa: {
    label: "Baixa",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    ordem: 2,
  },
};

const STATUS_CONFIG: Record<
  StatusListaEspera,
  { label: string; classes: string }
> = {
  aguardando: { label: "Aguardando", classes: "bg-muted text-muted-foreground" },
  contactado: { label: "Contactado", classes: "bg-sky-50 text-sky-700 border border-sky-200" },
  atendido: { label: "Atendido", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  desistiu: { label: "Desistiu", classes: "bg-muted text-muted-foreground line-through" },
};

function formatTelefoneLink(tel: string | null) {
  if (!tel) return null;
  return tel.replace(/\D/g, "");
}

function timeAgo(iso: string): string {
  const created = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.floor((now - created) / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const dias = Math.floor(hrs / 24);
  return `há ${dias}d`;
}

// ─── Componente Principal ──────────────────────────────────────────────────

export default function ListaEsperaDrawer({
  open,
  onOpenChange,
  professionals,
}: ListaEsperaDrawerProps) {
  const { podeRemoverListaEspera } = usePermissoes();
  const { usuario } = useAuth();

  const [items, setItems] = useState<ListaEsperaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("aguardando");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editing, setEditing] = useState<ListaEsperaItem | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);

  // ── Portal setup ─────────────────────────────────────────────────────────
  if (typeof window !== "undefined" && !elRef.current) {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  // Bloqueia scroll do body quando o drawer está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fechar com ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onOpenChange(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onOpenChange]);

  // ── Carregar lista ───────────────────────────────────────────────────────
  const fetchLista = async () => {
    setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb
        .from("lista_espera")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data as ListaEsperaItem[]) || []);
    } catch (e) {
      console.error("Erro ao carregar lista de espera:", e);
      toast.error("Erro ao carregar lista de espera");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchLista();
  }, [open]);

  // ── Filtragem e ordenação ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const nome = filtroNome.toLowerCase().trim();
    return items
      .filter((i) => {
        if (filtroStatus !== "todos" && i.status !== filtroStatus) return false;
        if (filtroUrgencia !== "todas" && i.urgencia !== filtroUrgencia) return false;
        if (nome && !i.paciente_nome.toLowerCase().includes(nome)) return false;
        return true;
      })
      .sort((a, b) => {
        const ordemUrg =
          URGENCIA_CONFIG[a.urgencia].ordem - URGENCIA_CONFIG[b.urgencia].ordem;
        if (ordemUrg !== 0) return ordemUrg;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [items, filtroNome, filtroUrgencia, filtroStatus]);

  // Contadores para badges
  const contadores = useMemo(() => {
    const aguardando = items.filter((i) => i.status === "aguardando").length;
    const alta = items.filter(
      (i) => i.status === "aguardando" && i.urgencia === "alta"
    ).length;
    return { aguardando, alta };
  }, [items]);

  // ── Ações ────────────────────────────────────────────────────────────────
  async function marcarContactado(item: ListaEsperaItem) {
    try {
      const sb = createClient();
      const { error } = await sb
        .from("lista_espera")
        .update({
          status: "contactado",
          contacted_at: new Date().toISOString(),
          contacted_by:
            usuario?.nome_completo ?? usuario?.nome_acesso ?? null,
        })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(`${item.paciente_nome} marcado como contactado`);
      fetchLista();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao marcar como contactado");
    }
  }

  async function marcarAtendido(item: ListaEsperaItem) {
    try {
      const sb = createClient();
      const { error } = await sb
        .from("lista_espera")
        .update({ status: "atendido" })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(`${item.paciente_nome} marcado como atendido`);
      fetchLista();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao marcar como atendido");
    }
  }

  async function removerItem(item: ListaEsperaItem) {
    if (!confirm(`Remover ${item.paciente_nome} da lista de espera?`)) return;
    try {
      const sb = createClient();
      const { error } = await sb
        .from("lista_espera")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      toast.success("Removido da lista de espera");
      fetchLista();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover");
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (!elRef.current || typeof window === "undefined") return null;

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-200 ${
          open
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-[9999] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-card to-accent/30">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Lista de Espera
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {contadores.aguardando} aguardando
              {contadores.alta > 0 && (
                <span className="ml-1.5 text-red-600 font-medium">
                  • {contadores.alta} urgente{contadores.alta > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar / Add button */}
        <div className="p-4 border-b border-border space-y-3">
          <Button
            onClick={() => {
              setEditing(null);
              setShowAddForm(true);
            }}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            size="sm"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar à Lista de Espera
          </Button>

          {/* Filtros */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <Input
                placeholder="Buscar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="contactado">Contactados</SelectItem>
                  <SelectItem value="atendido">Atendidos</SelectItem>
                  <SelectItem value="desistiu">Desistiram</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroUrgencia} onValueChange={setFiltroUrgencia}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {items.length === 0
                  ? "Nenhum paciente na lista de espera"
                  : "Nenhum resultado com esses filtros"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {items.length === 0
                  ? "Clique em \"Adicionar\" para começar"
                  : "Tente ajustar os filtros acima"}
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const urg = URGENCIA_CONFIG[item.urgencia];
              const statusCfg = STATUS_CONFIG[item.status];
              const telLink = formatTelefoneLink(item.telefone);
              const profissional = professionals.find(
                (p) => p.id === item.profissional_preferido_id
              );
              return (
                <div
                  key={item.id}
                  className="bg-background border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  {/* Linha 1: Nome + Urgência */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${urg.dot}`}
                      />
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {item.paciente_nome}
                      </h4>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${urg.classes}`}
                    >
                      {urg.label}
                    </span>
                  </div>

                  {/* Linha 2: Motivo */}
                  {item.motivo && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {item.motivo}
                    </p>
                  )}

                  {/* Linha 3: Telefone + tempo */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    {telLink ? (
                      <a
                        href={`tel:${telLink}`}
                        className="flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        {item.telefone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/50 italic">
                        sem telefone
                      </span>
                    )}
                    <span className="text-muted-foreground/60">
                      {timeAgo(item.created_at)}
                    </span>
                  </div>

                  {/* Linha 4: Profissional preferido / agendamento atual */}
                  {(profissional || item.agendamento_atual_id) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {profissional && (
                        <span className="text-[10px] bg-accent text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                          Pref.: {profissional.shortName ?? profissional.name}
                        </span>
                      )}
                      {item.agendamento_atual_id && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CalendarClock className="w-2.5 h-2.5" />
                          Já agendado
                        </span>
                      )}
                    </div>
                  )}

                  {/* Linha 5: Status badge + Ações */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${statusCfg.classes}`}
                    >
                      {statusCfg.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.status === "aguardando" && (
                        <button
                          onClick={() => marcarContactado(item)}
                          className="p-1.5 rounded text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Marcar como contactado"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(item.status === "aguardando" ||
                        item.status === "contactado") && (
                        <button
                          onClick={() => marcarAtendido(item)}
                          className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Marcar como atendido"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditing(item);
                          setShowAddForm(true);
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:bg-muted transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {podeRemoverListaEspera && (
                        <button
                          onClick={() => removerItem(item)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Form modal (overlay sobre o drawer) */}
        {showAddForm && (
          <ListaEsperaForm
            editing={editing}
            professionals={professionals}
            onClose={() => {
              setShowAddForm(false);
              setEditing(null);
            }}
            onSaved={() => {
              setShowAddForm(false);
              setEditing(null);
              fetchLista();
            }}
          />
        )}
      </aside>
    </>
  );

  return createPortal(content, elRef.current);
}

// ─── Form de adição / edição ───────────────────────────────────────────────

interface ListaEsperaFormProps {
  editing: ListaEsperaItem | null;
  professionals: { id: string; name: string; shortName?: string }[];
  onClose: () => void;
  onSaved: () => void;
}

function ListaEsperaForm({
  editing,
  professionals,
  onClose,
  onSaved,
}: ListaEsperaFormProps) {
  const [nome, setNome] = useState(editing?.paciente_nome ?? "");
  const [telefone, setTelefone] = useState(editing?.telefone ?? "");
  const [pacienteId, setPacienteId] = useState<string | null>(
    editing?.paciente_id ?? null
  );
  const [profPref, setProfPref] = useState<string>(
    editing?.profissional_preferido_id ?? "sem-preferencia"
  );
  const [motivo, setMotivo] = useState(editing?.motivo ?? "");
  const [urgencia, setUrgencia] = useState<UrgenciaListaEspera>(
    editing?.urgencia ?? "media"
  );
  const [saving, setSaving] = useState(false);

  // Busca de paciente (autocomplete)
  const [pacientes, setPacientes] = useState<
    { id: string; nome_completo: string; telefone_cel: string | null }[]
  >([]);
  const [showDrop, setShowDrop] = useState(false);

  useEffect(() => {
    if (editing || nome.length < 2 || pacienteId) {
      setPacientes([]);
      return;
    }
    const t = setTimeout(async () => {
      const sb = createClient();
      const { data } = await sb
        .from("pacientes")
        .select("id, nome_completo, telefone_cel")
        .ilike("nome_completo", `%${nome}%`)
        .eq("ativo", true)
        .eq("tipo_usuario", "paciente")
        .limit(8);
      if (data) {
        setPacientes(data);
        setShowDrop(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [nome, editing, pacienteId]);

  async function salvar() {
    if (!nome.trim()) {
      toast.error("Informe o nome do paciente");
      return;
    }
    setSaving(true);
    try {
      const sb = createClient();
      const payload = {
        paciente_id: pacienteId,
        paciente_nome: nome.trim(),
        telefone: telefone.trim() || null,
        profissional_preferido_id:
          profPref === "sem-preferencia" ? null : profPref,
        motivo: motivo.trim() || null,
        urgencia,
      };
      if (editing) {
        const { error } = await sb
          .from("lista_espera")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Atualizado com sucesso");
      } else {
        const { error } = await sb.from("lista_espera").insert(payload);
        if (error) throw error;
        toast.success("Paciente adicionado à lista de espera");
      }
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            {editing ? "Editar Entrada" : "Adicionar à Lista"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground/60 hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Nome com autocomplete */}
          <div className="relative">
            <Label className="text-xs font-medium text-muted-foreground">
              Paciente *
            </Label>
            <Input
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setPacienteId(null);
              }}
              placeholder="Nome do paciente"
              className="mt-1 text-sm"
              autoComplete="off"
            />
            {!editing &&
              showDrop &&
              pacientes.length > 0 &&
              !pacienteId && (
                <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
                  {pacientes.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPacienteId(p.id);
                        setNome(p.nome_completo);
                        if (p.telefone_cel) setTelefone(p.telefone_cel);
                        setShowDrop(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{p.nome_completo}</div>
                      {p.telefone_cel && (
                        <div className="text-muted-foreground text-[10px]">
                          {p.telefone_cel}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Telefone */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Telefone
            </Label>
            <Input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="mt-1 text-sm"
            />
          </div>

          {/* Profissional preferido */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Profissional Preferido
            </Label>
            <Select value={profPref} onValueChange={setProfPref}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem-preferencia">
                  Sem preferência
                </SelectItem>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urgência */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Urgência
            </Label>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {(["alta", "media", "baixa"] as UrgenciaListaEspera[]).map(
                (u) => {
                  const cfg = URGENCIA_CONFIG[u];
                  const active = urgencia === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgencia(u)}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                        active
                          ? cfg.classes + " ring-2 ring-offset-1 ring-current"
                          : "bg-muted text-muted-foreground border-border opacity-60 hover:opacity-100"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                      />
                      {cfg.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Motivo */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Motivo / Observação
            </Label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: com dor nas costas, prefere horário da manhã..."
              rows={3}
              className="mt-1 w-full text-sm border border-border rounded-md px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={salvar}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
