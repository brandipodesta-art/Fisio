"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  titulo?: string;
  mensagem?: string;
  labelConfirmar?: string;
  loading?: boolean;
  variante?: "warning" | "destructive";
}

/**
 * Dialog reutilizável de confirmação de ação genérica.
 * Usado para confirmar ações como "Confirmar Pagamento", "Editar", etc.
 */
export default function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  titulo = "Confirmar Ação",
  mensagem = "Tem certeza que deseja realizar esta ação?",
  labelConfirmar = "Confirmar",
  loading = false,
  variante = "warning",
}: ConfirmActionDialogProps) {
  const iconeBg = variante === "destructive" ? "bg-red-100" : "bg-amber-100";
  const iconeColor = variante === "destructive" ? "text-red-600" : "text-amber-600";
  const btnClass = variante === "destructive"
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-amber-600 hover:bg-amber-700 text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconeBg} flex items-center justify-center`}>
              <TriangleAlert className={`w-5 h-5 ${iconeColor}`} />
            </div>
            <div>
              <DialogTitle className="text-base">{titulo}</DialogTitle>
              <DialogDescription className="mt-1">
                {mensagem}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={loading}
            className={`gap-2 ${btnClass}`}
          >
            {loading ? "Aguarde..." : labelConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
