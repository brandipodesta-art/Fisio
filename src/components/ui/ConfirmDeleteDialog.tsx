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

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  titulo?: string;
  mensagem?: string;
  loading?: boolean;
  /** Conteúdo extra entre a mensagem e os botões (ex.: opções de exclusão) */
  children?: React.ReactNode;
  /** Texto do botão de confirmação (padrão: "Excluir") */
  confirmLabel?: string;
}

/**
 * Dialog reutilizável de confirmação de exclusão.
 * Substitui o `confirm()` nativo do navegador por um dialog in-app
 * harmonizado com o design system do projeto.
 */
export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  titulo = "Confirmar Exclusão",
  mensagem = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
  loading = false,
  children,
  confirmLabel = "Excluir",
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <TriangleAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-base">{titulo}</DialogTitle>
              <DialogDescription className="mt-1">
                {mensagem}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {children}
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={loading}
            className="gap-2"
          >
            {loading ? "Excluindo..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
