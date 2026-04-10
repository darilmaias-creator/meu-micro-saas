import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getSupabaseKeyKind() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim() ?? "";

  if (!key) {
    return "missing";
  }

  if (key.startsWith("sb_secret_")) {
    return "secret";
  }

  if (key.startsWith("sb_publishable_")) {
    return "publishable";
  }

  if (key.startsWith("eyJ")) {
    return "jwt-like";
  }

  return "unknown";
}

export async function GET() {
  const result = {
    ok: false,
    keyKind: getSupabaseKeyKind(),
    authUsers: {
      ok: false,
      error: null as string | null,
    },
    userAppData: {
      ok: false,
      error: null as string | null,
    },
  };

  try {
    const supabase = createSupabaseServerClient();

    const authUsersResponse = await supabase
      .from("auth_users")
      .select("id", { count: "exact", head: true });

    if (authUsersResponse.error) {
      result.authUsers.error = authUsersResponse.error.message;
    } else {
      result.authUsers.ok = true;
    }

    const userAppDataResponse = await supabase
      .from("user_app_data")
      .select("user_id", { count: "exact", head: true });

    if (userAppDataResponse.error) {
      result.userAppData.error = userAppDataResponse.error.message;
    } else {
      result.userAppData.ok = true;
    }

    result.ok = result.authUsers.ok && result.userAppData.ok;

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ...result,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
