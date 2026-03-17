# 👥 Atualização: Ações Inline em Clientes Cadastrados

> **Arquivo modificado:** `src/components/ClientesListagem.tsx`

---

## Propósito da Alteração

A interface de listagem de clientes foi atualizada para melhorar a usabilidade e padronizar o design com os módulos financeiros (Recebimentos e Pagamentos). O menu suspenso (dropdown) oculto no avatar foi substituído por ícones de ação diretos e visíveis em cada card.

---

## O Que Mudou

### 1. Remoção do Dropdown Menu
- O componente `DropdownMenu` do shadcn/ui foi completamente removido da renderização dos cards de clientes.
- O avatar do usuário, que antes funcionava como um botão (trigger) para abrir o menu de ações, passou a ser apenas um elemento visual indicativo do status do paciente (verde para ativo, cinza para inativo).
- A opção de "Ativar/Desativar" o cliente foi temporariamente removida da interface principal para simplificar a visualização.

### 2. Inserção de Ícones Inline
Foram adicionados dois ícones de ação rápida alinhados à direita de cada card, mantendo o mesmo padrão visual e de interação já estabelecido no módulo Financeiro:

| Ícone | Ação Vinculada | Comportamento Visual |
|---|---|---|
| **👁 Eye (Olho)** | `onVisualizarCliente` | Ao passar o mouse, o ícone e o fundo mudam para tons de azul (`hover:text-blue-600 hover:bg-blue-50`), indicando uma ação de leitura/visualização. |
| **✏️ Pencil (Lápis)** | `onEditarCliente` | Ao passar o mouse, o ícone e o fundo mudam para tons de cinza escuro (`hover:text-slate-700 hover:bg-slate-100`), indicando uma ação de modificação. |

> **Nota:** O ícone de exclusão (Lixeira) **não** foi incluído nesta tela, garantindo que o histórico de pacientes não seja apagado acidentalmente diretamente da listagem principal.

---

## Impacto no Código

A alteração simplificou a árvore de componentes renderizada por cada card de cliente. As dependências do `lucide-react` foram limpas, removendo ícones não mais utilizados (`MoreVertical`, `PowerOff`, `Power`), e as importações relacionadas ao `dropdown-menu` foram deletadas.

A nova estrutura de ações ficou assim:

```tsx
{/* Ícones de ação */}
<div className="flex items-center gap-1 shrink-0">
  <button
    title="Visualizar"
    onClick={() => onVisualizarCliente?.(cliente)}
    className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
  >
    <Eye className="w-4 h-4" />
  </button>
  <button
    title="Editar"
    onClick={() => onEditarCliente?.(cliente)}
    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
  >
    <Pencil className="w-4 h-4" />
  </button>
</div>
```
