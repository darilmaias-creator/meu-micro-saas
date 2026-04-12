import "server-only";

const RESEND_API_URL = "https://api.resend.com/emails";

export type ResendAttachment = {
  filename: string;
  content: string;
};

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

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: ResendAttachment[];
}) {
  const { apiKey, fromEmail } = getResendConfig();

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
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
