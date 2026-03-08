import { useState } from "react";
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

  const handleSalvarEvolucao = () => {
    if (!textoAtual.trim()) {
      toast.error("Por favor, descreva a evolução do paciente");
      return;
    }

    const { data, hora } = formatarDataHora();
    const novaEvolucao: Evolucao = {
      id: Date.now().toString(),
      texto: textoAtual,
      dataSalva: data,
      horaSalva: hora,
    };

    setEvolucoes([novaEvolucao, ...evolucoes]);
    setTextoAtual("");
    setShowForm(false);
    toast.success("Evolução salva com sucesso!");
  };

  const handleDeletarEvolucao = (id: string) => {
    setEvolucoes(evolucoes.filter((e) => e.id !== id));
    toast.success("Evolução removida");
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Nova Evolução */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Nova Evolução
        </Button>
      ) : (
        <Card className="p-6 border-slate-200 shadow-sm bg-emerald-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Nova Evolução
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Descrição da Evolução do Paciente *
              </label>
              <Textarea
                placeholder="Descreva a evolução clínica do paciente, melhorias, dificuldades, etc."
                value={textoAtual}
                onChange={(e) => setTextoAtual(e.target.value)}
                className="min-h-32 resize-none border-slate-200"
              />
              <p className="text-xs text-slate-500 mt-2">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Salvar Evolução
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Histórico de Evoluções */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Histórico de Evoluções ({evolucoes.length})
        </h3>

        {evolucoes.length === 0 ? (
          <Card className="p-6 border-slate-200 shadow-sm text-center">
            <p className="text-slate-500">
              Nenhuma evolução registrada ainda. Clique em "Adicionar Nova
              Evolução" para começar.
            </p>
          </Card>
        ) : (
          evolucoes.map((evolucao, index) => (
            <Card
              key={evolucao.id}
              className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Evolução #{evolucoes.length - index}
                    </p>
                    <p className="text-xs text-slate-500">
                      {evolucao.dataSalva} às {evolucao.horaSalva}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletarEvolucao(evolucao.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {evolucao.texto}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-3 h-3" />
                <span>Este registro não pode ser editado</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
