# 👥 ClientesListagem.tsx — Listagem de Pacientes Cadastrados

> **Arquivo:** `src/components/ClientesListagem.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Exibir a lista de pacientes cadastrados no sistema com busca, filtros avançados, avatares coloridos e menu de ações por registro. Integra-se com `CadastroLayout` para navegar para edição, visualização e histórico do paciente.

---

## Funcionalidades Principais

### 1. Listagem Dinâmica
- Cards com avatar (iniciais + cor por hash do nome), nome, CPF, telefone, data de nascimento, cidade e data de cadastro.
- Dados carregados via `GET /api/pacientes` com debounce de 400ms nos filtros de texto.
- Contador `X de Y clientes` no topo — `X` = resultado atual, `Y` = total geral (sem filtros extras).

### 2. Filtros
| Filtro | Tipo | Padrão |
|---|---|---|
| Nome Completo | Texto (busca parcial) | vazio |
| CPF | Texto com máscara | vazio |
| Tipo de Usuário | Select | **Paciente** (padrão — não exibe funcionários por default) |
| Profissional Responsável | Select (carregado do Supabase) | Todos |
| Status | Select | Todos |

> **Importante:** O filtro "Tipo de Usuário" inicia com **Paciente** selecionado para evitar que funcionários e usuários do sistema apareçam na listagem de clientes. Admins podem trocar para "Todos os tipos" se necessário.

### 3. Permissões por Perfil
| Permissão | Comportamento |
|---|---|
| `podeVerUsuariosSistema` | Exibe opções "Funcionario", "Admin", "Financeiro" no filtro de tipo |
| `podeEditarCadastro` | Exibe botão "Editar" no menu de ações do card |
| `podeAlternarStatus` | Exibe opção "Ativar/Desativar" no menu de ações |
| `isFuncionario` | Remove do resultado registros de tipo funcionario/admin/financeiro |

### 4. Menu de Ações por Card (três pontos)
- **Visualizar** — abre modo leitura do cadastro
- **Editar** — abre formulário de edição (se permitido)
- **Ativar / Desativar** — alterna `ativo` via `PATCH /api/pacientes/:id` (se permitido)

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useEffect, useCallback, useRef` | React Hooks | `react` |
| `Card, Input, Button, Select, Label` | UI Components | `@/components/ui/...` |
| `DropdownMenu` | UI Component | `@/components/ui/dropdown-menu` |
| `createClient` | Supabase client | `@/lib/supabase/client` |
| `PacienteResumo, TIPO_USUARIO_LABEL, TIPO_USUARIO_COLOR` | Tipos | `@/lib/types/paciente` |
| `usePermissoes` | Hook | `@/lib/auth/usePermissoes` |
| Ícones variados | Ícones | `lucide-react` |

---

## Estrutura de Dados (API)

Consumido de `GET /api/pacientes` → tabela `pacientes` no Supabase.

### Modelo `PacienteResumo`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID |
| `created_at` | `string` | Data de cadastro |
| `tipo_usuario` | `string` | `"paciente"`, `"funcionario"`, `"admin"`, `"financeiro"` |
| `nome_completo` | `string` | Nome completo |
| `cpf` | `string` | CPF formatado |
| `telefone_cel` | `string \| null` | Celular |
| `data_nascimento` | `string \| null` | Formato YYYY-MM-DD |
| `cidade` | `string \| null` | Cidade |
| `ativo` | `boolean` | Status ativo/inativo |
| `profissional_responsavel` | `string \| null` | Slug do profissional |

---

## Notas para Edição Futura

- Para adicionar novos campos na listagem, incluir no `select` da query em `/api/pacientes/route.ts` e no card do componente
- O filtro padrão `tipo_usuario = "paciente"` é aplicado tanto no estado inicial quanto no `limparFiltros` — manter sincronizados
- `totalGeral` é atualizado apenas quando nome, cpf e profissional estão vazios e tipo é "paciente" ou "todos" e status é "todos"
- Cards inativos recebem `opacity-70` e avatar cinza
