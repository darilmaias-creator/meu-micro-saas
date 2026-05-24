import "server-only";

import { sendResendEmail } from "@/lib/email/resend";

function createEmailVerificationEmailBody(input: {
  name: string;
  verificationUrl: string;
}) {
  return {
    subject: "Confirme seu e-mail - Calcula Artesão",
    text: [
      `Ola, ${input.name}!`,
      "",
      "Confirme seu e-mail para aumentar a seguranca da sua conta na Calcula Artesão.",
      "",
      "Abra o link abaixo para confirmar:",
      input.verificationUrl,
      "",
      "Esse link expira em 24 horas.",
      "",
      "Se voce nao pediu essa confirmacao, pode ignorar este e-mail.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Confirme seu e-mail</h2>
        <p>Ola, <strong>${input.name}</strong>.</p>
        <p>Confirme seu e-mail para aumentar a seguranca da sua conta na Calcula Artesão.</p>
        <p>
          <a
            href="${input.verificationUrl}"
            style="display: inline-block; background: #d97706; color: white; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: bold;"
          >
            Confirmar meu e-mail
          </a>
        </p>
        <p style="word-break: break-all;">Se o botao nao abrir, copie este link:<br />${input.verificationUrl}</p>
        <p><strong>Validade:</strong> 24 horas.</p>
        <p>Se voce nao pediu essa confirmacao, pode ignorar este e-mail.</p>
      </div>
    `,
  };
}

export async function sendEmailVerificationEmail(input: {
  to: string;
  name: string;
  verificationUrl: string;
}) {
  const emailBody = createEmailVerificationEmailBody(input);

  return sendResendEmail({
    to: input.to,
    subject: emailBody.subject,
    text: emailBody.text,
    html: emailBody.html,
  });
}
