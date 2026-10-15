"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ClinicaConfig {
  logo_url: string | null;
  nome_clinica: string | null;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  cor_tema?: string | null;
  taxa_pix?: number | null;
  taxa_antecipacao?: number | null;
  /** Primeiro horário da Agenda (hora cheia, 0-23) */
  hora_inicio_agenda?: number | null;
  /** Último horário da Agenda (hora cheia, 0-23) */
  hora_fim_agenda?: number | null;
}

/**
 * Chave do localStorage com a última configuração carregada.
 * Também é lida pelo script inline do layout para aplicar o tema antes da primeira pintura.
 */
export const CLINICA_CONFIG_STORAGE_KEY = "fisio_clinica_config";

/** Tempo máximo de espera pela configuração antes de liberar a tela com o padrão */
const TIMEOUT_CONFIG_MS = 4000;

/**
 * Configuração já conhecida nesta aba (undefined = ainda não carregada).
 * Faz os componentes montados depois da carga já nascerem com a marca certa.
 */
let memoria: ClinicaConfig | null | undefined;

function lerCache(): ClinicaConfig | null {
  try {
    const raw = localStorage.getItem(CLINICA_CONFIG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClinicaConfig) : null;
  } catch {
    return null;
  }
}

function salvarCache(config: ClinicaConfig) {
  try {
    localStorage.setItem(CLINICA_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage indisponível: a configuração só não fica em cache
  }
}

function aplicarTema(config: ClinicaConfig | null) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", config?.cor_tema || "verde");
}

/**
 * Busca a configuração da clínica (linha única id=1). Retorna null se a tabela não existir.
 * Usa `*` para não falhar quando uma coluna opcional ainda não foi criada no banco.
 */
export async function fetchClinicaConfig(): Promise<ClinicaConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("configuracoes_clinica")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data as ClinicaConfig;
}

/**
 * Hook para componentes client: configuração da clínica e se ela já é conhecida.
 * `pronta` fica false até haver configuração em cache ou a busca terminar, para que
 * a tela não exiba a marca padrão antes da marca da clínica.
 */
export function useClinicaConfigStatus(): { config: ClinicaConfig | null; pronta: boolean } {
  const [config, setConfig] = useState<ClinicaConfig | null>(() => memoria ?? null);
  const [pronta, setPronta] = useState(() => memoria !== undefined);

  useEffect(() => {
    let ativo = true;

    const emCache = lerCache();
    if (emCache) {
      memoria = emCache;
      setConfig(emCache);
      setPronta(true);
      aplicarTema(emCache);
    }

    const carregar = () => {
      fetchClinicaConfig().then((c) => {
        if (!ativo) return;
        // Falha na busca: mantém o que já estava em cache em vez de voltar ao padrão
        if (c) {
          memoria = c;
          setConfig(c);
          salvarCache(c);
          aplicarTema(c);
        } else if (!lerCache()) {
          memoria = null;
          aplicarTema(null);
        }
        setPronta(true);
      });
    };
    carregar();

    const timeout = setTimeout(() => {
      if (ativo) setPronta(true);
    }, TIMEOUT_CONFIG_MS);

    // Permite que a tela de Configurações avise o TopBar quando a logo mudar
    window.addEventListener("clinica-config-updated", carregar);
    return () => {
      ativo = false;
      clearTimeout(timeout);
      window.removeEventListener("clinica-config-updated", carregar);
    };
  }, []);

  return { config, pronta };
}

/** Hook para componentes client: logo e nome da clínica, com recarga via evento global. */
export function useClinicaConfig() {
  return useClinicaConfigStatus().config;
}
