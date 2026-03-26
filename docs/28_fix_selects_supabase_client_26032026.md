# Fix: Selects de Procedimentos, Categorias e Formas de Pagamento Vazios

**Data:** 26/03/2026  
**Commit:** a ser gerado  
**Tipo:** bugfix

## Problema

Os selects de **Procedimentos**, **Categoria de Pagamento** e **Forma de Pagamento** nos formulários de Recebimentos e Pagamentos apareciam vazios, mesmo com os dados cadastrados em Configurações.

## Causa Raiz

O `src/lib/supabase/client.ts` usava `createBrowserClient` do pacote `@supabase/ssr`, que é projetado para trabalhar com autenticação baseada em cookies (SSR/SSG). Este pacote **não é compatível** com a chave `sb_publishable_` do Supabase — ele espera uma chave JWT padrão (`eyJ...`).

Como resultado, todas as queries feitas via `createClient()` nos componentes React retornavam silenciosamente sem dados, sem lançar erro visível.

## Solução

### 1. Corrigido `src/lib/supabase/client.ts`

Substituído `createBrowserClient` do `@supabase/ssr` por `createClient` do `@supabase/supabase-js` (pacote padrão), que é compatível com qualquer formato de chave:

```ts
// Antes (com bug)
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(URL, KEY)
}

// Depois (corrigido)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export function createClient(): SupabaseClient<any, any, any> {
  // singleton para evitar múltiplas conexões
  return createSupabaseClient(URL, KEY)
}
```

### 2. Migrados hooks de `FinanceiroRecebimentos` e `FinanceiroPagamentos`

Como medida adicional de robustez, os hooks `useProcedimentos`, `useFormasPagamento` e `useLookups` foram migrados para usar `fetch` direto à API REST do Supabase, eliminando dependência do cliente SDK para operações de leitura simples.

### 3. Migrado `HistoricoCliente`

O `useEffect` de carregamento de dados foi migrado para usar `fetch` direto, com tratamento de erros explícito via `try/catch/finally`.

## Componentes Afetados

| Componente | Correção |
|---|---|
| `src/lib/supabase/client.ts` | Substituído `@supabase/ssr` por `@supabase/supabase-js` |
| `FinanceiroRecebimentos.tsx` | Hooks migrados para `fetch` direto |
| `FinanceiroPagamentos.tsx` | Hook `useLookups` migrado para `fetch` direto |
| `HistoricoCliente.tsx` | `useEffect` migrado para `fetch` direto |

## Impacto

Todos os componentes que usam `createClient()` (AgendaPage, AgendaNewEventDialog, CadastroForm, EvolucaoField, ClientesListagem, ConfiguracoesPage) agora funcionam corretamente com a chave `sb_publishable_`.
