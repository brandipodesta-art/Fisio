# Fix: Centralização de Modais — 26/03/2026

## Problema

Os modais de "Visualizar" e formulários em `FinanceiroRecebimentos` e `FinanceiroPagamentos`
apareciam fora do centro da tela quando a página estava scrollada, pois o `z-index` era baixo
(z-50 = 50) e o container interno não tinha `max-h` + `overflow-y-auto`.

## Causa Raiz

O `position: fixed` em CSS é relativo ao **viewport**, mas pode se comportar de forma
inesperada quando algum ancestral tem `transform`, `filter` ou `will-change` aplicados.
Além disso, o `z-index: 50` do Tailwind pode ser sobreposto por outros elementos.

## Solução Aplicada

Em todos os modais customizados dos componentes financeiros:

1. **`z-index` elevado para `z-[9999]`** — garante que o overlay fique acima de qualquer elemento
2. **`style={{position:'fixed',top:0,left:0,right:0,bottom:0}}`** — força o posicionamento
   correto mesmo quando há ancestrais com `transform`
3. **`max-h-[90vh] overflow-y-auto`** no container interno — garante que o modal não ultrapasse
   a altura da tela e seja scrollável internamente

## Arquivos Modificados

| Arquivo | Modais corrigidos |
|---|---|
| `FinanceiroRecebimentos.tsx` | FormModal (Novo/Editar) + Modal de Visualização |
| `FinanceiroPagamentos.tsx` | FormModal (Novo/Editar) + Modal de Duplicidade + Modal de Visualização |

## Padrão Adotado

```tsx
// Overlay — cobre toda a tela
<div
  className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
>
  {/* Container do modal — centralizado, com scroll interno */}
  <div className="bg-popover rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
    {/* conteúdo */}
  </div>
</div>
```

> O `ConfirmDeleteDialog` usa o componente `Dialog` do shadcn/ui, que já usa
> `translate-x[-50%] translate-y[-50%]` e não foi afetado.
