"use client";

import { Lightbulb } from "lucide-react";

const DAILY_TIPS = [
  {
    title: "Margem Ideal",
    content:
      "A margem ideal para artesanato é entre 50-60%. Isso cobre custos fixos e gera lucro sustentável.",
  },
  {
    title: "Controle de Estoque",
    content:
      "Revise seu estoque mínimo semanalmente. Produtos com alta demanda precisam de estoque maior.",
  },
  {
    title: "Precificação Dinâmica",
    content:
      "Produtos personalizados podem ter margem maior (60-70%) que produtos em série (40-50%).",
  },
  {
    title: "Orçamentos Claros",
    content:
      "Sempre inclua detalhes do produto no orçamento. Clientes entendem melhor o valor.",
  },
  {
    title: "Custos Ocultos",
    content:
      "Não esqueça de incluir embalagem, etiqueta e frete nos custos. Eles impactam a margem.",
  },
  {
    title: "Teste de Preço",
    content:
      "Teste aumentar o preço em 10%. Muitos clientes não notam e você ganha mais margem.",
  },
  {
    title: "Histórico de Vendas",
    content:
      "Acompanhe qual produto vende mais. Foque em aumentar a produção do campeão.",
  },
  {
    title: "Negociação",
    content:
      "Sempre deixe espaço para negociar. Comece com preço 10-15% acima do ideal.",
  },
];

export function DailyTip() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (24 * 60 * 60 * 1000),
  );
  const tipIndex = dayOfYear % DAILY_TIPS.length;
  const tip = DAILY_TIPS[tipIndex];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
      <div className="flex items-start gap-3">
        <Lightbulb className="text-blue-600 flex-shrink-0 mt-1" size={20} />
        <div>
          <h4 className="font-bold text-blue-900">{tip.title}</h4>
          <p className="text-sm text-blue-800 mt-1">{tip.content}</p>
        </div>
      </div>
    </div>
  );
}
