# Registro de "Confirmado por" nos Recebimentos

**Data:** 27/03/2026  
**Arquivos modificados:**
- `src/lib/types/financeiro.ts`
- `src/components/FinanceiroRecebimentos.tsx`
- `src/components/HistoricoCliente.tsx`

---

## Objetivo

Registrar o nome e o ID do usuário logado que confirmou o recebimento de um pagamento, mantendo rastreabilidade para geração de relatórios futuros.

---

## Banco de Dados

Novas colunas adicionadas na tabela `recebimentos`:

| Coluna | Tipo | Descrição |
|---|---|---|
| `confirmado_por` | TEXT | Nome completo do usuário que confirmou |
| `confirmado_por_id` | UUID | ID do registro em `usuarios_acesso` |

---

## Pontos de gravação

| Local | Quando grava |
|---|---|
| `FinanceiroRecebimentos` → botão "Marcar Recebido" | Ao clicar em Marcar Recebido no dropdown |
| `HistoricoCliente` → botão "Confirmar Pagamento" | Ao confirmar pelo histórico do paciente |

O campo `confirmado_por` recebe `nome_completo` do usuário logado (ou `nome_acesso` como fallback).

---

## Exibição

No modal **Detalhes do Recebimento** (Financeiro → Recebimentos), quando o status é `recebido`, aparece a seção:

> **Confirmado por**  
> [Avatar com iniciais] Nome do usuário

Para registros antigos (anteriores a esta implementação), exibe: *"Não registrado"*.
