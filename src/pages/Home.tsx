import CadastroLayout from "@/components/CadastroLayout";

/**
 * Home - Página principal com o sistema de cadastro
 * Design: Healthcare Minimal com abas para Cadastro, Evolução e Histórico
 */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main>
        <CadastroLayout />
      </main>
    </div>
  );
}
