// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, any, any> | null = null;

/**
 * Retorna um cliente Supabase singleton para uso no browser.
 * Usa @supabase/supabase-js diretamente para compatibilidade com a chave sb_publishable_.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): SupabaseClient<any, any, any> {
  if (_client) return _client;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _client = createSupabaseClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}
