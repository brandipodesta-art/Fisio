import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PacienteInsert } from "@/lib/types/paciente";

/**
 * GET /api/pacientes
 * Retorna a lista de pacientes com suporte a filtros via query params:
 *   - nome: busca parcial por nome_completo (case-insensitive)
 *   - cpf:  busca parcial por cpf
 *   - tipo:        filtra por tipo_usuario exato
 *   - profissional: busca parcial por profissional_responsavel (case-insensitive)
 *   - status:       'ativo', 'inativo' ou 'todos' (default: 'todos')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const nome = searchParams.get("nome") ?? "";
    const cpf = searchParams.get("cpf") ?? "";
    const tipo = searchParams.get("tipo") ?? "";
    const profissional = searchParams.get("profissional") ?? "";
    const status = searchParams.get("status") ?? "todos";

    let query = supabase
      .from("pacientes")
      .select(
        "id, created_at, tipo_usuario, profissional_responsavel, nome_completo, cpf, telefone_cel, data_nascimento, cidade, ativo"
      )
      .order("nome_completo", { ascending: true });

    if (nome.trim()) {
      query = query.ilike("nome_completo", `%${nome.trim()}%`);
    }

    if (cpf.trim()) {
      const cpfDigits = cpf.replace(/\D/g, "");
      if (cpfDigits) {
        query = query.ilike("cpf", `%${cpfDigits}%`);
      }
    }

    if (tipo && tipo !== "todos") {
      query = query.eq("tipo_usuario", tipo);
    }

    if (profissional.trim()) {
      query = query.ilike("profissional_responsavel", `%${profissional.trim()}%`);
    }

    if (status === "ativo") {
      query = query.eq("ativo", true);
    } else if (status === "inativo") {
      query = query.eq("ativo", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Erro ao buscar pacientes", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pacientes
 * Cria um novo paciente no banco de dados.
 * Body: PacienteInsert (JSON)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: PacienteInsert = await request.json();

    // Validações básicas obrigatórias
    if (!body.nome_completo?.trim()) {
      return NextResponse.json(
        { error: "Nome completo é obrigatório" },
        { status: 400 }
      );
    }
    if (!body.cpf?.trim()) {
      return NextResponse.json(
        { error: "CPF é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("pacientes")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar paciente", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
