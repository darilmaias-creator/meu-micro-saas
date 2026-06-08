import { randomUUID } from "node:crypto";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { consumeApiRateLimit } from "@/lib/rate-limit";
import { sanitizePlainText } from "@/lib/sanitize";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isSuggestionCategory,
  isValidSuggestionTab,
  SUGGESTION_MAX_LENGTH,
} from "@/lib/suggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SuggestionPayload = {
  activeTab?: unknown;
  category?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para enviar sugestoes." },
      { status: 401 },
    );
  }

  const rateLimit = await consumeApiRateLimit({
    action: "user_suggestion",
    headers: request.headers,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { message: rateLimit.message },
      {
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
        status: 429,
      },
    );
  }

  let body: SuggestionPayload;

  try {
    body = (await request.json()) as SuggestionPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler sua sugestao." },
      { status: 400 },
    );
  }

  if (!isSuggestionCategory(body.category)) {
    return NextResponse.json(
      { message: "Escolha um tipo valido para a sugestao." },
      { status: 400 },
    );
  }

  if (typeof body.message !== "string") {
    return NextResponse.json(
      { message: "Escreva uma mensagem para enviar." },
      { status: 400 },
    );
  }

  const message = sanitizePlainText(body.message, SUGGESTION_MAX_LENGTH);

  if (message.length < 8) {
    return NextResponse.json(
      { message: "Escreva um pouco mais para eu entender sua sugestao." },
      { status: 400 },
    );
  }

  const activeTab = isValidSuggestionTab(body.activeTab) ? body.activeTab : null;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("user_suggestions").insert({
    active_tab: activeTab,
    category: body.category,
    id: randomUUID(),
    message,
    status: "new",
    user_email: session.user.email ?? "",
    user_id: session.user.id,
    user_name: session.user.name ?? "",
    user_plan: session.user.isPremium ? "premium" : "free",
  });

  if (error) {
    console.error("[suggestions:create]", error);

    return NextResponse.json(
      { message: "Nao foi possivel salvar sua sugestao agora." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Sugestao enviada com sucesso. Obrigado por ajudar a melhorar.",
  });
}
