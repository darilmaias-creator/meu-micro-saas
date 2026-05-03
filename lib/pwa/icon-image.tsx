import { ImageResponse } from "next/og";

import {
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
} from "@/lib/pwa/config";
import { DEFAULT_STORE_LOGO } from "@/lib/app-data/defaults";

type PwaIconVariant = "default" | "maskable" | "monochrome";

function renderPwaIcon(variant: PwaIconVariant) {
  const isMonochrome = variant === "monochrome";
  const isMaskable = variant === "maskable";
  const backgroundColor = isMonochrome
    ? "#ffffff"
    : isMaskable
      ? PWA_THEME_COLOR
      : "transparent";
  const labelColor = isMonochrome ? "#111827" : PWA_THEME_COLOR;
  const subtitleColor = isMonochrome ? "#374151" : "#334155";
  const logoSize = isMaskable ? 340 : 512;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: backgroundColor,
        color: "#0f172a",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {isMonochrome ? (
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
                color: labelColor,
              }}
            >
              CP
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: subtitleColor,
              }}
            >
              Produtor
            </div>
          </div>
        ) : (
            <img
              src={DEFAULT_STORE_LOGO}
              alt="Logo da Calcula Artesão"
              width={logoSize}
              height={logoSize}
              style={{
                objectFit: "contain",
                borderRadius: isMaskable ? 72 : 0,
              }}
            />
        )}
      </div>
    </div>
  );
}

export function createPwaIconResponse(input: {
  size: {
    width: number;
    height: number;
  };
  variant?: PwaIconVariant;
}) {
  return new ImageResponse(renderPwaIcon(input.variant ?? "default"), input.size);
}
