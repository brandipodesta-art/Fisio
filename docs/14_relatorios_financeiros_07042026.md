# 14 — Aba de Relatórios Financeiros

**Data:** 07/04/2026  
**Arquivos alterados:**
- `src/components/RelatoriosPage.tsx` *(novo)*
- `src/components/TopBar.tsx`
- `src/app/page.tsx`

---

## Descrição

Criação da aba **Relatórios** no menu principal, visível exclusivamente para o perfil **Admin**.

---

## Filtros disponíveis

| Campo | Descrição |
|---|---|
| Tipo de Relatório | Financeiro (Clientes) ou Financeiro (Funcionários) |
| Data Inicial | Filtra por `data_vencimento >= data_inicial` |
| Data Final | Filtra por `data_vencimento <= data_final` |
| Cliente | Seleção de paciente (quando tipo = Clientes) |
| Funcionário | Seleção de profissional (quando tipo = Funcionários) |

O botão **Gerar Relatório** só é habilitado quando todos os campos obrigatórios estão preenchidos.

---

## Relatório 1 — Financeiro (Clientes): Pagamentos Mensais

- Exibe **Pagamentos Confirmados** e **Pagamentos Pendentes** em seções separadas
- Dentro de cada seção, os registros são agrupados por data (data de pagamento para confirmados, data de vencimento para pendentes)
- Colunas: Cliente, Vencimento, Data Pagamento, Procedimento, Valor, Profissional
- Subtotal por dia ao final de cada grupo
- Somatória total de confirmados, pendentes e total geral

---

## Relatório 2 — Financeiro (Funcionários): Pagamentos Mensais

- Exibe **Pagamentos Confirmados** e **Pagamentos Pendentes** em seções separadas
- Registros agrupados por data
- Colunas: Profissional, Procedimento, Data Proc., Data Pagto, Valor, Comissão, Cliente
- Quando há comissão configurada para o procedimento, exibe: `XX% = R$ YY,YY`
- Subtotal de valor e comissão por dia
- Somatória total de valor e total de comissão

---

## Cards de resumo

Ao gerar o relatório, três cards de resumo são exibidos:
- **Confirmados** (verde)
- **Pendentes** (âmbar)
- **Total Geral** (clientes) ou **Total Comissão** (funcionários)

---

## Permissões

- Aba visível apenas para **Admin** (controlado por `isAdmin` no `usePermissoes`)
- Funcionário e Financeiro não têm acesso à aba
