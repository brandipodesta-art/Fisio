"use client";

import { useState } from "react";
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
import { CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * CadastroForm - Formulário completo de cadastro de pacientes
 * Design: Healthcare Minimal - Campos organizados em seções, validações em tempo real
 * Validações: CPF, CEP, CNPJ, Data de Nascimento
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

export default function CadastroForm() {
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

  const [validations, setValidations] = useState({
    cpf: false,
    cnpj: false,
    cep: false,
  });

  // Validar CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  };

  // Validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    if (cleanCNPJ.length !== 14) return false;

    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    let digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  // Buscar CEP
  const buscarCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
      }));

      setValidations((prev) => ({ ...prev, cep: true }));
      toast.success("CEP preenchido com sucesso");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    }
  };

  // Buscar CNPJ
  const buscarCNPJ = async (cnpj: string) => {
    if (!validateCNPJ(cnpj)) {
      toast.error("CNPJ inválido");
      return;
    }

    try {
      const cleanCNPJ = cnpj.replace(/\D/g, "");
      const response = await fetch(
        `https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`
      );
      const data = await response.json();

      if (data.status === "ERROR") {
        toast.error("CNPJ não encontrado");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        nfNomeCompleto: data.nome || "",
        nfRua: data.logradouro || "",
        nfNumero: data.numero || "",
        nfBairro: data.bairro || "",
        nfCidade: data.municipio || "",
        nfCep: data.cep || "",
      }));

      setValidations((prev) => ({ ...prev, cnpj: true }));
      toast.success("Dados do CNPJ preenchidos com sucesso");
    } catch (error) {
      toast.error("Erro ao buscar CNPJ");
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    let formatted = value
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    setFormData((prev) => ({ ...prev, cpf: formatted }));

    if (value.length === 11) {
      setValidations((prev) => ({
        ...prev,
        cpf: validateCPF(value),
      }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2);
    }
    if (value.length >= 5) {
      value = value.substring(0, 5) + "/" + value.substring(5, 9);
    }

    setFormData((prev) => ({ ...prev, dataNascimento: value }));
  };

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "telefonFixo" | "telefonCel" | "nfTelefonCel"
  ) => {
    let value = e.target.value.replace(/\D/g, "");

    if (field === "telefonFixo" && value.length <= 10) {
      if (value.length >= 2) {
        value = "(" + value.substring(0, 2) + ") " + value.substring(2);
      }
      if (value.length >= 9) {
        value = value.substring(0, 9) + "-" + value.substring(9, 10);
      }
    } else if ((field === "telefonCel" || field === "nfTelefonCel") && value.length <= 11) {
      if (value.length >= 2) {
        value = "(" + value.substring(0, 2) + ") " + value.substring(2);
      }
      if (value.length >= 10) {
        value = value.substring(0, 10) + "-" + value.substring(10, 11);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length <= 8) {
      if (value.length >= 5) {
        value = value.substring(0, 5) + "-" + value.substring(5, 8);
      }
    }

    setFormData((prev) => ({ ...prev, cep: value }));
  };

  const handleNFCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      // CPF
      let formatted = value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData((prev) => ({ ...prev, nfCpfCnpj: formatted }));
    } else if (value.length <= 14) {
      // CNPJ
      let formatted = value
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
      setFormData((prev) => ({ ...prev, nfCpfCnpj: formatted }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeCompleto || !formData.cpf) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (!validations.cpf) {
      toast.error("CPF inválido");
      return;
    }

    toast.success("Cadastro salvo com sucesso!");
    console.log("Form Data:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção 1: Tipo de Usuário e Profissional */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Tipo de Usuário
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipoUsuario" className="text-sm font-medium text-slate-700">
              Selecione o tipo de usuário *
            </Label>
            <Select value={formData.tipoUsuario} onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, tipoUsuario: value }))
            }>
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
          <div>
            <Label htmlFor="profissionalResponsavel" className="text-sm font-medium text-slate-700">
              Profissional Responsável *
            </Label>
            <Select value={formData.profissionalResponsavel} onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, profissionalResponsavel: value }))
            }>
              <SelectTrigger id="profissionalResponsavel" className="mt-2">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ana-carolina">Ana Carolina</SelectItem>
                <SelectItem value="amanda-augusta">Amanda Augusta</SelectItem>
                <SelectItem value="aline-pereira">Aline Pereira</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="nomeCompleto" className="text-sm font-medium text-slate-700">
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
              <Label htmlFor="cpf" className="text-sm font-medium text-slate-700">
                CPF *
              </Label>
              <div className="relative mt-2">
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  maxLength={14}
                />
                {validations.cpf && (
                  <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-emerald-600" />
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="rg" className="text-sm font-medium text-slate-700">
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
              <Label htmlFor="dataNascimento" className="text-sm font-medium text-slate-700">
                Data de Nascimento
              </Label>
              <Input
                id="dataNascimento"
                placeholder="DD/MM/AAAA"
                value={formData.dataNascimento}
                onChange={handleDateChange}
                maxLength={10}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="estadoCivil" className="text-sm font-medium text-slate-700">
                Estado Civil
              </Label>
              <Select value={formData.estadoCivil} onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, estadoCivil: value }))
              }>
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
            <Label htmlFor="profissao" className="text-sm font-medium text-slate-700">
              Profissão
            </Label>
            <Input
              id="profissao"
              placeholder="Digite sua profissão"
              value={formData.profissao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, profissao: e.target.value }))
              }
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Seção 3: Contato */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Contato
        </h2>
        <div className="space-y-4">
          {/* Telefones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefonFixo" className="text-sm font-medium text-slate-700">
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
            </div>
            <div>
              <Label htmlFor="telefonCel" className="text-sm font-medium text-slate-700">
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
            </div>
          </div>

          {/* Como Ficou Sabendo */}
          <div>
            <Label htmlFor="comoFicouSabendo" className="text-sm font-medium text-slate-700">
              Como ficou sabendo da nossa clínica?
            </Label>
            <Select value={formData.comoFicouSabendo} onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, comoFicouSabendo: value }))
            }>
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Endereço
        </h2>
        <div className="space-y-4">
          {/* CEP */}
          <div>
            <Label htmlFor="cep" className="text-sm font-medium text-slate-700">
              CEP
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={handleCEPChange}
                maxLength={9}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => buscarCEP(formData.cep)}
                variant="outline"
                className="px-6"
              >
                Buscar
              </Button>
            </div>
          </div>

          {/* Rua, Número, Bairro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="rua" className="text-sm font-medium text-slate-700">
                Rua
              </Label>
              <Input
                id="rua"
                placeholder="Digite a rua"
                value={formData.rua}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, rua: e.target.value }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="numero" className="text-sm font-medium text-slate-700">
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
              <Label htmlFor="bairro" className="text-sm font-medium text-slate-700">
                Bairro
              </Label>
              <Input
                id="bairro"
                placeholder="Digite o bairro"
                value={formData.bairro}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bairro: e.target.value }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="complemento" className="text-sm font-medium text-slate-700">
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
            <Label htmlFor="cidade" className="text-sm font-medium text-slate-700">
              Cidade
            </Label>
            <Input
              id="cidade"
              placeholder="Digite a cidade"
              value={formData.cidade}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cidade: e.target.value }))
              }
              className="mt-2"
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
                  className="w-4 h-4"
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
                  className="w-4 h-4"
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

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* CPF ou CNPJ */}
                  <div>
                    <Label htmlFor="nfCpfCnpj" className="text-sm font-medium text-slate-700">
                      CPF ou CNPJ *
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="nfCpfCnpj"
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        value={formData.nfCpfCnpj}
                        onChange={handleNFCpfCnpjChange}
                        maxLength={18}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => buscarCNPJ(formData.nfCpfCnpj)}
                        variant="outline"
                        className="px-6"
                      >
                        Buscar
                      </Button>
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <Label htmlFor="nfNomeCompleto" className="text-sm font-medium text-slate-700">
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

                  {/* CEP */}
                  <div>
                    <Label htmlFor="nfCep" className="text-sm font-medium text-slate-700">
                      CEP
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="nfCep"
                        placeholder="00000-000"
                        value={formData.nfCep}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length >= 5) {
                            val = val.substring(0, 5) + "-" + val.substring(5, 8);
                          }
                          setFormData((prev) => ({ ...prev, nfCep: val }));
                        }}
                        maxLength={9}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => buscarCEP(formData.nfCep)}
                        variant="outline"
                        className="px-6"
                      >
                        Buscar
                      </Button>
                    </div>
                  </div>

                  {/* Rua, Número, Bairro */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="nfRua" className="text-sm font-medium text-slate-700">
                        Rua
                      </Label>
                      <Input
                        id="nfRua"
                        placeholder="Digite a rua"
                        value={formData.nfRua}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nfRua: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nfNumero" className="text-sm font-medium text-slate-700">
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
                      <Label htmlFor="nfBairro" className="text-sm font-medium text-slate-700">
                        Bairro
                      </Label>
                      <Input
                        id="nfBairro"
                        placeholder="Digite o bairro"
                        value={formData.nfBairro}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nfBairro: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nfComplemento" className="text-sm font-medium text-slate-700">
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
                    <Label htmlFor="nfCidade" className="text-sm font-medium text-slate-700">
                      Cidade
                    </Label>
                    <Input
                      id="nfCidade"
                      placeholder="Digite a cidade"
                      value={formData.nfCidade}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nfCidade: e.target.value,
                        }))
                      }
                      className="mt-2"
                    />
                  </div>

                  {/* Telefone Celular */}
                  <div>
                    <Label htmlFor="nfTelefonCel" className="text-sm font-medium text-slate-700">
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
        <Button variant="outline">Cancelar</Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Salvar Cadastro
        </Button>
      </div>
    </form>
  );
}
