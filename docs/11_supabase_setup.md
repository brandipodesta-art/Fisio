# Configuração do Supabase

Este documento serve como guia para a configuração das credenciais do Supabase tanto no ambiente de desenvolvimento local quanto em produção (Vercel).

## Variáveis de Ambiente Necessárias

Para a integração funcionar, o projeto utiliza as seguintes variáveis de ambiente:

- `NEXT_PUBLIC_SUPABASE_URL`: A URL do seu banco de dados no Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A chave anônima (pública) para acessar o banco pelo cliente.

## 1. Ambiente Local (Desenvolvimento)

Para rodar o projeto localmente, crie um arquivo chamado `.env.local` na raiz do projeto (na mesma pasta onde está o `package.json`) e adicione as duas linhas abaixo, substituindo `sua_url_aqui` e `sua_chave_aqui` pelos valores reais:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

> **Aviso:** O arquivo `.env.local` não deve ser commitado no repositório (ele geralmente já está no `.gitignore`).

## 2. Ambiente de Produção (Vercel)

Quando formos fazer o deploy do projeto na Vercel, você precisará adicionar essas mesmas variáveis nas configurações do projeto lá na plataforma:

1. Acesse o dashboard do seu projeto na Vercel.
2. Vá em **Settings** > **Environment Variables**.
3. Adicione a chave `NEXT_PUBLIC_SUPABASE_URL` e cole o valor da URL do Supabase. Selecione os ambientes (Production, Preview, Development) e salve.
4. Adicione a chave `NEXT_PUBLIC_SUPABASE_ANON_KEY` e cole o valor da Anon Key. Selecione os ambientes e salve.
5. Se o projeto já estiver rodando, pode ser necessário fazer um novo deploy para que as variáveis entrem em vigor.

## Onde encontrar as chaves no Supabase?

1. Entre no painel do [Supabase](https://app.supabase.com/).
2. Selecione o seu projeto.
3. No menu lateral esquerdo, clique no ícone da engrenagem (Project Settings).
4. Clique em **API**.
5. Em **Project URL**, copie a URL (`NEXT_PUBLIC_SUPABASE_URL`).
6. Em **Project API Keys**, copie a chave da linha `anon` / `public` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
