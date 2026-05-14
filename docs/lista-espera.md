# Lista de Espera

Sistema para gerenciar pacientes que aguardam vaga ou que aceitam ser chamados
caso surja uma janela antes da data já agendada.

## Caso de uso (cliente)

> *"Marcelo está com dor nas costas, mas só tem horário para ele na sexta.
> Quanto antes melhor. Se a Maria desmarcar na terça, lembrar de ligar pro
> Marcelo pra ver se ele pode vir antes."*

## Onde aparece

### 1. Botão na toolbar da Agenda

Ao lado do botão "Novo Agendamento" há o botão **"Lista de Espera"** com um
**badge** que mostra a quantidade de pacientes aguardando:

- **Amarelo** = aguardando, sem casos de urgência alta
- **Vermelho** = existem casos de urgência alta na fila

### 2. Drawer lateral (desliza da direita)

Funciona em **qualquer tamanho de tela** (mobile, notebook, monitor ultrawide).
Não rouba espaço do calendário — só aparece quando aberto.

### 3. Checkbox no modal de Novo Agendamento

Ao criar um agendamento, há a opção *"Adicionar à Lista de Espera"* com
seletor de urgência (Alta / Média / Baixa). Ideal para o caso do Marcelo:
o agendamento da sexta é criado, e ele também entra na lista para ser
contactado se vagar antes.

## Estrutura de dados

Tabela `lista_espera` no Supabase. Schema completo em
[`docs/sql/lista_espera.sql`](sql/lista_espera.sql).

Campos principais:
- `paciente_id` (FK opcional — permite entradas avulsas sem cadastro)
- `paciente_nome`, `telefone`
- `profissional_preferido_id`, `procedimento_id` (opcionais)
- `motivo` (texto livre — "dor nas costas")
- `urgencia`: `alta` · `media` · `baixa`
- `agendamento_atual_id` (FK opcional — vincula ao agendamento que o
  paciente já tem marcado, se aplicável)
- `status`: `aguardando` · `contactado` · `atendido` · `desistiu`
- `created_at`, `contacted_at`, `contacted_by`

## Ordenação na lista

Pacientes aparecem ordenados por:
1. **Urgência** (alta → média → baixa)
2. **Antiguidade na fila** (mais antigos primeiro)

## Ações em cada paciente

| Ícone | Ação | Quando aparece |
|-------|------|----------------|
| 📞 PhoneCall | Marcar como **contactado** | Status `aguardando` |
| ✓ Check | Marcar como **atendido** | Status `aguardando` ou `contactado` |
| ✏️ Pencil | **Editar** entrada | Sempre |
| 🗑 Trash | **Remover** da lista | Se tem permissão |

O número de telefone é **clicável** (`tel:` link) — em desktop abre o
discador padrão; em mobile abre o app de telefone.

## Permissões

| Perfil | Pode ver | Pode adicionar | Pode remover |
|--------|----------|----------------|--------------|
| admin (Amanda) | ✓ | ✓ | ✓ |
| financeiro | ✓ | ✓ | ✓ |
| funcionario (secretária) | ✓ | ✓ | ✓ |

A recepção é compartilhada — qualquer atendente pode ligar para qualquer
paciente. Por isso, todos os perfis veem a lista inteira.

Controlado em [`src/lib/auth/usePermissoes.ts`](../src/lib/auth/usePermissoes.ts)
pelas flags `podeVerListaEspera` e `podeRemoverListaEspera`.

## Decisão: manual, não automático (por enquanto)

Quando alguém cancela um agendamento, o sistema **NÃO** sugere
automaticamente pacientes da lista. A recepcionista precisa abrir o drawer
manualmente para consultar.

**Por que manual?**
- Mais simples de aprender e usar
- Evita popups intrusivos que atrapalham outras tarefas
- A cliente preferiu começar simples e evoluir depois

**Quando faz sentido evoluir para automático?**
Após algumas semanas de uso, se a recepção sentir que está esquecendo de
consultar a lista, podemos adicionar:
- Toast notification discreto quando um agendamento for cancelado:
  *"3 pacientes na lista podem aproveitar este horário — abrir lista?"*
- Sem bloquear a tela, sem alterar o fluxo atual.

## Arquivos relacionados

| Arquivo | Função |
|---------|--------|
| `docs/sql/lista_espera.sql` | Schema SQL da tabela |
| `src/components/ListaEsperaDrawer.tsx` | Drawer lateral + formulário |
| `src/components/AgendaPage.tsx` | Botão na toolbar + integração |
| `src/components/AgendaNewEventDialog.tsx` | Checkbox no modal de agendamento |
| `src/components/agendaTypes.ts` | Campos `addToWaitlist` e `waitlistUrgencia` em `Appointment` |
| `src/lib/auth/usePermissoes.ts` | Flags de permissão |
