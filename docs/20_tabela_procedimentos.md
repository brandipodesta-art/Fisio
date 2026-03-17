# Tabela `procedimentos` — Integração Dinâmica com Recebimentos

## Contexto

Anteriormente, a lista de procedimentos disponíveis no formulário de Recebimentos era uma constante hardcoded no código-fonte (`PROCEDIMENTOS`). Isso exigia uma alteração no código e um novo deploy sempre que um procedimento precisasse ser adicionado, editado ou desativado.

Para tornar o sistema mais flexível e gerenciável, foi criada a tabela `procedimentos` no Supabase, e o formulário passou a buscar os valores dinamicamente.

---

## Estrutura da Tabela

```sql
CREATE TABLE public.procedimentos (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome       text NOT NULL UNIQUE,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Chave primária gerada automaticamente |
| `nome` | text | Nome do procedimento (único) |
| `ativo` | boolean | Controla se aparece no formulário (`true` = visível) |
| `created_at` | timestamptz | Data de criação do registro |

---

## Políticas de Acesso (RLS)

A tabela tem **Row Level Security (RLS)** habilitado com a seguinte política:

```sql
CREATE POLICY "Leitura pública de procedimentos"
  ON public.procedimentos FOR SELECT
  USING (true);
```

Qualquer usuário autenticado ou anônimo pode **ler** os procedimentos. Operações de escrita (INSERT, UPDATE, DELETE) devem ser feitas diretamente pelo painel do Supabase.

---

## Procedimentos Cadastrados Inicialmente

| Nome |
|---|
| Acupuntura |
| Drenagem linfática |
| Fisioterapia |
| Laserterapia |
| Liberação miofascial |
| Limpeza de pele |
| Massagem relaxante |
| Pelling de diamante |
| Pilates |
| Quiropraxia |

---

## Integração no Formulário de Recebimentos

### Hook `useProcedimentos`

Foi criado um hook customizado no componente `FinanceiroRecebimentos.tsx` que busca os procedimentos ativos ordenados por nome:

```ts
function useProcedimentos() {
  const [procedimentos, setProcedimentos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function buscar() {
      try {
        const { data } = await supabase
          .from("procedimentos")
          .select("nome")
          .eq("ativo", true)
          .order("nome");
        if (data) setProcedimentos(data.map(p => p.nome));
      } finally {
        setCarregando(false);
      }
    }
    buscar();
  }, [supabase]);

  return { procedimentos, carregando };
}
```

### Uso no FormModal

O hook é chamado dentro do `FormModal` e no componente principal, substituindo a referência à constante hardcoded:

```tsx
// Antes
{PROCEDIMENTOS.map(p => (
  <SelectItem key={p} value={p}>{p}</SelectItem>
))}

// Depois
{carregandoProc ? (
  <SelectItem value="__loading" disabled>Carregando...</SelectItem>
) : procedimentos.length === 0 ? (
  <SelectItem value="__empty" disabled>Nenhum procedimento cadastrado</SelectItem>
) : (
  procedimentos.map(p => (
    <SelectItem key={p} value={p}>{p}</SelectItem>
  ))
)}
```

O mesmo hook é reutilizado no filtro de Procedimento da listagem principal.

---

## Como Gerenciar Procedimentos

Para **adicionar** um novo procedimento, execute no SQL Editor do Supabase:

```sql
INSERT INTO public.procedimentos (nome) VALUES ('Nome do Procedimento');
```

Para **desativar** um procedimento sem excluí-lo (ele deixa de aparecer no formulário):

```sql
UPDATE public.procedimentos SET ativo = false WHERE nome = 'Nome do Procedimento';
```

Para **reativar**:

```sql
UPDATE public.procedimentos SET ativo = true WHERE nome = 'Nome do Procedimento';
```

---

## Commit de Referência

`77697bb` — `feat: integrar tabela procedimentos do Supabase no formulário de Recebimentos`
