"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAniversariante, calcularIdade } from "./aniversarioUtils";
import type { AniversarianteItem } from "@/components/AniversariantesDialog";

export function useAniversariantes() {
  const [aniversariantes, setAniversariantes] = useState<AniversarianteItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const carregarAniversariantes = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome_completo, data_nascimento, telefone_cel, tipo_usuario, ativo")
        .order("nome_completo");

      if (error) {
        console.error("Erro ao carregar pacientes para aniversários:", error);
        return;
      }

      if (data) {
        const hoje = new Date();
        const aniversariantesHoje: AniversarianteItem[] = data
          .filter((p) => p.ativo !== false && p.data_nascimento && isAniversariante(p.data_nascimento, hoje))
          .map((p) => ({
            id: p.id,
            nomeCompleto: p.nome_completo,
            dataNascimento: p.data_nascimento,
            telefoneCel: p.telefone_cel,
            tipoUsuario: p.tipo_usuario,
            idade: calcularIdade(p.data_nascimento, hoje),
          }));

        setAniversariantes(aniversariantesHoje);

        // Disparo automático na primeira entrada do dia
        const hojeISO = hoje.toISOString().slice(0, 10);
        const chaveSessao = `fisio_aniversario_visto_${hojeISO}`;
        if (aniversariantesHoje.length > 0 && typeof window !== "undefined") {
          const jaVisto = sessionStorage.getItem(chaveSessao);
          if (!jaVisto) {
            setIsModalOpen(true);
            sessionStorage.setItem(chaveSessao, "true");
          }
        }
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar aniversariantes:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAniversariantes();
  }, [carregarAniversariantes]);

  return {
    aniversariantes,
    total: aniversariantes.length,
    isModalOpen,
    setIsModalOpen,
    isLoading,
    recarregar: carregarAniversariantes,
  };
}
