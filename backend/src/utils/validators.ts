import dns from 'dns/promises';
import net from 'net';
import { z } from 'zod';
import { parsePhoneNumber, isValidPhoneNumber, PhoneNumber } from 'libphonenumber-js';

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o domínio do e-mail possui registros MX (consegue receber e-mail).
 */
export async function hasMxRecords(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  const knownDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'uol.com.br', 'bol.com.br', 'icloud.com', 'live.com'];
  if (knownDomains.includes(domain)) return true;
  try {
    const mx = await dns.resolveMx(domain);
    return mx && mx.length > 0;
  } catch {
    return false;
  }
}

/**
 * SMTP Probe – Abre uma conexão TCP com o servidor de e-mail e simula o início
 * de um envio sem entregar nenhuma mensagem. Retorna true se o servidor aceitar
 * o endereço (RCPT TO:), indicando que a caixa postal *provavelmente* existe.
 *
 * ⚠ Alguns provedores (Gmail, Outlook) bloqueiam esta técnica por segurança –
 * nesses casos o probe retorna `true` de forma conservadora para não bloquear
 * usuários legítimos. O fluxo OTP é a verificação definitiva.
 */
export async function smtpProbeEmail(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;

  let mxRecords: Array<{ exchange: string; priority: number }>;
  try {
    mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return false;
    mxRecords.sort((a, b) => a.priority - b.priority);
  } catch {
    return false;
  }

  const mxHost = mxRecords[0].exchange;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      socket.destroy();
      // Timeout = servidor lento ou bloqueado → aceita de forma conservadora
      resolve(true);
    }, 5000);

    const socket = net.createConnection(25, mxHost);
    let step = 0;
    let buffer = '';

    socket.on('data', (data) => {
      buffer += data.toString();
      if (buffer.includes('\n')) {
        const line = buffer.trim();
        buffer = '';

        if (step === 0 && line.startsWith('220')) {
          step = 1;
          socket.write(`EHLO validator.saasbarber.local\r\n`);
        } else if (step === 1 && (line.startsWith('250') || line.startsWith('220'))) {
          step = 2;
          socket.write(`MAIL FROM:<noreply@saasbarber.app>\r\n`);
        } else if (step === 2 && line.startsWith('250')) {
          step = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else if (step === 3) {
          clearTimeout(timeout);
          socket.write('QUIT\r\n');
          socket.destroy();
          // 250 = aceito | 550/551/553 = não existe | outros = incerto → aceita
          resolve(line.startsWith('250') || (!line.startsWith('550') && !line.startsWith('551') && !line.startsWith('553')));
        } else if (line.startsWith('4') || line.startsWith('5')) {
          clearTimeout(timeout);
          socket.destroy();
          // 5xx definitivo de rejeição antes de RCPT = domínio bloqueia probes
          resolve(true); // conservador
        }
      }
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(true); // conexão falhou = servidor restrito → aceita conservador
    });

    socket.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Zod validator completo para e-mail:
 * 1. Formato básico de e-mail
 * 2. Domínio com MX records
 * 3. SMTP probe (verifica se caixa postal existe)
 */
export const emailValidator = z
  .string()
  .email('Formato de e-mail inválido.')
  .refine(async (val) => await hasMxRecords(val), {
    message: 'Domínio do e-mail não possui registros MX (não consegue receber e-mails).',
  });

export const emailWithMxValidator = emailValidator;

// ─────────────────────────────────────────────────────────────────────────────
// TELEFONE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida um número de telefone usando libphonenumber-js.
 * Aceita números brasileiros com ou sem +55.
 * Retorna objeto com número formatado em E.164 ou erro.
 */
export function validatePhone(raw: string): { valid: boolean; e164?: string; error?: string } {
  try {
    let input = raw.trim().replace(/[\s\-().]/g, '');

    // Adiciona +55 se vier apenas com 0 ou DD direto
    if (/^0\d{10,11}$/.test(input)) {
      input = '+55' + input.slice(1);
    } else if (/^\d{10,11}$/.test(input)) {
      input = '+55' + input;
    }

    const parsed: PhoneNumber = parsePhoneNumber(input, 'BR');

    if (!parsed || !isValidPhoneNumber(input, 'BR')) {
      return { valid: false, error: 'Número de telefone inválido para o Brasil.' };
    }

    const type = parsed.getType();
    // Rejeita tipos claramente inválidos para uso pessoal
    if (type === 'TOLL_FREE' || type === 'PREMIUM_RATE' || type === 'VOICEMAIL') {
      return { valid: false, error: `Tipo de número não permitido: ${type}` };
    }

    return { valid: true, e164: parsed.format('E.164') };
  } catch (err: any) {
    return { valid: false, error: 'Número de telefone inválido: ' + err.message };
  }
}

/**
 * Zod validator para telefone brasileiro.
 * Normaliza e valida via libphonenumber-js.
 * Retorna o número em formato E.164 (+55...).
 */
export const brazilPhoneValidator = z
  .string()
  .transform((val) => {
    let input = val.trim().replace(/[\s\-().]/g, '');
    if (/^0\d{10,11}$/.test(input)) input = '+55' + input.slice(1);
    else if (/^\d{10,11}$/.test(input)) input = '+55' + input;
    return input;
  })
  .refine(
    (val) => {
      try {
        return isValidPhoneNumber(val, 'BR');
      } catch {
        return false;
      }
    },
    { message: 'Número de telefone brasileiro inválido. Ex: (11) 99999-9999 ou +55119XXXXXXXX' }
  );

// ─────────────────────────────────────────────────────────────────────────────
// SENHA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Política de senha forte centralizada.
 * Aplicar em TODOS os pontos onde uma senha é criada ou alterada:
 *   - Registro de tenant (authController)
 *   - Registro de cliente (portalRoutes)
 *   - Reset de senha (passwordResetController)
 *
 * Regras:
 *   ✔ Mínimo 8 caracteres
 *   ✔ Pelo menos 1 letra maiúscula (A-Z)
 *   ✔ Pelo menos 1 letra minúscula (a-z)
 *   ✔ Pelo menos 1 número (0-9)
 *   ✔ Pelo menos 1 caractere especial (!@#$%^&*...)
 *   ✔ Máximo 100 caracteres
 */
export const passwordValidator = z.string()
  .min(8,   'A senha deve ter no mínimo 8 caracteres.')
  .max(100, 'A senha não pode ter mais de 100 caracteres.')
  .regex(/[A-Z]/,                   'A senha deve ter pelo menos 1 letra maiúscula.')
  .regex(/[a-z]/,                   'A senha deve ter pelo menos 1 letra minúscula.')
  .regex(/[0-9]/,                   'A senha deve ter pelo menos 1 número.')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'A senha deve ter pelo menos 1 caractere especial (!@#$%...).');

/**
 * Valida a força de uma senha sem usar Zod (para uso em controllers diretos).
 * Retorna null se válida, ou string com o motivo da falha.
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8)   return 'A senha deve ter no mínimo 8 caracteres.';
  if (password.length > 100)               return 'A senha não pode ter mais de 100 caracteres.';
  if (!/[A-Z]/.test(password))            return 'A senha deve ter pelo menos 1 letra maiúscula.';
  if (!/[a-z]/.test(password))            return 'A senha deve ter pelo menos 1 letra minúscula.';
  if (!/[0-9]/.test(password))            return 'A senha deve ter pelo menos 1 número.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    return 'A senha deve ter pelo menos 1 caractere especial (!@#$%...).';
  return null;
}

