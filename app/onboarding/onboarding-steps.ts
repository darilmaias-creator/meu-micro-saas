import type { ActiveTab } from "@/lib/app-tabs";
import { getPathForActiveTab } from "@/lib/app-tabs";

export type OnboardingStep = {
  id: string;
  tab: ActiveTab;
  title: string;
  description: string;
  actionHint: string;
  targetSelector: string;
  href: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "insumos",
    tab: "inventory",
    title: "Passo 1 de 3 • Meus Materiais",
    description:
      "Aqui você cadastra cada insumo com nome, preço e estoque. Esses dados alimentam todo o cálculo do app.",
    actionHint:
      "Preencha o bloco Novo Insumo e clique em Salvar no Estoque.",
    targetSelector: '[data-onboarding="inventory-insumo-form"]',
    href: getPathForActiveTab("inventory"),
  },
  {
    id: "ficha-tecnica",
    tab: "calculator",
    title: "Passo 2 de 3 • Calcular Preço / Ficha Técnica",
    description:
      "Agora monte a receita do produto com materiais, tempos e custos. O app calcula custo real e preço sugerido.",
    actionHint:
      "Adicione materiais na ficha e depois salve no catálogo.",
    targetSelector: '[data-onboarding="calculator-recipe-form"]',
    href: getPathForActiveTab("calculator"),
  },
  {
    id: "orcamentos",
    tab: "sales",
    title: "Passo 3 de 3 • Orçamentos e Vendas",
    description:
      "Nesta aba você gera propostas para clientes e conclui vendas com baixa no estoque.",
    actionHint:
      "Selecione o produto, preencha cliente e clique em Salvar Pendente.",
    targetSelector: '[data-onboarding="sales-quote-workflow"]',
    href: getPathForActiveTab("sales"),
  },
];

