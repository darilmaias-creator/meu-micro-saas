"use client";

import { ArrowRight, ChevronLeft, Sparkles, X } from "lucide-react";

import type { ActiveTab } from "@/lib/app-tabs";

import { useOnboardingGuide } from "./useOnboardingGuide";

type OnboardingGuideProps = {
  userId: string;
  activeTab: ActiveTab;
};

export default function OnboardingGuide({
  userId,
  activeTab,
}: OnboardingGuideProps) {
  const onboardingGuide = useOnboardingGuide({ userId, activeTab });

  if (!onboardingGuide.isReady || !onboardingGuide.isActive) {
    return null;
  }

  const {
    currentStep,
    stepIndex,
    totalSteps,
    progressPercent,
    canGoBack,
    isTargetReady,
    goBack,
    goNext,
    skipGuide,
    goToCurrentStepTab,
  } = onboardingGuide;

  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <aside className="pointer-events-none fixed bottom-4 right-4 z-[70] w-[min(92vw,360px)]">
      <div className="pointer-events-auto rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">
              <Sparkles size={12} />
              Tutorial guiado
            </p>
            <h3 className="mt-2 text-base font-black text-slate-900">
              {currentStep.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={skipGuide}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Pular tutorial"
            aria-label="Pular tutorial"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {currentStep.description}
        </p>
        <p className="mt-2 text-xs font-semibold text-amber-800">
          {currentStep.actionHint}
        </p>

        {!isTargetReady && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-xs font-semibold text-blue-700">
              Vamos te levar para a aba certa desse passo.
            </p>
            <button
              type="button"
              onClick={goToCurrentStepTab}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200 transition-colors hover:bg-blue-100"
            >
              Ir para esta aba
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-1 text-[11px] font-bold text-slate-500">
          Passo {stepIndex + 1} de {totalSteps}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={skipGuide}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 transition-colors enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Voltar
          </button>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-600 px-2 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
          >
            {isLastStep ? "Concluir" : "Próximo"}
            {!isLastStep && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

