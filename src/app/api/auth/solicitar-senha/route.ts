import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/auth/solicitar-senha
 * Cria uma solicitação de redefinição de senha para o Admin revisar.
 * Body: { identificador: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identificador } = body;

    if (!identificador) {
      return NextResponse.json(
        { error: "Informe o nome de acesso ou e-mail." },
        { status: 400 }
      );
    }

    const id = identificador.trim().toLowerCase();

    // Buscar usuário por nome_acesso ou email
    const { data: usuario } = await supabase
      .from("usuarios_acesso")
      .select("id, nome_acesso, email, ativo")
      .or(`nome_acesso.eq.${identificador.trim()},email.eq.${id}`)
      .maybeSingle();

    if (!usuario || !usuario.ativo) {
      // Resposta genérica para não revelar se o usuário existe
      return NextResponse.json({
        success: true,
        message: "Se o usuário existir, a solicitação foi registrada.",
      });
    }

    // Verificar se já existe solicitação pendente
    const { data: solicitacaoExistente } = await supabase
      .from("solicitacoes_senha")
      .select("id")
      .eq("usuario_id", usuario.id)
      .eq("status", "pendente")
      .maybeSingle();

    if (solicitacaoExistente) {
      return NextResponse.json({
        success: true,
        message: "Já existe uma solicitação pendente para este usuário. O Admin será notificado.",
      });
    }

    // Criar nova solicitação
    const { error } = await supabase.from("solicitacoes_senha").insert({
      usuario_id:  usuario.id,
      nome_acesso: usuario.nome_acesso,
      email:       usuario.email,
      status:      "pendente",
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Solicitação registrada com sucesso. O Admin irá redefinir sua senha em breve.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro interno ao registrar solicitação." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/solicitar-senha
 * Lista as solicitações pendentes (para o Admin visualizar).
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("solicitacoes_senha")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json(data ?? []);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro ao buscar solicitações." },
      { status: 500 }
    );
  }
}
