"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_SECONDS = HEARTBEAT_INTERVAL_MS / 1000;

function canTrackActivity() {
  return (
    typeof document !== "undefined" &&
    typeof navigator !== "undefined" &&
    document.visibilityState === "visible" &&
    navigator.onLine
  );
}

function sendActivityHeartbeat(input: {
  activeSeconds: number;
  isPageView?: boolean;
  path: string;
}) {
  if (!canTrackActivity()) {
    return;
  }

  void fetch("/api/activity/heartbeat", {
    body: JSON.stringify(input),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).catch(() => {
    // Activity tracking must never interrupt the app experience.
  });
}

export function ActivityTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTrackedPathRef.current === pathname) {
      return;
    }

    lastTrackedPathRef.current = pathname;
    sendActivityHeartbeat({
      activeSeconds: 1,
      isPageView: true,
      path: pathname,
    });
  }, [pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      sendActivityHeartbeat({
        activeSeconds: HEARTBEAT_SECONDS,
        path: window.location.pathname,
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
