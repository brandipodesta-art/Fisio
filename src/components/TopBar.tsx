"use client";

import { Activity, Users, CalendarDays, DollarSign, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { key: "cadastro", label: "Cadastro", icon: Users },
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "financeiro", label: "Financeiro", icon: DollarSign },
];

export default function TopBar({ activePage, onPageChange }: TopBarProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — Left */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Fisio
            </span>
          </div>

          {/* Navigation — Center */}
          <nav className="flex items-center gap-1">
            {menuItems.map(({ key, label, icon: Icon }) => {
              const isActive = activePage === key;
              return (
                <button
                  key={key}
                  onClick={() => onPageChange(key)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150 cursor-pointer
                    ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout — Right */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
            onClick={() => {
              // TODO: implement logout logic
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
