# Toast — Padrão de Notificações do Sistema

Componente: [`src/components/ui/AppToaster.tsx`](../src/components/ui/AppToaster.tsx)
Aplicado globalmente em: [`src/app/layout.tsx`](../src/app/layout.tsx)

## Filosofia

Toasts do FisioSys são **discretos e não-intrusivos**. Eles informam sem
sobrepor a interface com cores fortes. O fundo é sempre branco (cor do card
do sistema) e apenas a **bolinha do ícone** carrega a cor da severidade.

## Anatomia

```
┌─────────────────────────────────────────────┐
│  ●  Título da mensagem                  ✕   │  ← fundo branco, sombra suave
│     Descrição opcional em texto cinza        │
└─────────────────────────────────────────────┘
   ↑
   Bolinha 24px com ícone branco dentro
```

| Variante | Cor da bolinha | Ícone   | Quando usar                                |
| -------- | -------------- | ------- | ------------------------------------------ |
| success  | `emerald-500`  | Check   | Operação concluída (salvar, criar, deletar) |
| error    | `red-500`      | X       | Falha (erro de rede, validação, permissão)  |
| warning  | `amber-500`    | Alert   | Atenção (dados parciais, ação reversível)   |
| info     | `sky-500`      | Info    | Informativo neutro                          |

## Como usar

A API é a mesma do `sonner`. Não precisa importar nada novo — qualquer
chamada de `toast.*` no projeto herda este visual automaticamente.

```ts
import { toast } from "sonner";

toast.success("Agendamento criado com sucesso!");
toast.error("Erro ao salvar. Tente novamente.");
toast.warning("Procedimento sem valor cadastrado.");
toast.info("Lembrete: paciente está na lista de espera.");

// Com descrição:
toast.success("Pagamento confirmado", {
  description: "R$ 250,00 — Pilates · Cartão de Crédito",
});
```

## Posicionamento e duração

- **Posição**: `top-right` (canto superior direito)
- **Duração**: 4 segundos (auto-dismiss)
- **Botão de fechar**: sempre visível (canto superior direito do toast)

## Customizações desativadas

- `richColors` do sonner foi **removido** — ele aplica fundos coloridos
  cheios (verde, vermelho, amarelo), que conflita com o nosso padrão de
  fundo branco.

## Acessibilidade

- O ícone tem `strokeWidth={3}` para contraste forte sobre a bolinha colorida
- Texto sempre em `foreground` para garantir contraste AA mesmo em modo escuro
- `aria-live` é gerenciado pelo próprio sonner (region polite)

## Onde NÃO usar toast

- **Confirmações destrutivas** → use `ConfirmActionDialog` (apagar, cancelar)
- **Erros de formulário inline** → mostre próximo ao campo
- **Status persistente** (paciente inativo, agenda bloqueada) → use banner/badge
