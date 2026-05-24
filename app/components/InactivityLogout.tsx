"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "click",
  "keydown",
  "mousemove",
  "scroll",
  "touchstart",
] as const;

export function InactivityLogout() {
  const { data: session, status } = useSession();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return undefined;
    }

    if (!session?.user?.id) {
      void signOut({
        callbackUrl: "/?session=invalidated",
      });
      return undefined;
    }

    function clearLogoutTimer() {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    }

    function scheduleLogout() {
      clearLogoutTimer();
      timeoutRef.current = window.setTimeout(() => {
        void signOut({
          callbackUrl: "/?session=expired",
        });
      }, INACTIVITY_TIMEOUT_MS);
    }

    scheduleLogout();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, scheduleLogout, {
        passive: true,
      });
    });

    return () => {
      clearLogoutTimer();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, scheduleLogout);
      });
    };
  }, [session?.user?.id, status]);

  return null;
}
