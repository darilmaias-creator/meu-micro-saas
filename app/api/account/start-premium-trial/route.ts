import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

type AuthUserTrialRow = {
  id: string;
  plan: string;
  premium_trial_used: boolean | null;
  premium_trial_started_at: string | null;
  premium_trial_expires_at: string | null;
};

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para iniciar o teste Premium." },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  try {
    const supabase = createSupabaseServerClient();
    const { data: user, error: fetchError } = await supabase
      .from("auth_users")
      .select(
        "id, plan, premium_trial_used, premium_trial_started_at, premium_trial_expires_at",
      )
      .eq("id", userId)
      .single<AuthUserTrialRow>();

    if (fetchError) {
      throw fetchError;
    }

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    if (user.plan === "premium") {
      return NextResponse.json(
        { message: "Sua conta ja esta com o plano Premium ativo." },
        { status: 400 },
      );
    }

    if (user.premium_trial_used) {
      return NextResponse.json(
        { message: "Voce ja usou seu teste gratis de 7 dias." },
        { status: 400 },
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + TRIAL_DURATION_MS);

    const { error: updateError } = await supabase
      .from("auth_users")
      .update({
        premium_trial_started_at: now.toISOString(),
        premium_trial_expires_at: expiresAt.toISOString(),
        premium_trial_used: true,
      })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      {
        success: true,
        trialStartedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        daysRemaining: TRIAL_DURATION_DAYS,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[start-premium-trial] failed to start trial", error);

    return NextResponse.json(
      {
        message: "Nao foi possivel iniciar o teste Premium agora.",
        ...(process.env.NODE_ENV !== "production"
          ? { details: getErrorDetails(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}
