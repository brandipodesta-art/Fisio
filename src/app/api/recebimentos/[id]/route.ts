import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/recebimentos/[id]
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("recebimentos")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// ── Cria comissão pendente para a profissional ao confirmar recebimento ────────
async function criarComissaoSeAplicavel(
  recebimentoId: string,
  recebimento: { observacoes: string | null; valor: number; procedimento_id: string | null },
  dataPagamento: string
) {
  // 1. Idempotência — não duplicar se comissão já foi criada para este recebimento
  const { data: existente } = await supabase
    .from("pagamentos")
    .select("id")
    .ilike("observacoes", `%recebimento:${recebimentoId}%`)
    .maybeSingle();
  if (existente) return;

  // 2. Verificar se o recebimento veio de um agendamento
  const matchAgt = recebimento.observacoes?.match(/agendamento:([a-f0-9-]+)/i);
  if (!matchAgt?.[1]) return; // recebimento manual sem vínculo — ignorar

  const agendamentoId = matchAgt[1];

  // 3. Buscar agendamento → professional_id + procedimento_id + nome do profissional
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("professional_id, procedimento_id, profissionais(name)")
    .eq("id", agendamentoId)
    .maybeSingle();

  if (!agendamento?.professional_id) return;

  const procedimentoId = agendamento.procedimento_id ?? recebimento.procedimento_id;
  if (!procedimentoId) return;

  // 4. Buscar percentual de comissão da profissional para este procedimento
  const { data: comissao } = await supabase
    .from("comissoes_profissional")
    .select("percentual")
    .eq("profissional_id", agendamento.professional_id)
    .eq("procedimento_id", procedimentoId)
    .maybeSingle();

  if (!comissao || comissao.percentual <= 0) return;

  // 5. Calcular valor da comissão
  const valorComissao = Math.round(recebimento.valor * comissao.percentual) / 100;
  if (valorComissao <= 0) return;

  // 6. Resolver nome do profissional
  const prof = agendamento.profissionais as unknown as { name: string } | null;
  const profissionalNome = prof?.name ?? agendamento.professional_id;

  // 7. Buscar categoria "Comissões" (soft match)
  const { data: categoria } = await supabase
    .from("categorias_pagamento")
    .select("id")
    .ilike("nome", "Comiss%")
    .limit(1)
    .maybeSingle();

  // 8. Inserir pagamento de comissão com status pendente
  await supabase.from("pagamentos").insert({
    descricao: `${profissionalNome} - Comissão`,
    fornecedor: profissionalNome,
    valor: valorComissao,
    status: "pendente",
    data_vencimento: dataPagamento,
    categoria: "Comissões",
    categoria_id: categoria?.id ?? null,
    observacoes: `recebimento:${recebimentoId}`,
  });
}

// PUT /api/recebimentos/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Buscar estado atual do recebimento antes de atualizar (para detectar transição de status)
  const { data: antes } = await supabase
    .from("recebimentos")
    .select("status, observacoes, valor, procedimento_id")
    .eq("id", id)
    .maybeSingle();

  // Atualizar recebimento
  const { data, error } = await supabase
    .from("recebimentos")
    .update(body)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Criar comissão apenas na transição → "recebido" (evita duplicar se já estava recebido)
  if (body.status === "recebido" && antes?.status !== "recebido" && antes) {
    const dataPagamento =
      body.data_pagamento ?? new Date().toISOString().slice(0, 10);
    await criarComissaoSeAplicavel(id, antes, dataPagamento).catch(() => {
      // Falha silenciosa — não bloqueia a confirmação do recebimento
    });
  }

  return NextResponse.json(data);
}

// DELETE /api/recebimentos/[id]
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from("recebimentos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
