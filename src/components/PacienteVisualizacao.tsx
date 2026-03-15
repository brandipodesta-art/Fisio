"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pencil,
  UserRound,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  FileText,
  Users,
  Receipt,
  Loader2,
  AlertCircle,
  Power,
  PowerOff,
} from "lucide-react";
import type { PacienteDB } from "@/lib/types/paciente";
import { TIPO_USUARIO_LABEL, TIPO_USUARIO_COLOR } from "@/lib/types/paciente";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor + "T00:00:00");
  if (isNaN(d.getTime())) return valor;
  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return valor;
  return d.toLocaleString("pt-BR");
}

function capitalizar(valor: string | null | undefined): string {
  if (!valor) return "—";
  return valor
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function vazio(valor: string | null | undefined): string {
  return valor && valor.trim() !== "" ? valor : "—";
}

// ─────────────────────────────────────────────────────────
// Sub-componente: campo de visualização
// ─────────────────────────────────────────────────────────
function Campo({
  label,
  valor,
  destaque = false,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-sm ${
          destaque
            ? "font-semibold text-slate-900"
            : valor === "—"
            ? "text-slate-400 italic"
            : "text-slate-700"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-componente: seção com título e ícone
// ─────────────────────────────────────────────────────────
function Secao({
  titulo,
  icone: Icone,
  children,
}: {
  titulo: string;
  icone: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center">
            <Icone className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          {children}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────
interface PacienteVisualizacaoProps {
  pacienteId: string;
  onVoltar: () => void;
  onEditar: () => void;
}

// ─────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────
export default function PacienteVisualizacao({
  pacienteId,
  onVoltar,
  onEditar,
}: PacienteVisualizacaoProps) {
  const [paciente, setPaciente] = useState<PacienteDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  const alternarStatus = async () => {
    if (!paciente) return;
    setAlterandoStatus(true);
    try {
      const res = await fetch(`/api/pacientes/${paciente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !paciente.ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      const atualizado = await res.json();
      setPaciente((prev) => prev ? { ...prev, ativo: atualizado.ativo } : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setAlterandoStatus(false);
    }
  };

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const res = await fetch(`/api/pacientes/${pacienteId}`);
        if (!res.ok) throw new Error("Erro ao carregar paciente");
        const data = await res.json();
        setPaciente(data);
      } catch (e) {
        setErro("Não foi possível carregar os dados do paciente.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [pacienteId]);

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm">Carregando dados do paciente...</span>
      </div>
    );
  }

  // ── Erro ──────────────────────────────────────────────
  if (erro || !paciente) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <span className="text-sm text-red-500">{erro ?? "Paciente não encontrado."}</span>
        <Button variant="outline" size="sm" onClick={onVoltar}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a listagem
        </Button>
      </div>
    );
  }

  const tipoCor = TIPO_USUARIO_COLOR[paciente.tipo_usuario] ?? "bg-slate-100 text-slate-600";
  const tipoLabel = TIPO_USUARIO_LABEL[paciente.tipo_usuario] ?? paciente.tipo_usuario;

  return (
    <div className="space-y-4">
      {/* ── Cabeçalho ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onVoltar}
            className="text-slate-500 hover:text-slate-700 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={alternarStatus}
            disabled={alterandoStatus}
            className={`gap-2 ${
              paciente.ativo
                ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
            }`}
          >
            {alterandoStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : paciente.ativo ? (
              <><PowerOff className="w-4 h-4" /> Desativar Cliente</>
            ) : (
              <><Power className="w-4 h-4" /> Ativar Cliente</>
            )}
          </Button>
          <Button
            onClick={onEditar}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Pencil className="w-4 h-4" />
            Editar Cadastro
          </Button>
        </div>
      </div>

      {/* ── Banner de identificação ─────────────────────────────────────────────── */}
      <Card className={`shadow-sm ${
        paciente.ativo
          ? "border-slate-200 bg-gradient-to-r from-emerald-50 to-white"
          : "border-slate-300 bg-gradient-to-r from-slate-100 to-white"
      }`}>
        <div className="p-5 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
            paciente.ativo ? "bg-emerald-100" : "bg-slate-200"
          }`}>
            <UserRound className={`w-7 h-7 ${
              paciente.ativo ? "text-emerald-600" : "text-slate-400"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className={`text-xl font-bold truncate ${
                paciente.ativo ? "text-slate-900" : "text-slate-500"
              }`}>
                {paciente.nome_completo}
              </h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoCor}`}>
                {tipoLabel}
              </span>
              {!paciente.ativo && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                  Inativo
                </span>
              )}
            </div>   <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="font-mono">CPF: {vazio(paciente.cpf)}</span>
              {paciente.telefone_cel && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {paciente.telefone_cel}
                </span>
              )}
              {paciente.cidade && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {paciente.cidade}
                </span>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 text-xs text-slate-400 shrink-0">
            <span>Cadastrado em</span>
            <span className="font-medium text-slate-600">
              {formatarDataHora(paciente.created_at)}
            </span>
          </div>
        </div>
      </Card>

      {/* ── Tipo de Usuário ───────────────────────────── */}
      <Secao titulo="Tipo de Usuário" icone={Users}>
        <Campo label="Tipo de Usuário" valor={tipoLabel} destaque />
        <Campo
          label="Profissional Responsável"
          valor={capitalizar(paciente.profissional_responsavel)}
          destaque
        />
      </Secao>

      {/* ── Dados Pessoais ────────────────────────────── */}
      <Secao titulo="Dados Pessoais" icone={UserRound}>
        <Campo label="Nome Completo" valor={vazio(paciente.nome_completo)} destaque />
        <Campo label="CPF" valor={vazio(paciente.cpf)} />
        <Campo label="RG" valor={vazio(paciente.rg)} />
        <Campo label="Data de Nascimento" valor={formatarData(paciente.data_nascimento)} />
        <Campo label="Estado Civil" valor={capitalizar(paciente.estado_civil)} />
        <Campo label="Profissão" valor={vazio(paciente.profissao)} />
      </Secao>

      {/* ── Contato ───────────────────────────────────── */}
      <Secao titulo="Contato" icone={Phone}>
        <Campo label="Telefone Fixo" valor={vazio(paciente.telefone_fixo)} />
        <Campo label="Telefone Celular" valor={vazio(paciente.telefone_cel)} />
        <Campo label="Como ficou sabendo" valor={capitalizar(paciente.como_ficou_sabendo)} />
      </Secao>

      {/* ── Endereço ──────────────────────────────────── */}
      <Secao titulo="Endereço" icone={MapPin}>
        <Campo label="CEP" valor={vazio(paciente.cep)} />
        <Campo label="Rua" valor={vazio(paciente.rua)} />
        <Campo label="Número" valor={vazio(paciente.numero)} />
        <Campo label="Bairro" valor={vazio(paciente.bairro)} />
        <Campo label="Complemento" valor={vazio(paciente.complemento)} />
        <Campo label="Cidade" valor={vazio(paciente.cidade)} destaque />
      </Secao>

      {/* ── Nota Fiscal ───────────────────────────────── */}
      <Secao titulo="Nota Fiscal" icone={Receipt}>
        <Campo
          label="Emitir NF em outro nome?"
          valor={paciente.emitir_nf === "sim" ? "Sim" : "Não"}
        />
        {paciente.emitir_nf === "sim" && (
          <>
            <Campo label="CPF / CNPJ" valor={vazio(paciente.nf_cpf_cnpj)} />
            <Campo label="Nome / Razão Social" valor={vazio(paciente.nf_nome_completo)} />
            <Campo label="CEP" valor={vazio(paciente.nf_cep)} />
            <Campo label="Rua" valor={vazio(paciente.nf_rua)} />
            <Campo label="Número" valor={vazio(paciente.nf_numero)} />
            <Campo label="Bairro" valor={vazio(paciente.nf_bairro)} />
            <Campo label="Complemento" valor={vazio(paciente.nf_complemento)} />
            <Campo label="Cidade" valor={vazio(paciente.nf_cidade)} />
            <Campo label="Telefone Celular" valor={vazio(paciente.nf_telefone_cel)} />
          </>
        )}
      </Secao>

      {/* ── Rodapé ────────────────────────────────────── */}
      <div className="flex justify-between items-center pt-2 pb-4">
        <Button variant="outline" size="sm" onClick={onVoltar} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar para a listagem
        </Button>
        <Button
          onClick={onEditar}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <Pencil className="w-4 h-4" />
          Editar Cadastro
        </Button>
      </div>
    </div>
  );
}
