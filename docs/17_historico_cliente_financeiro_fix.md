# 🛠️ Correção: Aba Financeiro no Histórico do Cliente

> **Arquivos modificados:** 
> - `src/components/HistoricoCliente.tsx`
> - `src/components/CadastroLayout.tsx`

---

## O Problema

A aba "Financeiro" dentro do Histórico do Cliente estava sempre exibindo a mensagem "Nenhum registro financeiro", mesmo quando o paciente possuía recebimentos cadastrados no sistema.

A investigação revelou duas causas raízes para o problema:

1. **Falta de Contexto (Props):** O componente `HistoricoCliente` não estava recebendo o ID do paciente do seu componente pai (`CadastroLayout`).
2. **Tabela Incorreta:** A query do Supabase estava tentando buscar dados em uma tabela inexistente chamada `financeiro_paciente`, em vez de consultar a tabela oficial `recebimentos`.

---

## A Solução Implementada

### 1. Passagem do `pacienteId`
O componente `HistoricoCliente` foi refatorado para aceitar a prop `pacienteId`. O `CadastroLayout` foi atualizado para passar o `idCliente` ativo para o componente de histórico.

```tsx
// Antes (CadastroLayout.tsx)
<HistoricoCliente />

// Depois (CadastroLayout.tsx)
<HistoricoCliente pacienteId={idCliente} />
```

### 2. Atualização da Query no Supabase
A busca de dados financeiros foi corrigida para apontar para a tabela `recebimentos`, aplicando um filtro pelo `paciente_id` quando este é fornecido.

```tsx
// Antes (HistoricoCliente.tsx)
supabase.from('financeiro_paciente').select('*')

// Depois (HistoricoCliente.tsx)
let queryFinanceiro = supabase
  .from('recebimentos')
  .select('id, descricao, valor, data_vencimento, data_pagamento, status')
  .order('data_vencimento', { ascending: false });

if (pacienteId) {
  queryFinanceiro = queryFinanceiro.eq('paciente_id', pacienteId);
}
```

### 3. Mapeamento de Dados e Regras de Negócio
Para garantir que a interface do Histórico renderize corretamente os dados sem quebrar os totalizadores, as seguintes regras de mapeamento foram aplicadas no retorno da query:

- **Data de Exibição:** O sistema agora prioriza a `data_pagamento` (se o recebimento já foi pago). Caso seja nula, ele exibe a `data_vencimento`.
- **Mapeamento de Status:** A tabela `recebimentos` utiliza o status `"recebido"`, mas a interface do Histórico esperava `"pago"` para aplicar a cor verde corretamente. O mapeamento foi ajustado no frontend para converter `"recebido"` em `"pago"` durante a renderização.

```tsx
data: f.data_pagamento ?? f.data_vencimento,
status: (f.status === 'recebido' ? 'pago' : f.status) as 'pago' | 'pendente' | 'cancelado',
```

---

## Resultado

Agora, ao acessar a aba de Histórico de um paciente, o sistema carrega corretamente todos os recebimentos vinculados àquele CPF/ID, exibindo os cards individuais e calculando os totais (Pago, Pendente e Total Geral) de forma dinâmica.
