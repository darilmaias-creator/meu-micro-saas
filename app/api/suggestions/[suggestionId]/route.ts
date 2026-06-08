import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin/access";
import { authOptions } from "@/lib/auth/options";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSuggestionStatus } from "@/lib/suggestions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    suggestionId: string;
  }>;
};

async function ensureAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Voce precisa estar logado." },
        { status: 401 },
      ),
    };
  }

  if (!isAdminEmail(session.user.email)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Apenas administradores podem gerenciar sugestoes." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const adminSession = await ensureAdminSession();

  if (!adminSession.ok) {
    return adminSession.response;
  }

  const { suggestionId } = await context.params;

  if (!suggestionId) {
    return NextResponse.json(
      { message: "Sugestao invalida." },
      { status: 400 },
    );
  }

  let body: { status?: unknown };

  try {
    body = (await request.json()) as { status?: unknown };
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler a acao." },
      { status: 400 },
    );
  }

  if (!isSuggestionStatus(body.status)) {
    return NextResponse.json(
      { message: "Status invalido para a sugestao." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("user_suggestions")
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", suggestionId);

  if (error) {
    console.error("[suggestions:update]", error);

    return NextResponse.json(
      { message: "Nao foi possivel atualizar a sugestao." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const adminSession = await ensureAdminSession();

  if (!adminSession.ok) {
    return adminSession.response;
  }

  const { suggestionId } = await context.params;

  if (!suggestionId) {
    return NextResponse.json(
      { message: "Sugestao invalida." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("user_suggestions")
    .delete()
    .eq("id", suggestionId);

  if (error) {
    console.error("[suggestions:delete]", error);

    return NextResponse.json(
      { message: "Nao foi possivel excluir a sugestao." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
