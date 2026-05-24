import { NextResponse } from "next/server";

import { detectAnomaliesForRecentUsers } from "@/lib/anomaly-detection";
import { captureServerException } from "@/lib/observability/server-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAuthorizedCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await detectAnomaliesForRecentUsers();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    captureServerException({
      scope: "cron:anomaly-detection",
      error,
    });

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
