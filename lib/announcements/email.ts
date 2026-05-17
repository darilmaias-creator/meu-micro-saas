import "server-only";

import { sendResendEmail } from "@/lib/email/resend";

import type { AnnouncementRecord } from "./types";

const ANNOUNCEMENT_EMAIL_BATCH_SIZE = 15;

export type AnnouncementEmailRecipient = {
  userId: string;
  email: string;
  name?: string | null;
};

export type AnnouncementEmailDispatchSummary = {
  enabled: boolean;
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  sampleErrors: string[];
};

function sanitizeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createAnnouncementEmailBody(input: {
  announcement: AnnouncementRecord;
  recipientName?: string | null;
}) {
  const appName = "Calcula Artesao";
  const recipientName = input.recipientName?.trim() || "usuario";
  const title = input.announcement.title;
  const message = input.announcement.message;
  const ctaLabel = input.announcement.ctaLabel?.trim() || "";
  const ctaUrl = input.announcement.ctaUrl?.trim() || "";
  const hasCta = Boolean(ctaLabel && ctaUrl);

  const safeRecipientName = sanitizeText(recipientName);
  const safeTitle = sanitizeText(title);
  const safeMessage = sanitizeText(message).replace(/\n/g, "<br />");
  const safeCtaLabel = sanitizeText(ctaLabel);
  const safeCtaUrl = sanitizeText(ctaUrl);

  return {
    subject: `${appName}: ${title}`,
    text: [
      `Ola, ${recipientName}.`,
      "",
      `${appName} publicou um novo aviso para todos os usuarios:`,
      `${title}`,
      "",
      message,
      "",
      hasCta ? `${ctaLabel}: ${ctaUrl}` : "",
      "",
      "Essa mensagem foi enviada automaticamente pelo app.",
    ]
      .filter(Boolean)
      .join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 8px; color: #0b2f44;">${appName}</h2>
        <p>Ola, <strong>${safeRecipientName}</strong>.</p>
        <p>Publicamos um novo aviso no app:</p>
        <div style="border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; background: #f8fbff;">
          <p style="margin: 0 0 6px; font-size: 18px; font-weight: 700; color: #0b2f44;">${safeTitle}</p>
          <p style="margin: 0; color: #334155;">${safeMessage}</p>
        </div>
        ${
          hasCta
            ? `<p style="margin-top: 16px;">
                 <a href="${safeCtaUrl}" style="display: inline-block; background: #0b5fff; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 10px; padding: 10px 14px;">
                   ${safeCtaLabel}
                 </a>
               </p>`
            : ""
        }
        <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
          Essa mensagem foi enviada automaticamente pelo app.
        </p>
      </div>
    `,
  };
}

function normalizeRecipients(input: AnnouncementEmailRecipient[]) {
  const seen = new Set<string>();
  const normalized: AnnouncementEmailRecipient[] = [];

  for (const recipient of input) {
    const email = recipient.email.trim().toLowerCase();

    if (!email || seen.has(email)) {
      continue;
    }

    seen.add(email);
    normalized.push({
      userId: recipient.userId,
      email,
      name: recipient.name?.trim() || null,
    });
  }

  return normalized;
}

export async function sendAnnouncementEmailToUsers(input: {
  announcement: AnnouncementRecord;
  recipients: AnnouncementEmailRecipient[];
}) {
  const recipients = normalizeRecipients(input.recipients);
  const summary: AnnouncementEmailDispatchSummary = {
    enabled: true,
    attempted: recipients.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    sampleErrors: [],
  };

  for (let index = 0; index < recipients.length; index += ANNOUNCEMENT_EMAIL_BATCH_SIZE) {
    const batch = recipients.slice(index, index + ANNOUNCEMENT_EMAIL_BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (recipient) => {
        const emailBody = createAnnouncementEmailBody({
          announcement: input.announcement,
          recipientName: recipient.name,
        });

        await sendResendEmail({
          to: recipient.email,
          subject: emailBody.subject,
          text: emailBody.text,
          html: emailBody.html,
        });
      }),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        summary.sent += 1;
        continue;
      }

      summary.failed += 1;

      if (summary.sampleErrors.length < 5) {
        summary.sampleErrors.push(
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
        );
      }
    }
  }

  return summary;
}
