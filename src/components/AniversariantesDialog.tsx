"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cake, PartyPopper, MessageCircle, Calendar, User, Sparkles } from "lucide-react";
import { gerarLinkWhatsApp } from "@/lib/aniversarioUtils";
import { useClinicaConfig } from "@/lib/useClinicaConfig";

export interface AniversarianteItem {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  telefoneCel?: string | null;
  tipoUsuario?: string;
  idade?: number | null;
}

interface AniversariantesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aniversariantes: AniversarianteItem[];
  isLoading?: boolean;
}

export default function AniversariantesDialog({
  open,
  onOpenChange,
  aniversariantes,
  isLoading = false,
}: AniversariantesDialogProps) {
  const clinicaConfig = useClinicaConfig();
  const nomeClinica = clinicaConfig?.nome_clinica || "Clínica";

  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-0 overflow-hidden border-border bg-card">
        {/* Top celebratory banner */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-white relative overflow-hidden">
          <div className="absolute top-2 right-3 opacity-15 pointer-events-none">
            <Cake className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <PartyPopper className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Aniversariantes do Dia
                <Sparkles className="w-4 h-4 text-amber-300" />
              </DialogTitle>
              <DialogDescription className="text-white/85 text-xs flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 inline" />
                {dataFormatada} • Celebre com quem faz parte da clínica!
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Carregando aniversariantes...
            </div>
          ) : aniversariantes.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <Cake className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Nenhum aniversariante hoje</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                Não há pacientes ou profissionais fazendo aniversário na data de hoje.
              </p>
            </div>
          ) : (
            <>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {aniversariantes.length} {aniversariantes.length === 1 ? "aniversariante encontrado" : "aniversariantes encontrados"}
              </div>

              {aniversariantes.map((pessoa) => {
                const linkWhatsApp = gerarLinkWhatsApp(
                  pessoa.telefoneCel,
                  pessoa.nomeCompleto,
                  nomeClinica
                );

                const partesNome = pessoa.nomeCompleto.trim().split(/\s+/);
                const iniciais = (
                  partesNome[0]?.[0] + (partesNome.length > 1 ? partesNome[partesNome.length - 1]?.[0] : "")
                ).toUpperCase();

                return (
                  <div
                    key={pessoa.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 bg-background/60 hover:bg-muted/40 transition-colors shadow-xs"
                  >
                    {/* Informações da pessoa */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/15 to-purple-500/15 border border-pink-500/30 flex items-center justify-center text-pink-600 font-semibold text-xs shadow-xs">
                          {iniciais}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-xs">🎂</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">
                            {pessoa.nomeCompleto}
                          </span>
                          {pessoa.idade !== null && pessoa.idade !== undefined && (
                            <span className="text-[11px] font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                              {pessoa.idade} anos
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="capitalize">{pessoa.tipoUsuario || "Paciente"}</span>
                          {pessoa.telefoneCel && (
                            <>
                              <span>•</span>
                              <span>{pessoa.telefoneCel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botão de WhatsApp */}
                    {linkWhatsApp ? (
                      <a
                        href={linkWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0 shadow-xs active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Parabenizar</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 italic self-end sm:self-center">
                        Sem telefone
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-muted/20 border-t border-border flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
