# 👥 Histórico de Alterações: Clientes Cadastrados

> **Componente Principal:** `src/components/ClientesListagem.tsx`

Este documento consolida todas as evoluções e refatorações realizadas no módulo de listagem de clientes (Clientes Cadastrados), desde sua criação até a padronização visual com os módulos financeiros.

---

## 1. Estrutura e Integração com Banco de Dados

A listagem foi conectada diretamente ao Supabase, consumindo a tabela `pacientes` através da API interna do Next.js (`/api/pacientes`). 

- **Busca em tempo real:** Implementada uma função de busca com *debounce* de 400ms, evitando sobrecarga de requisições ao digitar.
- **Contadores dinâmicos:** O sistema exibe o total de clientes cadastrados (ex: `3 de 3 clientes`) e ajusta a contagem dinamicamente quando filtros são aplicados.
- **Tratamento de estados:** Foram adicionados *skeletons* de carregamento (`Loader2`) e *empty states* (estados vazios) tanto para quando não há clientes cadastrados quanto para quando uma busca não retorna resultados.

---

## 2. Sistema de Filtros Avançados

O painel de filtros foi expandido para permitir buscas precisas em uma base de dados crescente. Os seguintes filtros estão disponíveis e podem ser combinados:

| Filtro | Tipo | Comportamento |
|---|---|---|
| **Nome Completo** | Texto livre | Busca parcial (*ilike*) ignorando maiúsculas/minúsculas. |
| **CPF** | Máscara formatada | Formata automaticamente durante a digitação e limpa os caracteres especiais antes de enviar para a API. |
| **Tipo de Usuário** | Dropdown | Filtra por `paciente`, `funcionario`, `admin` ou `financeiro`. |
| **Profissional Responsável** | Dropdown | Filtra pelo profissional vinculado ao paciente no momento do cadastro. |
| **Status** | Dropdown | Permite isolar clientes `ativos` ou `inativos`. |

> **UX:** Um botão "Limpar filtros" aparece automaticamente assim que qualquer filtro é ativado.

---

## 3. Design dos Cards e Informações Exibidas

Cada cliente é renderizado em um card individual que segue os princípios de *Healthcare Minimal* (espaços em branco, hierarquia visual clara e paleta de cores neutras com toques semânticos).

### Informações do Card
- **Avatar semântico:** Verde para ativos (`bg-emerald-100`), cinza para inativos (`bg-slate-200`).
- **Badges:** Identificação visual do tipo de usuário e status (ex: badge `Inativo` e badge `Paciente`).
- **Dados rápidos:** CPF formatado, Telefone Celular (com ícone), Data de Nascimento (com ícone) e Profissional Responsável.
- **Metadados (Desktop):** Alinhados à direita, mostram a data original de cadastro formatada (DD/MM/AAAA) e a cidade do paciente.

---

## 4. Evolução das Ações de Interface

As ações disponíveis para cada cliente passaram por uma evolução para melhorar a usabilidade e prevenir erros acidentais.

### Fase 1: Dropdown Menu (Obsoleto)
Inicialmente, as ações ficavam escondidas dentro de um menu suspenso acessado ao clicar no avatar do cliente. O menu continha as opções Visualizar, Editar e Ativar/Desativar.

### Fase 2: Ações Inline (Atual)
Para padronizar a interface com o módulo Financeiro (Recebimentos e Pagamentos) e reduzir a quantidade de cliques, o dropdown foi removido. Agora, as ações são apresentadas como ícones inline fixos à direita do card:

- **👁 Visualizar:** Abre a tela de `PacienteVisualizacao` (somente leitura), incluindo abas de Evolução e Histórico Financeiro.
- **✏️ Editar:** Abre o `CadastroForm` preenchido para modificação dos dados.

**Decisão de Design:** O ícone de **Excluir** foi intencionalmente omitido da listagem principal para evitar a exclusão acidental de históricos clínicos e financeiros. A inativação do paciente deve ser feita por dentro da edição do cadastro, garantindo integridade referencial.
