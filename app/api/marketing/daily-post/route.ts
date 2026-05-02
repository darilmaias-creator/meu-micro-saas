import { NextResponse } from "next/server";

import {
  formatDailyPostForClipboard,
  getDailyFacebookPost,
} from "@/lib/marketing/daily-post";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const now = new Date();
  const post = getDailyFacebookPost(now);

  return NextResponse.json({
    generatedAt: now.toISOString(),
    post,
    clipboardText: formatDailyPostForClipboard(post),
  });
}
