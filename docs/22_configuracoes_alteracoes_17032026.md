# Configurações — Alterações em 17/03/2026

## Visão Geral

Módulo de Configurações criado e aprimorado ao longo do dia 17/03/2026. O componente principal é `src/components/ConfiguracoesPage.tsx`.

---

## 1. Criação do módulo de Configurações

### Componente principal
`src/components/ConfiguracoesPage.tsx`

### Navegação
- Item **Configurações** adicionado ao menu da `TopBar`
- Renderização condicional adicionada em `src/app/page.tsx`

### Seções implementadas

| Seção | Grupo | Tabela Supabase |
|---|---|---|
| Tipos de Procedimentos | Recebimentos | `procedimentos` |
| Formas de Pagamento — Recebimentos | Recebimentos | `formas_pagamento` (tipo: recebimento/ambos) |
| Categorias de Pagamento | Pagamentos | `categorias_pagamento` |
| Formas de Pagamento — Despesas | Pagamentos | `formas_pagamento` (tipo: pagamento/ambos) |
| Profissionais e Comissões | Profissionais | `profissionais` + `comissoes_profissional` |

---

## 2. Layout em duas colunas

O layout foi alterado para exibir as seções em duas colunas lado a lado:

- **Coluna esquerda**: Recebimentos (Tipos de Procedimentos + Formas de Pagamento — Recebimentos)
- **Coluna direita**: Pagamentos (Categorias + Formas de Pagamento — Despesas)
- **Linha completa abaixo**: Profissionais e Comissões

Em telas menores (mobile), as colunas se empilham automaticamente.

---

## 3. Exibição do Valor Padrão nos Procedimentos

O valor padrão de cada procedimento é exibido diretamente na linha da lista, sem necessidade de abrir o formulário de edição.

- Badge verde com ícone de lápis à direita do nome
- Procedimentos sem valor cadastrado exibem `—`
- Clicar no badge abre o formulário de edição

---

## 4. Validações de duplicidade e consistência

### 4.1 Nome duplicado em Formas de Pagamento
Ao inserir ou editar, o sistema verifica se já existe uma forma de pagamento com o mesmo nome (comparação case-insensitive). Exibe mensagem de erro inline.

### 4.2 Nome duplicado em Categorias de Pagamento
Mesma lógica aplicada às categorias.

### 4.3 Comissão acima de 100%
O formulário de comissão valida se o percentual está entre 0 e 100. Se ultrapassar, exibe mensagem de erro e bloqueia o salvamento.

### 4.4 Aviso antes de exclusão em cascata
- **Excluir profissional**: exibe aviso informando que todas as comissões vinculadas serão removidas
- **Excluir comissão**: exibe confirmação com o nome do procedimento

---

## 5. Filtro de procedimentos no select de comissões

Ao adicionar uma comissão para um profissional, o select de procedimentos exibe apenas os procedimentos que **ainda não foram cadastrados** para aquele profissional, evitando duplicidades.

---

## 6. Correção de compatibilidade com a tabela `profissionais`

A tabela `profissionais` já existia no banco com a coluna `name` (não `nome`). O componente foi adaptado para usar a estrutura real:

```typescript
interface Profissional {
  id: string;
  name: string;        // coluna real no banco
  short_name?: string;
  color?: string;
  // ...
}
```

---

## 7. Testes automatizados

Arquivo: `src/__tests__/validacoes-configuracoes.test.ts`
Funções testadas: `src/lib/validacoes-configuracoes.ts`

**46 testes passando com 100% de cobertura:**

| Grupo | Testes |
|---|---|
| Duplicidade — Formas de Pagamento | 8 |
| Duplicidade — Categorias | 5 |
| Mensagens de erro | 3 |
| Percentual de comissão | 10 |
| Procedimentos disponíveis | 5 |
| Nome obrigatório | 6 |
| Procedimento selecionado | 3 |
| Fluxos de integração | 4 |

**Comandos para executar os testes:**

```bash
npm test                  # Rodar todos os testes
npm run test:coverage     # Com relatório de cobertura
npm run test:watch        # Modo watch (desenvolvimento)
```
