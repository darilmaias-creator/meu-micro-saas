import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getHost(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host;
  } catch {
    return "invalid";
  }
}

export async function GET() {
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const passwordRecoveryEnabled =
    process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_ENABLED === "true";

  return NextResponse.json({
    ok: true,
    auth: {
      hasNextAuthUrl: Boolean(nextAuthUrl),
      nextAuthUrlHost: getHost(nextAuthUrl),
      hasNextAuthSecret: Boolean(nextAuthSecret),
      nextAuthSecretLength: nextAuthSecret?.length ?? 0,
      hasGoogleClientId: Boolean(googleClientId),
      googleClientIdPrefix: googleClientId
        ? googleClientId.slice(0, 12)
        : null,
      hasGoogleClientSecret: Boolean(googleClientSecret),
    },
    supabase: {
      hasUrl: Boolean(supabaseUrl),
      urlHost: getHost(supabaseUrl),
      hasSecretKey: Boolean(supabaseSecretKey),
    },
    passwordRecovery: {
      enabled: passwordRecoveryEnabled,
      hasResendApiKey: Boolean(resendApiKey),
      hasResendFromEmail: Boolean(resendFromEmail),
      resendFromEmailHost: resendFromEmail?.split("@")[1] ?? null,
    },
  });
}
