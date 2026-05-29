# 18 — Importação em Lote de 802 Clientes (Cadastro.xlsx)

**Data:** 29/05/2026  
**Arquivo fonte:** `Cadastro.xlsx` (802 registros)  
**Scripts:** `importar_clientes_lote.py`, `completar_importacao.py`, `testar_importacao_lote.py`

---

## Resultado da Importação

| Métrica | Valor |
|---|---|
| Total na planilha | 802 |
| Clientes únicos (após remover duplicatas da planilha) | 798 |
| Já existiam no banco antes da importação | 7 |
| Inseridos com sucesso | 791 |
| Erros de inserção | 0 |
| **Total de pacientes no banco após importação** | **798** |

---

## CPFs Duplicados na Planilha (Tratados)

A planilha continha 4 CPFs repetidos — erros de cadastro na fonte de dados. O sistema inseriu apenas a **primeira ocorrência** e ignorou as demais:

| CPF | 1ª Ocorrência (inserida) | 2ª Ocorrência (ignorada) |
|---|---|---|
| 383.815.278-64 | Sabrina Luiza Alves Veiga (linha 55) | Sabrina Luisa Alves Veiga (linha 266) |
| 304.410.698-27 | Renata Almada (linha 92) | Renata F R A Bardi (linha 763) |
| 072.599.696-01 | Daniela Galatti Zavagli (linha 465) | Daia Daniela Galatti Zavagli (linha 479) |
| 035.233.556-48 | Lidiane Cardoso Piza Bueno (linha 725) | Renato Resende Bueno (linha 801) |

---

## Campos Importados

| Campo na Planilha | Campo no Banco | Transformação |
|---|---|---|
| Nome | `nome_completo` | Trim |
| CPF | `cpf` | Trim |
| RG | `rg` | Texto |
| Data de nascimento | `data_nascimento` | `DD/MM/AAAA` |
| Profissão | `profissao` | Trim |
| Telefone fixo | `telefone_fixo` | Máscara `(XX) XXXX-XXXX` |
| Celular | `telefone_cel` | Máscara `(XX) XXXXX-XXXX` |
| CEP | `cep` | Texto |
| Endereço | `rua` | Trim |
| Número | `numero` | Texto (suporta `SN`, `s/n`, etc.) |
| Bairro | `bairro` | Trim + correção `s\b` → `s/n` |
| Cidade | `cidade` | Trim |

**Campos fixos:** `tipo_usuario = 'paciente'`, `ativo = true`

---

## Testes de Integridade — 11/11 OK

- Total de pacientes no banco = 798
- Sem CPFs duplicados no banco (588 CPFs únicos)
- Amostra de 9 clientes verificados individualmente (início, meio e fim da planilha)
- Todos com `tipo_usuario = 'paciente'` e `ativo = true`
- CPFs duplicados da planilha: exatamente 1 registro cada no banco

---

## Idempotência

O script é seguro para re-execução: verifica CPF e nome antes de inserir. Registros já existentes são pulados sem erro.
