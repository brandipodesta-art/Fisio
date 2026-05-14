"use client";

import { Toaster } from "sonner";
import { Check, AlertTriangle, X, Info } from "lucide-react";

/**
 * AppToaster — Toaster customizado do sistema.
 *
 * Design padronizado:
 *  - Fundo branco (card) com sombra suave e borda fina
 *  - Bolinha colorida à esquerda com ícone branco dentro
 *      • success  → verde   (Check)
 *      • warning  → amarelo (AlertTriangle)
 *      • error    → vermelho (X)
 *      • info     → azul    (Info)
 *  - Texto em foreground / muted-foreground (sem fundo colorido)
 *
 * Aplicado globalmente via layout.tsx. Todas as chamadas existentes
 * de toast.success / toast.error / toast.warning / toast.info
 * herdam automaticamente este visual.
 */

function Badge({
  bg,
  Icon,
}: {
  bg: string;
  Icon: typeof Check;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bg} shrink-0`}
    >
      <Icon className="w-3.5 h-3.5 text-white" strokeWidth={3} />
    </span>
  );
}

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      duration={4000}
      closeButton
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group !bg-white !border !border-border !shadow-lg !rounded-xl !p-4 !min-w-[320px] !text-foreground",
          title: "!text-sm !font-medium !text-foreground",
          description: "!text-xs !text-muted-foreground !mt-0.5",
          actionButton:
            "!bg-primary !text-primary-foreground !text-xs !font-medium !rounded-md !px-2.5 !py-1",
          cancelButton:
            "!bg-muted !text-muted-foreground !text-xs !font-medium !rounded-md !px-2.5 !py-1",
          closeButton:
            "!bg-transparent !border-0 !text-muted-foreground/60 hover:!text-foreground !right-2 !top-2 !left-auto",
          success: "",
          error: "",
          warning: "",
          info: "",
        },
      }}
      icons={{
        success: <Badge bg="bg-emerald-500" Icon={Check} />,
        error: <Badge bg="bg-red-500" Icon={X} />,
        warning: <Badge bg="bg-amber-500" Icon={AlertTriangle} />,
        info: <Badge bg="bg-sky-500" Icon={Info} />,
      }}
    />
  );
}
