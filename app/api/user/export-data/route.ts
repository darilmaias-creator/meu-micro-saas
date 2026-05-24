import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { buildBackupFileName, getBackupPayloadForUser } from "@/lib/account/backup";
import { logSecurityEvent } from "@/lib/audit-log";
import { authOptions } from "@/lib/auth/options";
import { findUserById } from "@/lib/auth/user-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para exportar seus dados." },
      { status: 401 },
    );
  }

  try {
    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar a conta logada." },
        { status: 404 },
      );
    }

    const payload = await getBackupPayloadForUser(user);

    await logSecurityEvent({
      action: "lgpd.data_export.downloaded",
      headers: request.headers,
      userId,
    });

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Disposition": `attachment; filename="${buildBackupFileName()}"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Nao foi possivel exportar seus dados agora.",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
