import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabaseServer";

// GET /api/recebimentos/resumo?ano=YYYY[&mes=1..12]
// Com `mes`, os totais consideram apenas aquele mês; o gráfico continua trazendo o ano inteiro.
export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(req.url);
  const ano = searchParams.get("ano") ?? new Date().getFullYear().toString();
  const mesParam = Number(searchParams.get("mes"));
  const mes = Number.isInteger(mesParam) && mesParam >= 1 && mesParam <= 12 ? mesParam : null;

  const [{ data: recebimentos }, { data: pagamentos }] = await Promise.all([
    supabase
      .from("recebimentos")
      .select("valor, status, data_vencimento, data_pagamento, taxa_valor, valor_liquido")
      .gte("data_vencimento", `${ano}-01-01`)
      .lte("data_vencimento", `${ano}-12-31`),
    supabase
      .from("pagamentos")
      .select("valor, status, data_vencimento, data_pagamento")
      .gte("data_vencimento", `${ano}-01-01`)
      .lte("data_vencimento", `${ano}-12-31`),
  ]);

  const recAno = recebimentos ?? [];
  const pagAno = pagamentos ?? [];

  // Totais: mês selecionado ou ano inteiro
  const prefixoMes = mes ? `${ano}-${String(mes).padStart(2, "0")}` : null;
  const rec = prefixoMes ? recAno.filter(r => r.data_vencimento?.startsWith(prefixoMes)) : recAno;
  const pag = prefixoMes ? pagAno.filter(p => p.data_vencimento?.startsWith(prefixoMes)) : pagAno;

  const totalRecebido          = rec.filter(r => r.status === "recebido").reduce((s, r) => s + Number(r.valor), 0);
  const totalTaxasCartao       = rec.filter(r => r.status === "recebido").reduce((s, r) => s + Number(r.taxa_valor ?? 0), 0);
  const totalLiquidoRecebido   = rec.filter(r => r.status === "recebido").reduce((s, r) => s + Number(r.valor_liquido ?? r.valor), 0);
  const totalPendenteRec       = rec.filter(r => r.status === "pendente").reduce((s, r) => s + Number(r.valor), 0);
  const totalAtrasadoRec       = rec.filter(r => r.status === "atrasado").reduce((s, r) => s + Number(r.valor), 0);
  const totalPago              = pag.filter(p => p.status === "pago").reduce((s, p) => s + Number(p.valor), 0);
  const totalDespesasPendentes = pag.filter(p => p.status === "pendente" || p.status === "atrasado").reduce((s, p) => s + Number(p.valor), 0);
  const saldoLiquido           = totalLiquidoRecebido - totalPago;

  // Agrupar por mês
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const recebimentosPorMes = meses.map((mes, i) => {
    const m = String(i + 1).padStart(2, "0");
    const valor = recAno
      .filter(r => r.status === "recebido" && r.data_vencimento?.startsWith(`${ano}-${m}`))
      .reduce((s, r) => s + Number(r.valor_liquido ?? r.valor), 0);
    return { mes, valor };
  });

  const pagamentosPorMes = meses.map((mes, i) => {
    const m = String(i + 1).padStart(2, "0");
    const valor = pagAno
      .filter(p => p.status === "pago" && p.data_vencimento?.startsWith(`${ano}-${m}`))
      .reduce((s, p) => s + Number(p.valor), 0);
    return { mes, valor };
  });

  return NextResponse.json({
    totalRecebido,
    totalTaxasCartao,
    totalLiquidoRecebido,
    totalPendente: totalPendenteRec,
    totalAtrasado: totalAtrasadoRec,
    totalPago,
    totalDespesasPendentes,
    saldoLiquido,
    recebimentosPorMes,
    pagamentosPorMes,
  });
}
