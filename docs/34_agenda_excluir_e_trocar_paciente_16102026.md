# 34 — Agenda: excluir agendamento e trocar paciente lançado errado (16/10/2026)

## Problema relatado pela clínica
Um agendamento foi lançado no paciente errado e não havia como **excluir**. A **edição** também
não resolveu.

## O que estava acontecendo
- **Não existia exclusão de agendamento** em lugar nenhum (cartão, janela de edição, banco). Antes
  havia o status "Cancelado", que servia de saída; ele saiu quando os status foram trocados por
  Atendido / Reposição / Falta com e sem Reposição (commit `c5ec58b`).
- **Edição com armadilhas:**
  - agendamento já finalizado (Atendido, Não Atendido, Falta sem Reposição, Reposição) abre com
    tudo bloqueado; o botão para liberar ficava escondido no rodapé;
  - o menu ⋮ do cartão só aparecia passando o mouse (invisível em tablet/celular) e sumia nos
    status finalizados;
  - trocar o paciente não levava junto a **cobrança** (recebimento) já gerada — ela continuava no
    nome do paciente errado — nem recontava as **frequências** dos dois pacientes.

## O que mudou
1. **Botão "Excluir"** na janela "Editar Agendamento" (rodapé, à esquerda), com confirmação que
   mostra paciente, data e horário.
   - Cobrança **pendente, atrasada ou cancelada** gerada pelo agendamento é excluída junto.
   - Cobrança **já paga** impede a exclusão, com aviso para estornar/excluir no Financeiro antes
     (dinheiro recebido e comissão não somem pela agenda).
   - Vínculo com a Lista de Espera é solto antes de excluir.
   - Frequência do paciente no mês é recontada.
2. **Trocar o paciente na edição** agora leva junto as cobranças geradas pelo agendamento e
   reconta as frequências do paciente antigo e do novo (e dos dois meses, se a data mudou).
3. **Agendamento bloqueado:** o botão **"Desbloquear"** fica dentro do próprio aviso colorido.
4. **Menu ⋮ do cartão:** sempre visível em tablet/celular; com mouse continua aparecendo ao passar
   por cima. "Editar" aparece em qualquer status.

## Como trocar o paciente de um agendamento
Clicar no agendamento → (se bloqueado, "Desbloquear") → apagar o nome no campo Paciente → digitar
o certo e **escolher na lista** → Salvar.

## Onde mexe
- `src/lib/agendamentoExclusao.ts` — regras (o que acontece com as cobranças; paciente mudou?;
  id já salvo?).
- `src/components/AgendaPage.tsx` — `handleDeleteAppointment`, troca de paciente em
  `handleUpdateAppointment`, `recalcularFrequencia` (extraída de `runStatusSideEffects`).
- `src/components/AgendaNewEventDialog.tsx` — botão Excluir, confirmação, Desbloquear no aviso.
- `src/components/AgendaEventCard.tsx` — menu ⋮.
- Sem mudança no banco. A única tabela que aponta para `agendamentos` é `lista_espera`
  (`ON DELETE SET NULL`), tratada antes da exclusão.

## Verificação
- Testes: `src/__tests__/agendamento-exclusao.test.ts` (9) — total do projeto 86, todos passando.
- `tsc --noEmit` e `next build` sem erros.
- **Não testado com o banco real** (não há `.env` local). Conferir no ambiente de teste/preview:
  1. excluir agendamento sem cobrança;
  2. excluir agendamento Atendido com cobrança pendente → a cobrança some do Financeiro;
  3. tentar excluir agendamento com cobrança paga → aviso, nada excluído;
  4. trocar o paciente de um agendamento Atendido → a cobrança passa para o paciente novo;
  5. no tablet/celular, o ⋮ do cartão aparece.
