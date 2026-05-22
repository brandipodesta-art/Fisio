import { createClient } from "@supabase/supabase-js";

/**
 * Cria o cliente Supabase sob demanda (lazy).
 * Deve ser chamado DENTRO dos handlers de rota — nunca no topo do módulo —
 * para evitar erros de build no Vercel quando as variáveis ainda não estão disponíveis.
 */
export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
