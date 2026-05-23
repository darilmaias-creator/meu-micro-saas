"use client";

import { AlertCircle, Crown } from "lucide-react";
import Link from "next/link";

interface SoftLimitWarningProps {
  message: string;
  onDismiss: () => void;
}

export function SoftLimitWarning({
  message,
  onDismiss,
}: SoftLimitWarningProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3">
      <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
      <div className="flex-1">
        <p className="text-sm text-amber-900 font-semibold">{message}</p>
        <div className="flex gap-2 mt-2">
          <Link
            href="/premium"
            className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition"
          >
            <Crown size={14} className="inline mr-1" />
            Teste Premium
          </Link>
          <button
            onClick={onDismiss}
            className="text-xs text-amber-700 hover:text-amber-900"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
