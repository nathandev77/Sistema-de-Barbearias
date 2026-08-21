import nodemailer from 'nodemailer';

interface TrialWelcomeEmailParams {
  to: string;
  barbershopName: string;
  loginEmail: string;
  tempPassword: string;
  loginUrl: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  } else {
    // Modo Fallback / Dev: cria um transport de teste
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }

  return transporter;
}

export async function sendTrialWelcomeEmail({
  to,
  barbershopName,
  loginEmail,
  tempPassword,
  loginUrl,
}: TrialWelcomeEmailParams): Promise<{ success: boolean; preview?: string; error?: string }> {
  try {
    const from = process.env.SMTP_FROM || '"Barber Control" <contato@controlbarber.online>';
    const mailClient = getTransporter();

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Acesso ao Barber Control</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0d13; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0d13; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #131722; border-radius: 20px; border: 1px solid #232a3b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header / Banner -->
          <tr>
            <td style="padding: 36px 32px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); text-align: center; border-bottom: 1px solid #2d3748;">
              <div style="display: inline-block; background: #2563eb; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; font-size: 24px; color: #ffffff; margin-bottom: 12px;">
                ✂️
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Barber Control
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                Seu Teste Grátis de 4 Dias Está Liberado!
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 18px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Olá! Parabéns por dar o primeiro passo para organizar e alavancar a <strong>${barbershopName}</strong>.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Seu acesso exclusivo já está pronto. Utilize as credenciais abaixo para entrar no seu painel:
              </p>

              <!-- Credentials Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #1a202c; border: 1px solid #2d3748; border-radius: 14px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px;">Nome da Barbearia</span>
                      <strong style="font-size: 15px; color: #38bdf8;">${barbershopName}</strong>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px;">E-mail de Acesso</span>
                      <strong style="font-size: 15px; color: #f1f5f9;">${loginEmail}</strong>
                    </div>
                    <div>
                      <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px;">Senha Provisória</span>
                      <div style="display: inline-block; background: #0f172a; border: 1px dashed #3b82f6; padding: 6px 14px; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: bold; color: #60a5fa; letter-spacing: 1px;">
                        ${tempPassword}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; padding: 14px 16px; border-radius: 8px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 13px; color: #fef08a; line-height: 1.5;">
                  🔒 <strong>Atenção ao Primeiro Acesso:</strong> Por medida de segurança, assim que você fizer o login com a senha provisória, o sistema solicitará que você <strong>defina sua nova senha definitiva</strong>.
                </p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0 10px 0;">
                <a href="${loginUrl}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                  Acessar Meu Painel Agora →
                </a>
              </div>

              <p style="text-align: center; margin: 16px 0 0 0; font-size: 12px; color: #64748b;">
                Link direto: <a href="${loginUrl}" style="color: #38bdf8; text-decoration: none;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #0c0e14; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                © ${new Date().getFullYear()} Barber Control — Sistema de Gestão & Agendamento para Barbearias.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const isDev = process.env.NODE_ENV === 'development';
    console.log(`\n📧 [EMAIL DISPATCH] ═══════════════════════════════════════`);
    console.log(`Para: ${to}`);
    console.log(`Barbearia: ${barbershopName}`);
    console.log(`Email de Login: ${loginEmail}`);
    console.log(`Senha Provisória: ${isDev ? tempPassword : '[OCULTA EM PRODUÇÃO]'}`);
    console.log(`Link de Acesso: ${loginUrl}`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await mailClient.sendMail({
        from,
        to,
        subject: `✂️ Seu acesso ao Barber Control — ${barbershopName}`,
        html: htmlContent,
      });
      console.log(`✅ E-mail enviado com sucesso para ${to}`);
    } else {
      console.log(`ℹ️ SMTP não configurado no .env — E-mail simulado com sucesso em modo de desenvolvimento.`);
    }

    return { success: true };
  } catch (error: any) {
    console.error(`❌ Erro ao disparar e-mail de boas-vindas:`, error?.message);
    return { success: false, error: error?.message };
  }
}
