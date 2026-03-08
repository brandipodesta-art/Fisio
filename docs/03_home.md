# 🏠 Home.tsx — Página Principal

> **Arquivo:** `Home.tsx` · **Linhas:** 16 · **Tamanho:** 364 bytes

---

## Propósito

Página principal (rota raiz) da aplicação. Serve como wrapper que renderiza o `CadastroLayout`, o qual contém todo o sistema de abas.

---

## Dependências

| Import | Origem |
|---|---|
| `CadastroLayout` | `@/components/CadastroLayout` |

---

## Componente: `Home`

- **Tipo:** Componente funcional (function component)
- **Props:** Nenhuma
- **Export:** `default`

---

## Estrutura JSX

```
┌──────────────────────────────────────────────────┐
│  <div>  min-h-screen  flex  flex-col             │
│  ┌────────────────────────────────────────────┐   │
│  │  <main>                                    │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │  <CadastroLayout />                  │  │   │
│  │  │  (todo o conteúdo está aqui)         │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Estilização CSS/Tailwind

| Elemento | Classes | Efeito |
|---|---|---|
| `<div>` wrapper | `min-h-screen flex flex-col` | Ocupa 100% da viewport, layout vertical flexível |
| `<main>` | *(sem classes)* | Container semântico HTML5 |

---

## UI Renderizada

A página em si é apenas um container transparente. Todo o visual vem do `CadastroLayout`:

1. **Header** com título "Cadastro de Pacientes"
2. **Tabs** com 3 abas: Cadastro, Evolução, Histórico
3. **Conteúdo** da aba ativa

---

## Notas para Edição Futura

- Para adicionar um **navbar/sidebar**, insira antes do `<main>`
- Para adicionar um **footer**, insira após o `<main>`
- O `flex-col` permite que o `<main>` cresça verticalmente com `flex-1` se necessário
- Para adicionar **rotas**, substitua o conteúdo do `<main>` por um `<Router>` (React Router)
- Para um **layout com sidebar**, mude `flex-col` para `flex-row` e adicione uma `<aside>`
