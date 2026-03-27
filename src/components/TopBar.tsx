"use client";

import { Activity, Users, CalendarDays, DollarSign, LogOut, Settings, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePermissoes } from "@/lib/auth/usePermissoes";
import { toast } from "sonner";

interface TopBarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const TODOS_MENUS = [
  { key: "cadastro",   label: "Cadastro",   icon: Users,         requerAdmin: false },
  { key: "agenda",     label: "Agenda",     icon: CalendarDays,  requerAdmin: false },
  { key: "financeiro", label: "Financeiro", icon: DollarSign,    requerAdmin: false, requerFinanceiro: true },
];

export default function TopBar({ activePage, onPageChange }: TopBarProps) {
  const { usuario, logout } = useAuth();
  const { podeVerConfiguracoes, isFuncionario } = usePermissoes();

  // Filtra menus conforme permissões do perfil
  const menuItems = TODOS_MENUS.filter(m => {
    if (m.requerFinanceiro && isFuncionario) return false;
    return true;
  });

  // Gera iniciais a partir do nome completo
  const iniciais = (usuario?.nome_completo ?? "US")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  const nomeExibicao = usuario?.nome_completo ?? "Usuário";
  const emailExibicao = usuario?.email ?? "";

  const handleLogout = () => {
    logout();
    toast.success("Sessão encerrada com sucesso.");
  };

  return (
    <header className="w-full bg-card/80 glass border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* ── Logo ──────────────────────────────────── */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-700 shadow-sm">
              <Activity className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-[15px] font-bold text-foreground tracking-tight">
              FisioSys
            </span>
          </div>

          {/* ── Navegação central ─────────────────────── */}
          <nav className="flex items-center gap-1">
            {menuItems.map(({ key, label, icon: Icon }) => {
              const isActive = activePage === key;
              return (
                <button
                  key={key}
                  onClick={() => onPageChange(key)}
                  className={`
                    relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium
                    transition-premium cursor-pointer
                    ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                  <span className="hidden sm:inline">{label}</span>
                  {/* Indicador ativo — barra inferior animada */}
                  <span
                    className={`
                      absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full
                      bg-primary transition-all duration-250 ease-out
                      ${isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}
                    `}
                  />
                </button>
              );
            })}
          </nav>

          {/* ── Account Card + Popover ─────────────────── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-premium cursor-pointer outline-none">
                {/* Avatar com iniciais */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/90 to-emerald-700 text-white text-xs font-semibold shadow-sm">
                  {iniciais}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground leading-tight">
                    {nomeExibicao.split(" ")[0]}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight capitalize">
                    {usuario?.tipo_usuario ?? ""}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 py-1">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary/90 to-emerald-700 text-white text-xs font-semibold">
                    {iniciais}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">{nomeExibicao}</span>
                    <span className="text-xs text-muted-foreground truncate">{emailExibicao}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Configurações — apenas para admin */}
              {podeVerConfiguracoes && (
                <DropdownMenuItem
                  onClick={() => onPageChange("configuracoes")}
                  className="gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Configurações</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
