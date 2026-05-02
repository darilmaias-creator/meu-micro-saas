import { createStaticPngIconResponse } from "@/lib/pwa/static-icon-response";

export const runtime = "nodejs";

export async function GET() {
  return createStaticPngIconResponse("android-chrome-512x512.png");
}
