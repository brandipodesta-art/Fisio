# Migração de Cards para Tabela de Clientes

## Visão Geral
O objetivo deste plano é refatorar o componente `ClientesListagem.tsx` para substituir o layout contínuo de "Cards" por uma View de Tabela moderna e paginada (Dashboard view). Isso irá melhorar a performance e a escalabilidade ao suportar centenas/milhares de cadastros sem poluir a interface.

## Requisito de Ouro (Crítico)
> [!IMPORTANT]
> **NENHUMA INFORMAÇÃO PODE SER PERDIDA!**
> Os dados atuais (Nome, Iniciais/Avatar, Tipo de Usuário, Status, CPF, Telefone, Data de Nascimento, Profissional Responsável, Data de Cadastro e Cidade) devem estar presentes ou na visualização da tabela (colunas principais) ou em um elemento expansível / tooltip.

## Project Type
WEB

## Success Criteria
- [ ] A interface deve apresentar uma tabela harmoniosa, alinhada com as cores e design system atual.
- [ ] O componente deve implementar controles de paginação (Ex: `< Anterior | 1 | 2 | 3 | Próxima >`).
- [ ] Todas as informações contidas nos cards originais devem estar disponíveis na tela sem necessidade de acessar a página do cliente.
- [ ] O dropdown de opções atual (Visualizar, Editar, Ativar/Desativar) persistirá no final de cada linha.
- [ ] Os filtros de busca já existentes continuarão operacionais e integrados visualmente.

## Tech Stack
- React / Next.js
- Tailwind CSS (Estilização de Tabelas/Grids modernas)
- Lucide React (Ícones)
- Paginação Client-Side (ou conectada com a API)

## File Structure

### [MODIFY] src/components/ClientesListagem.tsx
- Inclusão dos estados de controle de paginação (p. ex., `paginaAtual`, `itensPorPagina`).
- Troca do render `.map()` das `<Card>` para a estrutura de tabela flexível.
- Criação dos botões de paginação no rodape de listagem.

## Task Breakdown
- **[ ] Task 1:** Configurar estado de paginação em `ClientesListagem.tsx`. (Agent: frontend-specialist, Skill: frontend-design)
    - Input: Dados buscados da API.
    - Output: Índices de paginação e o subset dos clientes visíveis calculados.
    - Verify: Lógica consegue fracionar a lista principal.
- **[ ] Task 2:** Refatorar marcação visual (`<Card>` para `<table>`/`<div>` grid). (Agent: frontend-specialist, Skill: react-best-practices)
    - Input: O map dos clientes a exibir.
    - Output: Tabela renderizando as colunas organizadas e com tooltip caso a largura exija.
    - Verify: Nenhuma informação omitida e visual alinhado com "HR Dashboard".
- **[ ] Task 3:** Implementar controles da paginação. (Agent: frontend-specialist, Skill: frontend-design)
    - Input: `paginaAtual`, `totalPaginas`.
    - Output: Botões de navegação e labels.
    - Verify: Cliques limitam bounds e navegam validamente.

## Phase X: Verification
### Verificações do frontend-specialist
- Responsividade e auditoria visual da tabela. 
- Busca preservando filtros re-calculando a paginação.
- Lint final
  ```bash
  npm run lint && npx tsc --noEmit
  ```

## ✅ PHASE X COMPLETE
*Para ser preenchido ao término da execução.*
