# 🏗️ layout.tsx — Root Layout (Next.js App Router)

> **Arquivo:** `src/app/layout.tsx` · **Tipo:** Server Component

---

## Propósito

Root Layout do Next.js App Router. Substitui o antigo `index.html` + `main.tsx` do Vite. Responsável por definir a estrutura HTML base, carregar a fonte Geist Sans via `next/font`, configurar metadata SEO e renderizar o Toaster de notificações.

---

## Estrutura Completa

### Imports

| Import | Origem | Uso |
|---|---|---|
| `Metadata` | `next` | Tipo para metadata SEO |
| `Geist` | `next/font/google` | Carregamento otimizado da fonte |
| `./globals.css` | Local | Design Tokens e estilos globais |
| `Toaster` | `sonner` | Componente de notificações toast |

### Fonte: Geist Sans

```typescript
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

- Carregada via `next/font/google` (sem link externo, auto-hosted)
- Injeta CSS variable `--font-geist-sans` usada pelo `globals.css`
- Subsets: apenas latin para otimizar tamanho

### Metadata SEO

| Campo | Valor |
|---|---|
| `title` | `Clínica de Fisioterapia - Sistema de Cadastro` |
| `description` | Sistema de cadastro de pacientes, evolução clínica, histórico e agenda |

### Body

- Classes: `${geistSans.variable} antialiased`
- Filhos: `{children}` (conteúdo da página) + `<Toaster richColors position="top-right" />`

---

## UI Visual

```
┌──────────────────────────────────────────────────┐
│  <html lang="pt-BR">                             │
│  ┌────────────────────────────────────────────┐   │
│  │  <head> (gerenciado automaticamente)       │   │
│  │  · meta charset, viewport                  │   │
│  │  · title + description (via metadata)      │   │
│  │  · Geist Sans (auto-hosted por next/font)  │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  <body>                                    │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  {children}                          │  │   │
│  │  │  ← page.tsx renderiza aqui           │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  │  <Toaster richColors position="top-right"> │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Diferenças em relação ao antigo index.html + main.tsx

| Aspecto | Antes (Vite) | Agora (Next.js) |
|---|---|---|
| Entrada HTML | `index.html` manual | `layout.tsx` gera HTML automaticamente |
| Fonte | Link externo Google Fonts | `next/font/google` (auto-hosted, zero CLS) |
| Root mount | `ReactDOM.createRoot(#root)` | App Router automático |
| Toaster | Dentro de `main.tsx` | Dentro de `layout.tsx` |
| Analytics | Script `<script defer>` com vars Vite | Removido (migrar para Vercel Analytics) |
| SEO | Tag `<title>` manual | Export `metadata` do Next.js |

---

## Notas para Edição Futura

- Para adicionar Vercel Analytics, instale `@vercel/analytics` e adicione `<Analytics />` no body
- Para alterar a fonte, modifique o import de `Geist` e atualize a variable CSS em `globals.css`
- Para adicionar metadata OG/Twitter, expanda o objeto `metadata`
- Este é um **Server Component** — não pode usar hooks React ou event handlers
