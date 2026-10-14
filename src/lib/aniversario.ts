import { createClient } from "@/lib/supabase/client";

export interface PacienteAniversario {
  id: string;
  nome_completo: string;
  telefone_cel: string | null;
  data_nascimento: string | null;
}

/**
 * Extrai dia e mês de uma data de nascimento.
 * Aceita "DD/MM/AAAA" (formato gravado pelo cadastro) e "AAAA-MM-DD" (ISO).
 */
export function diaMesNascimento(
  dataNascimento: string | null | undefined
): { dia: number; mes: number } | null {
  if (!dataNascimento) return null;
  const valor = dataNascimento.trim();

  let dia: number;
  let mes: number;
  const br = valor.match(/^(\d{2})\/(\d{2})\/\d{4}$/);
  const iso = valor.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (br) {
    dia = Number(br[1]);
    mes = Number(br[2]);
  } else if (iso) {
    mes = Number(iso[1]);
    dia = Number(iso[2]);
  } else {
    return null;
  }

  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { dia, mes };
}

function anoBissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

/**
 * Indica se a data de nascimento faz aniversário na data informada.
 * Nascidos em 29/02 comemoram em 28/02 nos anos não bissextos.
 */
export function ehAniversario(
  dataNascimento: string | null | undefined,
  data: Date
): boolean {
  const nasc = diaMesNascimento(dataNascimento);
  if (!nasc) return false;

  const dia = data.getDate();
  const mes = data.getMonth() + 1;
  if (nasc.dia === dia && nasc.mes === mes) return true;

  return (
    nasc.dia === 29 &&
    nasc.mes === 2 &&
    dia === 28 &&
    mes === 2 &&
    !anoBissexto(data.getFullYear())
  );
}

/** Idade completada no aniversário do ano da data informada. Retorna null se o ano não for conhecido. */
export function idadeNoAniversario(
  dataNascimento: string | null | undefined,
  data: Date
): number | null {
  if (!dataNascimento) return null;
  const valor = dataNascimento.trim();
  const br = valor.match(/^\d{2}\/\d{2}\/(\d{4})$/);
  const iso = valor.match(/^(\d{4})-\d{2}-\d{2}/);
  const ano = br ? Number(br[1]) : iso ? Number(iso[1]) : null;
  if (!ano) return null;
  const idade = data.getFullYear() - ano;
  return idade > 0 && idade < 130 ? idade : null;
}

/** Normaliza o nome para comparação (sem acentos, caixa e espaços extras). */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Converte o celular cadastrado para o formato do WhatsApp (DDI + DDD + número).
 * Retorna null se o número não tiver DDD.
 */
export function telefoneWhatsApp(telefone: string | null | undefined): string | null {
  if (!telefone) return null;
  let digitos = telefone.replace(/\D/g, "").replace(/^0+/, "");
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  if (digitos.length !== 12 && digitos.length !== 13) return null;
  return digitos;
}

/** Mensagem padrão de parabéns enviada pelo WhatsApp. */
export function mensagemParabens(nomeCompleto: string, nomeClinica?: string | null): string {
  const primeiroNome = nomeCompleto.trim().split(/\s+/)[0] ?? "";
  const assinatura = nomeClinica?.trim() ? `\n\nCom carinho, equipe ${nomeClinica.trim()}.` : "";
  return (
    `Olá, ${primeiroNome}! Hoje é o seu dia e não poderíamos deixar passar em branco. ` +
    `Feliz aniversário! Desejamos muita saúde, alegria e realizações.${assinatura}`
  );
}

/** Link que abre a conversa do WhatsApp com a mensagem de parabéns preenchida. */
export function linkWhatsAppParabens(
  telefone: string | null | undefined,
  nomeCompleto: string,
  nomeClinica?: string | null
): string | null {
  const numero = telefoneWhatsApp(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagemParabens(nomeCompleto, nomeClinica))}`;
}

/**
 * Busca os pacientes ativos com data de nascimento preenchida.
 * Pagina a consulta porque o Supabase devolve no máximo 1000 linhas por requisição.
 */
export async function fetchPacientesComNascimento(): Promise<PacienteAniversario[]> {
  const supabase = createClient();
  const TAMANHO_PAGINA = 1000;
  const todos: PacienteAniversario[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from("pacientes")
      .select("id, nome_completo, telefone_cel, data_nascimento")
      .eq("ativo", true)
      .not("data_nascimento", "is", null)
      .order("id")
      .range(inicio, inicio + TAMANHO_PAGINA - 1);

    if (error || !data) break;
    todos.push(...(data as PacienteAniversario[]));
    if (data.length < TAMANHO_PAGINA) break;
  }

  return todos;
}
