import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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
