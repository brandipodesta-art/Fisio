# 🎨 index.css — Design Tokens e Estilos Globais

> **Arquivo:** `index.css` · **Linhas:** 185 · **Tamanho:** 6.033 bytes

---

## Propósito

Define o design system completo da aplicação: importações do TailwindCSS, variáveis CSS (design tokens) para modo claro e escuro, estilos de base e componentes customizados.

---

## Imports

```css
@import "tailwindcss";
@import "tw-animate-css";
```

- `tailwindcss` — Framework CSS utilitário (v4)
- `tw-animate-css` — Animações CSS para Tailwind

---

## Custom Variant

```css
@custom-variant dark (&:is(.dark *));
```

Ativa o modo escuro via classe `.dark` no elemento pai.

---

## Design Tokens (`@theme inline`)

Mapeia variáveis CSS customizadas para tokens do Tailwind:

| Token Tailwind | Variável CSS |
|---|---|
| `--color-background` | `var(--background)` |
| `--color-foreground` | `var(--foreground)` |
| `--color-primary` | `var(--primary)` |
| `--color-secondary` | `var(--secondary)` |
| `--color-muted` | `var(--muted)` |
| `--color-accent` | `var(--accent)` |
| `--color-destructive` | `var(--destructive)` |
| `--color-card` | `var(--card)` |
| `--color-popover` | `var(--popover)` |
| `--color-border` | `var(--border)` |
| `--color-input` | `var(--input)` |
| `--color-ring` | `var(--ring)` |
| `--color-chart-1..5` | `var(--chart-1..5)` |
| `--color-sidebar` | `var(--sidebar)` |
| `--radius-sm/md/lg/xl` | Calculados a partir de `--radius` |

---

## Modo Claro (`:root`)

| Token | Valor OKLCH | Cor Aproximada |
|---|---|---|
| `--primary` | `oklch(0.515 0.195 142.5)` | 🟢 Verde Esmeralda |
| `--primary-foreground` | `oklch(1 0 0)` | ⚪ Branco |
| `--background` | `oklch(1 0 0)` | ⚪ Branco |
| `--foreground` | `oklch(0.11 0.008 65)` | ⚫ Quase Preto |
| `--secondary` | `oklch(0.97 0.001 286)` | 🔘 Cinza muito claro |
| `--muted` | `oklch(0.943 0.002 286)` | 🔘 Cinza claro |
| `--muted-foreground` | `oklch(0.55 0.016 286)` | 🔘 Cinza médio |
| `--accent` | `oklch(0.515 0.195 142.5)` | 🟢 Verde Esmeralda |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 🔴 Vermelho |
| `--border` | `oklch(0.92 0.004 286.32)` | 🔘 Cinza muito claro |
| `--input` | `oklch(0.96 0.002 286)` | 🔘 Cinza claríssimo |
| `--ring` | `oklch(0.515 0.195 142.5)` | 🟢 Verde Esmeralda |
| `--radius` | `0.5rem` | Border radius base (8px) |

---

## Modo Escuro (`.dark`)

| Token | Valor | Cor Aproximada |
|---|---|---|
| `--primary` | `var(--color-blue-700)` | 🔵 Azul Escuro |
| `--primary-foreground` | `var(--color-blue-50)` | 🔵 Azul muito claro |
| `--background` | `oklch(0.141 0.005 285.823)` | ⚫ Preto azulado |
| `--foreground` | `oklch(0.85 0.005 65)` | ⚪ Cinza claro |
| `--card` | `oklch(0.21 0.006 285.885)` | ⚫ Cinza muito escuro |
| `--border` | `oklch(1 0 0 / 10%)` | Branco 10% opacidade |
| `--input` | `oklch(1 0 0 / 15%)` | Branco 15% opacidade |
| `--destructive` | `oklch(0.704 0.191 22.216)` | 🔴 Vermelho claro |
| `--ring` | `oklch(0.488 0.243 264.376)` | 🔵 Azul vibrante |

> **Nota:** No modo escuro, a paleta muda de verde esmeralda para azul.

---

## Layer: Base

```css
@layer base {
  * { @apply border-border outline-ring/50; }
  body {
    @apply bg-background text-foreground font-sans;
    font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  h1..h6 { @apply font-semibold; }
  /* Elementos interativos: cursor-pointer quando não disabled */
  button, [role="button"], a[href], select, input[checkbox], input[radio] {
    @apply cursor-pointer;
  }
}
```

---

## Layer: Components

### `.container`

Container responsivo com padding crescente:

| Breakpoint | Padding | Max-width |
|---|---|---|
| Mobile (< 640px) | `1rem` (16px) | `100%` |
| Tablet (≥ 640px) | `1.5rem` (24px) | `100%` |
| Desktop (≥ 1024px) | `2rem` (32px) | `1280px` |

### `.flex`

```css
.flex { min-height: 0; min-width: 0; }
```

Previne overflow em layouts flex.

### `.card-minimal`

```css
.card-minimal { @apply bg-white border border-border rounded-lg shadow-sm p-6; }
```

Card base com fundo branco, borda, cantos arredondados, sombra sutil e padding interno.

---

## Notas para Edição Futura

- Para mudar a cor principal do tema claro, altere `--primary` em `:root` (atualmente verde esmeralda)
- Para mudar a cor principal do tema escuro, altere `--primary` em `.dark` (atualmente azul)
- O `--radius` base de `0.5rem` é usado para calcular `sm`, `md`, `lg` e `xl`
- Os tokens `--chart-1..5` são todos iguais no modo claro — diferenciar para melhor visualização em gráficos
- A classe `.container` sobreescreve o container padrão do Tailwind
