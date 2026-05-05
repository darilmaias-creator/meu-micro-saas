"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ActiveTab } from "@/lib/app-tabs";

import { ONBOARDING_STEPS, type OnboardingStep } from "./onboarding-steps";
import {
  getOnboardingCompletedKey,
  getOnboardingProgressKey,
  ONBOARDING_GLOBAL_COMPLETED_KEY,
} from "./storage";

type StoredOnboardingProgress = {
  status: "active" | "completed" | "skipped";
  stepIndex: number;
  updatedAt: string;
};

type UseOnboardingGuideParams = {
  userId: string;
  activeTab: ActiveTab;
};

type UseOnboardingGuideResult = {
  isReady: boolean;
  isActive: boolean;
  stepIndex: number;
  totalSteps: number;
  progressPercent: number;
  currentStep: OnboardingStep;
  canGoBack: boolean;
  isTargetReady: boolean;
  goBack: () => void;
  goNext: () => void;
  skipGuide: () => void;
  goToCurrentStepTab: () => void;
};

const HIGHLIGHT_CLASSNAME = "onboarding-highlight-target";

function clampStepIndex(stepIndex: number) {
  return Math.min(Math.max(0, stepIndex), ONBOARDING_STEPS.length - 1);
}

function readStoredProgress(
  rawValue: string | null,
): StoredOnboardingProgress | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<StoredOnboardingProgress>;

    if (
      (parsedValue.status === "active" ||
        parsedValue.status === "completed" ||
        parsedValue.status === "skipped") &&
      Number.isFinite(parsedValue.stepIndex)
    ) {
      return {
        status: parsedValue.status,
        stepIndex: clampStepIndex(Number(parsedValue.stepIndex)),
        updatedAt:
          typeof parsedValue.updatedAt === "string"
            ? parsedValue.updatedAt
            : new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }

  return null;
}

function isElementMostlyVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewportHeight &&
    rect.right <= viewportWidth
  );
}

export function useOnboardingGuide({
  userId,
  activeTab,
}: UseOnboardingGuideParams): UseOnboardingGuideResult {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isTargetReady, setIsTargetReady] = useState(false);
  const highlightedElementRef = useRef<HTMLElement | null>(null);

  const scopedCompletedKey = useMemo(() => getOnboardingCompletedKey(userId), [userId]);
  const progressKey = useMemo(() => getOnboardingProgressKey(userId), [userId]);
  const totalSteps = ONBOARDING_STEPS.length;
  const currentStep = ONBOARDING_STEPS[clampStepIndex(stepIndex)];
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  const syncGuideState = useCallback(
    (nextStepIndex: number, nextIsActive: boolean) => {
      setStepIndex(clampStepIndex(nextStepIndex));
      setIsActive(nextIsActive);
      setIsReady(true);
    },
    [],
  );

  const resetTargetReady = useCallback(() => {
    setIsTargetReady(false);
  }, []);

  const removeHighlight = useCallback(() => {
    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove(HIGHLIGHT_CLASSNAME);
      highlightedElementRef.current = null;
    }
  }, []);

  const completeGuide = useCallback(
    (status: "completed" | "skipped") => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ONBOARDING_GLOBAL_COMPLETED_KEY, "true");
        window.localStorage.setItem(scopedCompletedKey, "true");
        const finalProgress: StoredOnboardingProgress = {
          status,
          stepIndex: totalSteps - 1,
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(progressKey, JSON.stringify(finalProgress));
      }

      removeHighlight();
      resetTargetReady();
      setIsActive(false);
    },
    [progressKey, removeHighlight, resetTargetReady, scopedCompletedKey, totalSteps],
  );

  const goToStep = useCallback(
    (targetIndex: number) => {
      const nextStepIndex = clampStepIndex(targetIndex);
      resetTargetReady();
      setStepIndex(nextStepIndex);

      const targetStep = ONBOARDING_STEPS[nextStepIndex];

      if (targetStep.tab !== activeTab) {
        router.push(targetStep.href);
      }
    },
    [activeTab, resetTargetReady, router],
  );

  const goBack = useCallback(() => {
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const goNext = useCallback(() => {
    if (stepIndex >= totalSteps - 1) {
      completeGuide("completed");
      return;
    }

    goToStep(stepIndex + 1);
  }, [completeGuide, goToStep, stepIndex, totalSteps]);

  const skipGuide = useCallback(() => {
    completeGuide("skipped");
  }, [completeGuide]);

  const goToCurrentStepTab = useCallback(() => {
    if (currentStep.tab !== activeTab) {
      router.push(currentStep.href);
    }
  }, [activeTab, currentStep, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const scheduleGuideState = (nextStepIndex: number, nextIsActive: boolean) => {
      window.setTimeout(() => {
        syncGuideState(nextStepIndex, nextIsActive);
      }, 0);
    };

    const wasCompleted =
      window.localStorage.getItem(scopedCompletedKey) === "true" ||
      window.localStorage.getItem(ONBOARDING_GLOBAL_COMPLETED_KEY) === "true";

    if (wasCompleted) {
      scheduleGuideState(0, false);
      return;
    }

    const storedProgress = readStoredProgress(
      window.localStorage.getItem(progressKey),
    );

    if (storedProgress?.status === "active") {
      scheduleGuideState(storedProgress.stepIndex, true);
      return;
    }

    const initialProgress: StoredOnboardingProgress = {
      status: "active",
      stepIndex: 0,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(progressKey, JSON.stringify(initialProgress));
    scheduleGuideState(0, true);
  }, [progressKey, scopedCompletedKey, syncGuideState]);

  useEffect(() => {
    if (!isReady || !isActive || typeof window === "undefined") {
      return;
    }

    const progress: StoredOnboardingProgress = {
      status: "active",
      stepIndex,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(progressKey, JSON.stringify(progress));
  }, [isActive, isReady, progressKey, stepIndex]);

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: number | null = null;
    let resetTargetTimeoutId: number | null = null;

    removeHighlight();
    resetTargetTimeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        resetTargetReady();
      }
    }, 0);

    if (!isReady || !isActive || typeof window === "undefined") {
      return;
    }

    let attempts = 0;
    const step = currentStep;

    const tryHighlightTarget = () => {
      if (isCancelled) {
        return;
      }

      const candidateElement = document.querySelector(step.targetSelector);

      if (candidateElement instanceof HTMLElement) {
        candidateElement.classList.add(HIGHLIGHT_CLASSNAME);
        highlightedElementRef.current = candidateElement;

        if (!isElementMostlyVisible(candidateElement)) {
          candidateElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }

        setIsTargetReady(true);
        return;
      }

      attempts += 1;

      if (attempts < 24) {
        timeoutId = window.setTimeout(tryHighlightTarget, 120);
        return;
      }

      setIsTargetReady(false);
    };

    tryHighlightTarget();

    return () => {
      isCancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (resetTargetTimeoutId !== null) {
        window.clearTimeout(resetTargetTimeoutId);
      }

      removeHighlight();
    };
  }, [activeTab, currentStep, isActive, isReady, removeHighlight, resetTargetReady]);

  return {
    isReady,
    isActive,
    stepIndex,
    totalSteps,
    progressPercent,
    currentStep,
    canGoBack: stepIndex > 0,
    isTargetReady,
    goBack,
    goNext,
    skipGuide,
    goToCurrentStepTab,
  };
}
