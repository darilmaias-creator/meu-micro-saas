"use client";

interface ProgressCardProps {
  title: string;
  current: number;
  total?: number;
  icon: React.ReactNode;
  color: "emerald" | "amber" | "blue";
}

export function ProgressCard({
  title,
  current,
  total,
  icon,
  color,
}: ProgressCardProps) {
  const percentage = total ? (current / total) * 100 : 0;
  const colorClasses = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        <span className="text-2xl font-bold text-slate-900">{current}</span>
      </div>

      {total && (
        <>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div
              className={`${colorClasses[color]} h-2 rounded-full transition-all`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-600">
            {current} de {total} ({Math.round(percentage)}%)
          </p>
        </>
      )}
    </div>
  );
}
