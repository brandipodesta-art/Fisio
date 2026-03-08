# 📄 index.html — Ponto de Entrada HTML

> **Arquivo:** `index.html` · **Linhas:** 25 · **Tamanho:** 763 bytes

---

## Propósito

Arquivo HTML raiz que serve como ponto de entrada da aplicação React/Vite. Carrega a fonte tipográfica, define metadados e monta o container `#root` onde o React renderiza a aplicação.

---

## Estrutura Completa

### `<head>`

| Elemento | Detalhes |
|---|---|
| `charset` | UTF-8 |
| `viewport` | `width=device-width, initial-scale=1.0, maximum-scale=1` — impede zoom em mobile |
| `<title>` | `Clínica de Fisioterapia - Sistema de Cadastro` |
| **Google Fonts** | Preconnect para `fonts.googleapis.com` e `fonts.gstatic.com` |
| **Fonte carregada** | `Geist Sans` com pesos `400, 500, 600, 700` |

### `<body>`

| Elemento | Detalhes |
|---|---|
| `<div id="root">` | Container onde o React monta toda a aplicação via `ReactDOM.createRoot` |
| `<script type="module">` | Carrega `/src/main.tsx` — o ponto de entrada do React |
| `<script defer>` | **Umami Analytics** — usa variáveis de ambiente Vite: `%VITE_ANALYTICS_ENDPOINT%` e `%VITE_ANALYTICS_WEBSITE_ID%` |

---

## UI Visual

Este arquivo **não possui elementos visuais próprios**. Ele serve apenas como container HTML para a aplicação React.

```
┌──────────────────────────────────────────────────┐
│  <html>                                          │
│  ┌────────────────────────────────────────────┐   │
│  │  <head>                                    │   │
│  │  · meta charset=UTF-8                      │   │
│  │  · meta viewport                           │   │
│  │  · title: Sistema de Cadastro              │   │
│  │  · Google Fonts: Geist Sans                │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │  <body>                                    │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  <div id="root">                     │  │   │
│  │  │  ← React monta tudo aqui             │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  │  · main.tsx (módulo ES)                    │   │
│  │  · Umami Analytics (defer)                 │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Variáveis de Ambiente Necessárias

| Variável | Uso |
|---|---|
| `VITE_ANALYTICS_ENDPOINT` | URL do servidor Umami Analytics |
| `VITE_ANALYTICS_WEBSITE_ID` | ID do site no Umami |

---

## Notas para Edição Futura

- Para alterar a fonte, modifique o link do Google Fonts E o `font-family` em `index.css`
- O `maximum-scale=1` no viewport impede zoom — remover se quiser permitir zoom em mobile
- As variáveis `%VITE_...%` são substituídas em tempo de build pelo Vite
