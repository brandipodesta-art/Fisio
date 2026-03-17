"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, DollarSign, Calendar, FileText } from "lucide-react";

/**
 * HistoricoCliente - Aba de Histórico do cliente
 * Design: Healthcare Minimal - Cards com abas internas para diferentes tipos de histórico
 * Seções: Exames, Frequência, Financeiro, Evolução
 */

interface Exame {
  id: string;
  tipo: string;
  data: string;
  resultado: string;
}

interface Frequencia {
  mes: string;
  presencas: number;
  faltas: number;
}

interface Financeiro {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  status: "pago" | "pendente" | "cancelado";
}

interface Evolucao {
  id: string;
  data: string;
  descricao: string;
}

interface HistoricoClienteProps {
  pacienteId?: string;
}

export default function HistoricoCliente({ pacienteId }: HistoricoClienteProps) {
  const [exames, setExames] = useState<Exame[]>([]);
  const [frequencia, setFrequencia] = useState<Frequencia[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);
  const [evolucoes, setEvolucoes] = useState<Evolucao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Busca financeira: usa a tabela `recebimentos` filtrada pelo paciente_id
      let queryFinanceiro = supabase
        .from('recebimentos')
        .select('id, descricao, valor, data_vencimento, data_pagamento, status')
        .order('data_vencimento', { ascending: false });
      if (pacienteId) {
        queryFinanceiro = queryFinanceiro.eq('paciente_id', pacienteId);
      }

      const [resExames, resFrequencia, resFinanceiro, resEvolucoes] = await Promise.all([
        supabase.from('exames').select('*'),
        supabase.from('frequencias').select('*'),
        queryFinanceiro,
        supabase.from('evolucoes').select('*').order('created_at', { ascending: false })
      ]);

      if (resExames.data) {
        setExames(resExames.data.map((e: { id: string; tipo: string; data: string; resultado: string }) => ({
          id: e.id, tipo: e.tipo, data: e.data, resultado: e.resultado
        })));
      }
      if (resFrequencia.data) {
        setFrequencia(resFrequencia.data.map((f: { mes: string; presencas: number; faltas: number }) => ({
          mes: f.mes, presencas: f.presencas, faltas: f.faltas
        })));
      }
      if (resFinanceiro.data) {
        setFinanceiro(resFinanceiro.data.map((f: { id: string; descricao: string; valor: number; data_vencimento: string; data_pagamento: string | null; status: string }) => ({
          id: f.id,
          descricao: f.descricao,
          valor: Number(f.valor),
          // Prioriza data de pagamento; se não houver, usa data de vencimento
          data: f.data_pagamento ?? f.data_vencimento,
          status: (f.status === 'recebido' ? 'pago' : f.status) as 'pago' | 'pendente' | 'cancelado',
        })));
      }
      if (resEvolucoes.data) {
        setEvolucoes(resEvolucoes.data.map((e: { id: string; data_salva: string; texto: string }) => ({
          id: e.id, data: e.data_salva, descricao: e.texto
        })));
      }
      
      setIsLoading(false);
    }
    fetchData();
  }, [supabase, pacienteId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-emerald-100 text-emerald-800";
      case "pendente":
        return "bg-amber-100 text-amber-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Histórico */}
      <Card className="p-6 border-slate-200 shadow-sm bg-gradient-to-r from-slate-50 to-emerald-50">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Histórico do Cliente
        </h2>
        <p className="text-slate-600">
          Visualize exames, frequência, dados financeiros e evolução clínica
        </p>
      </Card>

      {/* Abas de Histórico */}
      <Tabs defaultValue="exames" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200 rounded-lg p-1">
          <TabsTrigger
            value="exames"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Exames</span>
          </TabsTrigger>
          <TabsTrigger
            value="frequencia"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Frequência</span>
          </TabsTrigger>
          <TabsTrigger
            value="financeiro"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger
            value="evolucao"
            className="flex items-center gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Evolução</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Exames */}
        <TabsContent value="exames" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Carregando exames...</p>
            </Card>
          ) : exames.length === 0 ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Nenhum exame registrado</p>
            </Card>
          ) : (
            exames.map((exame) => (
              <Card key={exame.id} className="p-6 border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {exame.tipo}
                    </h3>
                    <p className="text-sm text-slate-500">{exame.data}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                    Concluído
                  </span>
                </div>
                <p className="text-slate-700 text-sm">{exame.resultado}</p>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Tab: Frequência */}
        <TabsContent value="frequencia" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Carregando frequência...</p>
            </Card>
          ) : frequencia.length === 0 ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Nenhum registro de frequência</p>
            </Card>
          ) : (
            <>
              {frequencia.map((freq, index) => (
                <Card key={index} className="p-6 border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    {freq.mes}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <p className="text-sm text-slate-600 mb-1">Presenças</p>
                      <p className="text-3xl font-bold text-emerald-700">
                        {freq.presencas}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-slate-600 mb-1">Faltas</p>
                      <p className="text-3xl font-bold text-red-700">
                        {freq.faltas}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Taxa de Presença:{" "}
                      <span className="font-semibold text-slate-900">
                        {Math.round(
                          (freq.presencas /
                            (freq.presencas + freq.faltas)) *
                            100
                        )}
                        %
                      </span>
                    </p>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Tab: Financeiro */}
        <TabsContent value="financeiro" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Carregando financeiro...</p>
            </Card>
          ) : financeiro.length === 0 ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Nenhum registro financeiro</p>
            </Card>
          ) : (
            <>
              <Card className="p-6 border-slate-200 shadow-sm bg-slate-50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Pago</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      R${" "}
                      {financeiro
                        .filter((f) => f.status === "pago")
                        .reduce((sum, f) => sum + f.valor, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Pendente</p>
                    <p className="text-2xl font-bold text-amber-700">
                      R${" "}
                      {financeiro
                        .filter((f) => f.status === "pendente")
                        .reduce((sum, f) => sum + f.valor, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Geral</p>
                    <p className="text-2xl font-bold text-slate-900">
                      R${" "}
                      {financeiro
                        .reduce((sum, f) => sum + f.valor, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>

              {financeiro.map((item) => (
                <Card key={item.id} className="p-6 border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {item.descricao}
                      </h3>
                      <p className="text-sm text-slate-500">{item.data}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 mb-2">
                        R$ {item.valor.toFixed(2)}
                      </p>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status === "pago"
                          ? "Pago"
                          : item.status === "pendente"
                          ? "Pendente"
                          : "Cancelado"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* Tab: Evolução */}
        <TabsContent value="evolucao" className="space-y-4">
          {isLoading ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Carregando evolução...</p>
            </Card>
          ) : evolucoes.length === 0 ? (
            <Card className="p-6 border-slate-200 shadow-sm text-center">
              <p className="text-slate-500">Nenhuma evolução registrada</p>
            </Card>
          ) : (
            evolucoes.map((evo) => (
              <Card key={evo.id} className="p-6 border-slate-200 shadow-sm">
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-900">
                    {evo.data}
                  </p>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {evo.descricao}
                </p>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
