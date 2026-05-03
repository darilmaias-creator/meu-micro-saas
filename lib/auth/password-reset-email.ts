import "server-only";

import {
  getPasswordResetExpirationLabel,
} from "@/lib/auth/password-reset";
import { sendResendEmail } from "@/lib/email/resend";

function createPasswordResetEmailBody(input: {
  name: string;
  resetUrl: string;
  expiresAt: string;
}) {
  const expirationLabel = getPasswordResetExpirationLabel(input.expiresAt);

  return {
    subject: "Redefina sua senha - Calcula Artesão",
    text: [
      `Ola, ${input.name}!`,
      "",
      "Recebemos um pedido para redefinir a senha da sua conta.",
      "",
      "Abra o link abaixo para criar uma nova senha:",
      input.resetUrl,
      "",
      `Esse link expira em: ${expirationLabel}.`,
      "",
      "Se voce nao pediu essa recuperacao, pode ignorar este e-mail.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Recuperacao de senha</h2>
        <p>Ola, <strong>${input.name}</strong>.</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta na Calcula Artesão.</p>
        <p>
          <a
            href="${input.resetUrl}"
            style="display: inline-block; background: #d97706; color: white; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: bold;"
          >
            Redefinir minha senha
          </a>
        </p>
        <p style="word-break: break-all;">Se o botao nao abrir, copie este link:<br />${input.resetUrl}</p>
        <p><strong>Validade:</strong> ${expirationLabel}</p>
        <p>Se voce nao pediu essa recuperacao, pode ignorar este e-mail.</p>
      </div>
    `,
  };
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
  expiresAt: string;
}) {
  const emailBody = createPasswordResetEmailBody(input);

  return sendResendEmail({
    to: input.to,
    subject: emailBody.subject,
    text: emailBody.text,
    html: emailBody.html,
  });
}
