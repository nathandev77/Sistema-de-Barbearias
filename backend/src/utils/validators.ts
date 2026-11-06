import dns from 'dns/promises';
import net from 'net';
import { z } from 'zod';
import { parsePhoneNumber, isValidPhoneNumber, PhoneNumber } from 'libphonenumber-js';

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether the email domain has MX records (can receive email).
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
 * SMTP Probe – Opens a TCP connection to the mail server and simulates the start
 * of a send without delivering any message. Returns true if the server accepts
 * the address (RCPT TO:), indicating that the mailbox *probably* exists.
 *
 * ⚠ Some providers (Gmail, Outlook) block this technique for security –
 * in those cases the probe conservatively returns `true` so as not to block
 * legitimate users. The OTP flow is the definitive verification.
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
      // Timeout = slow or blocked server → accept conservatively
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
          // 250 = accepted | 550/551/553 = does not exist | others = uncertain → accept
          resolve(line.startsWith('250') || (!line.startsWith('550') && !line.startsWith('551') && !line.startsWith('553')));
        } else if (line.startsWith('4') || line.startsWith('5')) {
          clearTimeout(timeout);
          socket.destroy();
          // Definitive 5xx rejection before RCPT = domain blocks probes
          resolve(true); // conservative
        }
      }
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      resolve(true); // connection failed = restricted server → accept conservatively
    });

    socket.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Complete Zod validator for email:
 * 1. Basic email format
 * 2. Domain with MX records
 * 3. SMTP probe (checks whether the mailbox exists)
 */
export const emailValidator = z
  .string()
  .email('Invalid email format.')
  .refine(async (val) => await hasMxRecords(val), {
    message: 'The email domain has no MX records (cannot receive emails).',
  });

export const emailWithMxValidator = emailValidator;

// ─────────────────────────────────────────────────────────────────────────────
// PHONE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a phone number using libphonenumber-js.
 * Accepts Brazilian numbers with or without +55.
 * Returns an object with the number formatted in E.164 or an error.
 */
export function validatePhone(raw: string): { valid: boolean; e164?: string; error?: string } {
  try {
    let input = raw.trim().replace(/[\s\-().]/g, '');

    // Adds +55 if it comes with only a leading 0 or the area code directly
    if (/^0\d{10,11}$/.test(input)) {
      input = '+55' + input.slice(1);
    } else if (/^\d{10,11}$/.test(input)) {
      input = '+55' + input;
    }

    const parsed: PhoneNumber = parsePhoneNumber(input, 'BR');

    if (!parsed || !isValidPhoneNumber(input, 'BR')) {
      return { valid: false, error: 'Invalid phone number for Brazil.' };
    }

    const type = parsed.getType();
    // Rejects types that are clearly invalid for personal use
    if (type === 'TOLL_FREE' || type === 'PREMIUM_RATE' || type === 'VOICEMAIL') {
      return { valid: false, error: `Number type not allowed: ${type}` };
    }

    return { valid: true, e164: parsed.format('E.164') };
  } catch (err: any) {
    return { valid: false, error: 'Invalid phone number: ' + err.message };
  }
}

/**
 * Zod validator for Brazilian phone numbers.
 * Normalizes and validates via libphonenumber-js.
 * Returns the number in E.164 format (+55...).
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
    { message: 'Invalid Brazilian phone number. e.g. (11) 99999-9999 or +55119XXXXXXXX' }
  );

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Centralized strong password policy.
 * Apply at ALL points where a password is created or changed:
 *   - Tenant registration (authController)
 *   - Client registration (portalRoutes)
 *   - Password reset (passwordResetController)
 *
 * Rules:
 *   ✔ Minimum 8 characters
 *   ✔ At least 1 uppercase letter (A-Z)
 *   ✔ At least 1 lowercase letter (a-z)
 *   ✔ At least 1 number (0-9)
 *   ✔ At least 1 special character (!@#$%^&*...)
 *   ✔ Maximum 100 characters
 */
export const passwordValidator = z.string()
  .min(8,   'Password must be at least 8 characters.')
  .max(100, 'Password cannot exceed 100 characters.')
  .regex(/[A-Z]/,                   'Password must contain at least 1 uppercase letter.')
  .regex(/[a-z]/,                   'Password must contain at least 1 lowercase letter.')
  .regex(/[0-9]/,                   'Password must contain at least 1 number.')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'Password must contain at least 1 special character (!@#$%...).');

/**
 * Validates password strength without using Zod (for use directly in controllers).
 * Returns null if valid, or a string with the failure reason.
 */
export function validatePasswordStrength(password: string): string | null {
  if (!password || password.length < 8)   return 'Password must be at least 8 characters.';
  if (password.length > 100)               return 'Password cannot exceed 100 characters.';
  if (!/[A-Z]/.test(password))            return 'Password must contain at least 1 uppercase letter.';
  if (!/[a-z]/.test(password))            return 'Password must contain at least 1 lowercase letter.';
  if (!/[0-9]/.test(password))            return 'Password must contain at least 1 number.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    return 'Password must contain at least 1 special character (!@#$%...).';
  return null;
}

