import "server-only";

import { buildBackupFileName, type AccountBackupPayload } from "@/lib/account/backup";

const RESEND_API_URL = "https://api.resend.com/emails";

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  return {
    apiKey,
    fromEmail,
  };
}

function createEmailBody(payload: AccountBackupPayload) {
  const appDataCounts = [
    `Insumos: ${payload.appData.insumos.length}`,
    `Produtos salvos: ${payload.appData.savedProducts.length}`,
    `Vendas: ${payload.appData.sales.length}`,
    `Orcamentos: ${payload.appData.quotes.length}`,
  ].join("\n");

  return {
    subject: `Backup da sua conta - ${payload.account.name}`,
    text: [
      `Ola, ${payload.account.name}!`,
      "",
      "Segue em anexo o backup JSON da sua conta na Calculadora do Produtor.",
      "",
      `Plano: ${payload.account.plan}`,
      `Exportado em: ${payload.exportedAt}`,
      "",
      appDataCounts,
      "",
      "Guarde esse arquivo em um local seguro.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
        <h2 style="margin-bottom: 8px;">Backup da sua conta</h2>
        <p>Ola, <strong>${payload.account.name}</strong>.</p>
        <p>Segue em anexo o backup JSON da sua conta na Calculadora do Produtor.</p>
        <ul>
          <li><strong>Plano:</strong> ${payload.account.plan}</li>
          <li><strong>Exportado em:</strong> ${payload.exportedAt}</li>
          <li><strong>Insumos:</strong> ${payload.appData.insumos.length}</li>
          <li><strong>Produtos salvos:</strong> ${payload.appData.savedProducts.length}</li>
          <li><strong>Vendas:</strong> ${payload.appData.sales.length}</li>
          <li><strong>Orcamentos:</strong> ${payload.appData.quotes.length}</li>
        </ul>
        <p>Guarde esse arquivo em um local seguro.</p>
      </div>
    `,
  };
}

export async function sendBackupEmail(input: {
  to: string;
  payload: AccountBackupPayload;
}) {
  const { apiKey, fromEmail } = getResendConfig();
  const emailBody = createEmailBody(input.payload);
  const attachmentContent = Buffer.from(
    JSON.stringify(input.payload, null, 2),
    "utf8",
  ).toString("base64");

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: emailBody.subject,
      text: emailBody.text,
      html: emailBody.html,
      attachments: [
        {
          filename: buildBackupFileName(),
          content: attachmentContent,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Resend request failed with status ${response.status}: ${errorText}`,
    );
  }

  return response.json().catch(() => null);
}
