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
| `ClientesListagem` | Filtro de tipo oculta funcionario/admin/financeiro para Funcionário; botões Editar e Ativar/Desativar ocultos |
| `CadastroForm` | Select de tipoUsuario desabilitado e fixado em "paciente" para Funcionário |
| `HistoricoCliente` | Opções Confirmar Pagamento e Alterar ocultas para Funcionário |
