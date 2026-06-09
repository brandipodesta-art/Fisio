# 19 — Relatório de Inadimplência / Em Atraso

**Data:** 09/06/2026
**Arquivo alterado:** `src/components/RelatoriosPage.tsx`

---

## Descrição

Adicionado novo tipo de relatório **"Inadimplência — Recebimentos e Pagamentos em Atraso"** na página de Relatórios.

---

## Funcionalidade

### Acesso
Menu Relatórios → Tipo de Relatório → **Inadimplência — Recebimentos e Pagamentos em Atraso**

### Comportamento
- **Não requer seleção de período** — usa a data atual como referência automática
- Ao clicar em "Gerar Relatório", busca todos os itens com `data_vencimento < hoje` e status pendente/atrasado
- Os filtros de Período, Status do Pagamento, Cliente e Funcionário são ocultados automaticamente

### Dados exibidos

#### Recebimentos em Atraso
- Busca na tabela `recebimentos` via REST com filtro `status=in.(pendente,atrasado)&data_vencimento=lt.{hoje}`
- Colunas: Cliente, Procedimento, Profissional, Vencimento (vermelho), Valor, Status
- Total em destaque vermelho

#### Pagamentos em Atraso
- Busca na tabela `pagamentos` via `/api/pagamentos` com filtro local
- Colunas: Descrição, Categoria, Fornecedor, Vencimento (laranja), Valor, Status
- Total em destaque laranja

### Cards de resumo (topo)
| Card | Cor | Conteúdo |
|---|---|---|
| Recebimentos em Atraso | Vermelho | Soma + contagem de recebimentos vencidos |
| Pagamentos em Atraso | Laranja | Soma + contagem de pagamentos vencidos |
| Total em Aberto | Rosa/Rose | Soma geral de recebimentos + pagamentos |

### Estado vazio
- Se não houver nenhum item em atraso, exibe mensagem positiva: "Todos os recebimentos e pagamentos estão em dia."

---

## Alterações técnicas

### Novos estados
```typescript
const [pagamentosAtraso, setPagamentosAtraso] = useState<PagamentoAtraso[]>([]);
```

### Nova interface
```typescript
interface PagamentoAtraso {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  fornecedor: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
}
```

### Novos ícones importados
- `AlertTriangle` — ícone do SelectItem e card Total em Aberto
- `ArrowDownCircle` — ícone de Recebimentos em Atraso
- `ArrowUpCircle` — ícone de Pagamentos em Atraso

### Lógica de `podeGerar` atualizada
```typescript
const podeGerar =
  tipoRelatorio !== "" &&
  (tipoRelatorio === "atraso" || (dataInicial !== "" && dataFinal !== ""));
```

---

## Exportação PDF/Excel
Os botões de exportação aparecem quando há dados de recebimentos **ou** pagamentos em atraso.
A exportação para o tipo "atraso" ainda usa a lógica padrão de recebimentos (a ser expandida em versão futura para incluir pagamentos no PDF/Excel).
