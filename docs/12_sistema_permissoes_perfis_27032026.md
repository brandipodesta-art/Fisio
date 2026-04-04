# Sistema de Permissões por Perfil

**Data:** 27/03/2026  
**Commit:** pendente  
**Arquivos modificados:**
- `src/lib/auth/usePermissoes.ts` (novo)
- `src/components/TopBar.tsx`
- `src/components/CadastroForm.tsx`
- `src/components/ClientesListagem.tsx`
- `src/components/HistoricoCliente.tsx`

---

## Visão Geral

Implementação de controle de acesso por perfil em todo o sistema, utilizando o hook centralizado `usePermissoes`.

---

## Hook `usePermissoes`

Arquivo: `src/lib/auth/usePermissoes.ts`

Lê o `tipo_usuario` da sessão via `useAuth()` e expõe flags booleanas:

| Flag | Admin | Financeiro | Funcionário |
|---|---|---|---|
| `podeVerConfiguracoes` | ✅ | ❌ | ❌ |
| `podeVerUsuariosSistema` | ✅ | ✅ | ❌ |
| `podeSelecionarTipoUsuario` | ✅ | ✅ | ❌ |
| `podeEditarCadastro` | ✅ | ✅ | ❌ |
| `podeAlternarStatus` | ✅ | ✅ | ❌ |
| `podeConfirmarPagamento` | ✅ | ✅ | ❌ |
| `podeAlterarRecebimento` | ✅ | ✅ | ❌ |
| `podeVerFinanceiro` | ✅ | ✅ | ❌ |

---

## Permissões por Perfil

### Funcionário
- **Menu:** Cadastro e Agenda visíveis; Financeiro **oculto**
- **Configurações:** não visível
- **Cadastro / Listagem:** vê apenas Pacientes (funcionario/admin/financeiro filtrados)
- **Cadastro / Formulário:** campo Tipo de Usuário fixado em "Paciente" (desabilitado); sem opções de outros tipos
- **Cadastro / Ações:** apenas Visualizar (sem Editar, sem Ativar/Desativar)
- **Histórico / Financeiro:** apenas Visualizar (sem Confirmar Pagamento, sem Alterar)

### Admin
- Acesso total a todas as funcionalidades e Configurações

### Financeiro
- Acesso total exceto Configurações
- Vê e gerencia todos os tipos de usuário
- Acesso completo ao módulo Financeiro

---

## Pontos de Controle

| Componente | Controle Aplicado |
|---|---|
| `TopBar` | Menu Financeiro oculto para Funcionário; Configurações apenas para Admin |
| `page.tsx` | Guard duplo: `useEffect` redireciona para "cadastro" se `activePage` salvo no `localStorage` não for permitido para o perfil; renderização condicional impede exibição mesmo por um frame |
| `ClientesListagem` | Filtro de tipo oculta funcionario/admin/financeiro para Funcionário; botões Editar e Ativar/Desativar ocultos |
| `CadastroForm` | Select de tipoUsuario desabilitado e fixado em "paciente" para Funcionário |
| `HistoricoCliente` | Opções Confirmar Pagamento e Alterar ocultas para Funcionário |

---

## Correção: Acesso indevido via localStorage (04/04/2026)

**Problema:** O `activePage` era persistido no `localStorage`. Se um usuário com acesso ao Financeiro saía e um Funcionário fazia login, a página "financeiro" era renderizada antes de qualquer checagem de permissão, expondo dados financeiros brevemente.

**Causa raiz:** Proteção existia apenas na `TopBar` (ocultando o menu), mas não no nível de renderização da página.

**Solução aplicada em `src/app/page.tsx`:**
- Importado `usePermissoes`
- `useEffect` que observa `activePage` + permissões: redireciona imediatamente para "cadastro" se a página ativa não for permitida (e limpa o `localStorage`)
- Guard direto na renderização: `{activePage === "financeiro" && podeVerFinanceiro && <FinanceiroPage />}` — garante que nenhum dado seja exibido mesmo que o `useEffect` não tenha executado ainda
