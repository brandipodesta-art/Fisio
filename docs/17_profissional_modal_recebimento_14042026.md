# 17 — Campo Profissional no Modal "Detalhes do Recebimento"

**Data:** 14/04/2026  
**Arquivo alterado:** `src/components/HistoricoCliente.tsx`

---

## Objetivo

Exibir o nome do profissional responsável pelo procedimento no modal "Detalhes do Recebimento", acessível em Clientes → Histórico → Financeiro.

---

## Mudanças Implementadas

### 1. Interfaces TypeScript

Adicionado campo `observacoes: string | null` nas interfaces:
- `RecebimentoRaw` — dados brutos vindos do Supabase
- `FinanceiroItem` — dados mapeados para exibição

### 2. Queries de Recebimentos

Incluído `observacoes` no `select` das duas queries de recebimentos:
- Modo Paciente: `recebimentos?paciente_id=eq.{id}&select=...,observacoes`
- Modo Funcionário: `recebimentos?paciente_id=in.({ids})&select=...,observacoes`

### 3. Estado `profissionalModal`

Adicionado `const [profissionalModal, setProfissionalModal] = useState<string | null>(null)` para armazenar o nome do profissional enquanto o modal está aberto.

### 4. Busca Assíncrona ao Abrir o Modal

Nos dois botões "Visualizar" (seção Pendentes e Histórico Completo), ao clicar:

1. Seta `visualizandoItem` com o item selecionado
2. Reseta `profissionalModal` para `null`
3. Extrai o ID do agendamento de `observacoes` via regex: `/agendamento:([a-f0-9-]+)/i`
4. Se encontrado, faz fetch em `agendamentos?id=eq.{id}&select=professional_id,profissionais(name)`
5. Popula `profissionalModal` com o nome do profissional retornado

### 5. Exibição no Modal

Adicionado campo "Profissional" no grid do modal, entre "Paciente" e "Valor":

```tsx
<div>
  <p className="text-xs font-medium text-muted-foreground mb-1">Profissional</p>
  <p className="text-sm text-foreground">
    {profissionalModal ?? <span className="italic text-muted-foreground/60">—</span>}
  </p>
</div>
```

Exibe `—` quando o recebimento não tem agendamento vinculado (ex: lançamentos manuais).

### 6. Limpeza do Estado

`setProfissionalModal(null)` é chamado em todos os pontos de fechamento do modal:
- Botão X (fechar)
- Botão "Fechar"
- Botão "Confirmar Pagamento" (que fecha o modal e abre o de confirmação)

---

## Comportamento

| Recebimento | Exibe Profissional? |
|---|---|
| Gerado automaticamente pela Agenda | Sim — busca via `observacoes: agendamento:{id}` |
| Lançado manualmente no Financeiro | Não — exibe `—` |
