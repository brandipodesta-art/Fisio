"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface PacienteSugestao { id: string; nome_completo: string; }

export function AutocompletePaciente({
  value,
  pacienteId,
  onChange,
  placeholder = "Digite o nome do paciente...",
}: {
  value: string;
  pacienteId: string | null;
  onChange: (nome: string, id: string | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery]         = useState(value);
  const [sugestoes, setSugestoes] = useState<PacienteSugestao[]>([]);
  const [aberto, setAberto]       = useState(false);
  const [buscando, setBuscando]   = useState(false);
  const timer                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v, null);
    if (timer.current) clearTimeout(timer.current);
    if (v.length < 2) { setSugestoes([]); setAberto(false); return; }
    timer.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/pacientes?nome=${encodeURIComponent(v)}&limit=8`);
        const data = await res.json();
        setSugestoes(
          data.map((p: { id: string; nome_completo: string }) => ({
            id: p.id,
            nome_completo: p.nome_completo,
          }))
        );
        setAberto(true);
      } finally {
        setBuscando(false);
      }
    }, 300);
  }

  function selecionar(p: PacienteSugestao) {
    setQuery(p.nome_completo);
    onChange(p.nome_completo, p.id);
    setSugestoes([]);
    setAberto(false);
  }

  function limpar() {
    setQuery("");
    onChange("", null);
    setSugestoes([]);
    setAberto(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={limpar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {buscando && (
        <p className="text-xs text-muted-foreground/60 mt-1 pl-1">Buscando...</p>
      )}
      {pacienteId && (
        <p className="text-xs text-primary mt-1 pl-1">✓ Paciente vinculado</p>
      )}
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {sugestoes.map(p => (
            <li
              key={p.id}
              onMouseDown={() => selecionar(p)}
              className="px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-primary cursor-pointer"
            >
              {p.nome_completo}
            </li>
          ))}
        </ul>
      )}
      {aberto && sugestoes.length === 0 && !buscando && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground/60">
          Nenhum paciente encontrado
        </div>
      )}
    </div>
  );
}
