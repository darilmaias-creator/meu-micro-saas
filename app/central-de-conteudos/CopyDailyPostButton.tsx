"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

type CopyDailyPostButtonProps = {
  content: string;
};

export function CopyDailyPostButton({ content }: CopyDailyPostButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(content);
        setStatus("copied");
        window.setTimeout(() => setStatus("idle"), 2400);
      } catch {
        setStatus("error");
        window.setTimeout(() => setStatus("idle"), 2600);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-amber-300 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Copiando...
        </>
      ) : status === "copied" ? (
        <>
          <Check size={16} />
          Post copiado
        </>
      ) : status === "error" ? (
        <>
          <Copy size={16} />
          Falha ao copiar
        </>
      ) : (
        <>
          <Copy size={16} />
          Copiar post do dia
        </>
      )}
    </button>
  );
}
