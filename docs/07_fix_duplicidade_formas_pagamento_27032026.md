# Fix: Validação de Duplicidade em Formas de Pagamento — Recebimentos vs Despesas

**Data:** 27/03/2026  
**Tipo:** `fix`  
**Arquivo:** `src/components/ConfiguracoesPage.tsx`

---

## Problema

Ao tentar cadastrar uma Forma de Pagamento em **Despesas** com o mesmo nome já existente em **Recebimentos** (ex: "Pix"), o sistema bloqueava a operação exibindo a mensagem:

> Já existe uma forma de pagamento com o nome "Pix".

Isso era incorreto, pois Recebimentos e Despesas são contextos independentes e devem permitir nomes iguais.

## Causa Raiz

A validação de duplicidade em ambas as seções (`SecaoFormasPagamentoRecebimento` e `SecaoFormasPagamentoDespesa`) comparava o nome digitado contra **todos** os registros da tabela `formas_pagamento`, sem filtrar pelo tipo (`recebimento` / `pagamento` / `ambos`).

```typescript
// ANTES (incorreto) — compara contra todos os itens da tabela
const duplicado = itens.some(i =>
  i.nome.toLowerCase() === nomeNormalizado && i.id !== mostrando
);
```

## Solução

Alterada a comparação para usar `itensFiltrados` (já filtrado por tipo) em vez de `itens` (todos os registros):

```typescript
// DEPOIS (correto) — compara apenas dentro do mesmo tipo
const duplicado = itensFiltrados.some(i =>
  i.nome.toLowerCase() === nomeNormalizado && i.id !== mostrando
);
```

A variável `itensFiltrados` já estava definida em cada seção:

- **Recebimentos:** `itens.filter(i => i.tipo === "recebimento" || i.tipo === "ambos")`
- **Despesas:** `itens.filter(i => i.tipo === "pagamento" || i.tipo === "ambos")`

## Comportamento Após a Correção

| Cenário | Resultado |
|---|---|
| "Pix" em Recebimentos + "Pix" em Despesas | ✅ Permitido |
| "Pix" duas vezes em Recebimentos | ❌ Bloqueado com mensagem amigável |
| "Pix" duas vezes em Despesas | ❌ Bloqueado com mensagem amigável |

## Commits

- `fix(configuracoes): separar validação de duplicidade por tipo em formas de pagamento`
