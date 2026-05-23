import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function blockProductionDiagnostics() {
  return process.env.NODE_ENV === "production"
    ? NextResponse.json({ message: "Not found." }, { status: 404 })
    : null;
}

export async function GET() {
  const blockedResponse = blockProductionDiagnostics();

  if (blockedResponse) {
    return blockedResponse;
  }

  const relevantKeys = Object.keys(process.env)
    .filter((key) =>
      ["NEXTAUTH", "GOOGLE", "SUPABASE"].some((fragment) =>
        key.toUpperCase().includes(fragment),
      ),
    )
    .sort();

  return NextResponse.json({
    ok: true,
    keys: relevantKeys,
  });
}
