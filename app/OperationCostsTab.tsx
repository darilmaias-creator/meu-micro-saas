"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import React, { useState } from "react";
import { Crown, DollarSign, Info, Plus, Trash2 } from "lucide-react";

import { Card, InputGroup } from "./ui";
import { resolveOperationCostConfig } from "@/lib/app-data/operation-costs";

export function OperationCostsSummary({
  isPremium,
  operationCostBreakdown,
}: any) {
  const operationModeLabel =
    operationCostBreakdown.operationCostMode === "per_hour"
      ? "Rateio por hora produtiva"
      : "Rateio simples por unidade";

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            Custos da Operacao
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
              de acrescimo operacional
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-indigo-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Ajuste seus gastos em uma aba separada e mantenha a calculadora limpa.
          </p>
          <p className="text-xs text-slate-500">
            Os valores configurados aqui entram automaticamente no preco sugerido.
          </p>
        </div>
        <Link
          href="/custos-operacao"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
        >
          Abrir custos da operacao
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
    "No plano gratis, voce usa custos basicos e rateio simples por unidade.";
  const premiumModeOperationHint =
    "No Premium, voce libera custos personalizados, rateio por hora e acrescimo operacional.";
  const operationModeLabel =
    operationConfig.operationCostMode === "per_hour"
      ? "Rateio por hora produtiva"
      : "Rateio simples por unidade";

  const addCustomOperationCost = () => {
    const trimmedName = customCostName.trim();
    const normalizedAmount = Number(customCostAmount.replace(",", "."));

    if (!trimmedName) {
      alert("Informe o nome do custo personalizado.");
      return;
    }

    if (!(normalizedAmount > 0)) {
      alert("Informe um valor valido para o custo personalizado.");
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
                    Custos da Operacao
                  </h2>
                </div>
                <p className="text-sm text-slate-500">
                  Traga aluguel, agua, luz e outros gastos para dentro da
                  precificacao.
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
                ? "Seus custos operacionais entram automaticamente no preco sugerido."
                : freeModeOperationHint}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isPremium
                ? premiumModeOperationHint
                : "O Premium libera custos personalizados, rateio por hora produtiva e acrescimo operacional."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
                Custos fixos mensais
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
                Custos variaveis mensais
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
                tooltip="Quantidade media de pecas produzidas por mes para o rateio simples."
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
                  Rateio atual
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
                  Recursos avancados de custos operacionais
                </h3>
                <p className="text-xs text-slate-300">
                  Custos personalizados, rateio por hora e acrescimo operacional.
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
                O plano gratis continua usando seus custos basicos e o rateio
                simples por unidade. Se quiser aprofundar a operacao, o Premium
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
                  tooltip="Usado para transformar o custo mensal em custo por hora produtiva."
                />
              </div>
              <div className={isPremium ? "" : "opacity-70"}>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Modo de rateio
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
                    <option value="per_hour">Por hora produtiva</option>
                  </select>
                </div>
              </div>
              <div className={isPremium ? "" : "opacity-70"}>
                <InputGroup
                  label="Acrescimo operacional"
                  value={config.operationCostMarkup}
                  onChange={config.setOperationCostMarkup}
                  disabled={!isPremium}
                  suffix="%"
                  placeholder="0"
                  tooltip="Percentual extra para imprevistos, reinvestimento e protecao de margem."
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-800">
                    Custos personalizados
                  </h4>
                  <p className="text-xs text-slate-500">
                    Adicione custos extras do seu negocio quando quiser uma
                    precificacao ainda mais completa.
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
                    label="Nome do custo"
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
                  Adicionar custo
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {customOperationCosts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Nenhum custo personalizado adicionado.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Próximo passo: preencha nome e valor acima e clique em{" "}
                      <strong>Adicionar custo</strong>.
                    </p>
                  </div>
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
            <h3 className="font-bold text-slate-800">Resumo da operacao</h3>
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
                  Rateio por unidade
                </p>
                <p className="mt-1 text-lg font-bold text-slate-800">
                  R$ {operationConfig.monthlyCostPerUnit.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Rateio por hora
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
                calculo do custo final dentro da aba de precificacao.
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
              <span className="font-bold text-slate-800">Custos fixos:</span>{" "}
              entram todo mes mesmo sem venda.
            </li>
            <li>
              <span className="font-bold text-slate-800">Custos variaveis:</span>{" "}
              acompanham o volume do seu negocio.
            </li>
            <li>
              <span className="font-bold text-slate-800">
                Producao media por mes:
              </span>{" "}
              ajuda o app a dividir seus custos por unidade.
            </li>
            <li>
              <span className="font-bold text-slate-800">Premium:</span> libera
              custos personalizados, rateio por hora e acrescimo operacional.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
