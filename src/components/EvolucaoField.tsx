"use client";

import { useState, useEffect } from "react";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * EvolucaoField - Campo de Evolução com histórico
 * Design: Healthcare Minimal - Cards com histórico, campo de texto com validação
 * Funcionalidade: Salvar evolução com data/hora, impossível editar após salvo
 */

interface Evolucao {
  id: string;
  texto: string;
  dataSalva: string;
  horaSalva: string;
}

export default function EvolucaoField() {
  const [evolucoes, setEvolucoes] = useState<Evolucao[]>([]);
  const [textoAtual, setTextoAtual] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchEvolucoes() {
      const { data, error } = await supabase
        .from('evolucoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao carregar evoluções:", error);
      } else if (data) {
        setEvolucoes(data.map(e => ({
          id: e.id,
          texto: e.texto,
          dataSalva: e.data_salva,
          horaSalva: e.hora_salva
        })));
      }
      setIsLoading(false);
    }
    fetchEvolucoes();
  }, [supabase]);

  const formatarDataHora = (): { data: string; hora: string } => {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, "0");
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, "0");
    const minutos = String(agora.getMinutes()).padStart(2, "0");
    const segundos = String(agora.getSeconds()).padStart(2, "0");

    return {
      data: `${dia}/${mes}/${ano}`,
      hora: `${horas}:${minutos}:${segundos}`,
    };
  };

  const handleSalvarEvolucao = async () => {
    if (!textoAtual.trim()) {
      toast.error("Por favor, descreva a evolução do paciente");
      return;
    }

    const { data, hora } = formatarDataHora();
    const tempId = Date.now().toString();
    const novaEvolucao: Evolucao = {
      id: tempId,
      texto: textoAtual,
      dataSalva: data,
      horaSalva: hora,
    };

    // Atualiza otimisticamente
    setEvolucoes([novaEvolucao, ...evolucoes]);
    setTextoAtual("");
    setShowForm(false);
    toast.loading("Salvando evolução...", { id: "save-evo" });

    const { data: insertedData, error } = await supabase
      .from('evolucoes')
      .insert({
        texto: textoAtual,
        data_salva: data,
        hora_salva: hora,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar evolução.", { id: "save-evo" });
      setEvolucoes((prev) => prev.filter(e => e.id !== tempId));
    } else {
      toast.success("Evolução salva com sucesso!", { id: "save-evo" });
      setEvolucoes((prev) => prev.map(e => e.id === tempId ? { ...novaEvolucao, id: insertedData.id } : e));
    }
  };

  const handleDeletarEvolucao = async (id: string) => {
    const backup = [...evolucoes];
    setEvolucoes(evolucoes.filter((e) => e.id !== id));
    
    const { error } = await supabase.from('evolucoes').delete().eq('id', id);
    if (error) {
       toast.error("Erro ao deletar");
       setEvolucoes(backup);
    } else {
       toast.success("Evolução removida");
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Nova Evolução */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Nova Evolução
        </Button>
      ) : (
        <Card className="p-6 border-border shadow-sm bg-accent">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Nova Evolução
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground/80 block mb-2">
                Descrição da Evolução do Paciente *
              </label>
              <Textarea
                placeholder="Descreva a evolução clínica do paciente, melhorias, dificuldades, etc."
                value={textoAtual}
                onChange={(e) => setTextoAtual(e.target.value)}
                className="min-h-32 resize-none border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {textoAtual.length} caracteres
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setTextoAtual("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarEvolucao}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Salvar Evolução
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Histórico de Evoluções */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Histórico de Evoluções ({evolucoes.length})
        </h3>

        {isLoading ? (
          <Card className="p-6 border-border shadow-sm text-center">
            <p className="text-muted-foreground">
              Carregando evoluções...
            </p>
          </Card>
        ) : evolucoes.length === 0 ? (
          <Card className="p-6 border-border shadow-sm text-center">
            <p className="text-muted-foreground">
              Nenhuma evolução registrada ainda. Clique em "Adicionar Nova
              Evolução" para começar.
            </p>
          </Card>
        ) : (
          evolucoes.map((evolucao, index) => (
            <Card
              key={evolucao.id}
              className="p-6 border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Evolução #{evolucoes.length - index}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evolucao.dataSalva} às {evolucao.horaSalva}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletandoId(evolucao.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed">
                  {evolucao.texto}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                <span>Este registro não pode ser editado</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDeleteDialog
        open={!!deletandoId}
        onOpenChange={(open) => { if (!open) setDeletandoId(null); }}
        onConfirm={() => { if (deletandoId) { handleDeletarEvolucao(deletandoId); setDeletandoId(null); } }}
        titulo="Excluir Evolução"
        mensagem="Tem certeza que deseja excluir esta evolução? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
