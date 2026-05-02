import { createStaticPngIconResponse } from "@/lib/pwa/static-icon-response";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default async function Icon() {
  return createStaticPngIconResponse("android-chrome-512x512.png");
}
