# Alterações Pós-17/03/2026

Documentação de todas as melhorias implementadas após o doc `23_financeiro_ajustes_17032026.md`.

---

## 1. Dependências Adicionadas — `react-hook-form`, `@hookform/resolvers`, `zod`

**Commit:** `271a11a`

Instaladas as seguintes dependências para suportar o `CadastroForm.tsx` com validação de formulário:

| Pacote | Versão |
|---|---|
| `react-hook-form` | ^7.71.2 |
| `@hookform/resolvers` | ^5.2.2 |
| `zod` | ^4.3.6 |

**Motivo:** O arquivo `CadastroForm.tsx` local do usuário utiliza `useForm` do `react-hook-form` com `zodResolver`, que não estavam presentes no `package.json`.

---

## 2. CadastroForm — Ocultar Campo "Profissional Responsável" para Não-Pacientes

**Commit:** `ed8e970`  
**Arquivo:** `src/components/CadastroForm.tsx`

O campo **Profissional Responsável** agora é exibido **somente quando o tipo de usuário for "Paciente"**. Para os tipos Funcionário, Admin e Financeiro, o campo fica oculto.

**Lógica aplicada:**
```tsx
{formData.tipoUsuario === "paciente" && (
  <div>
    {/* campo Profissional Responsável */}
  </div>
)}
```

**Regra de negócio:** Profissional responsável é um vínculo exclusivo de pacientes — funcionários, admins e financeiros não precisam desse campo.

---

## 3. CadastroForm — Sincronização com Tabela `profissionais`

**Commit:** `71484e1`  
**Arquivo:** `src/components/CadastroForm.tsx`

Ao salvar um cadastro com tipo **Funcionário** ou **Financeiro**, o sistema automaticamente insere ou atualiza o registro na tabela `profissionais` do Supabase.

**Lógica de sincronização:**

| Campo | Valor gerado |
|---|---|
| `id` | Slug do nome (ex: `thais-almeida`) |
| `name` | Nome completo do cadastro |
| `short_name` | Abreviação (ex: `Thais A.`) |
| `color` | Cor da paleta rotativa (6 cores) |
| `bg_color` | Cor de fundo correspondente |

**Paleta de cores rotativa:**
```typescript
const CORES = [
  { color: "#7c3aed", bg_color: "#ede9fe" }, // violeta
  { color: "#0891b2", bg_color: "#cffafe" }, // ciano
  { color: "#059669", bg_color: "#d1fae5" }, // esmeralda
  { color: "#d97706", bg_color: "#fef3c7" }, // âmbar
  { color: "#dc2626", bg_color: "#fee2e2" }, // vermelho
  { color: "#7c3aed", bg_color: "#fce7f3" }, // rosa
];
```

**Comportamento:**
- **Novo cadastro:** `INSERT` com `onConflict: "id"` (upsert)
- **Edição de cadastro:** `UPDATE` na tabela `profissionais` com os dados atualizados
- Se o tipo for alterado de Funcionário/Financeiro para outro tipo, o registro em `profissionais` **não é removido** (preservação de histórico)

---

## 4. FinanceiroPagamentos — Filtros de Vencimento e Data do Pagamento

**Commit:** `71530ca`  
**Arquivo:** `src/components/FinanceiroPagamentos.tsx`

Adicionados dois novos filtros de intervalo de datas na seção de Pagamentos:

| Filtro | Campo no banco | Comportamento |
|---|---|---|
| **Vencimento** | `data_vencimento` | Filtra por intervalo De → Até |
| **Data do Pagamento** | `data_pagamento` | Filtra por intervalo De → Até |

**Estados adicionados:**
```typescript
const [filtroVencimentoDe, setFiltroVencimentoDe] = useState("");
const [filtroVencimentoAte, setFiltroVencimentoAte] = useState("");
const [filtroPagamentoDe, setFiltroPagamentoDe] = useState("");
const [filtroPagamentoAte, setFiltroPagamentoAte] = useState("");
```

**Lógica de filtragem:**
```typescript
if (filtroVencimentoDe) itens = itens.filter(p => p.data_vencimento >= filtroVencimentoDe);
if (filtroVencimentoAte) itens = itens.filter(p => p.data_vencimento <= filtroVencimentoAte);
if (filtroPagamentoDe)  itens = itens.filter(p => p.data_pagamento && p.data_pagamento >= filtroPagamentoDe);
if (filtroPagamentoAte) itens = itens.filter(p => p.data_pagamento && p.data_pagamento <= filtroPagamentoAte);
```

Cada filtro tem um botão **×** para limpar o intervalo rapidamente. Os filtros funcionam em conjunto com os já existentes (busca por texto, status e categoria).

---

## 5. Configurações — Seção "Alertas de E-mail"

**Commits:** `2a4aa97`, `23f9357`, `6802e45`, `73adacf`, `c0b7513`, `de79aa7`  
**Arquivo:** `src/components/ConfiguracoesPage.tsx`  
**Tabela nova:** `configuracoes_alertas`  
**API route nova:** `src/app/api/alertas/route.ts`

### 5.1 Nova tabela `configuracoes_alertas`

Criada para persistir as preferências de envio de alertas por e-mail.

```sql
CREATE TABLE IF NOT EXISTS public.configuracoes_alertas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            text        NOT NULL DEFAULT 'pagamentos_vencidos',
  ativo           boolean     NOT NULL DEFAULT true,
  email_destino   text        NOT NULL DEFAULT 'brandipodesta@gmail.com',
  email_remetente text        NOT NULL DEFAULT 'marpodesta@gmail.com',
  dias_semana     integer[]   NOT NULL DEFAULT '{1,2,3,4,5}',
  horario         time        NOT NULL DEFAULT '08:00:00',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**Convenção `dias_semana`:** `0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb`

### 5.2 Componente `SecaoAlertasEmail`

Nova seção em Configurações → Notificações com os seguintes controles:

| Campo | Tipo | Descrição |
|---|---|---|
| Toggle Ativo | Switch | Liga/desliga o alerta |
| Dias de Envio | Botões multi-select | Dias da semana para envio |
| Horário de Envio | `<input type="time">` | Hora do envio |
| E-mail de Destino | `<input type="email">` | Destinatário do alerta |
| E-mail Remetente | `<input type="email">` | Conta Gmail remetente |
| Botão Salvar | Button | Salva no Supabase com feedback |

### 5.3 Script de alerta diário (`/home/ubuntu/alerta_pagamentos.py`)

O script consulta a tabela `configuracoes_alertas` antes de enviar:
- Verifica se o alerta está `ativo`
- Verifica se o dia atual está nos `dias_semana` configurados
- Busca pagamentos vencidos no Supabase
- Envia e-mail HTML para `email_destino` usando `email_remetente` via Gmail SMTP

**Agendamento:** Diário às 8h (horário de Brasília) via Manus Scheduler.

**Credenciais SMTP:**
- Remetente: `marpodesta@gmail.com`
- Senha de app: configurada via variável de ambiente `GMAIL_APP_PASSWORD`

---

## 6. Configurações — Layout e Comportamento dos Cards

**Commits:** `6802e45`, `73adacf`, `c0b7513`, `de79aa7`  
**Arquivo:** `src/components/ConfiguracoesPage.tsx`

### 6.1 Cards fechados por padrão

O componente `Secao` foi ajustado para iniciar com `useState(false)` — todos os cards começam fechados ao abrir a página de Configurações.

**Antes:**
```typescript
const [aberta, setAberta] = useState(true);
```

**Depois:**
```typescript
const [aberta, setAberta] = useState(false);
```

### 6.2 Prop `iniciarFechada` no componente `Secao`

Adicionada prop opcional para controle individual por seção:
```typescript
function Secao({ titulo, icone, cor, children, iniciarFechada }: {
  iniciarFechada?: boolean;
  // ...
})
```

### 6.3 Layout final das seções

```
Configurações
├── [Grid 2 colunas]
│   ├── RECEBIMENTOS
│   │   ├── Tipos de Procedimentos
│   │   └── Formas de Pagamento — Recebimentos
│   └── PAGAMENTOS
│       ├── Categorias de Pagamento
│       └── Formas de Pagamento — Despesas
├── [Grid 2 colunas]
│   ├── PROFISSIONAIS
│   │   └── Profissionais e Comissões
│   └── NOTIFICAÇÕES
│       └── Alertas de E-mail
```

---

## 7. Resumo dos commits documentados neste arquivo

| Commit | Descrição |
|---|---|
| `271a11a` | chore: instalar react-hook-form, @hookform/resolvers e zod |
| `ed8e970` | feat: ocultar campo Profissional Responsável para tipos não-paciente |
| `71484e1` | feat: sincronizar Funcionário/Financeiro com tabela profissionais ao salvar cadastro |
| `71530ca` | feat: adicionar filtros de Vencimento e Data do Pagamento na seção Pagamentos |
| `2a4aa97` | feat: seção Alertas de E-mail em Configurações com dias, horário e e-mails configuráveis |
| `23f9357` | fix: seção Alertas de E-mail inicia fechada em Configurações |
| `6802e45` | fix: todos os cards de Configurações iniciam fechados |
| `73adacf` | fix: cards fechados por padrão e Notificações antes de Profissionais em Configurações |
| `c0b7513` | fix: Profissionais antes de Notificações em Configurações |
| `de79aa7` | feat: Profissionais e Notificações lado a lado em grid 2 colunas em Configurações |

---

## 8. Arquivos modificados/criados

| Arquivo | Tipo | Alteração |
|---|---|---|
| `package.json` | Modificado | react-hook-form, @hookform/resolvers, zod adicionados |
| `src/components/CadastroForm.tsx` | Modificado | Campo Profissional Responsável condicional + sync profissionais |
| `src/components/FinanceiroPagamentos.tsx` | Modificado | Filtros de Vencimento e Data do Pagamento |
| `src/components/ConfiguracoesPage.tsx` | Modificado | Seção Alertas de E-mail + cards fechados + layout grid |
| `src/app/api/alertas/route.ts` | Criado | API route GET para configurações de alertas |
| `docs/sql_configuracoes_alertas.sql` | Criado | Script SQL idempotente para tabela configuracoes_alertas |
| `/home/ubuntu/alerta_pagamentos.py` | Criado | Script de alerta diário com leitura de config do Supabase |
