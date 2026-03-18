#!/usr/bin/env python3
"""
testar_constraints.py
=====================
Script automatizado para validar as constraints e FKs aplicadas na migração
de integridade do banco Supabase do projeto Fisio Clínica.

Referência: docs/26_plano_testes_constraints.md

Uso:
    python3 scripts/testar_constraints.py

Requisitos:
    - SUPABASE_ACCESS_TOKEN: token pessoal do Supabase
      Gere em: https://supabase.com/dashboard/account/tokens
    - SUPABASE_PROJECT_REF: ID do projeto (padrão: uxastllbpbthqvicfkfo)
"""

import os
import sys
import json
import getpass
import textwrap
import requests
from datetime import date

# ─── Configuração ─────────────────────────────────────────────────────────────
PROJECT_REF    = os.getenv("SUPABASE_PROJECT_REF", "uxastllbpbthqvicfkfo")
ACCESS_TOKEN   = os.getenv("SUPABASE_ACCESS_TOKEN", "")
SUPABASE_URL   = f"https://{PROJECT_REF}.supabase.co"
MANAGEMENT_API = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
ANON_KEY       = os.getenv(
    "SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YXN0bGxicGJ0aHF2aWNma2ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0NjA5NTYsImV4cCI6MjA1NzAzNjk1Nn0.Qy6cVBqpXZJbJjUMzOXAVMQmBbPjvFnFOJAqpHaJxhI"
)

# Dados reais do banco para usar nos testes
CPF_EXISTENTE        = "123.456.789-09"
ID_FORMA_PAGAMENTO   = "74034da1-4cec-4bac-85d0-84afb203d8b7"   # PIX
ID_CATEGORIA         = "8631754e-3c78-4579-9789-d04ab9074e24"   # Aluguel
ID_PACIENTE          = "ead2040a-ec45-4717-b4c7-3fa17ad08d77"   # teste_01
UUID_INEXISTENTE     = "00000000-0000-0000-0000-000000000000"
SLUG_INEXISTENTE     = "profissional-inexistente-xyz"
HOJE                 = date.today().isoformat()

# ─── Contadores ───────────────────────────────────────────────────────────────
resultados = []


# ─── Funções auxiliares ───────────────────────────────────────────────────────

def obter_token():
    token = ACCESS_TOKEN
    if not token:
        print("\n" + "="*60)
        print("  Supabase Access Token necessário")
        print("  Gere em: https://supabase.com/dashboard/account/tokens")
        print("="*60)
        token = getpass.getpass("\nCole o token aqui (oculto): ").strip()
    if not token:
        print("\n❌ Token não informado. Encerrando.")
        sys.exit(1)
    return token


def sql(token: str, query: str) -> dict:
    """Executa SQL via Management API (DDL/DML)."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    resp = requests.post(
        MANAGEMENT_API,
        headers=headers,
        json={"query": textwrap.dedent(query).strip()},
        timeout=30
    )
    try:
        body = resp.json()
    except Exception:
        body = resp.text
    return {"status": resp.status_code, "body": body}


def rest_insert(tabela: str, payload: dict) -> dict:
    """Faz INSERT via REST API do Supabase."""
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/{tabela}",
        headers=headers,
        json=payload,
        timeout=15
    )
    try:
        body = resp.json()
    except Exception:
        body = resp.text
    return {"status": resp.status_code, "body": body}


def registrar(tc_id: str, nome: str, passou: bool, detalhe: str = ""):
    icon = "✅" if passou else "❌"
    resultados.append({"id": tc_id, "nome": nome, "passou": passou, "detalhe": detalhe})
    status = "PASSOU" if passou else "FALHOU"
    print(f"  {icon} [{tc_id}] {nome} — {status}")
    if detalhe and not passou:
        print(f"       Detalhe: {detalhe[:120]}")


def erro_de_constraint(body) -> bool:
    """Verifica se o erro é de constraint violation (23xxx)."""
    texto = json.dumps(body) if isinstance(body, (dict, list)) else str(body)
    return any(k in texto.lower() for k in [
        "violates", "constraint", "duplicate", "foreign key",
        "check constraint", "unique constraint"
    ])


def limpar_teste(token: str, tabela: str, condicao: str):
    """Remove registros de teste após cada caso."""
    sql(token, f"DELETE FROM public.{tabela} WHERE {condicao};")


# ─── Casos de Teste ───────────────────────────────────────────────────────────

def tc_01_valor_zero_recebimento(token):
    nome = "CHECK: valor=0 em recebimento deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.recebimentos
          (paciente_id, descricao, valor, data_vencimento, status, forma_pagamento)
        VALUES
          ('{ID_PACIENTE}', 'TESTE_TC01', 0, '{HOJE}', 'recebido', 'pix');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-01", nome, passou, str(r["body"])[:150])


def tc_02_valor_negativo_recebimento(token):
    nome = "CHECK: valor=-50 em recebimento deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.recebimentos
          (paciente_id, descricao, valor, data_vencimento, status, forma_pagamento)
        VALUES
          ('{ID_PACIENTE}', 'TESTE_TC02', -50, '{HOJE}', 'recebido', 'pix');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-02", nome, passou, str(r["body"])[:150])


def tc_03_valor_positivo_recebimento(token):
    nome = "CHECK: valor=100 em recebimento deve ser aceito"
    r = sql(token, f"""
        INSERT INTO public.recebimentos
          (paciente_id, descricao, valor, data_vencimento, status, forma_pagamento)
        VALUES
          ('{ID_PACIENTE}', 'TESTE_TC03', 100, '{HOJE}', 'recebido', 'pix')
        RETURNING id;
    """)
    passou = r["status"] in (200, 201)
    if passou:
        try:
            novo_id = r["body"][0]["id"]
            limpar_teste(token, "recebimentos", f"id = '{novo_id}'")
        except Exception:
            pass
    registrar("TC-03", nome, passou, str(r["body"])[:150])


def tc_04_valor_zero_pagamento(token):
    nome = "CHECK: valor=0 em pagamento deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.pagamentos
          (descricao, fornecedor, valor, data_vencimento, status, forma_pagamento, categoria)
        VALUES
          ('TESTE_TC04', 'Fornecedor Teste', 0, '{HOJE}', 'pendente', 'boleto', 'Outros');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-04", nome, passou, str(r["body"])[:150])


def tc_05_valor_negativo_pagamento(token):
    nome = "CHECK: valor=-1 em pagamento deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.pagamentos
          (descricao, fornecedor, valor, data_vencimento, status, forma_pagamento, categoria)
        VALUES
          ('TESTE_TC05', 'Fornecedor Teste', -1, '{HOJE}', 'pendente', 'boleto', 'Outros');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-05", nome, passou, str(r["body"])[:150])


def tc_06_cpf_duplicado(token):
    nome = "UNIQUE: CPF duplicado em pacientes deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.pacientes
          (nome_completo, cpf, tipo_usuario, ativo)
        VALUES
          ('TESTE_TC06_DUPLICADO', '{CPF_EXISTENTE}', 'paciente', true);
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-06", nome, passou, str(r["body"])[:150])


def tc_07_cpf_null_aceito(token):
    nome = "UNIQUE: CPF=NULL em pacientes deve ser aceito (partial index)"
    r = sql(token, f"""
        INSERT INTO public.pacientes
          (nome_completo, cpf, tipo_usuario, ativo)
        VALUES
          ('TESTE_TC07_NULL', NULL, 'paciente', true)
        RETURNING id;
    """)
    passou = r["status"] in (200, 201)
    if passou:
        try:
            novo_id = r["body"][0]["id"]
            limpar_teste(token, "pacientes", f"id = '{novo_id}'")
        except Exception:
            pass
    registrar("TC-07", nome, passou, str(r["body"])[:150])


def tc_08_fk_forma_invalida_recebimento(token):
    nome = "FK: forma_pagamento_id inexistente em recebimento deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.recebimentos
          (paciente_id, descricao, valor, data_vencimento, status, forma_pagamento, forma_pagamento_id)
        VALUES
          ('{ID_PACIENTE}', 'TESTE_TC08', 100, '{HOJE}', 'recebido', 'pix', '{UUID_INEXISTENTE}');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-08", nome, passou, str(r["body"])[:150])


def tc_09_fk_forma_null_recebimento(token):
    nome = "FK: forma_pagamento_id=NULL em recebimento deve ser aceito"
    r = sql(token, f"""
        INSERT INTO public.recebimentos
          (paciente_id, descricao, valor, data_vencimento, status, forma_pagamento, forma_pagamento_id)
        VALUES
          ('{ID_PACIENTE}', 'TESTE_TC09', 100, '{HOJE}', 'recebido', 'pix', NULL)
        RETURNING id;
    """)
    passou = r["status"] in (200, 201)
    if passou:
        try:
            novo_id = r["body"][0]["id"]
            limpar_teste(token, "recebimentos", f"id = '{novo_id}'")
        except Exception:
            pass
    registrar("TC-09", nome, passou, str(r["body"])[:150])


def tc_10_fk_forma_invalida_pagamento(token):
    nome = "FK: forma_pagamento_id inexistente em pagamento deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.pagamentos
          (descricao, fornecedor, valor, data_vencimento, status, forma_pagamento, forma_pagamento_id)
        VALUES
          ('TESTE_TC10', 'Fornecedor', 100, '{HOJE}', 'pendente', 'boleto', '{UUID_INEXISTENTE}');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-10", nome, passou, str(r["body"])[:150])


def tc_11_fk_categoria_invalida_pagamento(token):
    nome = "FK: categoria_id inexistente em pagamento deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.pagamentos
          (descricao, fornecedor, valor, data_vencimento, status, forma_pagamento, categoria, categoria_id)
        VALUES
          ('TESTE_TC11', 'Fornecedor', 100, '{HOJE}', 'pendente', 'boleto', 'Outros', '{UUID_INEXISTENTE}');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-11", nome, passou, str(r["body"])[:150])


def tc_12_fk_profissional_invalido_paciente(token):
    nome = "FK: profissional_responsavel inexistente em paciente deve ser rejeitado"
    r = sql(token, f"""
        INSERT INTO public.pacientes
          (nome_completo, tipo_usuario, ativo, profissional_responsavel)
        VALUES
          ('TESTE_TC12', 'paciente', true, '{SLUG_INEXISTENTE}');
    """)
    passou = r["status"] != 201 and erro_de_constraint(r["body"])
    registrar("TC-12", nome, passou, str(r["body"])[:150])


def tc_13_fk_profissional_null_paciente(token):
    nome = "FK: profissional_responsavel=NULL em paciente deve ser aceito"
    r = sql(token, f"""
        INSERT INTO public.pacientes
          (nome_completo, tipo_usuario, ativo, profissional_responsavel)
        VALUES
          ('TESTE_TC13', 'paciente', true, NULL)
        RETURNING id;
    """)
    passou = r["status"] in (200, 201)
    if passou:
        try:
            novo_id = r["body"][0]["id"]
            limpar_teste(token, "pacientes", f"id = '{novo_id}'")
        except Exception:
            pass
    registrar("TC-13", nome, passou, str(r["body"])[:150])


def tc_14_uuid_nativo_formas(token):
    nome = "TIPO: formas_pagamento.id deve ser UUID nativo"
    r = sql(token, """
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'formas_pagamento'
          AND column_name = 'id';
    """)
    tipo = ""
    try:
        tipo = r["body"][0]["data_type"]
    except Exception:
        pass
    passou = tipo == "uuid"
    registrar("TC-14", nome, passou, f"data_type = '{tipo}'")


def tc_15_uuid_nativo_categorias(token):
    nome = "TIPO: categorias_pagamento.id deve ser UUID nativo"
    r = sql(token, """
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'categorias_pagamento'
          AND column_name = 'id';
    """)
    tipo = ""
    try:
        tipo = r["body"][0]["data_type"]
    except Exception:
        pass
    passou = tipo == "uuid"
    registrar("TC-15", nome, passou, f"data_type = '{tipo}'")


def tc_16_migracao_forma_recebimentos(token):
    nome = "MIGRAÇÃO: recebimentos com forma_pagamento_id populado"
    r_total = sql(token, """
        SELECT COUNT(*) AS total FROM public.recebimentos
        WHERE forma_pagamento IS NOT NULL AND forma_pagamento <> '';
    """)
    r_migrado = sql(token, """
        SELECT COUNT(*) AS migrado FROM public.recebimentos
        WHERE forma_pagamento_id IS NOT NULL;
    """)
    try:
        total   = int(r_total["body"][0]["total"])
        migrado = int(r_migrado["body"][0]["migrado"])
        passou  = migrado > 0
        registrar("TC-16", nome, passou, f"{migrado}/{total} registros migrados")
    except Exception as e:
        registrar("TC-16", nome, False, str(e))


def tc_17_migracao_categoria_pagamentos(token):
    nome = "MIGRAÇÃO: pagamentos com categoria_id populado"
    r_total = sql(token, """
        SELECT COUNT(*) AS total FROM public.pagamentos
        WHERE categoria IS NOT NULL AND categoria <> '';
    """)
    r_migrado = sql(token, """
        SELECT COUNT(*) AS migrado FROM public.pagamentos
        WHERE categoria_id IS NOT NULL;
    """)
    try:
        total   = int(r_total["body"][0]["total"])
        migrado = int(r_migrado["body"][0]["migrado"])
        passou  = migrado > 0
        registrar("TC-17", nome, passou, f"{migrado}/{total} registros migrados")
    except Exception as e:
        registrar("TC-17", nome, False, str(e))


# ─── Execução principal ───────────────────────────────────────────────────────

TODOS_OS_TESTES = [
    tc_01_valor_zero_recebimento,
    tc_02_valor_negativo_recebimento,
    tc_03_valor_positivo_recebimento,
    tc_04_valor_zero_pagamento,
    tc_05_valor_negativo_pagamento,
    tc_06_cpf_duplicado,
    tc_07_cpf_null_aceito,
    tc_08_fk_forma_invalida_recebimento,
    tc_09_fk_forma_null_recebimento,
    tc_10_fk_forma_invalida_pagamento,
    tc_11_fk_categoria_invalida_pagamento,
    tc_12_fk_profissional_invalido_paciente,
    tc_13_fk_profissional_null_paciente,
    tc_14_uuid_nativo_formas,
    tc_15_uuid_nativo_categorias,
    tc_16_migracao_forma_recebimentos,
    tc_17_migracao_categoria_pagamentos,
]


def main():
    print("\n" + "="*65)
    print("  Fisio Clínica — Plano de Testes: Constraints e FKs")
    print(f"  Projeto: {PROJECT_REF}")
    print("="*65)

    token = obter_token()

    print(f"\n  Executando {len(TODOS_OS_TESTES)} casos de teste...\n")

    for teste in TODOS_OS_TESTES:
        teste(token)

    # ─── Relatório final ──────────────────────────────────────────────────────
    aprovados = sum(1 for r in resultados if r["passou"])
    reprovados = len(resultados) - aprovados

    print("\n" + "="*65)
    print(f"  RESULTADO FINAL: {aprovados}/{len(resultados)} testes aprovados")
    print("="*65)

    if reprovados > 0:
        print(f"\n  ❌ {reprovados} teste(s) reprovado(s):")
        for r in resultados:
            if not r["passou"]:
                print(f"     • [{r['id']}] {r['nome']}")
                if r["detalhe"]:
                    print(f"       → {r['detalhe'][:100]}")
    else:
        print("\n  ✅ Todas as constraints estão funcionando corretamente!")

    print("="*65 + "\n")
    return 0 if reprovados == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
