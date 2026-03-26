"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: ReactNode;
}

/**
 * Renderiza o conteúdo diretamente no <body> via React Portal.
 * Isso garante que modais com `position: fixed` fiquem sempre
 * centralizados na viewport, independente de qualquer ancestral
 * com `transform`, `filter`, `overflow` ou `will-change`.
 */
export default function ModalPortal({ children }: ModalPortalProps) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    // Bloqueia o scroll do body enquanto o modal está aberto
    document.body.style.overflow = "hidden";
    return () => {
      document.body.removeChild(el);
      document.body.style.overflow = "";
    };
  }, []);

  return createPortal(children, elRef.current);
}
