import { createPwaIconResponse } from "@/lib/pwa/icon-image";

export const runtime = "nodejs";

export async function GET() {
  return createPwaIconResponse({
    size: {
      width: 512,
      height: 512,
    },
    variant: "monochrome",
  });
}
