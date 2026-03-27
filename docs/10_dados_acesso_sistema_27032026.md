# 10 — Dados de Acesso ao Sistema no Cadastro

**Data:** 27/03/2026  
**Tipo:** Feature  
**Arquivos alterados:**
- `src/components/CadastroForm.tsx`
- `src/app/api/usuarios-acesso/route.ts` *(novo)*

**Banco de dados:**
- Nova tabela `usuarios_acesso` criada no Supabase

---

## Contexto

Ao cadastrar um usuário do tipo **Funcionário**, **Admin** ou **Financeiro**, o sistema agora exibe uma seção adicional de **Dados de Acesso ao Sistema**, permitindo configurar as credenciais de login diretamente no formulário de cadastro.

---

## Nova Tabela: `usuarios_acesso`

```sql
CREATE TABLE IF NOT EXISTS usuarios_acesso (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  nome_acesso TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**RLS:** habilitado com política permissiva `allow_all_usuarios_acesso`.

---

## Campos da Seção de Acesso

| Campo | Obrigatório | Observação |
|---|---|---|
| Nome para Acesso ao Sistema | Sim | Único no sistema (ex: `joao.silva`) |
| E-mail | Sim | Único no sistema, salvo em minúsculas |
| Senha | Sim (criação) / Opcional (edição) | Mínimo 6 caracteres, armazenada com bcrypt (salt 12) |
| Confirmar Senha | Sim (criação) / Opcional (edição) | Validação em tempo real com feedback visual |

---

## Comportamento

### Criação de novo cadastro
- Seção aparece automaticamente ao selecionar tipo Funcionário, Admin ou Financeiro
- Todos os 4 campos são obrigatórios
- Validações em tempo real: senhas coincidem (verde ✓) ou não (vermelho ✗)
- Senha armazenada com **bcrypt** (salt rounds = 12) via API route server-side
- Botão de mostrar/ocultar senha em ambos os campos

### Edição de cadastro existente
- Se já houver acesso cadastrado: banner verde informando que acesso existe
- `nome_acesso` e `email` são pré-carregados (senha nunca é exibida)
- Senha é **opcional** na edição — deixar em branco mantém a senha atual
- Ao preencher nova senha, confirmar senha se torna obrigatória

---

## API Route: `/api/usuarios-acesso`

### `POST` — Criar acesso
```json
{
  "paciente_id": "uuid",
  "nome_acesso": "joao.silva",
  "email": "joao@clinica.com",
  "senha": "minhasenha123"
}
```

### `PUT` — Atualizar acesso
```json
{
  "paciente_id": "uuid",
  "nome_acesso": "joao.silva",
  "email": "joao@clinica.com",
  "senha": "novasenha456"  // opcional
}
```

**Erros tratados:**
- `400` — campos obrigatórios ausentes
- `404` — acesso não encontrado (PUT)
- `409` — nome de acesso ou e-mail já em uso
- `500` — erro interno

---

## Dependência adicionada

```
bcryptjs@3.0.3  (+ @types/bcryptjs)
```
