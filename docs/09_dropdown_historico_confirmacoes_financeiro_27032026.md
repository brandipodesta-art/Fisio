# 09 — Dropdown de Ações no Histórico e Confirmações no Financeiro

**Data:** 27/03/2026  
**Tipo:** Feature + UX  
**Arquivos alterados:**
- `src/components/HistoricoCliente.tsx`
- `src/components/FinanceiroRecebimentos.tsx`
- `src/components/FinanceiroPagamentos.tsx`
- `src/components/ui/ConfirmActionDialog.tsx` *(novo)*

---

## 1. Dropdown de Ações no Histórico do Cliente

### Contexto
Na aba **Cadastro → Histórico → Financeiro**, os itens de recebimento não tinham ações disponíveis — era apenas leitura.

### Implementação
Adicionado dropdown `⋯` (MoreHorizontal) em **dois lugares**:

#### Seção "Pendentes de Pagamento"
Sempre exibe as três opções (item sempre é pendente/atrasado):
- **Visualizar** — abre modal com detalhes do recebimento
- **Confirmar Pagamento** — abre dialog de confirmação; ao confirmar, atualiza status para `recebido` com data de hoje (via Supabase REST API) e atualiza a lista localmente
- **Alterar** — abre modal informativo orientando o usuário a acessar Financeiro > Recebimentos para edição completa

#### Seção "Histórico Completo"
- **Visualizar** — sempre disponível
- **Confirmar Pagamento** e **Alterar** — exibidos apenas quando `status === "pendente" || "atrasado"`

### Novos estados adicionados
```typescript
const [visualizandoItem, setVisualizandoItem] = useState<FinanceiroItem | null>(null);
const [confirmandoItem, setConfirmandoItem]   = useState<FinanceiroItem | null>(null);
const [alterandoItem, setAlterandoItem]       = useState<FinanceiroItem | null>(null);
const [salvandoAcao, setSalvandoAcao]         = useState(false);
```

---

## 2. Confirmação antes de Editar no Financeiro

### Contexto
Ao clicar em **Editar** (tanto no dropdown quanto no modal de visualização), o formulário de edição abria diretamente sem confirmação. Para Exclusão já havia confirmação.

### Implementação
Adicionado `ConfirmActionDialog` (novo componente) antes de abrir o formulário de edição em:
- **FinanceiroRecebimentos** — "Deseja editar o recebimento de `[descrição]` no valor de `[R$ X]`?"
- **FinanceiroPagamentos** — "Deseja editar o pagamento de `[descrição]` no valor de `[R$ X]`?"

O botão **Editar** no modal de visualização também foi atualizado para passar pelo dialog de confirmação.

---

## 3. Novo Componente: ConfirmActionDialog

Criado `src/components/ui/ConfirmActionDialog.tsx` — dialog genérico reutilizável para confirmação de ações não-destrutivas (complementa o `ConfirmDeleteDialog` já existente).

| Prop | Tipo | Padrão |
|---|---|---|
| `open` | boolean | — |
| `onOpenChange` | (open: boolean) => void | — |
| `onConfirm` | () => void | — |
| `titulo` | string | "Confirmar Ação" |
| `mensagem` | string | "Tem certeza..." |
| `labelConfirmar` | string | "Confirmar" |
| `loading` | boolean | false |
| `variante` | "warning" \| "destructive" | "warning" |

---

## Resumo das Confirmações no Financeiro

| Ação | Antes | Depois |
|---|---|---|
| Marcar Recebido / Marcar Pago | Direto (sem confirmação) | Direto (sem confirmação) |
| **Editar** | Direto (sem confirmação) | **Dialog de confirmação** |
| **Excluir** | Dialog de confirmação | Dialog de confirmação (sem mudança) |
