"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import React, { useState } from "react";
import { Crown, DollarSign, Info, Plus } from "lucide-react";

import { Card, InputGroup } from "./ui";
import { resolveOperationCostConfig } from "@/lib/app-data/operation-costs";
import EmptyState from "@/components/ui/empty-state";

export function OperationCostsSummary({
  isPremium,
  operationCostBreakdown,
}: any) {
  const operationModeLabel =
    operationCostBreakdown.operationCostMode === "per_hour"
      ? "Dividir por hora trabalhada"
      : "Dividir por unidade";

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            Gastos do Negocio
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-800">
            Resumo aplicado no preco
          </h3>
        </div>
        {!isPremium && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
            <Crown size={12} />
            Misto
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Total mensal
          </p>
          <p className="mt-1 text-xl font-bold text-slate-800">
            R$ {Number(operationCostBreakdown.monthlyTotal || 0).toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Modo atual
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {operationModeLabel}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {operationCostBreakdown.operationCostMode === "per_hour"
              ? `R$ ${Number(operationCostBreakdown.monthlyCostPerHour || 0).toFixed(2)} por hora`
              : `R$ ${Number(operationCostBreakdown.monthlyCostPerUnit || 0).toFixed(2)} por unidade`}
          </p>
        </div>
        <div className="rounded-lg border border-white/80 bg-white px-3 py-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Impacto por unidade
          </p>
          <p className="mt-1 text-xl font-bold text-slate-800">
            R${" "}
            {Number(
              operationCostBreakdown.appliedOperationCostPerUnit || 0,
            ).toFixed(2)}
          </p>
          {operationCostBreakdown.markupValuePerUnit > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              + R${" "}
              {Number(operationCostBreakdown.markupValuePerUnit || 0).toFixed(2)}{" "}
              de reserva extra
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-indigo-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Ajuste seus gastos em uma aba separada e mantenha a calculadora simples.
          </p>
          <p className="text-xs text-slate-500">
            Os valores configurados aqui entram automaticamente no preco sugerido.
          </p>
        </div>
        <Link
          href="/custos-operacao"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
        >
          Abrir gastos do negocio
        </Link>
      </div>
    </div>
  );
}

export default function OperationCostsTab({ appData, isPremium }: any) {
  const { config } = appData;
  const [customCostName, setCustomCostName] = useState("");
  const [customCostAmount, setCustomCostAmount] = useState("");
  const [customCostKind, setCustomCostKind] = useState<"fixed" | "variable">(
    "fixed",
  );

  const operationConfig = resolveOperationCostConfig(config, isPremium);
  const customOperationCosts = Array.isArray(config.customOperationCosts)
    ? config.customOperationCosts
    : [];
  const freeModeOperationHint =
    "No plano gratis, voce usa gastos basicos divididos por unidade.";
  const premiumModeOperationHint =
    "No Premium, voce libera gastos personalizados, divisao por hora e reserva extra.";
  const operationModeLabel =
    operationConfig.operationCostMode === "per_hour"
      ? "Dividir por hora trabalhada"
      : "Dividir por unidade";

  const addCustomOperationCost = () => {
    const trimmedName = customCostName.trim();
    const normalizedAmount = Number(customCostAmount.replace(",", "."));

    if (!trimmedName) {
      alert("Informe o nome do gasto personalizado.");
      return;
    }

    if (!(normalizedAmount > 0)) {
      alert("Informe um valor valido para o gasto personalizado.");
      return;
    }

    config.setCustomOperationCosts((previous: any[] = []) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        name: trimmedName,
        amount: String(normalizedAmount),
        kind: customCostKind,
      },
    ]);
    setCustomCostName("");
    setCustomCostAmount("");
    setCustomCostKind("fixed");
  };

  const removeCustomOperationCost = (id: string) => {
    config.setCustomOperationCosts((previous: any[] = []) =>
      previous.filter((item: any) => item?.id !== id),
    );
  };

  return (
    <div className="animate-fadeIn grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <Card className="border-t-4 border-indigo-500">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2 text-indigo-700">
                  <DollarSign size={20} />
                  <h2 className="text-lg font-bold text-slate-800">
                    Gastos do Negocio
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  Traga aluguel, agua, luz e outros gastos para dentro do
                  calculo do preco.
                </p>
              </div>
              {!isPremium && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  <Crown size={14} />
                  Modelo misto
                </span>
              )}
            </div>
          </div>

          <div
            className={`mb-4 rounded-xl border p-4 ${
              isPremium
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <p className="text-sm font-semibold text-slate-700">
              {isPremium
                ? "Seus gastos do negocio entram automaticamente no preco sugerido."
                : freeModeOperationHint}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isPremium
                ? premiumModeOperationHint
                : "O Premium libera gastos personalizados, divisao por hora trabalhada e reserva extra."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                Gastos fixos mensais
              </h3>
              <InputGroup
                label="Aluguel"
                value={config.fixedCostRent}
                onChange={config.setFixedCostRent}
                prefix="R$"
                tooltip="Valor mensal do atelie, sala ou espaco de producao."
              />
              <InputGroup
                label="Agua"
                value={config.fixedCostWater}
                onChange={config.setFixedCostWater}
                prefix="R$"
              />
              <InputGroup
                label="Luz"
                value={config.fixedCostElectricity}
                onChange={config.setFixedCostElectricity}
                prefix="R$"
              />
              <InputGroup
                label="Internet"
                value={config.fixedCostInternet}
                onChange={config.setFixedCostInternet}
                prefix="R$"
                className="mb-0"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                Gastos variaveis mensais
              </h3>
              <InputGroup
                label="Embalagem"
                value={config.variableCostPackaging}
                onChange={config.setVariableCostPackaging}
                prefix="R$"
                tooltip="Gasto medio com fitas, etiquetas, caixas e embalagens."
              />
              <InputGroup
                label="Transporte"
                value={config.variableCostTransport}
                onChange={config.setVariableCostTransport}
                prefix="R$"
                tooltip="Compras, entregas e deslocamentos ligados a producao."
              />
              <InputGroup
                label="Taxas"
                value={config.variableCostFees}
                onChange={config.setVariableCostFees}
                prefix="R$"
                tooltip="Taxas de maquininha, plataforma e outras cobrancas variaveis."
                className="mb-0"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <InputGroup
                label="Producao media por mes"
                value={config.monthlyProductionTarget}
                onChange={config.setMonthlyProductionTarget}
                placeholder="Ex: 80"
                tooltip="Quantidade media de pecas produzidas por mes para dividir os gastos por unidade."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
              <div
                className={`rounded-xl border p-4 ${
                  isPremium
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total fixo / mes
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {operationConfig.fixedMonthlyTotal.toFixed(2)}
                </p>
              </div>
              <div
                className={`rounded-xl border p-4 ${
                  isPremium
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total variavel / mes
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  R$ {operationConfig.variableMonthlyTotal.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-700">
                  Como entra no preco
                </p>
                <p className="text-sm font-bold text-amber-800">
                  {operationModeLabel}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  {operationConfig.operationCostMode === "per_hour"
                    ? `R$ ${operationConfig.monthlyCostPerHour.toFixed(2)} / hora`
                    : `R$ ${operationConfig.monthlyCostPerUnit.toFixed(2)} / unidade`}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-t-4 border-slate-900">
          <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-2 text-white">
              <Crown size={18} className={isPremium ? "text-amber-300" : "text-slate-400"} />
              <div>
                <h3 className="font-bold">
                  Recursos avancados de gastos do negocio
                </h3>
                <p className="text-xs text-slate-300">
                  Gastos personalizados, divisao por hora e reserva extra.
                </p>
              </div>
            </div>
            {!isPremium && (
              <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-200">
                Premium
              </span>
            )}
          </div>

          <div className="space-y-4">
            {!isPremium && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                O plano gratis continua usando seus gastos basicos divididos
                por unidade. Se quiser aprofundar a operacao, o Premium
                libera tudo.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={isPremium ? "" : "opacity-70"}>
                <InputGroup
                  label="Horas produtivas por mes"
                  value={config.productiveHoursPerMonth}
                  onChange={config.setProductiveHoursPerMonth}
                  disabled={!isPremium}
                  placeholder="Ex: 120"
                  tooltip="Usado para transformar o gasto mensal em gasto por hora trabalhada."
                />
              </div>
              <div className={isPremium ? "" : "opacity-70"}>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Como dividir os gastos
                  </label>
                  <select
                    value={config.operationCostMode}
                    onChange={(e) =>
                      isPremium && config.setOperationCostMode(e.target.value)
                    }
                    disabled={!isPremium}
                    className={`w-full rounded-lg border p-2 outline-none transition-all ${
                      isPremium
                        ? "border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    <option value="per_unit">Por unidade produzida</option>
                    <option value="per_hour">Por hora trabalhada</option>
                  </select>
                </div>
              </div>
              <div className={isPremium ? "" : "opacity-70"}>
                <InputGroup
                  label="Reserva extra"
                  value={config.operationCostMarkup}
                  onChange={config.setOperationCostMarkup}
                  disabled={!isPremium}
                  suffix="%"
                  placeholder="0"
                  tooltip="Percentual extra para imprevistos, reinvestimento e protecao do lucro."
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-800">
                    Gastos personalizados
                  </h4>
                  <p className="text-xs text-slate-500">
                    Adicione outros gastos do seu negocio quando quiser um
                    preco ainda mais completo.
                  </p>
                </div>
                {isPremium && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Premium ativo
                  </span>
                )}
              </div>

              <div
                className={`mb-4 grid grid-cols-1 gap-3 md:grid-cols-4 ${
                  isPremium ? "" : "opacity-70"
                }`}
              >
                <div className="md:col-span-2">
                  <InputGroup
                    label="Nome do gasto"
                    type="text"
                    value={customCostName}
                    onChange={setCustomCostName}
                    disabled={!isPremium}
                    placeholder="Ex: Contador, plataforma, manutencao"
                    className="mb-0"
                  />
                </div>
                <div>
                  <InputGroup
                    label="Valor mensal"
                    value={customCostAmount}
                    onChange={setCustomCostAmount}
                    disabled={!isPremium}
                    prefix="R$"
                    className="mb-0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tipo
                  </label>
                  <select
                    value={customCostKind}
                    onChange={(e) =>
                      isPremium &&
                      setCustomCostKind(e.target.value as "fixed" | "variable")
                    }
                    disabled={!isPremium}
                    className={`w-full rounded-lg border p-2 outline-none transition-all ${
                      isPremium
                        ? "border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    <option value="fixed">Fixo</option>
                    <option value="variable">Variavel</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addCustomOperationCost}
                  disabled={!isPremium}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    isPremium
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "cursor-not-allowed bg-slate-200 text-slate-500"
                  }`}
                >
                  <Plus size={16} />
                  Adicionar gasto
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {customOperationCosts.length === 0 ? (
                  <EmptyState
                    icon={DollarSign}
                    title="Nenhum gasto personalizado adicionado"
                    description="Adicione outros gastos para refinar seu cálculo além dos campos básicos."
                    ctaLabel="Adicionar gasto"
                    onCtaClick={() => {
                      const target = document.querySelector<HTMLInputElement>(
                        'input[placeholder="Ex: Contador, plataforma, manutencao"]',
                      );
                      target?.focus();
                    }}
                  />
                ) : (
                  customOperationCosts.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {item.kind === "variable" ? "Variavel" : "Fixo"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">
                          R$ {Number(item.amount || 0).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCustomOperationCost(item.id)}
                          disabled={!isPremium}
                          className={`rounded-lg px-3 py-2 text-xs font-bold ${
                            isPremium
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                          }`}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-4">
        <Card className="border border-indigo-200 bg-white">
          <div className="flex items-center gap-2 text-indigo-700">
            <Info size={18} />
            <h3 className="font-bold text-slate-800">Resumo dos gastos</h3>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total mensal
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                R$ {operationConfig.monthlyTotal.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Dividido por unidade
                </p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  R$ {operationConfig.monthlyCostPerUnit.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Dividido por hora
                </p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  R$ {operationConfig.monthlyCostPerHour.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-bold">Como isso entra no preco?</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Tudo o que voce configurar aqui sera aplicado automaticamente no
                calculo do custo final dentro da aba Calcular Preco.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-700">
            <Info size={18} />
            <h3 className="font-bold text-slate-800">Dicas para usar melhor</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
            <li>
              <span className="font-bold text-slate-800">Gastos fixos:</span>{" "}
              entram todo mes mesmo sem venda.
            </li>
            <li>
              <span className="font-bold text-slate-800">Gastos variaveis:</span>{" "}
              acompanham o volume do seu negocio.
            </li>
            <li>
              <span className="font-bold text-slate-800">
                Producao media por mes:
              </span>{" "}
              ajuda o app a dividir seus gastos por unidade.
            </li>
            <li>
              <span className="font-bold text-slate-800">Premium:</span> libera
              gastos personalizados, divisao por hora e reserva extra.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
