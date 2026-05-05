"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-amber-300 bg-amber-50/80 p-5 text-center ${className}`}
    >
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
        <Icon size={22} />
      </div>
      <h3 className="text-sm font-bold text-amber-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-amber-800">{description}</p>

      {ctaLabel &&
        (ctaHref ? (
          <Link
            href={ctaHref}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
          >
            {ctaLabel}
            <ArrowRight size={14} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCtaClick}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
          >
            {ctaLabel}
            <ArrowRight size={14} />
          </button>
        ))}
    </div>
  );
}
