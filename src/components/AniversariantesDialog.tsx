"use client";

import { useEffect, useState } from "react";
import { Cake, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClinicaConfig } from "@/lib/useClinicaConfig";
import {
  ehAniversario,
  fetchPacientesComNascimento,
  idadeNoAniversario,
  linkWhatsAppParabens,
  type PacienteAniversario,
} from "@/lib/aniversario";

/**
 * AniversariantesDialog - Pop-up com os aniversariantes do dia.
 * Abre automaticamente uma vez por dia (por navegador) quando há aniversariantes,
 * com atalho para enviar os parabéns pelo WhatsApp.
 */

const STORAGE_KEY = "fisio_aniversariantes_visto";

function chaveDoDia(data: Date): string {
  return `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
}

export default function AniversariantesDialog() {
  const [aniversariantes, setAniversariantes] = useState<PacienteAniversario[]>([]);
  const [open, setOpen] = useState(false);
  const clinica = useClinicaConfig();
  const hoje = new Date();

  useEffect(() => {
    let ativo = true;
    const agora = new Date();
    let jaVisto = false;
    try {
      jaVisto = localStorage.getItem(STORAGE_KEY) === chaveDoDia(agora);
    } catch {
      // localStorage indisponível: exibe normalmente
    }
    if (jaVisto) return;

    fetchPacientesComNascimento().then((pacientes) => {
      if (!ativo) return;
      const doDia = pacientes
        .filter((p) => ehAniversario(p.data_nascimento, agora))
        .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, "pt-BR"));
      if (doDia.length > 0) {
        setAniversariantes(doDia);
        setOpen(true);
      }
    });

    return () => {
      ativo = false;
    };
  }, []);

  const handleOpenChange = (aberto: boolean) => {
    setOpen(aberto);
    if (!aberto) {
      try {
        localStorage.setItem(STORAGE_KEY, chaveDoDia(new Date()));
      } catch {
        // ignora: o pop-up apenas voltará a aparecer no próximo acesso
      }
    }
  };

  if (aniversariantes.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-500" />
            Aniversariantes do dia
          </DialogTitle>
          <DialogDescription>
            {aniversariantes.length === 1
              ? "1 pessoa faz aniversário hoje."
              : `${aniversariantes.length} pessoas fazem aniversário hoje.`}
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-[50vh] overflow-y-auto divide-y divide-border -mx-1 px-1">
          {aniversariantes.map((p) => {
            const idade = idadeNoAniversario(p.data_nascimento, hoje);
            const link = linkWhatsAppParabens(p.telefone_cel, p.nome_completo, clinica?.nome_clinica);
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {p.nome_completo}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {idade !== null ? `${idade} anos` : "Idade não informada"}
                    {p.telefone_cel ? ` · ${p.telefone_cel}` : ""}
                  </div>
                </div>
                {link ? (
                  <Button asChild size="sm" variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-4 h-4" />
                      Parabenizar
                    </a>
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground/70 shrink-0">
                    Sem celular válido
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
