# Módulo de Configurações

## Visão Geral

A página de **Configurações** (`/configuracoes`) centraliza o gerenciamento de todos os parâmetros do sistema da clínica. Ela substitui as constantes hardcoded anteriores por dados dinâmicos armazenados no Supabase.

---

## Acesso

O item **Configurações** está disponível na barra de navegação principal (TopBar), ao lado dos módulos Cadastro, Agenda e Financeiro.

---

## Seções Disponíveis

### Recebimentos

| Seção | Tabela Supabase | Descrição |
|---|---|---|
| Tipos de Procedimentos | `procedimentos` | Gerencia os tipos de atendimento oferecidos pela clínica, com valor padrão por sessão |
| Formas de Pagamento — Recebimentos | `formas_pagamento` (tipo = `recebimento` ou `ambos`) | Formas aceitas para recebimento de pacientes (PIX, Cartão, etc.) |

### Pagamentos

| Seção | Tabela Supabase | Descrição |
|---|---|---|
| Categorias de Pagamento | `categorias_pagamento` | Categorias para classificação de despesas (Aluguel, Energia, etc.) |
| Formas de Pagamento — Despesas | `formas_pagamento` (tipo = `pagamento` ou `ambos`) | Formas utilizadas para pagar fornecedores e despesas |

### Profissionais

| Seção | Tabela Supabase | Descrição |
|---|---|---|
| Profissionais e Comissões | `profissionais` + `comissoes_profissional` | Cadastro de profissionais e percentual de comissão por procedimento |

---

## Estrutura das Tabelas

### `formas_pagamento`

```sql
id         UUID PRIMARY KEY
nome       TEXT NOT NULL
tipo       TEXT CHECK (tipo IN ('recebimento', 'pagamento', 'ambos'))
ativo      BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
```

### `categorias_pagamento`

```sql
id         UUID PRIMARY KEY
nome       TEXT NOT NULL
ativo      BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
```

### `profissionais`

```sql
id         UUID PRIMARY KEY
nome       TEXT NOT NULL
ativo      BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ DEFAULT NOW()
```

### `comissoes_profissional`

```sql
id               UUID PRIMARY KEY
profissional_id  UUID REFERENCES profissionais(id) ON DELETE CASCADE
procedimento_id  UUID REFERENCES procedimentos(id) ON DELETE CASCADE
percentual       NUMERIC(5,2) CHECK (percentual >= 0 AND percentual <= 100)
created_at       TIMESTAMPTZ DEFAULT NOW()
UNIQUE (profissional_id, procedimento_id)
```

---

## Configuração Inicial

Execute o script SQL em `docs/sql_configuracoes.sql` no **Supabase SQL Editor** para:

1. Adicionar coluna `valor_padrao` na tabela `procedimentos`
2. Criar tabela `formas_pagamento` com dados iniciais
3. Criar tabela `categorias_pagamento` com dados iniciais
4. Criar tabela `profissionais`
5. Criar tabela `comissoes_profissional`
6. Configurar RLS (Row Level Security) em todas as tabelas

---

## Funcionalidades de CRUD

Todas as seções oferecem:

- **Adicionar**: Botão "Novo" abre formulário inline na parte superior da lista
- **Editar**: Ícone de lápis (visível ao passar o mouse) abre formulário inline no lugar do item
- **Excluir**: Ícone de lixeira com confirmação inline (dois cliques para confirmar)
- **Estado inativo**: Itens marcados como inativos são exibidos com opacidade reduzida e badge "Inativo"

### Comissões por Profissional

A seção de Profissionais possui uma sub-lista expansível para cada profissional, onde é possível:

- Clicar no nome do profissional para expandir/recolher suas comissões
- Adicionar comissão: selecionar procedimento + percentual
- Editar percentual de comissão existente
- Excluir comissão

---

## Componentes

| Arquivo | Descrição |
|---|---|
| `src/components/ConfiguracoesPage.tsx` | Componente principal da página |
| `src/components/TopBar.tsx` | Barra de navegação (item Configurações adicionado) |
| `src/app/page.tsx` | Roteamento para renderizar `ConfiguracoesPage` |

---

## Hook `useCrud`

Hook genérico reutilizável para operações CRUD no Supabase:

```typescript
function useCrud<T extends { id: string }>(
  tabela: string,
  select?: string,
  orderBy?: string
)
```

Retorna: `{ itens, carregando, erro, carregar, inserir, atualizar, excluir }`

---

## Dados Iniciais Populados

### Formas de Pagamento

| Nome | Tipo |
|---|---|
| PIX | ambos |
| Dinheiro | ambos |
| Cartão de Crédito | recebimento |
| Cartão de Débito | recebimento |
| Transferência | ambos |
| Boleto | pagamento |
| Cheque | pagamento |

### Categorias de Pagamento

Aluguel, Água, Energia Elétrica, Internet, Telefone, Material de Escritório, Material de Limpeza, Equipamentos, Manutenção, Salários, Impostos, Contabilidade, Marketing, Outros.
