import { ImageResponse } from "next/og";

import {
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PWA_THEME_COLOR,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 36,
            background: PWA_BACKGROUND_COLOR,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.22)",
            color: PWA_THEME_COLOR,
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: "-0.06em",
          }}
        >
          CP
        </div>
      </div>
    ),
    size,
  );
}
