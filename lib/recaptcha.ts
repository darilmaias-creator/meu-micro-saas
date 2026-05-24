import "server-only";

type RecaptchaVerifyResponse = {
  action?: string;
  challenge_ts?: string;
  "error-codes"?: string[];
  hostname?: string;
  score?: number;
  success?: boolean;
};

export function isRecaptchaConfigured() {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim());
}

export async function verifyRecaptchaToken(token: unknown) {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();

  if (!secret) {
    return {
      ok: true as const,
      skipped: true as const,
    };
  }

  if (typeof token !== "string" || !token.trim()) {
    return {
      message: "Confirme que voce nao e um robo para continuar.",
      ok: false as const,
      skipped: false as const,
    };
  }

  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      body: new URLSearchParams({
        response: token,
        secret,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    },
  );
  const result = (await response.json().catch(() => null)) as
    | RecaptchaVerifyResponse
    | null;

  if (!response.ok || !result?.success) {
    return {
      message: "CAPTCHA invalido. Tente novamente.",
      ok: false as const,
      skipped: false as const,
    };
  }

  const minimumScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");

  if (typeof result.score === "number" && result.score < minimumScore) {
    return {
      message: "Nao foi possivel validar a seguranca do envio agora.",
      ok: false as const,
      skipped: false as const,
    };
  }

  return {
    ok: true as const,
    skipped: false as const,
  };
}
