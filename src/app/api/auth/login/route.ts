import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/login
 * Autentica um usuário pelo nome_acesso ou email + senha.
 * Body: { identificador: string, senha: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const body = await request.json();
    const { identificador, senha } = body;

    if (!identificador || !senha) {
      return NextResponse.json(
        { error: "Informe o nome/e-mail e a senha." },
        { status: 400 }
      );
    }

    const id = identificador.trim().toLowerCase();

    // Buscar por nome_acesso OU email — join com pacientes é OPCIONAL (left join)
    const { data: usuario, error: dbError } = await supabase
      .from("usuarios_acesso")
      .select(`
        id,
        paciente_id,
        nome_acesso,
        email,
        senha_hash,
        ativo,
        tipo_usuario,
        pacientes(nome_completo, tipo_usuario)
      `)
      .or(`nome_acesso.eq.${identificador.trim()},email.eq.${id}`)
      .eq("ativo", true)
      .maybeSingle();

    if (dbError) throw new Error(dbError.message);

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 401 }
      );
    }

    // Verificar senha com bcrypt
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: "Senha incorreta." },
        { status: 401 }
      );
    }

    // tipo_usuario: a fonte primária é a tabela pacientes (onde o CadastroForm salva o perfil).
    // O campo tipo_usuario em usuarios_acesso pode não existir, estar null ou desatualizado.
    // Prioridade: pacientes.tipo_usuario > usuarios_acesso.tipo_usuario > fallback "funcionario"
    const paciente = Array.isArray(usuario.pacientes)
      ? usuario.pacientes[0]
      : usuario.pacientes;

    const nomeCompleto: string = paciente?.nome_completo ?? usuario.nome_acesso;
    const tipoUsuario: string = paciente?.tipo_usuario || (usuario as any).tipo_usuario || "funcionario";

    // Montar payload da sessão (sem dados sensíveis)
    const sessao = {
      id:           usuario.id,
      paciente_id:  usuario.paciente_id,
      nome_acesso:  usuario.nome_acesso,
      email:        usuario.email,
      nome_completo: nomeCompleto,
      tipo_usuario:  tipoUsuario,
    };

    return NextResponse.json({ success: true, usuario: sessao });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Erro interno ao autenticar." },
      { status: 500 }
    );
  }
}
