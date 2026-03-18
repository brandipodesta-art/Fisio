#!/usr/bin/env python3
"""
executar_ddl_supabase.py
========================
Script para aplicar automaticamente as melhorias de integridade DDL no Supabase.

Uso:
    python3 scripts/executar_ddl_supabase.py

Requisitos:
    - SUPABASE_ACCESS_TOKEN: token pessoal do Supabase
      Gere em: https://supabase.com/dashboard/account/tokens
    - SUPABASE_PROJECT_REF: ID do projeto (padrão: uxastllbpbthqvicfkfo)

O token pode ser passado como variável de ambiente ou informado interativamente.
"""

import os
import sys
import json
import getpass
import textwrap
import requests

# ─── Configuração ─────────────────────────────────────────────────────────────
PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "uxastllbpbthqvicfkfo")
ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")

MANAGEMENT_API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

# ─── Blocos DDL (executados em ordem, cada um idempotente) ────────────────────
DDL_STEPS = [
    {
        "nome": "1. CHECK valor positivo — recebimentos",
        "sql": """
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'chk_recebimentos_valor_positivo'
              ) THEN
                ALTER TABLE public.recebimentos
                  ADD CONSTRAINT chk_recebimentos_valor_positivo CHECK (valor > 0);
              END IF;
            END $$;
        """
    },
    {
        "nome": "2. CHECK valor positivo — pagamentos",
        "sql": """
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'chk_pagamentos_valor_positivo'
              ) THEN
                ALTER TABLE public.pagamentos
                  ADD CONSTRAINT chk_pagamentos_valor_positivo CHECK (valor > 0);
              END IF;
            END $$;
        """
    },
    {
        "nome": "3. UUID nativo — formas_pagamento.id",
        "sql": """
            DO $$ BEGIN
              IF (SELECT data_type FROM information_schema.columns
                  WHERE table_name = 'formas_pagamento' AND column_name = 'id'
                    AND table_schema = 'public') = 'text' THEN
                ALTER TABLE public.formas_pagamento ALTER COLUMN id TYPE UUID USING id::uuid;
              END IF;
            END $$;
        """
    },
    {
        "nome": "4. UUID nativo — categorias_pagamento.id",
        "sql": """
            DO $$ BEGIN
              IF (SELECT data_type FROM information_schema.columns
                  WHERE table_name = 'categorias_pagamento' AND column_name = 'id'
                    AND table_schema = 'public') = 'text' THEN
                ALTER TABLE public.categorias_pagamento ALTER COLUMN id TYPE UUID USING id::uuid;
              END IF;
            END $$;
        """
    },
    {
        "nome": "5. UNIQUE INDEX parcial — pacientes.cpf",
        "sql": """
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_indexes WHERE indexname = 'uq_pacientes_cpf'
              ) THEN
                CREATE UNIQUE INDEX uq_pacientes_cpf
                  ON public.pacientes (cpf)
                  WHERE cpf IS NOT NULL AND cpf <> '';
              END IF;
            END $$;
        """
    },
    {
        "nome": "6. FK forma_pagamento_id — recebimentos",
        "sql": """
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'recebimentos' AND column_name = 'forma_pagamento_id'
                  AND table_schema = 'public'
              ) THEN
                ALTER TABLE public.recebimentos
                  ADD COLUMN forma_pagamento_id UUID
                  REFERENCES public.formas_pagamento(id) ON DELETE SET NULL;
              END IF;
            END $$;
        """
    },
    {
        "nome": "7. Migrar forma_pagamento texto → UUID — recebimentos",
        "sql": """
            UPDATE public.recebimentos r
            SET forma_pagamento_id = fp.id
            FROM public.formas_pagamento fp
            WHERE LOWER(r.forma_pagamento) = LOWER(fp.nome)
              AND r.forma_pagamento_id IS NULL;
        """
    },
    {
        "nome": "8. FK forma_pagamento_id — pagamentos",
        "sql": """
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'pagamentos' AND column_name = 'forma_pagamento_id'
                  AND table_schema = 'public'
              ) THEN
                ALTER TABLE public.pagamentos
                  ADD COLUMN forma_pagamento_id UUID
                  REFERENCES public.formas_pagamento(id) ON DELETE SET NULL;
              END IF;
            END $$;
        """
    },
    {
        "nome": "9. Migrar forma_pagamento texto → UUID — pagamentos",
        "sql": """
            UPDATE public.pagamentos p
            SET forma_pagamento_id = fp.id
            FROM public.formas_pagamento fp
            WHERE LOWER(p.forma_pagamento) = LOWER(fp.nome)
              AND p.forma_pagamento_id IS NULL;
        """
    },
    {
        "nome": "10. FK categoria_id — pagamentos",
        "sql": """
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'pagamentos' AND column_name = 'categoria_id'
                  AND table_schema = 'public'
              ) THEN
                ALTER TABLE public.pagamentos
                  ADD COLUMN categoria_id UUID
                  REFERENCES public.categorias_pagamento(id) ON DELETE SET NULL;
              END IF;
            END $$;
        """
    },
    {
        "nome": "11. Migrar categoria texto → UUID — pagamentos",
        "sql": """
            UPDATE public.pagamentos p
            SET categoria_id = cp.id
            FROM public.categorias_pagamento cp
            WHERE p.categoria = cp.nome
              AND p.categoria_id IS NULL;
        """
    },
    {
        "nome": "12. Limpar profissional_responsavel vazio — pacientes",
        "sql": """
            UPDATE public.pacientes
            SET profissional_responsavel = NULL
            WHERE profissional_responsavel = '';
        """
    },
    {
        "nome": "13. FK profissional_responsavel → profissionais — pacientes",
        "sql": """
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_pacientes_profissional'
              ) THEN
                ALTER TABLE public.pacientes
                  ADD CONSTRAINT fk_pacientes_profissional
                  FOREIGN KEY (profissional_responsavel)
                  REFERENCES public.profissionais(id)
                  ON DELETE SET NULL;
              END IF;
            END $$;
        """
    },
    {
        "nome": "14. Verificação final — constraints aplicadas",
        "sql": """
            SELECT
              tc.table_name                                    AS tabela,
              tc.constraint_name                               AS constraint,
              tc.constraint_type                               AS tipo
            FROM information_schema.table_constraints tc
            WHERE tc.table_schema = 'public'
              AND tc.table_name IN (
                'pacientes', 'recebimentos', 'pagamentos',
                'formas_pagamento', 'categorias_pagamento'
              )
              AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK', 'UNIQUE')
            ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
        """,
        "exibir_resultado": True
    },
]


# ─── Funções auxiliares ───────────────────────────────────────────────────────

def obter_token():
    """Obtém o access token via env var ou input interativo."""
    token = ACCESS_TOKEN
    if not token:
        print("\n" + "="*60)
        print("  Supabase Access Token necessário")
        print("="*60)
        print("  Gere em: https://supabase.com/dashboard/account/tokens")
        print("  Ou defina: export SUPABASE_ACCESS_TOKEN=seu_token")
        print("="*60)
        token = getpass.getpass("\nCole o token aqui (oculto): ").strip()
    if not token:
        print("\n❌ Token não informado. Encerrando.")
        sys.exit(1)
    return token


def executar_sql(token: str, sql: str) -> dict:
    """Executa uma query SQL via Supabase Management API."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {"query": textwrap.dedent(sql).strip()}
    resp = requests.post(MANAGEMENT_API, headers=headers, json=payload, timeout=30)
    return {"status": resp.status_code, "body": resp.text}


def formatar_resultado(body: str) -> str:
    """Formata o resultado JSON de uma query SELECT."""
    try:
        dados = json.loads(body)
        if not dados:
            return "  (nenhum resultado)"
        linhas = []
        if isinstance(dados, list) and dados:
            cabecalho = list(dados[0].keys())
            larguras = {k: max(len(k), max(len(str(r.get(k, ""))) for r in dados)) for k in cabecalho}
            sep = "  +" + "+".join("-" * (larguras[k] + 2) for k in cabecalho) + "+"
            linha_cab = "  |" + "|".join(f" {k:<{larguras[k]}} " for k in cabecalho) + "|"
            linhas.append(sep)
            linhas.append(linha_cab)
            linhas.append(sep)
            for row in dados:
                linhas.append("  |" + "|".join(f" {str(row.get(k,'')):<{larguras[k]}} " for k in cabecalho) + "|")
            linhas.append(sep)
        return "\n".join(linhas)
    except Exception:
        return f"  {body[:300]}"


# ─── Execução principal ───────────────────────────────────────────────────────

def main():
    print("\n" + "="*60)
    print("  Fisio Clínica — Migração de Integridade DDL")
    print(f"  Projeto: {PROJECT_REF}")
    print("="*60)

    token = obter_token()

    total = len(DDL_STEPS)
    erros = []

    for i, step in enumerate(DDL_STEPS, 1):
        nome = step["nome"]
        print(f"\n[{i:02d}/{total}] {nome}")
        print("  Executando...", end=" ", flush=True)

        resultado = executar_sql(token, step["sql"])
        status = resultado["status"]
        body = resultado["body"]

        if status in (200, 201, 204):
            print("✅ OK")
            if step.get("exibir_resultado"):
                print(formatar_resultado(body))
        else:
            print(f"❌ ERRO (HTTP {status})")
            try:
                erro_json = json.loads(body)
                msg = erro_json.get("message") or erro_json.get("error") or body[:200]
            except Exception:
                msg = body[:200]
            print(f"  Detalhe: {msg}")
            erros.append({"step": nome, "status": status, "erro": msg})

    print("\n" + "="*60)
    if erros:
        print(f"  ⚠️  Concluído com {len(erros)} erro(s):")
        for e in erros:
            print(f"     • {e['step']}: {e['erro'][:80]}")
    else:
        print("  ✅ Todas as 13 migrações aplicadas com sucesso!")
    print("="*60 + "\n")

    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
