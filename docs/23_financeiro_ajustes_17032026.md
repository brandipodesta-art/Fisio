# Financeiro e Ajustes Gerais — Alterações em 17/03/2026

## 1. Financeiro — Recebimentos (`FinanceiroRecebimentos.tsx`)

### 1.1 Procedimentos carregados do banco de dados

O hook `useProcedimentos` foi atualizado para buscar também o campo `valor_padrao`:

```typescript
interface ProcedimentoOpcao {
  nome: string;
  valor_padrao: number | null;
}
```

A query agora busca `nome, valor_padrao` em vez de apenas `nome`.

### 1.2 Preenchimento automático do Valor ao selecionar Procedimento

No modal **Novo Recebimento**, ao selecionar um procedimento no campo **Procedimento**, o campo **Valor (R$)** é preenchido automaticamente com o `valor_padrao` cadastrado em Configurações.

**Comportamento:**
- Se o procedimento tem `valor_padrao` cadastrado e maior que zero → campo Valor preenchido automaticamente
- Se o procedimento não tem `valor_padrao` → campo Valor permanece em branco para preenchimento manual
- O valor pode ser editado manualmente após o preenchimento automático

**Código da lógica:**
```typescript
onValueChange={v => {
  set("descricao", v);
  const proc = procedimentos.find(p => p.nome === v);
  if (proc && proc.valor_padrao !== null && proc.valor_padrao > 0) {
    set("valor", proc.valor_padrao);
  }
}}
```

### 1.3 Checkbox "Repete mensalmente" desabilitado sem Vencimento

O checkbox **Repete mensalmente** só é habilitado após o campo **Vencimento** ser preenchido.

**Comportamento:**
- **Vencimento vazio**: checkbox acinzentado, desabilitado, exibe *(preencha o vencimento primeiro)*
- **Vencimento preenchido**: checkbox habilitado normalmente

**Código:**
```tsx
<input
  type="checkbox"
  checked={repete}
  disabled={!form.data_vencimento}
  onChange={e => setRepete(e.target.checked)}
  className="w-4 h-4 accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
/>
```

---

## 2. Configuração do Next.js (`next.config.ts`)

O aviso de workspace root foi silenciado adicionando `outputFileTracingRoot`:

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
```

**Causa do aviso:** Existência de dois `package-lock.json` — um na pasta `Fisio` e outro na pasta pai `projeto-fisio`.

---

## 3. Resumo dos commits do dia 17/03/2026

| Commit | Descrição |
|---|---|
| `8090b54` | chore: silenciar aviso de workspace root com outputFileTracingRoot |
| `b5750c5` | feat: desabilitar checkbox Repete mensalmente até o Vencimento ser preenchido |
| `d93e66b` | feat: preencher valor automaticamente ao selecionar procedimento no Novo Recebimento |
| `c70190d` | test: adicionar testes automatizados para validações de Configurações |
| `e058335` | feat: validações de duplicidade e consistência nas Configurações |
| `9f10c78` | fix: filtrar procedimentos já cadastrados no select de comissões |
| `e86c038` | feat: layout de Configurações em duas colunas |
| `ffa030d` | feat: layout customizado para linha de procedimentos |
| `0fa77bd` | feat: exibir valor padrão do procedimento diretamente na lista |
| `e9417f0` | fix: adaptar ConfiguracoesPage para estrutura real da tabela profissionais |

---

## 4. Arquivos modificados/criados no dia

| Arquivo | Tipo | Alteração |
|---|---|---|
| `src/components/ConfiguracoesPage.tsx` | Modificado | Múltiplas melhorias (ver doc 22) |
| `src/components/FinanceiroRecebimentos.tsx` | Modificado | Procedimentos do banco + valor automático + checkbox |
| `src/components/TopBar.tsx` | Modificado | Item Configurações adicionado |
| `src/app/page.tsx` | Modificado | Renderização condicional do ConfiguracoesPage |
| `src/lib/validacoes-configuracoes.ts` | Criado | Funções de validação puras |
| `src/__tests__/validacoes-configuracoes.test.ts` | Criado | 46 testes automatizados |
| `next.config.ts` | Modificado | outputFileTracingRoot adicionado |
| `jest.config.js` | Criado | Configuração do Jest |
| `docs/21_supabase_alteracoes_17032026.md` | Criado | Documentação do banco |
| `docs/22_configuracoes_alteracoes_17032026.md` | Criado | Documentação das Configurações |
| `docs/23_financeiro_ajustes_17032026.md` | Criado | Este documento |
