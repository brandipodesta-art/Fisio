# 11 — Tela de Login para Funcionários

**Data:** 27/03/2026  
**Tipo:** Feature  
**Arquivos criados/alterados:**
- `src/components/LoginPage.tsx` *(novo)*
- `src/lib/auth/AuthContext.tsx` *(novo)*
- `src/app/api/auth/login/route.ts` *(novo)*
- `src/app/api/auth/solicitar-senha/route.ts` *(novo)*
- `src/app/page.tsx` *(alterado)*
- `src/app/layout.tsx` *(alterado)*
- `src/components/TopBar.tsx` *(alterado)*

**Banco de dados:**
- Nova tabela `solicitacoes_senha` criada no Supabase

---

## Contexto

O sistema agora exige autenticação para acesso. Ao abrir o FisioSys, o usuário é redirecionado para a tela de Login. Apenas usuários cadastrados na tabela `usuarios_acesso` (tipo: funcionario, admin ou financeiro) podem entrar.

---

## Tela de Login

### Campos
| Campo | Descrição |
|---|---|
| Nome de Acesso ou E-mail | Aceita qualquer um dos dois identificadores |
| Senha | Campo com botão mostrar/ocultar |

### Requisitos de senha (validados em tempo real)
| Requisito | Regra |
|---|---|
| Mínimo de 6 caracteres | `length >= 6` |
| Pelo menos 1 letra maiúscula | `/[A-Z]/` |
| Pelo menos 1 caractere especial | `/[!@#$%^&*...]/ ` |

Ao focar no campo de senha, um painel de requisitos aparece com indicadores visuais (✓ verde / ○ cinza).

### Fluxo de autenticação
1. Usuário informa nome/email + senha
2. `POST /api/auth/login` verifica no banco via bcrypt
3. Em caso de sucesso, a sessão é salva no `sessionStorage`
4. A aplicação exibe o sistema normalmente

---

## Fluxo "Esqueci minha senha"

1. Usuário clica em **"Esqueci minha senha — Solicitar ao Admin"**
2. Informa o nome de acesso ou e-mail
3. Sistema cria um registro em `solicitacoes_senha` com `status = 'pendente'`
4. Tela de confirmação informa que o Admin irá redefinir a senha
5. Admin acessa o sistema e redefine a senha manualmente no cadastro do funcionário

---

## Nova tabela: `solicitacoes_senha`

```sql
CREATE TABLE IF NOT EXISTS solicitacoes_senha (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios_acesso(id) ON DELETE CASCADE,
  nome_acesso TEXT NOT NULL,
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente', 'resolvida', 'cancelada')),
  observacao  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## AuthContext

Gerencia a sessão do usuário via `sessionStorage`:

| Função | Descrição |
|---|---|
| `login(usuario)` | Salva sessão no sessionStorage |
| `logout()` | Remove sessão e redireciona para Login |
| `isAdmin` | `true` se `tipo_usuario === 'admin'` |
| `isLoading` | `true` enquanto restaura sessão ao montar |

---

## TopBar atualizado

- Exibe **iniciais** e **nome real** do usuário logado
- Exibe **tipo de usuário** (funcionario / admin / financeiro)
- **Configurações** visível apenas para Admin
- **Sair** executa logout real com toast de confirmação

---

## API Routes

### `POST /api/auth/login`
```json
// Request
{ "identificador": "joao.silva", "senha": "Senha@123" }

// Response 200
{ "success": true, "usuario": { "id": "...", "nome_completo": "João Silva", ... } }

// Response 401
{ "error": "Senha incorreta." }
```

### `POST /api/auth/solicitar-senha`
```json
// Request
{ "identificador": "joao.silva" }

// Response 200
{ "success": true, "message": "Solicitação registrada com sucesso..." }
```

### `GET /api/auth/solicitar-senha`
Retorna lista de todas as solicitações (para o Admin visualizar).
