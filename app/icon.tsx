import { ImageResponse } from "next/og";

import {
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          color: "#0f172a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 88,
            background: PWA_BACKGROUND_COLOR,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 18px 42px rgba(15, 23, 42, 0.24)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                fontSize: 78,
                fontWeight: 900,
                letterSpacing: "-0.06em",
                color: PWA_THEME_COLOR,
              }}
            >
              CP
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Produtor
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
