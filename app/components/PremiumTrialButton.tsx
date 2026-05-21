"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Crown } from "lucide-react";

export function PremiumTrialButton() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/account/start-premium-trial", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        setFeedback(error.error || "Erro ao iniciar trial");
        return;
      }

      await response.json();
      setFeedback("✓ Trial iniciado! Você tem 7 dias de acesso premium.");

      await update();
    } catch {
      setFeedback("Erro ao iniciar trial. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (session?.user?.isPremium) {
    return null;
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleStartTrial}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-bold text-white hover:bg-amber-600 disabled:opacity-50"
      >
        <Crown size={20} />
        {isLoading ? "Ativando..." : "Teste Premium por 7 Dias"}
      </button>
      {feedback && (
        <p
          className={`text-center text-sm ${feedback.includes("✓") ? "text-green-600" : "text-red-600"}`}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
