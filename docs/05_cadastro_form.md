# 📝 CadastroForm.tsx — Formulário de Cadastro de Pacientes

> **Arquivo:** `src/components/CadastroForm.tsx` · **Diretiva:** `"use client"` · **Linhas:** 939

---

## Propósito

Formulário completo para cadastro de pacientes da clínica de fisioterapia. Inclui dados pessoais, contato, endereço (com busca de CEP via API), e emissão de nota fiscal (com busca de CNPJ via API). Possui validações em tempo real para CPF, CNPJ e CEP.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState` | React Hook | `react` |
| `Button` | UI Component | `@/components/ui/button` |
| `Input` | UI Component | `@/components/ui/input` |
| `Label` | UI Component | `@/components/ui/label` |
| `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` | UI Component | `@/components/ui/select` |
| `Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger` | UI Component | `@/components/ui/dialog` |
| `Card` | UI Component | `@/components/ui/card` |
| `CheckCircle2, AlertCircle` | Ícones | `lucide-react` |
| `toast` | Notificações | `sonner` |

---

## Interface: `FormData`

Todos os campos do formulário:

### Dados do Paciente

| Campo | Tipo | Descrição |
|---|---|---|
| `tipoUsuario` | `string` | Tipo: paciente, funcionário, admin, financeiro |
| `profissionalResponsavel` | `string` | Profissional responsável pelo paciente |
| `nomeCompleto` | `string` | Nome completo do paciente * (obrigatório) |
| `cpf` | `string` | CPF com máscara * (obrigatório, validado) |
| `rg` | `string` | RG do paciente |
| `dataNascimento` | `string` | Data no formato DD/MM/AAAA |
| `estadoCivil` | `string` | Solteiro, casado, divorciado, viúvo |
| `profissao` | `string` | Profissão do paciente |

### Contato

| Campo | Tipo | Descrição |
|---|---|---|
| `telefonFixo` | `string` | Formato (00) 0000-0000 |
| `telefonCel` | `string` | Formato (00) 00000-0000 |
| `comoFicouSabendo` | `string` | Outdoor, Instagram, Facebook, Indicação |

### Endereço

| Campo | Tipo | Descrição |
|---|---|---|
| `cep` | `string` | CEP com busca automática via ViaCEP |
| `rua` | `string` | Preenchido automaticamente pelo CEP |
| `numero` | `string` | Número do endereço |
| `bairro` | `string` | Preenchido automaticamente pelo CEP |
| `complemento` | `string` | Apto, bloco, etc. |
| `cidade` | `string` | Preenchida automaticamente pelo CEP |

### Nota Fiscal (prefixo `nf`)

| Campo | Tipo | Descrição |
|---|---|---|
| `emitirNF` | `string` | `"sim"` ou `"nao"` (padrão: `"nao"`) |
| `nfCpfCnpj` | `string` | CPF ou CNPJ do titular da NF |
| `nfNomeCompleto` | `string` | Nome completo do titular da NF |
| `nfCep` | `string` | CEP do titular da NF |
| `nfRua` | `string` | Rua do titular da NF |
| `nfNumero` | `string` | Número do titular da NF |
| `nfBairro` | `string` | Bairro do titular da NF |
| `nfComplemento` | `string` | Complemento do titular da NF |
| `nfCidade` | `string` | Cidade do titular da NF |
| `nfTelefonCel` | `string` | Telefone celular do titular da NF |

---

## Estado Interno

| Estado | Tipo | Descrição |
|---|---|---|
| `formData` | `FormData` | Todos os campos do formulário |
| `validations` | `{ cpf: boolean, cnpj: boolean, cep: boolean }` | Status de validação dos campos |

---

## Funções de Validação

### `validateCPF(cpf: string): boolean`
- Remove caracteres não numéricos
- Verifica se tem 11 dígitos
- Calcula e valida os 2 dígitos verificadores do CPF
- **Algoritmo:** Módulo 11 padrão da Receita Federal

### `validateCNPJ(cnpj: string): boolean`
- Remove caracteres não numéricos
- Verifica se tem 14 dígitos
- Calcula e valida os 2 dígitos verificadores do CNPJ
- **Algoritmo:** Módulo 11 com pesos variáveis

---

## Funções de API

### `buscarCEP(cep: string)` — Busca de CEP

| Propriedade | Valor |
|---|---|
| **API** | `https://viacep.com.br/ws/{cep}/json/` |
| **Método** | GET |
| **Preenche** | `rua`, `bairro`, `cidade` |
| **Feedback** | Toast de sucesso ou erro via Sonner |

### `buscarCNPJ(cnpj: string)` — Busca de CNPJ

| Propriedade | Valor |
|---|---|
| **API** | `https://www.receitaws.com.br/v1/cnpj/{cnpj}` |
| **Método** | GET |
| **Preenche** | `nfNomeCompleto`, `nfRua`, `nfNumero`, `nfBairro`, `nfCidade`, `nfCep` |
| **Validação** | Valida CNPJ localmente antes de chamar a API |
| **Feedback** | Toast de sucesso ou erro via Sonner |

---

## Funções de Formatação / Máscara

### `handleCPFChange(e)`
- Máscara: `000.000.000-00`
- Valida automaticamente quando atinge 11 dígitos

### `handleDateChange(e)`
- Máscara: `DD/MM/AAAA`
- Insere barras automaticamente

### `handlePhoneChange(e, field)`
- **Telefone Fixo:** `(00) 0000-0000` (10 dígitos)
- **Telefone Celular:** `(00) 00000-0000` (11 dígitos)
- Usado para 3 campos: `telefonFixo`, `telefonCel`, `nfTelefonCel`

### `handleCEPChange(e)`
- Máscara: `00000-000`
- Insere hífen automaticamente

### `handleNFCpfCnpjChange(e)`
- **CPF** (≤ 11 dígitos): `000.000.000-00`
- **CNPJ** (≤ 14 dígitos): `00.000.000/0000-00`
- Detecta automaticamente se é CPF ou CNPJ pelo tamanho

---

## Função de Submit

### `handleSubmit(e)`
1. `preventDefault()` — impede reload da página
2. Valida campos obrigatórios: `nomeCompleto` e `cpf`
3. Verifica se `validations.cpf` é `true`
4. Exibe toast de erro se falhar, toast de sucesso se ok
5. Loga `formData` no console (sem integração com backend)

---

## Estrutura UI — Diagrama Visual Completo

```
┌──────────────────────────────────────────────────────────┐
│  <form>  space-y-6                                       │
│                                                          │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  SEÇÃO 1: Tipo de Usuário          Card p-6         ║ │
│  ║  ┌────────────────────┬────────────────────┐        ║ │
│  ║  │ Tipo de Usuário *  │ Profissional       │        ║ │
│  ║  │ [Select ▼]         │ Responsável *      │        ║ │
│  ║  │ · Paciente         │ [Select ▼]         │        ║ │
│  ║  │ · Funcionário      │ · Ana Carolina     │        ║ │
│  ║  │ · Admin            │ · Amanda Augusta   │        ║ │
│  ║  │ · Financeiro       │ · Aline Pereira    │        ║ │
│  ║  └────────────────────┴────────────────────┘        ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                          │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  SEÇÃO 2: Dados Pessoais           Card p-6         ║ │
│  ║  ┌─────────────────────────────────────────┐        ║ │
│  ║  │ Nome Completo *                         │        ║ │
│  ║  │ [Input: "Digite seu nome completo"]     │        ║ │
│  ║  └─────────────────────────────────────────┘        ║ │
│  ║  ┌────────────────────┬────────────────────┐        ║ │
│  ║  │ CPF *              │ RG                 │        ║ │
│  ║  │ [Input + ✅ ícone]  │ [Input]            │        ║ │
│  ║  └────────────────────┴────────────────────┘        ║ │
│  ║  ┌────────────────────┬────────────────────┐        ║ │
│  ║  │ Data Nascimento    │ Estado Civil       │        ║ │
│  ║  │ [Input DD/MM/AAAA] │ [Select ▼]         │        ║ │
│  ║  └────────────────────┴────────────────────┘        ║ │
│  ║  ┌─────────────────────────────────────────┐        ║ │
│  ║  │ Profissão                               │        ║ │
│  ║  │ [Input]                                 │        ║ │
│  ║  └─────────────────────────────────────────┘        ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                          │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  SEÇÃO 3: Contato                  Card p-6         ║ │
│  ║  ┌────────────────────┬────────────────────┐        ║ │
│  ║  │ Telefone Fixo      │ Telefone Celular   │        ║ │
│  ║  │ [Input]            │ [Input]            │        ║ │
│  ║  └────────────────────┴────────────────────┘        ║ │
│  ║  ┌─────────────────────────────────────────┐        ║ │
│  ║  │ Como ficou sabendo?                     │        ║ │
│  ║  │ [Select ▼]                              │        ║ │
│  ║  │ · Outdoor · Instagram · Facebook ·      │        ║ │
│  ║  │   Indicação                             │        ║ │
│  ║  └─────────────────────────────────────────┘        ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                          │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  SEÇÃO 4: Endereço                 Card p-6         ║ │
│  ║  ┌─────────────────────────────────────────┐        ║ │
│  ║  │ CEP                                     │        ║ │
│  ║  │ [Input: 00000-000] [Buscar]             │        ║ │
│  ║  └─────────────────────────────────────────┘        ║ │
│  ║  ┌──────────────────────────┬──────────────┐        ║ │
│  ║  │ Rua (col-span-2)        │ Número       │        ║ │
│  ║  │ [Input]                  │ [Input]      │        ║ │
│  ║  └──────────────────────────┴──────────────┘        ║ │
│  ║  ┌────────────────────┬────────────────────┐        ║ │
│  ║  │ Bairro             │ Complemento        │        ║ │
│  ║  │ [Input]            │ [Input]            │        ║ │
│  ║  └────────────────────┴────────────────────┘        ║ │
│  ║  ┌─────────────────────────────────────────┐        ║ │
│  ║  │ Cidade                                  │        ║ │
│  ║  │ [Input]                                 │        ║ │
│  ║  └─────────────────────────────────────────┘        ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                          │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  SEÇÃO 5: Nota Fiscal              Card p-6         ║ │
│  ║  ┌─────────────────────────────────────────┐        ║ │
│  ║  │ Emitir NF no nome de outra pessoa?      │        ║ │
│  ║  │ ○ Não     ○ Sim                         │        ║ │
│  ║  └─────────────────────────────────────────┘        ║ │
│  ║                                                     ║ │
│  ║  SE "Sim":                                          ║ │
│  ║  ┌─────────────────────────────────────────┐        ║ │
│  ║  │ [Adicionar Dados da Nota Fiscal]        │        ║ │
│  ║  │  (abre Dialog/Modal)                    │        ║ │
│  ║  └─────────────────────────────────────────┘        ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                          │
│  ┌─────────────────────────────────── AÇÕES ──────────┐  │
│  │                        [Cancelar] [Salvar Cadastro] │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Modal: Dados da Nota Fiscal (Dialog)

Aparece ao clicar "Adicionar Dados da Nota Fiscal" quando `emitirNF === "sim"`:

```
┌──────────────────────────────────────────────┐
│  Dados da Nota Fiscal              ✕ Fechar  │
│  "Preencha os dados de quem será o titular"  │
│  ─────────────────────────────────────────── │
│  max-w-2xl  max-h-96 overflow-y-auto         │
│                                              │
│  CPF ou CNPJ *                               │
│  [Input: CPF ou CNPJ] [Buscar]               │
│                                              │
│  Nome Completo *                             │
│  [Input]                                     │
│                                              │
│  CEP                                         │
│  [Input] [Buscar]                            │
│                                              │
│  Rua (2/3)           Número (1/3)            │
│  [Input]             [Input]                 │
│                                              │
│  Bairro              Complemento             │
│  [Input]             [Input]                 │
│                                              │
│  Cidade                                      │
│  [Input]                                     │
│                                              │
│  Telefone Celular                            │
│  [Input]                                     │
│                                              │
│  ─────────────────────────────────────────── │
│                      [Cancelar] [Salvar Dados]│
└──────────────────────────────────────────────┘
```

---

## Detalhes de Estilização por Seção

### Cards de Seção

Todos os cards usam o mesmo padrão:
- `p-6` — padding 24px
- `border-slate-200` — borda cinza claro
- `shadow-sm` — sombra sutil

### Títulos de Seção (h2)

- `text-lg font-semibold text-slate-900 mb-4`

### Labels

- `text-sm font-medium text-slate-700`

### Inputs

- Margin top: `mt-2` (8px abaixo do label)
- Placeholder cinza padrão

### Grid Responsivo

| Layout | Mobile | Desktop |
|---|---|---|
| 2 colunas | `grid-cols-1` (empilhado) | `md:grid-cols-2` |
| 3 colunas | `grid-cols-1` (empilhado) | `md:grid-cols-3` |
| Rua + Número | 1 col cada | Rua `md:col-span-2` + Número 1 col |

### Botões de Ação

| Botão | Estilo |
|---|---|
| Cancelar | `variant="outline"` — borda sem preenchimento |
| Salvar Cadastro | `bg-emerald-600 hover:bg-emerald-700 text-white` |
| Buscar (CEP/CNPJ) | `variant="outline" px-6` |

### Indicador de CPF Válido

- Ícone `CheckCircle2` posicionado `absolute right-3 top-3`
- Cor: `text-emerald-600`
- Tamanho: `w-5 h-5`

### Radio Buttons (Emitir NF)

- Layout: `flex gap-4 mt-3`
- Cada label: `flex items-center gap-2 cursor-pointer`
- Input radio: `w-4 h-4`
- Texto: `text-sm text-slate-700`

---

## APIs Externas Utilizadas

| API | URL | Uso |
|---|---|---|
| **ViaCEP** | `https://viacep.com.br/ws/{cep}/json/` | Auto-preenchimento de endereço |
| **ReceitaWS** | `https://www.receitaws.com.br/v1/cnpj/{cnpj}` | Busca dados de empresa por CNPJ |

---

## Notas para Edição Futura

- **Backend:** O `handleSubmit` apenas loga no console — precisa integrar com API/banco
- **Campos obrigatórios:** Apenas `nomeCompleto` e `cpf` são validados no submit
- **Ícone não usado:** `AlertCircle` é importado mas nunca utilizado — pode remover ou usar para indicar erros
- **Profissionais:** Lista hardcoded (Ana Carolina, Amanda Augusta, Aline Pereira) — precisa ser dinâmica
- **Opções do Select:** Todas hardcoded — considerar carregar de uma API
- **CEP da NF:** A função `buscarCEP` atualiza os campos do endereço **principal**, não os da NF — possível bug
- **Validação de data:** Não há validação se a data é válida (ex: 31/02/2026) — só formata
- **maxLength dos inputs:** CPF=14, telefone fixo=14, celular=15, CEP=9, NF CPF/CNPJ=18
