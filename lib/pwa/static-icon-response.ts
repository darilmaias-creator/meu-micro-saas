import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ICON_HEADERS = {
  "Content-Type": "image/png",
  "Cache-Control": "public, max-age=0, must-revalidate",
};

export async function createStaticPngIconResponse(fileName: string) {
  const filePath = join(process.cwd(), "public", fileName);
  const iconBuffer = await readFile(filePath);

  return new Response(iconBuffer, {
    headers: ICON_HEADERS,
  });
}
