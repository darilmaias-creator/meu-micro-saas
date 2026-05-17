"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info, Megaphone, X } from "lucide-react";

import type { AnnouncementRecord } from "@/lib/announcements/types";

const STORAGE_NAMESPACE = "meu-micro-saas";

type ActiveAnnouncementApiResponse = {
  ok: boolean;
  announcement: AnnouncementRecord | null;
  message?: string;
};

type GlobalAnnouncementBannerProps = {
  userId: string;
};

function buildDismissedAnnouncementStorageKey(userId: string) {
  return `${STORAGE_NAMESPACE}:user:${userId}:announcement_dismissed_id`;
}

function getAnnouncementStyles(kind: AnnouncementRecord["kind"]) {
  if (kind === "success") {
    return {
      container:
        "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900",
      badge: "bg-emerald-100 text-emerald-800",
      button:
        "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700",
      icon: "text-emerald-700",
    };
  }

  if (kind === "warning") {
    return {
      container:
        "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950",
      badge: "bg-amber-100 text-amber-800",
      button: "border-amber-400 bg-amber-600 text-white hover:bg-amber-700",
      icon: "text-amber-700",
    };
  }

  return {
    container:
      "border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 text-slate-900",
    badge: "bg-sky-100 text-sky-800",
    button: "border-sky-300 bg-sky-700 text-white hover:bg-sky-800",
    icon: "text-sky-700",
  };
}

function isInternalUrl(url: string) {
  return url.startsWith("/");
}

export default function GlobalAnnouncementBanner({
  userId,
}: GlobalAnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<AnnouncementRecord | null>(null);
  const [hasDismissedCurrentAnnouncement, setHasDismissedCurrentAnnouncement] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadAnnouncement() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/announcements/active", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (isCurrent) {
            setAnnouncement(null);
          }
          return;
        }

        const result = (await response.json()) as ActiveAnnouncementApiResponse;

        if (!isCurrent) {
          return;
        }

        setAnnouncement(result.announcement);
      } catch {
        if (isCurrent) {
          setAnnouncement(null);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadAnnouncement();

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!announcement || typeof window === "undefined") {
      setHasDismissedCurrentAnnouncement(false);
      return;
    }

    const dismissedId = window.localStorage.getItem(
      buildDismissedAnnouncementStorageKey(userId),
    );

    setHasDismissedCurrentAnnouncement(dismissedId === announcement.id);
  }, [announcement, userId]);

  const styles = useMemo(
    () => (announcement ? getAnnouncementStyles(announcement.kind) : null),
    [announcement],
  );

  if (isLoading || !announcement || hasDismissedCurrentAnnouncement || !styles) {
    return null;
  }

  function handleDismissAnnouncement() {
    if (!announcement) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        buildDismissedAnnouncementStorageKey(userId),
        announcement.id,
      );
    }

    setHasDismissedCurrentAnnouncement(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div
        className={`rounded-3xl border px-4 py-4 shadow-sm md:px-5 ${styles.container}`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className={`mt-0.5 rounded-full p-2 ${styles.badge}`}>
              {announcement.kind === "warning" ? (
                <AlertTriangle size={16} />
              ) : announcement.kind === "success" ? (
                <Megaphone size={16} />
              ) : (
                <Info size={16} />
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black uppercase tracking-[0.18em]">
                  Aviso geral
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles.badge}`}
                >
                  Atualizacao
                </span>
              </div>
              <h2 className={`text-base font-black md:text-lg ${styles.icon}`}>
                {announcement.title}
              </h2>
              <p className="text-sm leading-relaxed md:text-[15px]">
                {announcement.message}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {announcement.ctaLabel && announcement.ctaUrl && (
              <>
                {isInternalUrl(announcement.ctaUrl) ? (
                  <Link
                    href={announcement.ctaUrl}
                    className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${styles.button}`}
                  >
                    {announcement.ctaLabel}
                  </Link>
                ) : (
                  <a
                    href={announcement.ctaUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-bold transition-colors ${styles.button}`}
                  >
                    {announcement.ctaLabel}
                  </a>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleDismissAnnouncement}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
              aria-label="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
