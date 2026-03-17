# 👥 ClientesListagem.tsx — Listagem de Pacientes

> **Arquivo:** `src/components/ClientesListagem.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Exibir a lista completa de pacientes cadastrados no sistema, oferecendo recursos de busca rápida e navegação direta para os detalhes e histórico de cada paciente.

---

## Funcionalidades Principais

### 1. Listagem Dinâmica
- Exibe os pacientes em cards limpos contendo nome, contato, data de nascimento e status.
- Os dados são carregados do banco de dados (Supabase) através da API local.

### 2. Busca e Filtro
- Barra de busca proeminente no topo.
- Permite filtrar a lista em tempo real pelo nome do paciente ou pelo telefone.
- O filtro é aplicado localmente sobre os dados já carregados para resposta instantânea.

### 3. Integração com Cadastro e Histórico
- Botão "Ver Prontuário" em cada card.
- Ao clicar, o sistema redireciona o usuário para a aba de "Histórico" (prontuário) carregando automaticamente os dados do paciente selecionado.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState, useEffect, useMemo` | React Hooks | `react` |
| `Card, Button, Input` | UI Components | `@/components/ui/...` |
| `Paciente` | Interface | `@/lib/types/paciente` |
| `Search, User, Phone, Calendar` | Ícones | `lucide-react` |

---

## Estrutura de Dados (API)

Os dados são consumidos da API local `/api/pacientes`.

### Modelo Resumido `Paciente`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID do paciente |
| `nome` | `string` | Nome completo |
| `telefone` | `string` | Contato principal |
| `data_nascimento` | `string` | Formato YYYY-MM-DD |
| `status` | `string` | "ativo" ou "inativo" |
