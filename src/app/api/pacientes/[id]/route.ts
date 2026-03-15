import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PacienteUpdate } from "@/lib/types/paciente";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/pacientes/[id]
 * Retorna os dados completos de um paciente pelo ID.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Paciente não encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao buscar paciente", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pacientes/[id]
 * Atualiza os dados de um paciente existente.
 * Body: PacienteUpdate (JSON) — campos parciais são aceitos
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body: PacienteUpdate = await request.json();

    // Validações básicas
    if (body.nome_completo !== undefined && !body.nome_completo.trim()) {
      return NextResponse.json(
        { error: "Nome completo não pode ser vazio" },
        { status: 400 }
      );
    }
    if (body.cpf !== undefined && !body.cpf.trim()) {
      return NextResponse.json(
        { error: "CPF não pode ser vazio" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pacientes")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Paciente não encontrado" },
          { status: 404 }
        );
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Já existe outro paciente com este CPF." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao atualizar paciente", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pacientes/[id]
 * Remove um paciente do banco de dados.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("pacientes")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao excluir paciente", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
