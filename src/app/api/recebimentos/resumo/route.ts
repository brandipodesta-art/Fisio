import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/recebimentos/resumo?ano=YYYY
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ano = searchParams.get("ano") ?? new Date().getFullYear().toString();

  const [{ data: recebimentos }, { data: pagamentos }] = await Promise.all([
    supabase
      .from("recebimentos")
      .select("valor, status, data_vencimento, data_pagamento")
      .gte("data_vencimento", `${ano}-01-01`)
      .lte("data_vencimento", `${ano}-12-31`),
    supabase
      .from("pagamentos")
      .select("valor, status, data_vencimento, data_pagamento")
      .gte("data_vencimento", `${ano}-01-01`)
      .lte("data_vencimento", `${ano}-12-31`),
  ]);

  const rec = recebimentos ?? [];
  const pag = pagamentos ?? [];

  const totalRecebido          = rec.filter(r => r.status === "recebido").reduce((s, r) => s + Number(r.valor), 0);
  const totalPendenteRec       = rec.filter(r => r.status === "pendente").reduce((s, r) => s + Number(r.valor), 0);
  const totalAtrasadoRec       = rec.filter(r => r.status === "atrasado").reduce((s, r) => s + Number(r.valor), 0);
  const totalPago              = pag.filter(p => p.status === "pago").reduce((s, p) => s + Number(p.valor), 0);
  const totalDespesasPendentes = pag.filter(p => p.status === "pendente" || p.status === "atrasado").reduce((s, p) => s + Number(p.valor), 0);
  const saldoLiquido           = totalRecebido - totalPago;

  // Agrupar por mês
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const recebimentosPorMes = meses.map((mes, i) => {
    const m = String(i + 1).padStart(2, "0");
    const valor = rec
      .filter(r => r.status === "recebido" && r.data_vencimento?.startsWith(`${ano}-${m}`))
      .reduce((s, r) => s + Number(r.valor), 0);
    return { mes, valor };
  });

  const pagamentosPorMes = meses.map((mes, i) => {
    const m = String(i + 1).padStart(2, "0");
    const valor = pag
      .filter(p => p.status === "pago" && p.data_vencimento?.startsWith(`${ano}-${m}`))
      .reduce((s, p) => s + Number(p.valor), 0);
    return { mes, valor };
  });

  return NextResponse.json({
    totalRecebido,
    totalPendente: totalPendenteRec,
    totalAtrasado: totalAtrasadoRec,
    totalPago,
    totalDespesasPendentes,
    saldoLiquido,
    recebimentosPorMes,
    pagamentosPorMes,
  });
}
