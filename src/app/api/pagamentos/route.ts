import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/pagamentos — lista com filtros opcionais
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status    = searchParams.get("status");
  const categoria = searchParams.get("categoria");
  const mes       = searchParams.get("mes");   // formato "YYYY-MM"
  const ano       = searchParams.get("ano");   // formato "YYYY"

  let query = supabase
    .from("pagamentos")
    .select("*")
    .order("data_vencimento", { ascending: false });

  if (status && status !== "todos") query = query.eq("status", status);
  if (categoria && categoria !== "todas") query = query.eq("categoria", categoria);
  if (mes)  query = query.gte("data_vencimento", `${mes}-01`).lte("data_vencimento", `${mes}-31`);
  if (ano && !mes) query = query.gte("data_vencimento", `${ano}-01-01`).lte("data_vencimento", `${ano}-12-31`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/pagamentos — cria novo pagamento
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Garantir que categoria nunca seja null (coluna NOT NULL no banco)
  // Usa o nome da categoria se disponível, senão fallback para "Outros"
  const payload = {
    ...body,
    categoria: body.categoria ?? "Outros",
  };
  const { data, error } = await supabase
    .from("pagamentos")
    .insert([payload])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
