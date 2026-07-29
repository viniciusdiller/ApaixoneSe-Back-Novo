/**
 * Templates de e-mail do Apaixone-se — Saquarema
 *
 * Centraliza todos os HTMLs transacionais.
 * Para alterar visual, cores ou conteúdo: edite apenas este arquivo.
 *
 * Padrão:
 *   - Logo: https://apaixonese.saquarema.rj.gov.br/images/apaixone-se.png
 *   - Cores: gradiente teal (#0a4f54 → #0d8a82), accent laranja (#f97316)
 *   - Max-width: 600px, responsivo
 *   - Rodapé com link para o site
 */

const LOGO_URL = "https://apaixonese.saquarema.rj.gov.br/images/apaixone-se.png";
const SITE_URL = "https://apaixonese.saquarema.rj.gov.br";

/** Estrutura base compartilhada por todos os templates */
function baseLayout({
  title,
  preheader,
  body,
}: {
  title: string;
  preheader: string;
  body: string;
}): string {
  return /* html */ `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Preheader (oculto, aparece no preview do cliente de e-mail) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Wrapper geral -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card principal -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Header com gradiente e logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a4f54 0%,#0d8a82 60%,#0b6b6b 100%);border-radius:16px 16px 0 0;padding:36px 40px 28px;text-align:center;">
              <img
                src="${LOGO_URL}"
                alt="Apaixone-se Saquarema"
                width="220"
                style="max-width:220px;width:100%;height:auto;display:inline-block;"
              />
            </td>
          </tr>

          <!-- Corpo do e-mail -->
          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;">
              ${body}
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
                Este e-mail foi enviado automaticamente pelo
                <a href="${SITE_URL}" style="color:#0d8a82;text-decoration:none;font-weight:600;">Apaixone-se Saquarema</a>.
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Se você não solicitou esta mensagem, pode ignorá-la com segurança.
              </p>
            </td>
          </tr>

        </table>
        <!-- / Card principal -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// =========================================================
// TEMPLATE 1 — Verificação de E-mail
// =========================================================

export interface VerifyEmailTemplateParams {
  nome: string;
  codigo: string;
  verifyPageUrl: string;
}

export function buildVerifyEmailTemplate(
  params: VerifyEmailTemplateParams,
): { subject: string; text: string; html: string } {
  const { nome, codigo, verifyPageUrl } = params;

  const subject = "Confirme seu e-mail — Apaixone-se Saquarema";

  const text = [
    `Olá, ${nome}!`,
    ``,
    `Seu código de verificação é: ${codigo}`,
    ``,
    `Acesse ${verifyPageUrl} e insira o código acima para ativar sua conta.`,
    `Este código expira em 24 horas.`,
    ``,
    `Se você não criou essa conta, ignore este e-mail.`,
  ].join("\n");

  const digits = codigo.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="width:48px;height:56px;background:#eef9f8;border:2px solid #0d8a82;
            border-radius:10px;text-align:center;vertical-align:middle;
            font-size:28px;font-weight:700;font-family:monospace;color:#0a4f54;">
          ${d}
        </td>`,
    )
    .join("<td style='width:8px;'></td>");

  const html = baseLayout({
    title: subject,
    preheader: `${nome}, seu código de ativação da conta Apaixone-se é ${codigo}`,
    body: /* html */ `
      <!-- Saudão -->
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;">Olá, ${nome}! 🌊</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
        Bem-vindo ao <strong>Apaixone-se Saquarema</strong>! Para ativar sua conta,
        insira o código abaixo na página de verificação:
      </p>

      <!-- Código OTP em caixas individuais -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
        <tr>
          ${digitBoxes}
        </tr>
      </table>

      <!-- Validade -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:12px 16px;">
            <p style="margin:0;font-size:14px;color:#7c2d12;">
              ⏰ Este código expira em <strong>24 horas</strong>.
            </p>
          </td>
        </tr>
      </table>

      <!-- Botão / link de acesso -->
      <p style="margin:0 0 8px;font-size:14px;color:#475569;">
        Acesse a página de verificação:
      </p>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:linear-gradient(90deg,#0a4f54,#0d8a82);border-radius:8px;">
            <a href="${verifyPageUrl}"
               style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;
                      color:#ffffff;text-decoration:none;border-radius:8px;">
              Verificar meu e-mail
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
        Ou copie e cole este link no navegador:<br />
        <a href="${verifyPageUrl}" style="color:#0d8a82;word-break:break-all;">${verifyPageUrl}</a>
      </p>
    `,
  });

  return { subject, text, html };
}

// =========================================================
// TEMPLATE 2 — Recuperação de Senha
// =========================================================

export interface ForgotPasswordTemplateParams {
  codigo: string;
}

export function buildForgotPasswordTemplate(
  params: ForgotPasswordTemplateParams,
): { subject: string; text: string; html: string } {
  const { codigo } = params;

  const subject = "Recuperação de Senha — Apaixone-se Saquarema";

  const text = [
    `Olá!`,
    ``,
    `Recebemos uma solicitação para redefinir a sua senha.`,
    `Seu código de recuperação é: ${codigo}`,
    ``,
    `Este código expira em 30 minutos.`,
    `Se você não solicitou a recuperação, ignore este e-mail.`,
    ``,
    `Atenciosamente,`,
    `Equipe Apaixone-se`,
  ].join("\n");

  const digits = codigo.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="width:48px;height:56px;background:#fef3c7;border:2px solid #f59e0b;
            border-radius:10px;text-align:center;vertical-align:middle;
            font-size:28px;font-weight:700;font-family:monospace;color:#92400e;">
          ${d}
        </td>`,
    )
    .join("<td style='width:8px;'></td>");

  const html = baseLayout({
    title: subject,
    preheader: `Seu código de recuperação de senha é ${codigo} — válido por 30 minutos`,
    body: /* html */ `
      <!-- Saudão -->
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;">Recuperação de Senha 🔑</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
        Recebemos uma solicitação para redefinir a senha da sua conta no
        <strong>Apaixone-se Saquarema</strong>. Use o código abaixo:
      </p>

      <!-- Código OTP em caixas individuais -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
        <tr>
          ${digitBoxes}
        </tr>
      </table>

      <!-- Validade -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:12px 16px;">
            <p style="margin:0;font-size:14px;color:#7c2d12;">
              ⏰ Este código expira em <strong>30 minutos</strong>. Não o compartilhe com ninguém.
            </p>
          </td>
        </tr>
      </table>

      <!-- Instruções -->
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        Acesse a página de redefinição de senha no site e insira o código acima
        junto com sua nova senha.
      </p>
    `,
  });

  return { subject, text, html };
}
