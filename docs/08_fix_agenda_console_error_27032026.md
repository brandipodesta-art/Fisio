# Fix: Erro na Agenda — console.error acionando overlay do Next.js 15

**Data:** 27/03/2026  
**Tipo:** `fix`  
**Arquivo:** `src/components/AgendaPage.tsx`

---

## Problema

Ao alterar o status de um agendamento na Agenda, o Next.js 15 exibia o overlay de erro de desenvolvimento com a mensagem:

> `src\components\AgendaPage.tsx (229:15) @ handleStatusChange`

O overlay bloqueava a interface e impedia o uso normal da agenda.

## Causa Raiz

O Next.js 15.5+ intercepta chamadas a `console.error()` no modo de desenvolvimento e as exibe como overlays de erro, mesmo quando o erro está sendo tratado corretamente no código. As três funções de persistência usavam `console.error(error)` para logar erros do Supabase:

- `handleSaveAppointment` (linha 180)
- `handleUpdateAppointment` (linha 209)
- `handleStatusChange` (linha 229)

O comportamento é correto — o erro era capturado, o estado era revertido via `setAppointments(backup)` — mas o `console.error` acionava o overlay indevidamente.

## Solução

Substituídos todos os `console.error(error)` por `toast.error(mensagem)` usando a biblioteca **Sonner** (já presente no projeto):

```typescript
// ANTES
if (error) {
  console.error(error);
  setAppointments(backup);
}

// DEPOIS
if (error) {
  toast.error("Erro ao alterar status. Tente novamente.");
  setAppointments(backup);
}
```

### Mensagens de erro por função

| Função | Mensagem |
|---|---|
| `handleSaveAppointment` | "Erro ao salvar agendamento. Tente novamente." |
| `handleUpdateAppointment` | "Erro ao atualizar agendamento. Tente novamente." |
| `handleStatusChange` | "Erro ao alterar status. Tente novamente." |

## Resultado

- Overlay de erro do Next.js não é mais acionado
- Erros do Supabase são exibidos como toast não-intrusivo no canto da tela
- O estado da agenda é revertido corretamente em caso de falha

## Commits

- `fix(agenda): substituir console.error por toast.error para evitar overlay do Next.js 15`
