# 18 — Importação de Clientes da Planilha Cadastro.xlsx

**Data:** 29/05/2026  
**Arquivo fonte:** `Cadastro.xlsx` (6 clientes)  
**Script de importação:** `importar_clientes.py`  
**Script de testes:** `testar_importacao.py`

---

## Objetivo

Importar os clientes cadastrados na planilha `Cadastro.xlsx` para a tabela `pacientes` do Supabase, com validação de duplicatas e testes de integridade.

---

## Clientes Importados

| Nome | CPF | Nasc. | Cidade | Status |
|---|---|---|---|---|
| Simone da Silva | 092.835.326-51 | — | Guaxupé/MG | Já existia |
| Patrícia Maria de Oliveira Martins | 092.635.366-78 | 18/04/1990 | Guaxupé/MG | Inserido |
| Julye Cassimiro Leite | 159.122.236-20 | 24/05/2007 | Guaxupé/MG | Inserido |
| Aline Aparecida Rodrigues Pereira | 101.726.366-39 | 09/08/1991 | Guaxupé/MG | Inserido |
| Silvia Maria Bariani Tranquillini | 024.716.278-70 | 20/12/1950 | Tapiratiba/SP | Inserido |
| Mariana Caldeira Bueno | 104.143.176-70 | 30/05/1989 | Guaxupé/MG | Inserido |

**Resultado:** 5 inseridos, 1 já existia (Simone da Silva — CPF duplicado), 0 erros.

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
| Número | `numero` | Texto |
| Bairro | `bairro` | Trim + correção `s\b` → `s/n` |
| Cidade | `cidade` | Trim |

**Campos fixos:** `tipo_usuario = 'paciente'`, `ativo = true`

---

## Testes de Integridade

**46/46 testes passaram** — sem falhas.

Testes executados por cliente:
- Registro existe no banco
- `nome_completo` correto
- `tipo_usuario = 'paciente'`
- `ativo = true`
- Campos específicos (cidade, data_nascimento, profissao, rg, telefone_cel)

Testes globais:
- Sem duplicatas por CPF (1 registro por CPF)
- Total de pacientes no banco: 7 (6 da planilha + 1 pré-existente)

---

## Idempotência

O script é seguro para re-execução: verifica existência por CPF antes de inserir. Se o CPF já existir, o registro é pulado sem erro.
