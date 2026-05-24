import "server-only";

import { escapeHTML } from "@/lib/sanitize";
import { sendResendEmail } from "@/lib/email/resend";

function createSecurityAlertEmail(input: {
  description: string;
  name: string;
}) {
  const safeName = escapeHTML(input.name);
  const safeDescription = escapeHTML(input.description);

  return {
    subject: "Alerta de segurança - Calcula Artesão",
    text: [
      `Ola, ${input.name}.`,
      "",
      "Detectamos uma atividade incomum na sua conta da Calcula Artesão:",
      input.description,
      "",
      "Se foi voce, pode ignorar este aviso.",
      "Se nao reconhece essa atividade, recomendamos trocar sua senha agora.",
      "",
      "Calcula Artesão",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Alerta de segurança</h2>
        <p>Ola, <strong>${safeName}</strong>.</p>
        <p>Detectamos uma atividade incomum na sua conta da Calcula Artesão:</p>
        <p style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 10px;">
          ${safeDescription}
        </p>
        <p>Se foi voce, pode ignorar este aviso.</p>
        <p>Se nao reconhece essa atividade, recomendamos trocar sua senha agora.</p>
      </div>
    `,
  };
}

export async function sendSecurityAlertEmail(input: {
  description: string;
  name: string;
  to: string;
}) {
  const emailBody = createSecurityAlertEmail(input);

  return sendResendEmail({
    to: input.to,
    subject: emailBody.subject,
    text: emailBody.text,
    html: emailBody.html,
  });
}
