/**
 * Utilitários para detecção e formatação de aniversariantes
 */

export interface DataNascimentoPartes {
  dia: number;
  mes: number;
  ano?: number;
}

/**
 * Converte qualquer formato de data aceito (DD/MM/AAAA, AAAA-MM-DD ou ISO)
 * em partes separadas { dia, mes, ano }.
 */
export function parseDataNascimento(
  dataStr: string | null | undefined
): DataNascimentoPartes | null {
  if (!dataStr || typeof dataStr !== "string") return null;

  const trimmed = dataStr.trim();
  if (!trimmed) return null;

  // Formato brasileiro: DD/MM/AAAA ou DD/MM
  const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (brMatch) {
    const dia = parseInt(brMatch[1], 10);
    const mes = parseInt(brMatch[2], 10);
    let ano = brMatch[3] ? parseInt(brMatch[3], 10) : undefined;
    if (ano && ano < 100) {
      ano += ano > 30 ? 1900 : 2000;
    }
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
      return { dia, mes, ano };
    }
    return null;
  }

  // Formato ISO: AAAA-MM-DD ou AAAA-MM-DDTHH:mm:ss...
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const ano = parseInt(isoMatch[1], 10);
    const mes = parseInt(isoMatch[2], 10);
    const dia = parseInt(isoMatch[3], 10);
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
      return { dia, mes, ano };
    }
    return null;
  }

  return null;
}

/**
 * Extrai dia e mês de uma data de referência sem risco de deslocamento por timezone.
 */
export function extrairDiaMesReferencia(
  referencia: Date | string = new Date()
): { dia: number; mes: number; ano: number } {
  if (typeof referencia === "string") {
    const trimmed = referencia.trim();
    // Verifica se é YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return {
        ano: parseInt(isoMatch[1], 10),
        mes: parseInt(isoMatch[2], 10),
        dia: parseInt(isoMatch[3], 10),
      };
    }
    // Verifica se é DD/MM/YYYY
    const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (brMatch) {
      return {
        dia: parseInt(brMatch[1], 10),
        mes: parseInt(brMatch[2], 10),
        ano: brMatch[3] ? parseInt(brMatch[3], 10) : new Date().getFullYear(),
      };
    }
    const d = new Date(referencia);
    return {
      dia: d.getDate(),
      mes: d.getMonth() + 1,
      ano: d.getFullYear(),
    };
  }

  return {
    dia: referencia.getDate(),
    mes: referencia.getMonth() + 1,
    ano: referencia.getFullYear(),
  };
}

/**
 * Retorna true se a data de nascimento corresponder ao mesmo dia e mês da data de referência.
 */
export function isAniversariante(
  dataNascimento: string | null | undefined,
  referencia: Date | string = new Date()
): boolean {
  const nasc = parseDataNascimento(dataNascimento);
  if (!nasc) return false;

  const ref = extrairDiaMesReferencia(referencia);

  // Aniversariantes de 29 de fevereiro em anos não bissextos podem ser considerados em 28 de fevereiro
  if (nasc.dia === 29 && nasc.mes === 2 && ref.mes === 2 && ref.dia === 28) {
    const isLeapYear = (ref.ano % 4 === 0 && ref.ano % 100 !== 0) || ref.ano % 400 === 0;
    if (!isLeapYear) return true;
  }

  return nasc.dia === ref.dia && nasc.mes === ref.mes;
}

/**
 * Calcula a idade completada na data de referência (ou idade atual se não informada).
 */
export function calcularIdade(
  dataNascimento: string | null | undefined,
  referencia: Date | string = new Date()
): number | null {
  const nasc = parseDataNascimento(dataNascimento);
  if (!nasc || !nasc.ano) return null;

  const ref = extrairDiaMesReferencia(referencia);

  let idade = ref.ano - nasc.ano;
  if (ref.mes < nasc.mes || (ref.mes === nasc.mes && ref.dia < nasc.dia)) {
    idade--;
  }

  return idade >= 0 ? idade : null;
}

/**
 * Gera um link direto do WhatsApp (wa.me) para envio de parabéns.
 */
export function gerarLinkWhatsApp(
  telefone: string | null | undefined,
  nomeCompleto: string,
  nomeClinica?: string
): string | null {
  if (!telefone) return null;

  const digitos = telefone.replace(/\D/g, "");
  // Número válido no Brasil tem ao menos DDD + 8 ou 9 dígitos (10 ou 11)
  if (digitos.length < 10) return null;

  const numeroCompleto = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const primeiroNome = nomeCompleto.trim().split(/\s+/)[0] || "Cliente";
  const clinica = nomeClinica?.trim() || "nossa clínica";

  const mensagem = `Olá, ${primeiroNome}! 🎉🎂\n\nNós da ${clinica} passamos para lhe desejar um Feliz Aniversário! Que o seu dia seja muito especial e repleto de saúde, realizações e alegrias. Parabéns! ✨`;

  return `https://wa.me/${numeroCompleto}?text=${encodeURIComponent(mensagem)}`;
}
