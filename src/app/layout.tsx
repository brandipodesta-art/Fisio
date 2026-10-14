import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/ui/AppToaster";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clínica de Fisioterapia - Sistema de Cadastro",
  description:
    "Sistema de cadastro de pacientes, evolução clínica, histórico e agenda para clínica de fisioterapia.",
};

// Aplica a cor de tema salva antes da primeira pintura (mesma chave de CLINICA_CONFIG_STORAGE_KEY)
const TEMA_INICIAL_SCRIPT = `try{var c=JSON.parse(localStorage.getItem("fisio_clinica_config")||"null");if(c&&c.cor_tema)document.documentElement.setAttribute("data-theme",c.cor_tema)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <AppToaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
