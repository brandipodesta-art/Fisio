# 📋 Nova Funcionalidade: Aba Procedimentos no Histórico do Cliente

> **Arquivo modificado:** `src/components/HistoricoCliente.tsx`

---

## Propósito da Alteração

A antiga aba "Exames" no Histórico do Cliente foi substituída pela aba **"Procedimentos"**. Essa mudança alinha a visualização do histórico clínico com a realidade financeira do paciente, exibindo automaticamente todos os procedimentos que ele está realizando com base nos lançamentos registrados no módulo de Recebimentos.

---

## O Que Mudou

### 1. Substituição Visual
- O ícone da aba mudou de `FileText` (Exames) para `Stethoscope` (Procedimentos).
- O texto explicativo no cabeçalho do Histórico foi atualizado de *"Visualize exames..."* para *"Visualize procedimentos..."*.

### 2. Lógica de Agrupamento de Dados
A aba não depende mais de uma tabela isolada. Em vez disso, ela consome os dados reais da tabela `recebimentos` e realiza um processamento dinâmico (via `useMemo`) para agrupar as informações:

- **Extração do Procedimento Base:** O sistema remove automaticamente sufixos de parcelamento recorrente (ex: `"Acupuntura (2/4)"` vira apenas `"Acupuntura"`).
- **Agrupamento:** Todos os recebimentos com o mesmo nome base são unificados em um único card de resumo.

### 3. Informações Exibidas
Para cada procedimento distinto que o paciente realiza ou já realizou, a aba apresenta:

- **Resumo Geral (Topo):**
  - Quantidade de procedimentos distintos
  - Total de sessões agendadas/realizadas
  - Total de sessões pendentes de pagamento (em destaque âmbar)
- **Card por Procedimento:**
  - Nome do procedimento
  - Data do último lançamento (vencimento)
  - **Total:** Número total de sessões daquele procedimento
  - **Pagas:** Quantidade de sessões já recebidas
  - **Pendentes:** Quantidade de sessões aguardando pagamento
  - **Valor Total:** Soma monetária de todas as sessões vinculadas a esse procedimento

---

## Impacto Técnico

A consulta ao Supabase foi otimizada. O componente agora faz uma única requisição à tabela `recebimentos` e utiliza esses mesmos dados brutos (`recebimentosRaw`) para alimentar duas abas simultaneamente:

1. **Aba Procedimentos:** Processa e agrupa os dados por nome e status.
2. **Aba Financeiro:** Exibe a lista cronológica exata de todos os lançamentos individuais.

Isso garante que as duas abas estejam sempre perfeitamente sincronizadas e sem gerar requisições duplicadas ao banco de dados.
