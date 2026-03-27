# 🛠️ Correções UX — 27/03/2026

> **Data:** 27/03/2026 · **Arquivos modificados:** `src/app/page.tsx`, `src/components/TopBar.tsx`, `src/components/FinanceiroRecebimentos.tsx`

---

## 1. Persistência de Página Ativa no Reload (`page.tsx`)

### Problema
Ao recarregar a página (F5 ou deploy), o usuário era sempre redirecionado para a aba **Cadastro**, perdendo o contexto de onde estava trabalhando.

### Solução
A aba ativa agora é salva no `localStorage` e restaurada ao recarregar.

```typescript
// Leitura na inicialização (lazy initializer)
const [activePage, setActivePage] = useState(() =>
  typeof window !== "undefined"
    ? (localStorage.getItem("fisio_active_page") ?? "cadastro")
    : "cadastro"
);

// Gravação a cada mudança
useEffect(() => {
  localStorage.setItem("fisio_active_page", activePage);
}, [activePage]);
```

**Chave usada:** `"fisio_active_page"`

---

## 2. Remoção de "Meu Perfil" sem destino (`TopBar.tsx`)

### Problema
O dropdown do usuário exibia um item **"Meu Perfil"** que não tinha funcionalidade implementada — clicando nele, nada acontecia. Isso gera confusão, especialmente para usuários pouco familiarizados com tecnologia.

### Solução
O item "Meu Perfil" foi removido completamente do dropdown. O ícone `User` do lucide-react (que só era usado por esse item) também foi removido do import.

**Antes:**
```typescript
import { ..., User, ... } from "lucide-react";
// ...
<DropdownMenuItem className="gap-2 cursor-pointer">
  <User className="w-4 h-4 text-muted-foreground" />
  <span>Meu Perfil</span>
</DropdownMenuItem>
<DropdownMenuSeparator />
```

**Depois:** Bloco removido. O dropdown agora exibe apenas Configurações (quando permitido) e Sair.

---

## 3. Substituição de `alert()` nativo por `toast.error()` (`FinanceiroRecebimentos.tsx`)

### Problema
As validações do formulário de recebimentos usavam `alert()` nativo do navegador, que:
- Bloqueia o thread da UI
- Tem aparência inconsistente com o restante do sistema
- É percebido como "erro grave" por usuários leigos, causando insegurança

### Solução
Migrado para `toast.error()` do **sonner**, consistente com todos os outros módulos do sistema.

```typescript
// Antes:
alert("Selecione o paciente antes de salvar.");

// Depois:
toast.error("Selecione o paciente antes de salvar.");
```

Validações migradas:
- Campo `paciente_id` vazio → `toast.error("Selecione o paciente antes de salvar.")`
- Campo `forma_pagamento_id` vazio → `toast.error("Selecione a forma de pagamento antes de salvar.")`

---

## Impacto

Essas três correções melhoram a experiência para profissionais de saúde com baixa afinidade tecnológica:

| Correção | Benefício |
|---|---|
| Persistência de página | Não perde o contexto ao recarregar — menor fricção no uso diário |
| Remoção de "Meu Perfil" | Elimina opção sem função — interface mais limpa e confiável |
| `toast` no lugar de `alert` | Feedback menos intrusivo e visualmente consistente |
