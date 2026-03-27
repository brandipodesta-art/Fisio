# Fix: Selects não abriam dentro de modais — 27/03/2026

## Problema

Os selects de **Procedimento**, **Categoria**, **Forma de Pagamento** e **Status** nos formulários de Recebimentos e Pagamentos apareciam visualmente (mostravam o placeholder), mas ao clicar **não abriam as opções**.

## Causa raiz

O `SelectContent` do Radix UI usa `SelectPrimitive.Portal` para renderizar o dropdown diretamente no `<body>`. Porém, o z-index padrão era `z-50` (Tailwind = 50), enquanto os modais dos formulários usam `z-[9999]`.

Como resultado, o dropdown era renderizado **atrás do overlay do modal**, tornando-o invisível e não-clicável para o usuário — mesmo que tecnicamente estivesse sendo aberto.

O mesmo problema afetava os menus de `DropdownMenu` (menu de ações `...` nos cards).

## Solução

Aumentado o z-index dos componentes Radix que renderizam via Portal:

| Arquivo | Componente | Antes | Depois |
|---|---|---|---|
| `src/components/ui/select.tsx` | `SelectContent` | `z-50` | `z-[10000]` |
| `src/components/ui/dropdown-menu.tsx` | `DropdownMenuContent` | `z-50` | `z-[10000]` |
| `src/components/ui/dropdown-menu.tsx` | `DropdownMenuSubContent` | `z-50` | `z-[10000]` |

O valor `z-[10000]` garante que os dropdowns fiquem sempre acima dos modais (`z-[9999]`).

## Arquivos alterados

- `src/components/ui/select.tsx`
- `src/components/ui/dropdown-menu.tsx`
