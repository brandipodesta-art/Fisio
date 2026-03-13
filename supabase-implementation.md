# Implementação do Supabase

## 1. Visão Geral
O objetivo deste plano é detalhar a integração do backend-as-a-service Supabase ao projeto Fisio (Next.js 15 App Router). O foco inicial é configurar a conexão, instalar as bibliotecas necessárias e preparar a estrutura de código para as futuras substituições de dados mockados por dados reais (banco de dados).

## 2. Tipo de Projeto
**WEB** (Next.js App Router, React 19, TailwindCSS v4)

## 3. Critérios de Sucesso
- Variáveis de ambiente configuradas corretamente localmente (`.env.local`).
- Cliente Supabase corretamente instanciado de acordo com o padrão de Server-Side Rendering (SSR).
- Teste de conexão bem-sucedido.
- Guia criado de como espelhar as configurações da Vercel.

## 4. Tech Stack Recomendada
- `@supabase/ssr`: Utilitários oficiais para rodar Supabase no framework Next.js compatíveis com o App Router, Server Components e Server Actions.
- `@supabase/supabase-js`: SDK principal (dependência associada do `@supabase/ssr`).

## 5. Estrutura de Arquivos Planejada
- [x] `docs/11_supabase_setup.md` (Documentação com passo a passo para deploy na Vercel e Setup Local)
- [ ] `.env.local`
- [ ] `src/lib/supabase/client.ts` (Browser client wrapper)
- [ ] `src/lib/supabase/server.ts` (Server Component/Server Action wrapper)
- [ ] `next.config.ts` (Pode ser necessário editar se for receber imagens do Supabase Storage no futuro)

## 6. Divisão de Tarefas (Task Breakdown)

### Tarefa 1: Coletar chaves do Supabase
- **Agente:** `project-planner`
- **Skill:** `plan-writing`
- **Prioridade:** P0
- **Input:** Solicitação do usuário.
- **Output:** URL e Anon Key do Supabase recebidos.
- **Verify:** Chaves fornecidas no chat e plano validado pelo usuário.

### Tarefa 2: Configurar Variáveis de Ambiente
- **Agente:** `backend-specialist`
- **Skill:** `api-patterns`
- **Prioridade:** P0
- **Dependências:** Tarefa 1
- **Input:** URL e Anon Key do Supabase.
- **Output:** Arquivo `.env.local` populado.
- **Verify:** O arquivo `.env.local` existe e possui o formato correto.

### Tarefa 3: Instalar as Dependências do Supabase
- **Agente:** `backend-specialist`
- **Skill:** `powershell-windows`
- **Prioridade:** P1
- **Dependências:** Tarefa 1
- **Input:** Npm.
- **Output:** Instalação rodada com sucesso no ambiente Local.
- **Verify:** `package.json` conta com `@supabase/ssr` e `@supabase/supabase-js`.

### Tarefa 4: Desenvolver Wrappers de SSR
- **Agente:** `backend-specialist`
- **Skill:** `clean-code`, `nodejs-best-practices`
- **Prioridade:** P1
- **Dependências:** Tarefa 3
- **Input:** Documentação de instanciamento `@supabase/ssr`.
- **Output:** `src/lib/supabase/client.ts` e `src/lib/supabase/server.ts`.
- **Verify:** Código limpo, testado pelo linter localmente e buildando sem crash.

### Tarefa 5: Validar a conexão inicial
- **Agente:** `backend-specialist`
- **Skill:** `testing-patterns`
- **Prioridade:** P2
- **Dependências:** Tarefa 4
- **Input:** Wrappers prontos.
- **Output:** Um script ou página testando uma consulta simples no Supabase (mesmo que a tabela esteja vazia, deve retornar status de OK na request REST/RPC).
- **Verify:** Não ocorre exceção de CORS ou de chave inválida (HTTP 4xx/5xx).

---

## ✅ Phase X: Verificação Final (Ainda não executada)
- [ ] Executar Linter (`npm run lint`).
- [ ] Teste de Conexão passou.
- [ ] Deploy Orientations: O usuário possui o arquivo `11_supabase_setup.md` para seguir na Vercel depois.
- [ ] Build test: Executar `npm run build` localmente para confirmar que bibliotecas SSR do Supabase não causam erro de compilação Next.js estática.
