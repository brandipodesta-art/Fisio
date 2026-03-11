"use client";

import CadastroLayout from "@/components/CadastroLayout";

/**
 * Page - Página principal com o sistema de cadastro
 * Design: Healthcare Minimal com abas para Cadastro, Evolução, Histórico e Agenda
 */
export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <main>
        <CadastroLayout />
      </main>
    </div>
  );
}
