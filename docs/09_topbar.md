# 🔝 TopBar.tsx — Barra de Navegação Superior

> **Arquivo:** `src/components/TopBar.tsx` · **Diretiva:** `"use client"` · **Tipo:** Client Component

---

## Propósito

Barra de navegação fixa no topo da aplicação. Contém a logo à esquerda, links de navegação centralizados (Cadastro, Agenda, Financeiro) com controle de permissões por perfil, e menu do usuário à direita com opções de Configurações e Sair.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `Activity, Users, CalendarDays, DollarSign, LogOut, Settings, ChevronDown` | Ícones | `lucide-react` |
| `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger` | UI | `@/components/ui/dropdown-menu` |
| `useAuth` | Hook de autenticação | `@/lib/auth/AuthContext` |
| `usePermissoes` | Hook de permissões | `@/lib/auth/usePermissoes` |

---

## Interface: `TopBarProps`

| Prop | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `activePage` | `string` | Sim | Página atualmente ativa (`"cadastro"`, `"agenda"`, `"financeiro"`, `"configuracoes"`) |
| `onPageChange` | `(page: string) => void` | Sim | Callback quando um menu é clicado |

---

## Constante: `menuItems`

| Key | Label | Ícone | Visibilidade |
|---|---|---|---|
| `cadastro` | Cadastro | `Users` | Todos |
| `agenda` | Agenda | `CalendarDays` | Todos |
| `financeiro` | Financeiro | `DollarSign` | Oculto para perfil `"funcionario"` |

> Configurações é renderizada separadamente no menu do usuário (não no menu principal).

---

## Controle de Permissões

O menu **Financeiro** é ocultado para usuários com `tipo_usuario === "funcionario"`:

```typescript
const item = menuItems.filter(item => {
  if (item.key === "financeiro" && usuario?.tipo_usuario === "funcionario") return false;
  return true;
});
```

**Configurações** aparece apenas no dropdown do usuário, quando `podeVerConfiguracoes` retorna `true` (perfis Admin e Financeiro).

---

## Menu do Usuário (Dropdown)

Ícone avatar com iniciais do usuário no canto direito. Ao clicar, abre dropdown com:

| Item | Condição | Ação |
|---|---|---|
| Avatar + nome + email | Sempre | Exibição apenas |
| Configurações | `podeVerConfiguracoes` | Navega para `"configuracoes"` |
| Sair | Sempre | Chama `handleLogout()` → limpa sessão → recarrega |

> **"Meu Perfil"** foi removido em 27/03/2026 — era um link sem destino implementado.

---

## Estrutura UI

```
┌────────────────────────────────────────────────────────────────┐
│  bg-card  border-b  shadow-sm  sticky top-0 z-50               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  max-w-[1600px] mx-auto  h-16  flex justify-between      │  │
│  │                                                          │  │
│  │  ┌──────────┐   ┌────────────────────────┐   ┌────────┐  │  │
│  │  │ 🟢 Fisio │   │ Cadastro Agenda Financ │   │ [M] ▼  │  │  │
│  │  │  (logo)  │   │   (nav center)         │   │ avatar │  │  │
│  │  └──────────┘   └────────────────────────┘   └────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Logout

```typescript
function handleLogout() {
  sessionStorage.removeItem("fisio_usuario");
  setUsuario(null);
  window.location.reload();
}
```

---

## Notas para Edição Futura

- Para adicionar **novos menus**, insira um novo objeto no array `menuItems`
- O menu **Financeiro** usa lógica de ocultação por perfil — não desabilitado, oculto
- Para logo customizada, substitua o bloco do ícone `Activity` por `<Image>` do Next.js
- O componente é **sticky** — permanece visível ao rolar a página
- Responsividade: labels usam `hidden sm:inline` — só ícones em telas pequenas
