"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ClinicaConfig {
  logo_url: string | null;
  nome_clinica: string | null;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
}

/** Busca a configuração da clínica (linha única id=1). Retorna null se a tabela não existir. */
export async function fetchClinicaConfig(): Promise<ClinicaConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("configuracoes_clinica")
    .select("logo_url, nome_clinica, cnpj, telefone, endereco")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data as ClinicaConfig;
}

/** Hook para componentes client: logo e nome da clínica, com recarga via evento global. */
export function useClinicaConfig() {
  const [config, setConfig] = useState<ClinicaConfig | null>(null);

  useEffect(() => {
    let ativo = true;
    const carregar = () => {
      fetchClinicaConfig().then((c) => {
        if (ativo) setConfig(c);
      });
    };
    carregar();
    // Permite que a tela de Configurações avise o TopBar quando a logo mudar
    window.addEventListener("clinica-config-updated", carregar);
    return () => {
      ativo = false;
      window.removeEventListener("clinica-config-updated", carregar);
    };
  }, []);

  return config;
}
