# 15 — Melhoria Visual do PDF de Relatórios Financeiros

**Data:** 07/04/2026  
**Arquivo alterado:** `src/components/RelatoriosPage.tsx`

---

## Objetivo

Reescrever a função `exportarPDF` para que o PDF gerado replique fielmente o layout visual da tela de relatórios, incluindo hierarquia de seções, cores, subtotais e totais.

---

## Mudanças Implementadas

### Cabeçalho do Documento

- Faixa verde (`green-600`) cobrindo toda a largura da página
- Título do relatório em branco, negrito, 14pt
- Período do relatório em branco, 9pt
- Data/hora de geração alinhada à direita

### Cards de Resumo (topo do relatório)

Três cards lado a lado replicando os cards da tela:

| Card | Cor | Conteúdo |
|------|-----|----------|
| Confirmados | Verde (`green-50` + borda `green-600`) | Total de pagamentos confirmados |
| Pendentes | Âmbar (`amber-50` + borda `amber-600`) | Total de pagamentos pendentes |
| Total Geral / Total Comissão | Cinza / Esmeralda | Dependendo do tipo de relatório |

### Seções com Banners Coloridos

Cada seção principal possui um banner com fundo colorido:

- **Pagamentos Confirmados** → banner `green-600` com texto branco
- **Pagamentos Pendentes** → banner `amber-600` com texto branco

### Agrupamento por Profissional (Relatório de Funcionários)

- **Banner de profissional** → fundo `blue-100`, texto `blue-800`, com seta `▸` e contagem de registros
- Para a seção de Pendentes, o banner usa `amber-50` com texto `amber-600`

### Agrupamento por Data

- **Banner de data** → fundo `slate-50`, texto `slate-500`, com contagem de registros à direita
- Tabela de itens com cabeçalho `slate-50`, linhas alternadas `slate-100`
- Linha de subtotal do dia com fundo colorido (verde ou âmbar conforme a seção)

### Colunas das Tabelas

**Clientes:**
| Cliente | Vencimento | Pagamento | Procedimento | Valor | Profissional |

**Funcionários:**
| Profissional | Procedimento | Data Proc. | Data Pagto | Valor | Comissão | Cliente |

A coluna de Comissão exibe `XX% = R$ YY,YY` quando há comissão cadastrada.

### Subtotais e Totais

- **Subtotal do dia** → linha de rodapé da tabela com fundo colorido
- **Total por profissional** → duas caixas lado a lado (Valor + Comissão) para confirmados
- **Total de seção** → caixa única ou dupla com fundo mais escuro
- **Somatória Total do Período** → caixa de destaque no final do relatório com valor grande

### Paginação Automática

A função `checkPage` verifica se há espaço suficiente antes de cada bloco e adiciona nova página quando necessário, reiniciando o cursor em `y = 15`.

---

## Paleta de Cores Utilizada

| Variável | RGB | Tailwind Equivalente |
|----------|-----|----------------------|
| `COR_VERDE_HEADER` | `[22, 163, 74]` | `green-600` |
| `COR_VERDE_LIGHT` | `[240, 253, 244]` | `green-50` |
| `COR_VERDE_MED` | `[220, 252, 231]` | `green-100` |
| `COR_VERDE_DARK` | `[187, 247, 208]` | `green-200` |
| `COR_VERDE_TOTAL` | `[134, 239, 172]` | `green-300` |
| `COR_AMBER_HEADER` | `[217, 119, 6]` | `amber-600` |
| `COR_AMBER_LIGHT` | `[255, 251, 235]` | `amber-50` |
| `COR_AMBER_MED` | `[254, 243, 199]` | `amber-100` |
| `COR_AMBER_DARK` | `[253, 230, 138]` | `amber-200` |
| `COR_AZUL_PROF` | `[219, 234, 254]` | `blue-100` |
| `COR_AZUL_TEXT` | `[30, 64, 175]` | `blue-800` |
| `COR_EMERALD_TOTAL` | `[16, 185, 129]` | `emerald-500` |
| `COR_CINZA_HEADER` | `[248, 250, 252]` | `slate-50` |
| `COR_CINZA_ALT` | `[241, 245, 249]` | `slate-100` |
| `COR_TEXTO` | `[15, 23, 42]` | `slate-900` |
| `COR_TEXTO_MUTED` | `[100, 116, 139]` | `slate-500` |

---

## Helpers Internos

| Helper | Descrição |
|--------|-----------|
| `drawSectionBanner` | Desenha banner de seção principal (Confirmados/Pendentes) |
| `drawProfBanner` | Desenha banner de profissional (azul) |
| `drawDateBanner` | Desenha banner de data com contagem |
| `drawTotalBox` | Desenha caixa de total única alinhada à direita |
| `drawDoubleTotalBox` | Desenha duas caixas de total lado a lado |
| `renderTabelaData` | Renderiza tabela de itens de uma data específica |
| `checkPage` | Verifica espaço e adiciona nova página se necessário |
