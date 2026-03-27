"use client";

import { useState } from "react";
import { Activity, Eye, EyeOff, KeyRound, Mail, User, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";

// ─── Validação de requisitos de senha ────────────────────────────────────────
function validarSenha(senha: string) {
  return {
    minCaracteres: senha.length >= 6,
    maiuscula:     /[A-Z]/.test(senha),
    especial:      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha),
  };
}

type Tela = "login" | "solicitar";

export default function LoginPage() {
  const { login } = useAuth();

  const [tela, setTela]                   = useState<Tela>("login");
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha]                 = useState("");
  const [mostrarSenha, setMostrarSenha]   = useState(false);
  const [carregando, setCarregando]       = useState(false);
  const [senhaFocada, setSenhaFocada]     = useState(false);

  // Tela de solicitação
  const [identSolicitacao, setIdentSolicitacao] = useState("");
  const [solicitando, setSolicitando]           = useState(false);
  const [solicitacaoEnviada, setSolicitacaoEnviada] = useState(false);

  const requisitos = validarSenha(senha);
  const senhaValida = requisitos.minCaracteres && requisitos.maiuscula && requisitos.especial;

  // ─── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identificador.trim()) {
      toast.error("Informe o nome de acesso ou e-mail.");
      return;
    }
    if (!senha) {
      toast.error("Informe a senha.");
      return;
    }
    if (!senhaValida) {
      toast.error("A senha não atende aos requisitos mínimos.");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador: identificador.trim(), senha }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erro ao autenticar.");
        return;
      }

      toast.success(`Bem-vindo, ${data.usuario.nome_completo}!`);
      login(data.usuario);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  // ─── Solicitar redefinição ────────────────────────────────────────────────
  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identSolicitacao.trim()) {
      toast.error("Informe o nome de acesso ou e-mail.");
      return;
    }

    setSolicitando(true);
    try {
      const res = await fetch("/api/auth/solicitar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador: identSolicitacao.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Erro ao registrar solicitação.");
        return;
      }

      setSolicitacaoEnviada(true);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSolicitando(false);
    }
  };

  // ─── Render: Tela de Solicitação ──────────────────────────────────────────
  if (tela === "solicitar") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 shadow-lg mb-4">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">FisioSys</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão de Clínica</p>
          </div>

          <Card className="p-8 border-border shadow-lg">
            {solicitacaoEnviada ? (
              /* ── Confirmação de envio ── */
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Solicitação Registrada!</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sua solicitação foi enviada ao <strong>Administrador</strong>. Assim que a senha for redefinida, você receberá as novas credenciais.
                  </p>
                </div>
                <Button
                  className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => { setTela("login"); setSolicitacaoEnviada(false); setIdentSolicitacao(""); }}
                >
                  Voltar ao Login
                </Button>
              </div>
            ) : (
              /* ── Formulário de solicitação ── */
              <form onSubmit={handleSolicitar} className="space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setTela("login")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Esqueci minha senha</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Informe seu nome de acesso ou e-mail para solicitar a redefinição ao Admin.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="identSolicitacao" className="text-sm font-medium text-foreground/80">
                    Nome de Acesso ou E-mail
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="identSolicitacao"
                      placeholder="Ex: joao.silva ou joao@clinica.com"
                      value={identSolicitacao}
                      onChange={(e) => setIdentSolicitacao(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>A solicitação será enviada ao <strong>Administrador</strong>, que irá redefinir sua senha manualmente.</span>
                </div>

                <Button
                  type="submit"
                  disabled={solicitando || !identSolicitacao.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {solicitando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Solicitar Redefinição de Senha
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // ─── Render: Tela de Login ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md">

        {/* ── Logo e título ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 shadow-lg mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">FisioSys</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão de Clínica</p>
        </div>

        {/* ── Card de Login ── */}
        <Card className="p-8 border-border shadow-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Acesso ao Sistema</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* ── Identificador ── */}
            <div>
              <Label htmlFor="identificador" className="text-sm font-medium text-foreground/80">
                Nome de Acesso ou E-mail
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="identificador"
                  placeholder="Ex: joao.silva ou joao@clinica.com"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* ── Senha ── */}
            <div>
              <Label htmlFor="senha" className="text-sm font-medium text-foreground/80">
                Senha
              </Label>
              <div className="relative mt-2">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onFocus={() => setSenhaFocada(true)}
                  onBlur={() => setSenhaFocada(false)}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Requisitos de senha — exibidos ao focar ou ao digitar */}
              {(senhaFocada || senha.length > 0) && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/60 space-y-1.5">
                  <p className="text-xs font-medium text-foreground/70 mb-2">Requisitos da senha:</p>
                  <RequisitoItem ok={requisitos.minCaracteres} texto="Mínimo de 6 caracteres" />
                  <RequisitoItem ok={requisitos.maiuscula}     texto="Pelo menos 1 letra maiúscula" />
                  <RequisitoItem ok={requisitos.especial}      texto="Pelo menos 1 caractere especial (!@#$%...)" />
                </div>
              )}
            </div>

            {/* ── Botão de Login ── */}
            <Button
              type="submit"
              disabled={carregando}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11 text-sm font-medium"
            >
              {carregando && <Loader2 className="w-4 h-4 animate-spin" />}
              {carregando ? "Autenticando..." : "Entrar"}
            </Button>

            {/* ── Esqueci a senha ── */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setTela("solicitar"); setIdentSolicitacao(identificador); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Esqueci minha senha — Solicitar ao Admin
              </button>
            </div>

          </form>
        </Card>

        {/* ── Rodapé ── */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          FisioSys © {new Date().getFullYear()} — Acesso restrito a funcionários autorizados
        </p>
      </div>
    </div>
  );
}

// ─── Componente auxiliar de requisito ────────────────────────────────────────
function RequisitoItem({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${ok ? "text-green-600" : "text-muted-foreground"}`}>
      {ok
        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
      }
      <span>{texto}</span>
    </div>
  );
}
