"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, ClipboardList, Lightbulb, Trash2 } from "lucide-react";

import {
  SUGGESTION_STATUS_LABELS,
  type SuggestionStatus,
} from "@/lib/suggestions";

type AdminSuggestionActionsProps = {
  currentStatus: SuggestionStatus;
  suggestionId: string;
};

const STATUS_ACTIONS: Array<{
  icon: typeof CheckCircle2;
  status: SuggestionStatus;
}> = [
  {
    icon: ClipboardList,
    status: "reviewing",
  },
  {
    icon: Lightbulb,
    status: "planned",
  },
  {
    icon: CheckCircle2,
    status: "resolved",
  },
  {
    icon: Archive,
    status: "archived",
  },
];

export function AdminSuggestionActions({
  currentStatus,
  suggestionId,
}: AdminSuggestionActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<SuggestionStatus | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(status: SuggestionStatus) {
    setUpdatingStatus(status);
    setMessage(null);

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        body: JSON.stringify({
          status,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setMessage(result?.message ?? "Nao foi possivel atualizar.");
        return;
      }

      router.refresh();
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function deleteSuggestion() {
    const shouldDelete = window.confirm("Excluir esta sugestao?");

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setMessage(result?.message ?? "Nao foi possivel excluir.");
        return;
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex min-w-44 flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {STATUS_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isCurrentStatus = currentStatus === action.status;
          const isUpdating = updatingStatus === action.status;

          return (
            <button
              key={action.status}
              type="button"
              onClick={() => updateStatus(action.status)}
              disabled={isCurrentStatus || Boolean(updatingStatus) || isDeleting}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              title={SUGGESTION_STATUS_LABELS[action.status]}
            >
              <Icon size={13} />
              {isUpdating ? "..." : SUGGESTION_STATUS_LABELS[action.status]}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={deleteSuggestion}
        disabled={isDeleting || Boolean(updatingStatus)}
        className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={14} />
        {isDeleting ? "Excluindo..." : "Excluir"}
      </button>
      {message && <p className="text-xs font-semibold text-red-700">{message}</p>}
    </div>
  );
}
