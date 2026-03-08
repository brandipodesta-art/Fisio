# 📈 EvolucaoField.tsx — Campo de Evolução Clínica

> **Arquivo:** `EvolucaoField.tsx` · **Linhas:** 178 · **Tamanho:** 6.029 bytes

---

## Propósito

Componente para registrar e visualizar a evolução clínica do paciente. Permite adicionar novas evoluções que são salvas com data/hora e **não podem ser editadas depois** (apenas deletadas). Funciona como um registro cronológico imutável.

---

## Dependências

| Import | Tipo | Origem |
|---|---|---|
| `useState` | React Hook | `react` |
| `Button` | UI Component | `@/components/ui/button` |
| `Card` | UI Component | `@/components/ui/card` |
| `Textarea` | UI Component | `@/components/ui/textarea` |
| `Plus, Lock, Trash2` | Ícones | `lucide-react` |
| `toast` | Notificações | `sonner` |

---

## Interface: `Evolucao`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | ID único (timestamp em ms) |
| `texto` | `string` | Descrição da evolução clínica |
| `dataSalva` | `string` | Data no formato DD/MM/AAAA |
| `horaSalva` | `string` | Hora no formato HH:MM:SS |

---

## Estado Interno

| Estado | Tipo | Valor Inicial | Descrição |
|---|---|---|---|
| `evolucoes` | `Evolucao[]` | `[]` | Lista de evoluções salvas |
| `textoAtual` | `string` | `""` | Texto sendo digitado no form |
| `showForm` | `boolean` | `false` | Controla visibilidade do formulário |

---

## Funções

### `formatarDataHora(): { data: string; hora: string }`
- Captura data/hora atual do sistema
- Retorna objeto com `data` (DD/MM/AAAA) e `hora` (HH:MM:SS)
- Usa `padStart(2, "0")` para garantir 2 dígitos

### `handleSalvarEvolucao()`
1. Valida se `textoAtual` não está vazio
2. Gera `id` com `Date.now().toString()`
3. Formata data e hora
4. Adiciona nova evolução **no início** do array (mais recente primeiro)
5. Limpa `textoAtual` e esconde o formulário
6. Exibe toast de sucesso

### `handleDeletarEvolucao(id: string)`
1. Filtra o array removendo a evolução com o `id` correspondente
2. Exibe toast de confirmação

---

## Estrutura UI — Diagrama Visual

### Estado Inicial (sem formulário visível)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │  [+ Adicionar Nova Evolução]                       │   │
│  │  bg-emerald-600 hover:bg-emerald-700               │   │
│  │  w-full  text-white                                │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
│  Histórico de Evoluções (0)                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │  "Nenhuma evolução registrada ainda."              │   │
│  │  Card text-center text-slate-500                   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Estado com formulário aberto

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ╔══════════════════════════════════════════════════════╗ │
│  ║  Card bg-emerald-50  border-slate-200               ║ │
│  ║                                                     ║ │
│  ║  h3: "Nova Evolução"                               ║ │
│  ║  text-lg font-semibold text-slate-900               ║ │
│  ║                                                     ║ │
│  ║  Descrição da Evolução do Paciente *                ║ │
│  ║  ┌──────────────────────────────────────────────┐   ║ │
│  ║  │  <Textarea>                                  │   ║ │
│  ║  │  min-h-32 resize-none border-slate-200       │   ║ │
│  ║  │  placeholder: "Descreva a evolução..."       │   ║ │
│  ║  │                                              │   ║ │
│  ║  │                                              │   ║ │
│  ║  └──────────────────────────────────────────────┘   ║ │
│  ║  0 caracteres                                       ║ │
│  ║  text-xs text-slate-500                             ║ │
│  ║                                                     ║ │
│  ║                    [Cancelar] [Salvar Evolução]     ║ │
│  ╚══════════════════════════════════════════════════════╝ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Estado com evoluções salvas

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [+ Adicionar Nova Evolução]                             │
│                                                          │
│  Histórico de Evoluções (2)                              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │  🔒 Evolução #2                          [🗑️]     │   │
│  │  15/02/2026 às 14:30:22                            │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  bg-slate-50 rounded-lg p-4 border           │  │   │
│  │  │  "Texto da evolução mais recente..."         │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  🔒 Este registro não pode ser editado             │   │
│  └────────────────────────────────────────────────────┘   │
│  hover:shadow-md transition-shadow                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐   │
│  │  🔒 Evolução #1                          [🗑️]     │   │
│  │  14/02/2026 às 10:15:05                            │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  "Texto da evolução anterior..."             │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  🔒 Este registro não pode ser editado             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Detalhes de Estilização

### Botão "Adicionar Nova Evolução"

| Propriedade | Valor |
|---|---|
| Largura | `w-full` |
| Fundo | `bg-emerald-600 hover:bg-emerald-700` |
| Texto | `text-white` |
| Ícone | `Plus` (w-4 h-4) alinhado com `flex items-center gap-2` |

### Card do Formulário

| Propriedade | Valor |
|---|---|
| Fundo | `bg-emerald-50` — verde muito claro |
| Borda | `border-slate-200` |
| Sombra | `shadow-sm` |
| Padding | `p-6` |

### Textarea

| Propriedade | Valor |
|---|---|
| Altura mínima | `min-h-32` (128px) |
| Resize | `resize-none` (desabilitado) |
| Borda | `border-slate-200` |

### Card de Evolução Salva

| Propriedade | Valor |
|---|---|
| Padding | `p-6` |
| Borda | `border-slate-200` |
| Sombra | `shadow-sm` → `hover:shadow-md` |
| Transição | `transition-shadow` |

### Ícone de Cadeado (Lock)

| Uso | Tamanho | Cor |
|---|---|---|
| No header do card | `w-4 h-4` | `text-emerald-600` |
| No rodapé do card | `w-3 h-3` | Herdado de `text-slate-500` |

### Botão de Deletar

| Propriedade | Valor |
|---|---|
| Variante | `ghost` + `size="sm"` |
| Cor | `text-red-600 hover:text-red-700` |
| Fundo hover | `hover:bg-red-50` |
| Ícone | `Trash2` (w-4 h-4) |

### Texto da Evolução

| Propriedade | Valor |
|---|---|
| Container | `bg-slate-50 rounded-lg p-4 border border-slate-200` |
| Texto | `text-slate-700 whitespace-pre-wrap text-sm leading-relaxed` |

---

## Notas para Edição Futura

- **Persistência:** Dados armazenados apenas em estado React — perdem-se ao recarregar a página. Precisa integrar com backend/banco de dados
- **Contradição na UI:** O texto diz "não pode ser editado" mas o botão de **deletar** existe — se realmente imutável, remover o botão de excluir
- **ID gerado:** Usa `Date.now()` — pode colidir se 2 evoluções forem salvas no mesmo milissegundo (improvável mas possível). Considerar `crypto.randomUUID()`
- **Paginação:** Sem limite de evoluções na lista — considerar paginação se paciente tiver muitas evoluções
- **Busca/filtro:** Não há como buscar ou filtrar evoluções — útil para pacientes com muitos registros
- **Impressão:** Considerar botão para exportar/imprimir evoluções
