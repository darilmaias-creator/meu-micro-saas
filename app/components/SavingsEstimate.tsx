"use client";

interface SavingsEstimateProps {
  totalCost: number;
  averageMargin: number;
}

export function SavingsEstimate({
  totalCost,
  averageMargin,
}: SavingsEstimateProps) {
  const potentialProfit = (totalCost * averageMargin) / 100;
  const monthlyProfit = potentialProfit * 20;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
      <h3 className="text-sm font-semibold text-emerald-900 mb-4">
        💰 Sua Economia Estimada
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-emerald-800">Margem média:</span>
          <span className="font-bold text-emerald-900">{averageMargin}%</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-emerald-800">Lucro por produto:</span>
          <span className="font-bold text-emerald-900">
            R$ {potentialProfit.toFixed(2)}
          </span>
        </div>

        <div className="border-t border-emerald-300 pt-3 flex justify-between items-center">
          <span className="text-emerald-900 font-semibold">
            Lucro estimado/mês:
          </span>
          <span className="text-2xl font-bold text-emerald-900">
            R$ {monthlyProfit.toFixed(2)}
          </span>
        </div>
      </div>

      <p className="text-xs text-emerald-700 mt-4">
        * Baseado em 20 vendas/mês com margem de {averageMargin}%
      </p>
    </div>
  );
}
