import { createStaticPngIconResponse } from "@/lib/pwa/static-icon-response";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  return createStaticPngIconResponse("icone-180x180.png");
}
