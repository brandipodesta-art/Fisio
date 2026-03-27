import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/usuarios-acesso
 * Cria um novo registro de acesso para um paciente (funcionario/admin/financeiro).
 * Body: { paciente_id, nome_acesso, email, senha }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paciente_id, nome_acesso, email, senha } = body;

    if (!paciente_id || !nome_acesso || !email || !senha) {
      return NextResponse.json(
        { error: "Campos obrigatórios: paciente_id, nome_acesso, email, senha." },
        { status: 400 }
      );
    }

    // Verificar duplicidade de nome_acesso
    const { data: nomeExiste } = await supabase
      .from("usuarios_acesso")
      .select("id")
      .eq("nome_acesso", nome_acesso.trim())
      .maybeSingle();

    if (nomeExiste) {
      return NextResponse.json(
        { error: `O nome de acesso "${nome_acesso}" já está em uso.` },
        { status: 409 }
      );
    }

    // Verificar duplicidade de email
    const { data: emailExiste } = await supabase
      .from("usuarios_acesso")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (emailExiste) {
      return NextResponse.json(
        { error: `O e-mail "${email}" já está em uso.` },
        { status: 409 }
      );
    }

    // Hash da senha
    const senha_hash = await bcrypt.hash(senha, 12);

    const { error } = await supabase.from("usuarios_acesso").insert({
      paciente_id,
      nome_acesso: nome_acesso.trim(),
      email: email.trim().toLowerCase(),
      senha_hash,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Nome de acesso ou e-mail já cadastrado." },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro interno ao criar acesso." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/usuarios-acesso
 * Atualiza o acesso de um paciente existente.
 * Body: { paciente_id, nome_acesso, email, senha? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paciente_id, nome_acesso, email, senha } = body;

    if (!paciente_id || !nome_acesso || !email) {
      return NextResponse.json(
        { error: "Campos obrigatórios: paciente_id, nome_acesso, email." },
        { status: 400 }
      );
    }

    // Buscar registro existente
    const { data: existente } = await supabase
      .from("usuarios_acesso")
      .select("id")
      .eq("paciente_id", paciente_id)
      .maybeSingle();

    if (!existente) {
      return NextResponse.json(
        { error: "Acesso não encontrado para este usuário." },
        { status: 404 }
      );
    }

    // Verificar duplicidade de nome_acesso (excluindo o próprio registro)
    const { data: nomeExiste } = await supabase
      .from("usuarios_acesso")
      .select("id")
      .eq("nome_acesso", nome_acesso.trim())
      .neq("id", existente.id)
      .maybeSingle();

    if (nomeExiste) {
      return NextResponse.json(
        { error: `O nome de acesso "${nome_acesso}" já está em uso.` },
        { status: 409 }
      );
    }

    // Verificar duplicidade de email (excluindo o próprio registro)
    const { data: emailExiste } = await supabase
      .from("usuarios_acesso")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .neq("id", existente.id)
      .maybeSingle();

    if (emailExiste) {
      return NextResponse.json(
        { error: `O e-mail "${email}" já está em uso.` },
        { status: 409 }
      );
    }

    const updatePayload: Record<string, string> = {
      nome_acesso: nome_acesso.trim(),
      email: email.trim().toLowerCase(),
      updated_at: new Date().toISOString(),
    };

    // Só atualiza a senha se foi fornecida
    if (senha && senha.length >= 6) {
      updatePayload.senha_hash = await bcrypt.hash(senha, 12);
    }

    const { error } = await supabase
      .from("usuarios_acesso")
      .update(updatePayload)
      .eq("id", existente.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro interno ao atualizar acesso." },
      { status: 500 }
    );
  }
}
