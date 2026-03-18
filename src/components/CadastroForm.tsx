import { useState, useRef, useEffect } from "react";
import type { PacienteDB } from "@/lib/types/paciente";
import { createClient } from "@/lib/supabase/client";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * CadastroForm - Formulário completo de cadastro de pacientes
 * Design: Healthcare Minimal - Campos organizados em seções, validações em tempo real
 *
 * Melhorias implementadas:
 * - CPF: validação com mensagem de erro em vermelho e ícone de alerta
 * - Data de Nascimento: validação real de dia/mês/ano (inclusive ano bissexto)
 * - Telefone Fixo: formato (00) 0000-0000 — 10 dígitos
 * - Telefone Celular: formato (00) 00000-0000 — 11 dígitos
 * - CEP: busca automática ao digitar 8 dígitos (sem botão Buscar)
 *        preenche Rua, Bairro e Cidade automaticamente via ViaCEP
 */

interface FormData {
  tipoUsuario: string;
  profissionalResponsavel: string;
  nomeCompleto: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  estadoCivil: string;
  profissao: string;
  telefonFixo: string;
  telefonCel: string;
  comoFicouSabendo: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
  cidade: string;
  emitirNF: string;
  nfCpfCnpj: string;
  nfNomeCompleto: string;
  nfCep: string;
  nfRua: string;
  nfNumero: string;
  nfBairro: string;
  nfComplemento: string;
  nfCidade: string;
  nfTelefonCel: string;
}

interface FieldErrors {
  cpf?: string;
  dataNascimento?: string;
  cep?: string;
  nfCpfCnpj?: string;
}

interface CadastroFormProps {
  /** Quando fornecido, o formulário entra em modo de edição */
  pacienteId?: string | null;
  /** Callback chamado após salvar com sucesso (novo ou edição) */
  onSalvoComSucesso?: () => void;
  /** Callback chamado ao clicar em Cancelar */
  onCancelar?: () => void;
}

export default function CadastroForm({
  pacienteId,
  onSalvoComSucesso,
  onCancelar,
}: CadastroFormProps = {}) {
  const modoEdicao = Boolean(pacienteId);
  const [formData, setFormData] = useState<FormData>({
    tipoUsuario: "",
    profissionalResponsavel: "",
    nomeCompleto: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    estadoCivil: "",
    profissao: "",
    telefonFixo: "",
    telefonCel: "",
    comoFicouSabendo: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
    cidade: "",
    emitirNF: "nao",
    nfCpfCnpj: "",
    nfNomeCompleto: "",
    nfCep: "",
    nfRua: "",
    nfNumero: "",
    nfBairro: "",
    nfComplemento: "",
    nfCidade: "",
    nfTelefonCel: "",
  });

  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPaciente, setLoadingPaciente] = useState(false);
  const [profissionaisList, setProfissionaisList] = useState<{ id: string; name: string }[]>([]);

  // Busca profissionais dinamicamente para o select
  useEffect(() => {
    supabase.from("profissionais").select("id, name").order("name").then(({ data }) => {
      if (data) setProfissionaisList(data as { id: string; name: string }[]);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  // Pré-carregamento dos dados no modo de edição
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!pacienteId) return;

    const carregarPaciente = async () => {
      setLoadingPaciente(true);
      try {
        const res = await fetch(`/api/pacientes/${pacienteId}`);
        if (!res.ok) throw new Error("Paciente não encontrado");
        const p: PacienteDB = await res.json();

        setFormData({
          tipoUsuario: p.tipo_usuario ?? "",
          profissionalResponsavel: p.profissional_responsavel ?? "",
          nomeCompleto: p.nome_completo ?? "",
          cpf: p.cpf ?? "",
          rg: p.rg ?? "",
          dataNascimento: p.data_nascimento ?? "",
          estadoCivil: p.estado_civil ?? "",
          profissao: p.profissao ?? "",
          telefonFixo: p.telefone_fixo ?? "",
          telefonCel: p.telefone_cel ?? "",
          comoFicouSabendo: p.como_ficou_sabendo ?? "",
          cep: p.cep ?? "",
          rua: p.rua ?? "",
          numero: p.numero ?? "",
          bairro: p.bairro ?? "",
          complemento: p.complemento ?? "",
          cidade: p.cidade ?? "",
          emitirNF: p.emitir_nf ?? "nao",
          nfCpfCnpj: p.nf_cpf_cnpj ?? "",
          nfNomeCompleto: p.nf_nome_completo ?? "",
          nfCep: p.nf_cep ?? "",
          nfRua: p.nf_rua ?? "",
          nfNumero: p.nf_numero ?? "",
          nfBairro: p.nf_bairro ?? "",
          nfComplemento: p.nf_complemento ?? "",
          nfCidade: p.nf_cidade ?? "",
          nfTelefonCel: p.nf_telefone_cel ?? "",
        });

        // Marcar CPF como válido (já estava salvo)
        if (p.cpf) {
          setValidations((prev) => ({ ...prev, cpf: true }));
        }
      } catch (err) {
        toast.error("Erro ao carregar dados do paciente.");
        console.error(err);
      } finally {
        setLoadingPaciente(false);
      }
    };

    carregarPaciente();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const [validations, setValidations] = useState({
    cpf: false,
    cnpj: false,
    cep: false,
  });

  // Erros de campo exibidos abaixo dos inputs
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Estados de carregamento do CEP
  const [cepLoading, setCepLoading] = useState(false);
  const [nfCepLoading, setNfCepLoading] = useState(false);

  // Estado de carregamento e validação do CPF/CNPJ da NF
  const [nfCnpjLoading, setNfCnpjLoading] = useState(false);
  const [nfCpfCnpjValid, setNfCpfCnpjValid] = useState<boolean | null>(null);

  // Refs para debounce da busca automática de CEP
  const cepDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nfCepDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nfCnpjDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─────────────────────────────────────────────
  // Funções de validação
  // ─────────────────────────────────────────────

  /**
   * Valida CPF com algoritmo oficial dos dígitos verificadores.
   * Rejeita sequências repetidas (000.000.000-00, 111.111.111-11, etc.)
   */
  const validateCPF = (cpf: string): boolean => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;

    let sum = 0;
    for (let i = 1; i <= 9; i++) sum += parseInt(clean[i - 1]) * (11 - i);
    let rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    if (rem !== parseInt(clean[9])) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(clean[i - 1]) * (12 - i);
    rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    return rem === parseInt(clean[10]);
  };

  /**
   * Valida data no formato DD/MM/AAAA.
   * Verifica dias máximos por mês e ano bissexto.
   */
  const validateDate = (date: string): boolean => {
    if (date.length !== 10) return false;
    const parts = date.split("/");
    if (parts.length !== 3) return false;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    // getDate(0) retorna o último dia do mês anterior, ou seja, o máximo do mês atual
    const maxDays = new Date(year, month, 0).getDate();
    if (day > maxDays) return false;
    return true;
  };

  /**
   * Valida CNPJ com algoritmo oficial dos dígitos verificadores.
   */
  const validateCNPJ = (cnpj: string): boolean => {
    const clean = cnpj.replace(/\D/g, "");
    if (clean.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(clean)) return false;

    let size = clean.length - 2;
    let numbers = clean.substring(0, size);
    const digits = clean.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size += 1;
    numbers = clean.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  };

  // ─────────────────────────────────────────────
  // Busca de endereço via ViaCEP
  // ─────────────────────────────────────────────

  /**
   * Consulta a API ViaCEP e preenche os campos de endereço automaticamente.
   * @param cep  CEP limpo (somente dígitos) ou formatado
   * @param isNF true para preencher os campos da Nota Fiscal
   */
  const buscarCEP = async (cep: string, isNF = false) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;

    if (isNF) setNfCepLoading(true);
    else setCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await response.json();

      if (data.erro) {
        if (!isNF) {
          setFieldErrors((prev) => ({
            ...prev,
            cep: "CEP não encontrado nos Correios",
          }));
          setValidations((prev) => ({ ...prev, cep: false }));
        }
        toast.error("CEP não encontrado");
        return;
      }

      if (isNF) {
        setFormData((prev) => ({
          ...prev,
          nfRua: data.logradouro || "",
          nfBairro: data.bairro || "",
          nfCidade: data.localidade || "",
        }));
        toast.success("Endereço da NF preenchido automaticamente");
      } else {
        setFormData((prev) => ({
          ...prev,
          rua: data.logradouro || "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
        }));
        setValidations((prev) => ({ ...prev, cep: true }));
        setFieldErrors((prev) => ({ ...prev, cep: undefined }));
        toast.success("Endereço preenchido automaticamente");
      }
    } catch {
      toast.error("Erro ao consultar CEP. Verifique sua conexão.");
    } finally {
      if (isNF) setNfCepLoading(false);
      else setCepLoading(false);
    }
  };

  // Busca de dados do CNPJ via API pública (BrasilAPI)
  const buscarCNPJ = async (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, "");
    if (!validateCNPJ(clean)) {
      setNfCpfCnpjValid(false);
      setFieldErrors((prev) => ({
        ...prev,
        nfCpfCnpj: "CNPJ inválido. Verifique os dígitos digitados.",
      }));
      return;
    }

    setNfCnpjLoading(true);
    setNfCpfCnpjValid(null);
    setFieldErrors((prev) => ({ ...prev, nfCpfCnpj: undefined }));

    try {
      // Tenta BrasilAPI primeiro (sem limitação de requisições)
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${clean}`
      );

      if (!response.ok) {
        throw new Error("CNPJ não encontrado");
      }

      const data = await response.json();

      // Formata o CEP retornado para 00000-000
      const cepRaw = (data.cep || "").replace(/\D/g, "");
      const cepFormatted =
        cepRaw.length === 8
          ? cepRaw.slice(0, 5) + "-" + cepRaw.slice(5)
          : cepRaw;

      setFormData((prev) => ({
        ...prev,
        nfNomeCompleto: data.razao_social || data.nome_fantasia || "",
        nfRua: data.logradouro || "",
        nfNumero: data.numero || "",
        nfBairro: data.bairro || "",
        nfCidade: data.municipio || "",
        nfCep: cepFormatted,
      }));

      setNfCpfCnpjValid(true);
      setValidations((prev) => ({ ...prev, cnpj: true }));
      toast.success("Dados do CNPJ preenchidos automaticamente!");
    } catch {
      setNfCpfCnpjValid(false);
      setFieldErrors((prev) => ({
        ...prev,
        nfCpfCnpj: "CNPJ não encontrado na base da Receita Federal.",
      }));
      toast.error("CNPJ não encontrado na base da Receita Federal.");
    } finally {
      setNfCnpjLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Handlers de formatação dos campos
  // ─────────────────────────────────────────────

  /** CPF: formata para 000.000.000-00 e valida ao completar 11 dígitos */
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    const formatted = digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setFormData((prev) => ({ ...prev, cpf: formatted }));

    if (digits.length === 11) {
      const valid = validateCPF(digits);
      setValidations((prev) => ({ ...prev, cpf: valid }));
      setFieldErrors((prev) => ({
        ...prev,
        cpf: valid
          ? undefined
          : "CPF inválido. Verifique os dígitos digitados.",
      }));
    } else {
      // Limpar feedback enquanto o usuário ainda está digitando
      setValidations((prev) => ({ ...prev, cpf: false }));
      setFieldErrors((prev) => ({ ...prev, cpf: undefined }));
    }
  };

  /**
   * Data de Nascimento: formata automaticamente para DD/MM/AAAA
   * e valida ao completar os 10 caracteres.
   */
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;

    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4)
      formatted = formatted.slice(0, 5) + "/" + digits.slice(4);

    setFormData((prev) => ({ ...prev, dataNascimento: formatted }));

    if (formatted.length === 10) {
      const valid = validateDate(formatted);
      setFieldErrors((prev) => ({
        ...prev,
        dataNascimento: valid
          ? undefined
          : "Data inválida. Verifique dia, mês e ano.",
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, dataNascimento: undefined }));
    }
  };

  /**
   * Telefones:
   *  - Fixo:    (00) 0000-0000  → máx. 10 dígitos
   *  - Celular: (00) 00000-0000 → máx. 11 dígitos
   */
  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "telefonFixo" | "telefonCel" | "nfTelefonCel"
  ) => {
    const isFixo = field === "telefonFixo";
    const maxDigits = isFixo ? 10 : 11;
    const digits = e.target.value.replace(/\D/g, "").slice(0, maxDigits);

    let formatted = digits;
    if (digits.length > 0) {
      if (digits.length <= 2) {
        formatted = `(${digits}`;
      } else if (isFixo) {
        // Fixo: (00) 0000-0000
        const ddd = digits.slice(0, 2);
        const part1 = digits.slice(2, 6);
        const part2 = digits.slice(6, 10);
        formatted = `(${ddd}) ${part1}${part2 ? "-" + part2 : ""}`;
      } else {
        // Celular: (00) 00000-0000
        const ddd = digits.slice(0, 2);
        const part1 = digits.slice(2, 7);
        const part2 = digits.slice(7, 11);
        formatted = `(${ddd}) ${part1}${part2 ? "-" + part2 : ""}`;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: formatted }));
  };

  /**
   * CEP principal: formata para 00000-000 e dispara busca automática
   * via debounce de 400ms ao completar 8 dígitos.
   */
  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const formatted =
      digits.length > 5
        ? digits.slice(0, 5) + "-" + digits.slice(5)
        : digits;

    setFormData((prev) => ({ ...prev, cep: formatted }));

    if (digits.length < 8) {
      setValidations((prev) => ({ ...prev, cep: false }));
      setFieldErrors((prev) => ({ ...prev, cep: undefined }));
    }

    // Busca automática com debounce
    if (cepDebounceRef.current) clearTimeout(cepDebounceRef.current);
    if (digits.length === 8) {
      cepDebounceRef.current = setTimeout(() => {
        buscarCEP(digits);
      }, 400);
    }
  };

  /**
   * CEP da Nota Fiscal: mesma lógica de busca automática.
   */
  const handleNFCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const formatted =
      digits.length > 5
        ? digits.slice(0, 5) + "-" + digits.slice(5)
        : digits;

    setFormData((prev) => ({ ...prev, nfCep: formatted }));

    if (nfCepDebounceRef.current) clearTimeout(nfCepDebounceRef.current);
    if (digits.length === 8) {
      nfCepDebounceRef.current = setTimeout(() => {
        buscarCEP(digits, true);
      }, 400);
    }
  };

  /** CPF/CNPJ da NF: detecta automaticamente o tipo pelo número de dígitos.
   *  - CPF (11 dígitos): valida imediatamente ao completar
   *  - CNPJ (14 dígitos): valida e busca dados automaticamente via API
   */
  const handleNFCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 14);

    let formatted = digits;
    if (digits.length <= 11) {
      // CPF
      formatted = digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      // CNPJ
      formatted = digits
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }

    setFormData((prev) => ({ ...prev, nfCpfCnpj: formatted }));

    // Limpar estados ao editar
    setNfCpfCnpjValid(null);
    setFieldErrors((prev) => ({ ...prev, nfCpfCnpj: undefined }));

    if (digits.length === 11) {
      // Validação de CPF
      const valid = validateCPF(digits);
      setNfCpfCnpjValid(valid);
      if (!valid) {
        setFieldErrors((prev) => ({
          ...prev,
          nfCpfCnpj: "CPF inválido. Verifique os dígitos digitados.",
        }));
      }
    } else if (digits.length === 14) {
      // Validação e busca automática de CNPJ com debounce de 600ms
      if (nfCnpjDebounceRef.current) clearTimeout(nfCnpjDebounceRef.current);
      nfCnpjDebounceRef.current = setTimeout(() => {
        buscarCNPJ(digits);
      }, 600);
    }
  };

  // ─────────────────────────────────────────────
  // Submissão do formulário
  // ─────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeCompleto || !formData.cpf) {
      toast.error("Preencha os campos obrigatórios: Nome Completo e CPF");
      return;
    }

    if (!validations.cpf) {
      toast.error("CPF inválido. Corrija antes de salvar.");
      return;
    }

    if (formData.dataNascimento && !validateDate(formData.dataNascimento)) {
      toast.error(
        "Data de Nascimento inválida. Verifique o formato DD/MM/AAAA."
      );
      return;
    }

    setIsSubmitting(true);
    toast.loading(modoEdicao ? "Atualizando cadastro..." : "Salvando cadastro...");

    const payload = {
      tipo_usuario: formData.tipoUsuario,
      // Converte string vazia para null — FK exige valor válido ou NULL
      profissional_responsavel: formData.profissionalResponsavel || null,
      nome_completo: formData.nomeCompleto,
      cpf: formData.cpf,
      rg: formData.rg,
      data_nascimento: formData.dataNascimento,
      estado_civil: formData.estadoCivil,
      profissao: formData.profissao,
      telefone_fixo: formData.telefonFixo,
      telefone_cel: formData.telefonCel,
      como_ficou_sabendo: formData.comoFicouSabendo,
      cep: formData.cep,
      rua: formData.rua,
      numero: formData.numero,
      bairro: formData.bairro,
      complemento: formData.complemento,
      cidade: formData.cidade,
      emitir_nf: formData.emitirNF,
      nf_cpf_cnpj: formData.nfCpfCnpj,
      nf_nome_completo: formData.nfNomeCompleto,
      nf_cep: formData.nfCep,
      nf_rua: formData.nfRua,
      nf_numero: formData.nfNumero,
      nf_bairro: formData.nfBairro,
      nf_complemento: formData.nfComplemento,
      nf_cidade: formData.nfCidade,
      nf_telefone_cel: formData.nfTelefonCel,
    };

    try {
      if (modoEdicao) {
        // ── Modo edição: PUT /api/pacientes/[id] ──
        const res = await fetch(`/api/pacientes/${pacienteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error ?? "Erro ao atualizar cadastro.");
        }
        toast.dismiss();
        toast.success("Cadastro atualizado com sucesso!");

        // ── Sincronizar com tabela profissionais se for Funcionário ou Financeiro ──
        if (formData.tipoUsuario === 'funcionario' || formData.tipoUsuario === 'financeiro') {
          const nome = formData.nomeCompleto.trim();
          const idSlug = nome
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          const primeiroNome = nome.split(' ')[0];
          const ultimoNome = nome.split(' ').slice(-1)[0];
          const shortName = nome.split(' ').length > 1
            ? `${primeiroNome} ${ultimoNome[0]}.`
            : primeiroNome;
          // Verifica se já existe para não sobrescrever a cor
          const { data: jaExiste } = await supabase
            .from('profissionais').select('id,color,bg_color,border_color,text_color').eq('id', idSlug).maybeSingle();
          if (jaExiste) {
            // Atualiza apenas o nome
            await supabase.from('profissionais').update({ name: nome, short_name: shortName }).eq('id', idSlug);
          } else {
            const paleta = [
              { color: '#8b5cf6', bg_color: 'bg-violet-100', border_color: 'border-violet-200', text_color: 'text-violet-700' },
              { color: '#ec4899', bg_color: 'bg-pink-100', border_color: 'border-pink-200', text_color: 'text-pink-700' },
              { color: '#14b8a6', bg_color: 'bg-teal-100', border_color: 'border-teal-200', text_color: 'text-teal-700' },
              { color: '#f59e0b', bg_color: 'bg-amber-100', border_color: 'border-amber-200', text_color: 'text-amber-700' },
              { color: '#6366f1', bg_color: 'bg-indigo-100', border_color: 'border-indigo-200', text_color: 'text-indigo-700' },
            ];
            const { data: existentes } = await supabase.from('profissionais').select('id');
            const cor = paleta[(existentes?.length ?? 0) % paleta.length];
            await supabase.from('profissionais').insert({ id: idSlug, name: nome, short_name: shortName, ...cor });
          }
        }

        onSalvoComSucesso?.();
        return;
      }

      // ── Modo criação: INSERT via Supabase client ──
      const { error } = await supabase.from('pacientes').insert({
        tipo_usuario: formData.tipoUsuario,
        // Converte string vazia para null — FK exige valor válido ou NULL
        profissional_responsavel: formData.profissionalResponsavel || null,
        nome_completo: formData.nomeCompleto,
        cpf: formData.cpf,
        rg: formData.rg,
        data_nascimento: formData.dataNascimento,
        estado_civil: formData.estadoCivil,
        profissao: formData.profissao,
        telefone_fixo: formData.telefonFixo,
        telefone_cel: formData.telefonCel,
        como_ficou_sabendo: formData.comoFicouSabendo,
        cep: formData.cep,
        rua: formData.rua,
        numero: formData.numero,
        bairro: formData.bairro,
        complemento: formData.complemento,
        cidade: formData.cidade,
        emitir_nf: formData.emitirNF,
        nf_cpf_cnpj: formData.nfCpfCnpj,
        nf_nome_completo: formData.nfNomeCompleto,
        nf_cep: formData.nfCep,
        nf_rua: formData.nfRua,
        nf_numero: formData.nfNumero,
        nf_bairro: formData.nfBairro,
        nf_complemento: formData.nfComplemento,
        nf_cidade: formData.nfCidade,
        nf_telefone_cel: formData.nfTelefonCel,
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Paciente com este CPF já cadastrado no sistema.');
        }
        throw new Error(error.message || error.details || `Erro ao salvar cadastro (código: ${error.code}).`);
      }

      // ── Sincronizar com tabela profissionais se for Funcionário ou Financeiro ──
      if (formData.tipoUsuario === 'funcionario' || formData.tipoUsuario === 'financeiro') {
        const nome = formData.nomeCompleto.trim();
        // Gera slug no padrão: "Thais Almeida" → "thais-almeida"
        const idSlug = nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const primeiroNome = nome.split(' ')[0];
        const ultimoNome = nome.split(' ').slice(-1)[0];
        const shortName = nome.split(' ').length > 1
          ? `${primeiroNome} ${ultimoNome[0]}.`
          : primeiroNome;
        // Paleta rotativa de cores para novos profissionais
        const paleta = [
          { color: '#8b5cf6', bg_color: 'bg-violet-100', border_color: 'border-violet-200', text_color: 'text-violet-700' },
          { color: '#ec4899', bg_color: 'bg-pink-100', border_color: 'border-pink-200', text_color: 'text-pink-700' },
          { color: '#14b8a6', bg_color: 'bg-teal-100', border_color: 'border-teal-200', text_color: 'text-teal-700' },
          { color: '#f59e0b', bg_color: 'bg-amber-100', border_color: 'border-amber-200', text_color: 'text-amber-700' },
          { color: '#6366f1', bg_color: 'bg-indigo-100', border_color: 'border-indigo-200', text_color: 'text-indigo-700' },
        ];
        const { data: existentes } = await supabase.from('profissionais').select('id');
        const cor = paleta[(existentes?.length ?? 0) % paleta.length];
        await supabase.from('profissionais').upsert(
          { id: idSlug, name: nome, short_name: shortName, ...cor },
          { onConflict: 'id' }
        );
      }

      toast.dismiss();
      toast.success("Cadastro salvo com sucesso no banco de dados!");
      onSalvoComSucesso?.();
    } catch (err: any) {
      toast.dismiss();
      // Extrai a mensagem real — suporta Error nativo e objeto de erro do Supabase
      const msg =
        err?.message ||
        err?.details ||
        (typeof err === "string" ? err : null) ||
        "Erro ao salvar cadastro. Tente novamente.";
      console.error("[CadastroForm] handleSubmit error:", msg, err);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (loadingPaciente) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-sm">Carregando dados do paciente...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner de modo edição */}
      {modoEdicao && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>Você está <strong>editando</strong> um cadastro existente. As alterações serão salvas no banco de dados.</span>
        </div>
      )}
      {/* Seção 1: Tipo de Usuário e Profissional */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Tipo de Usuário
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="tipoUsuario"
              className="text-sm font-medium text-slate-700"
            >
              Selecione o tipo de usuário *
            </Label>
            <Select
              value={formData.tipoUsuario}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, tipoUsuario: value }))
              }
            >
              <SelectTrigger id="tipoUsuario" className="mt-2">
                <SelectValue placeholder="Escolha uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.tipoUsuario === "paciente" && (
            <div>
              <Label
                htmlFor="profissionalResponsavel"
                className="text-sm font-medium text-slate-700"
              >
                Profissional Responsável *
              </Label>
              <Select
                value={formData.profissionalResponsavel}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    profissionalResponsavel: value,
                  }))
                }
              >
                <SelectTrigger id="profissionalResponsavel" className="mt-2">
                  <SelectValue placeholder="Selecione o profissional responsável por este cliente" />
                </SelectTrigger>
                <SelectContent>
                  {profissionaisList.length === 0 ? (
                    <SelectItem value="_loading" disabled>Carregando...</SelectItem>
                  ) : (
                    profissionaisList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Seção 2: Dados Pessoais */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Dados Pessoais
        </h2>
        <div className="space-y-4">
          {/* Nome Completo */}
          <div>
            <Label
              htmlFor="nomeCompleto"
              className="text-sm font-medium text-slate-700"
            >
              Nome Completo *
            </Label>
            <Input
              id="nomeCompleto"
              placeholder="Digite seu nome completo"
              value={formData.nomeCompleto}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nomeCompleto: e.target.value,
                }))
              }
              className="mt-2"
            />
          </div>

          {/* CPF e RG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="cpf"
                className="text-sm font-medium text-slate-700"
              >
                CPF *
              </Label>
              <div className="relative mt-2">
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  maxLength={14}
                  className={
                    fieldErrors.cpf
                      ? "border-red-400 focus-visible:ring-red-400 pr-10"
                      : validations.cpf
                      ? "border-emerald-400 pr-10"
                      : ""
                  }
                />
                {/* Ícone de sucesso */}
                {validations.cpf && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600 pointer-events-none" />
                )}
                {/* Ícone de erro */}
                {fieldErrors.cpf && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500 pointer-events-none" />
                )}
              </div>
              {/* Mensagem de erro abaixo do campo */}
              {fieldErrors.cpf && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.cpf}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="rg"
                className="text-sm font-medium text-slate-700"
              >
                RG
              </Label>
              <Input
                id="rg"
                placeholder="Digite o RG"
                value={formData.rg}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rg: e.target.value }))
                }
                className="mt-2"
              />
            </div>
          </div>

          {/* Data de Nascimento e Estado Civil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="dataNascimento"
                className="text-sm font-medium text-slate-700"
              >
                Data de Nascimento
              </Label>
              <Input
                id="dataNascimento"
                placeholder="DD/MM/AAAA"
                value={formData.dataNascimento}
                onChange={handleDateChange}
                maxLength={10}
                className={`mt-2 ${
                  fieldErrors.dataNascimento
                    ? "border-red-400 focus-visible:ring-red-400"
                    : formData.dataNascimento.length === 10 &&
                      !fieldErrors.dataNascimento
                    ? "border-emerald-400"
                    : ""
                }`}
              />
              {fieldErrors.dataNascimento && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {fieldErrors.dataNascimento}
                </p>
              )}
            </div>
            <div>
              <Label
                htmlFor="estadoCivil"
                className="text-sm font-medium text-slate-700"
              >
                Estado Civil
              </Label>
              <Select
                value={formData.estadoCivil}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, estadoCivil: value }))
                }
              >
                <SelectTrigger id="estadoCivil" className="mt-2">
                  <SelectValue placeholder="Escolha uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Profissão */}
          <div>
            <Label
              htmlFor="profissao"
              className="text-sm font-medium text-slate-700"
            >
              Profissão
            </Label>
            <Input
              id="profissao"
              placeholder="Digite sua profissão"
              value={formData.profissao}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  profissao: e.target.value,
                }))
              }
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Seção 3: Contato */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Contato</h2>
        <div className="space-y-4">
          {/* Telefones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="telefonFixo"
                className="text-sm font-medium text-slate-700"
              >
                Telefone Fixo
              </Label>
              <Input
                id="telefonFixo"
                placeholder="(00) 0000-0000"
                value={formData.telefonFixo}
                onChange={(e) => handlePhoneChange(e, "telefonFixo")}
                maxLength={14}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-slate-400">
                Formato: (DDD) 0000-0000
              </p>
            </div>
            <div>
              <Label
                htmlFor="telefonCel"
                className="text-sm font-medium text-slate-700"
              >
                Telefone Celular
              </Label>
              <Input
                id="telefonCel"
                placeholder="(00) 00000-0000"
                value={formData.telefonCel}
                onChange={(e) => handlePhoneChange(e, "telefonCel")}
                maxLength={15}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-slate-400">
                Formato: (DDD) 00000-0000
              </p>
            </div>
          </div>

          {/* Como Ficou Sabendo */}
          <div>
            <Label
              htmlFor="comoFicouSabendo"
              className="text-sm font-medium text-slate-700"
            >
              Como ficou sabendo da nossa clínica?
            </Label>
            <Select
              value={formData.comoFicouSabendo}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, comoFicouSabendo: value }))
              }
            >
              <SelectTrigger id="comoFicouSabendo" className="mt-2">
                <SelectValue placeholder="Escolha uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outdoor">Outdoor</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="indicacao">Indicação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Seção 4: Endereço */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Endereço</h2>
        <div className="space-y-4">
          {/* CEP — busca automática ao completar 8 dígitos (sem botão Buscar) */}
          <div>
            <Label
              htmlFor="cep"
              className="text-sm font-medium text-slate-700"
            >
              CEP
            </Label>
            <div className="relative mt-2">
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={handleCEPChange}
                maxLength={9}
                className={`pr-10 ${
                  fieldErrors.cep
                    ? "border-red-400 focus-visible:ring-red-400"
                    : validations.cep
                    ? "border-emerald-400"
                    : ""
                }`}
              />
              {/* Ícone de status do CEP */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {cepLoading ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : validations.cep ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : fieldErrors.cep ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <Search className="w-4 h-4 text-slate-300" />
                )}
              </div>
            </div>
            {fieldErrors.cep ? (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {fieldErrors.cep}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Endereço preenchido automaticamente ao digitar o CEP completo
              </p>
            )}
          </div>

          {/* Rua e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label
                htmlFor="rua"
                className="text-sm font-medium text-slate-700"
              >
                Rua
              </Label>
              <Input
                id="rua"
                placeholder="Preenchido automaticamente pelo CEP"
                value={formData.rua}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rua: e.target.value }))
                }
                className="mt-2 bg-slate-50"
              />
            </div>
            <div>
              <Label
                htmlFor="numero"
                className="text-sm font-medium text-slate-700"
              >
                Número
              </Label>
              <Input
                id="numero"
                placeholder="0000"
                value={formData.numero}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, numero: e.target.value }))
                }
                className="mt-2"
              />
            </div>
          </div>

          {/* Bairro e Complemento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="bairro"
                className="text-sm font-medium text-slate-700"
              >
                Bairro
              </Label>
              <Input
                id="bairro"
                placeholder="Preenchido automaticamente pelo CEP"
                value={formData.bairro}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bairro: e.target.value }))
                }
                className="mt-2 bg-slate-50"
              />
            </div>
            <div>
              <Label
                htmlFor="complemento"
                className="text-sm font-medium text-slate-700"
              >
                Complemento
              </Label>
              <Input
                id="complemento"
                placeholder="Apto, bloco, etc."
                value={formData.complemento}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    complemento: e.target.value,
                  }))
                }
                className="mt-2"
              />
            </div>
          </div>

          {/* Cidade */}
          <div>
            <Label
              htmlFor="cidade"
              className="text-sm font-medium text-slate-700"
            >
              Cidade
            </Label>
            <Input
              id="cidade"
              placeholder="Preenchido automaticamente pelo CEP"
              value={formData.cidade}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cidade: e.target.value }))
              }
              className="mt-2 bg-slate-50"
            />
          </div>
        </div>
      </Card>

      {/* Seção 5: Nota Fiscal */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Nota Fiscal
        </h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Deseja emitir NF no nome de outra pessoa ou empresa?
            </Label>
            <div className="flex gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="emitirNF"
                  value="nao"
                  checked={formData.emitirNF === "nao"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emitirNF: e.target.value,
                    }))
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm text-slate-700">Não</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="emitirNF"
                  value="sim"
                  checked={formData.emitirNF === "sim"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      emitirNF: e.target.value,
                    }))
                  }
                  className="w-4 h-4 accent-emerald-600"
                />
                <span className="text-sm text-slate-700">Sim</span>
              </label>
            </div>
          </div>

          {/* Modal para dados da NF */}
          {formData.emitirNF === "sim" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Adicionar Dados da Nota Fiscal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Dados da Nota Fiscal</DialogTitle>
                  <DialogDescription>
                    Preencha os dados de quem será o titular da nota fiscal
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {/* CPF ou CNPJ */}
                  <div>
                    <Label
                      htmlFor="nfCpfCnpj"
                      className="text-sm font-medium text-slate-700"
                    >
                      CPF ou CNPJ *
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="nfCpfCnpj"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={formData.nfCpfCnpj}
                        onChange={handleNFCpfCnpjChange}
                        maxLength={18}
                        className={`pr-10 ${
                          fieldErrors.nfCpfCnpj
                            ? "border-red-400 focus-visible:ring-red-400"
                            : nfCpfCnpjValid === true
                            ? "border-emerald-400"
                            : ""
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {nfCnpjLoading ? (
                          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        ) : nfCpfCnpjValid === true ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : fieldErrors.nfCpfCnpj ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                    {fieldErrors.nfCpfCnpj ? (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {fieldErrors.nfCpfCnpj}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400">
                        {formData.nfCpfCnpj.replace(/\D/g, "").length < 12
                          ? "CPF: validado automaticamente ao digitar 11 dígitos"
                          : "CNPJ: dados preenchidos automaticamente ao digitar 14 dígitos"}
                      </p>
                    )}
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <Label
                      htmlFor="nfNomeCompleto"
                      className="text-sm font-medium text-slate-700"
                    >
                      Nome Completo *
                    </Label>
                    <Input
                      id="nfNomeCompleto"
                      placeholder="Digite o nome completo"
                      value={formData.nfNomeCompleto}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nfNomeCompleto: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  {/* CEP da NF — busca automática */}
                  <div>
                    <Label
                      htmlFor="nfCep"
                      className="text-sm font-medium text-slate-700"
                    >
                      CEP
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="nfCep"
                        placeholder="00000-000"
                        value={formData.nfCep}
                        onChange={handleNFCepChange}
                        maxLength={9}
                        className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {nfCepLoading ? (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Endereço preenchido automaticamente ao digitar o CEP
                      completo
                    </p>
                  </div>

                  {/* Rua e Número */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label
                        htmlFor="nfRua"
                        className="text-sm font-medium text-slate-700"
                      >
                        Rua
                      </Label>
                      <Input
                        id="nfRua"
                        placeholder="Preenchido automaticamente pelo CEP"
                        value={formData.nfRua}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nfRua: e.target.value,
                          }))
                        }
                        className="mt-2 bg-slate-50"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="nfNumero"
                        className="text-sm font-medium text-slate-700"
                      >
                        Número
                      </Label>
                      <Input
                        id="nfNumero"
                        placeholder="0000"
                        value={formData.nfNumero}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nfNumero: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Bairro e Complemento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="nfBairro"
                        className="text-sm font-medium text-slate-700"
                      >
                        Bairro
                      </Label>
                      <Input
                        id="nfBairro"
                        placeholder="Preenchido automaticamente pelo CEP"
                        value={formData.nfBairro}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nfBairro: e.target.value,
                          }))
                        }
                        className="mt-2 bg-slate-50"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="nfComplemento"
                        className="text-sm font-medium text-slate-700"
                      >
                        Complemento
                      </Label>
                      <Input
                        id="nfComplemento"
                        placeholder="Apto, bloco, etc."
                        value={formData.nfComplemento}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nfComplemento: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Cidade */}
                  <div>
                    <Label
                      htmlFor="nfCidade"
                      className="text-sm font-medium text-slate-700"
                    >
                      Cidade
                    </Label>
                    <Input
                      id="nfCidade"
                      placeholder="Preenchido automaticamente pelo CEP"
                      value={formData.nfCidade}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nfCidade: e.target.value,
                        }))
                      }
                      className="mt-2 bg-slate-50"
                    />
                  </div>

                  {/* Telefone Celular */}
                  <div>
                    <Label
                      htmlFor="nfTelefonCel"
                      className="text-sm font-medium text-slate-700"
                    >
                      Telefone Celular
                    </Label>
                    <Input
                      id="nfTelefonCel"
                      placeholder="(00) 00000-0000"
                      value={formData.nfTelefonCel}
                      onChange={(e) => handlePhoneChange(e, "nfTelefonCel")}
                      maxLength={15}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline">Cancelar</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Salvar Dados
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          type="button"
          onClick={onCancelar}
        >
          {modoEdicao ? "← Voltar para Listagem" : "Cancelar"}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {modoEdicao ? "Salvar Alterações" : "Salvar Cadastro"}
        </Button>
      </div>
    </form>
  );
}