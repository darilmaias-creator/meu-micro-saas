"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Crown,
  ImagePlus,
  Save,
  Sparkles,
  Store,
  Upload,
} from "lucide-react";

import { Card } from "./ui";
import { useAppData } from "./hooks/useAppData";
import {
  createDefaultAppDataState,
  createDefaultQuoteDocumentConfig,
  DEFAULT_STORE_NAME,
  DEFAULT_STORE_SUBTITLE,
  resolveQuoteDocumentConfig,
} from "@/lib/app-data/defaults";

const DEFAULT_LOGO_URL = createDefaultAppDataState().config.userLogo;

type SettingsFieldProps = {
  label: string;
  hint: string;
  value: string;
  disabled: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  onChange: (value: string) => void;
};

function SettingsField({
  label,
  hint,
  value,
  disabled,
  placeholder,
  inputMode,
  maxLength,
  onChange,
}: SettingsFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
      />
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

type SettingsTextareaProps = {
  label: string;
  hint: string;
  value: string;
  disabled: boolean;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
};

function SettingsTextarea({
  label,
  hint,
  value,
  disabled,
  placeholder,
  maxLength,
  onChange,
}: SettingsTextareaProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <textarea
        rows={4}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
      />
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function BusinessSettingsPage() {
  const { data: session, status } = useSession();
  const [feedback, setFeedback] = useState<string | null>(null);

  const appData = useAppData(session?.user?.id ?? "");

  const defaultBranding = useMemo(
    () => ({
      logo: DEFAULT_LOGO_URL,
      storeName: DEFAULT_STORE_NAME,
      storeSubtitle: DEFAULT_STORE_SUBTITLE,
    }),
    [],
  );
  const defaultQuoteConfig = useMemo(
    () => createDefaultQuoteDocumentConfig(),
    [],
  );

  if (status === "loading" || !session || !appData.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-amber-600 animate-pulse">
          Carregando seu negocio...
        </p>
      </div>
    );
  }

  const isPremium = session.user.isPremium;
  const { config } = appData;
  const resolvedQuoteConfig = resolveQuoteDocumentConfig(config, isPremium);
  const displayLogo =
    isPremium && config.userLogo ? config.userLogo : defaultBranding.logo;
  const currentStoreName = config.storeName || defaultBranding.storeName;
  const currentStoreSubtitle =
    config.storeSubtitle || defaultBranding.storeSubtitle;
  const brandingMatchesDefault =
    (config.storeName || defaultBranding.storeName) === defaultBranding.storeName &&
    (config.storeSubtitle || defaultBranding.storeSubtitle) ===
      defaultBranding.storeSubtitle &&
    (!config.userLogo || config.userLogo === defaultBranding.logo);

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isPremium) {
      setFeedback(
        "A personalizacao do seu negocio fica disponivel no plano Premium.",
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      config.setUserLogo(reader.result as string);
      setFeedback("Logotipo atualizado. As alteracoes sao salvas automaticamente.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleResetBranding() {
    config.setStoreName(defaultBranding.storeName);
    config.setStoreSubtitle(defaultBranding.storeSubtitle);
    config.setUserLogo(defaultBranding.logo);
    setFeedback("Seu negocio voltou para o visual padrao do app.");
  }

  function handleQuoteValidityChange(value: string) {
    config.setQuoteValidityDays(value.replace(/\D/g, ""));
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="bg-amber-600 text-white py-4 shadow-md sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-4xl mx-auto px-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Store size={26} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight drop-shadow-sm">
                  Meu Negocio
                </h1>
                <span className="text-xs text-amber-200 uppercase tracking-wider font-bold">
                  Ajuste sua marca e os textos que saem no orçamento
                </span>
              </div>
            </div>

            <Link
              href="/estoque"
              className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-50"
            >
              <ArrowLeft size={16} />
              Voltar ao app
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-amber-200 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                <Sparkles size={13} />
                Area separada e simples
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Edite o nome, slogan, logotipo e o texto do seu orçamento
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Tudo o que voce mudar aqui aparece nos seus orcamentos e
                  documentos. As alteracoes sao salvas automaticamente.
                </p>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                isPremium
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Crown size={13} />
              {isPremium ? "Premium liberado" : "Disponivel no Premium"}
            </div>
          </div>

          {!isPremium && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No plano gratis, o app usa o visual e os textos padrao no orçamento.
              Ao voltar para o Premium, suas personalizacoes reaparecem
              automaticamente.
            </div>
          )}

          {feedback && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {feedback}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <Card className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Pre-visualizacao
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">
                Como seu negocio vai aparecer
              </h3>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img
                    src={displayLogo}
                    alt="Logotipo do negocio"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black text-slate-900 break-words">
                    {currentStoreName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 break-words">
                    {currentStoreSubtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 space-y-2">
              <p>
                <span className="font-bold text-slate-800">Validade padrão:</span>{" "}
                {resolvedQuoteConfig.quoteValidityDays} dias
              </p>
              <p>
                <span className="font-bold text-slate-800">Prazo:</span>{" "}
                {resolvedQuoteConfig.quoteLeadTimeText}
              </p>
              <p className="text-xs text-slate-500">
                Dica: deixe os textos curtos. Isso ajuda o orçamento a ficar
                profissional sem ficar poluido.
              </p>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Dados do negocio
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">
                Informacoes principais
              </h3>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Nome do seu negocio
              </label>
              <input
                type="text"
                value={config.storeName || ""}
                onChange={(event) => config.setStoreName(event.target.value)}
                disabled={!isPremium}
                placeholder={defaultBranding.storeName}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Slogan ou subtitulo
              </label>
              <input
                type="text"
                value={config.storeSubtitle ?? ""}
                onChange={(event) => config.setStoreSubtitle(event.target.value)}
                disabled={!isPremium}
                placeholder={defaultBranding.storeSubtitle}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Logotipo
              </label>
              <label className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 transition-colors hover:bg-amber-100">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                  <Upload size={16} />
                  Escolher imagem do seu negocio
                </div>
                <p className="text-sm text-slate-600">
                  Envie a logo que deve aparecer nos orcamentos e documentos.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!isPremium}
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleResetBranding}
                disabled={brandingMatchesDefault}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ImagePlus size={16} />
                Usar visual padrao
              </button>

              <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
                <Save size={16} />
                Salvo automaticamente
              </div>
            </div>
          </Card>
        </div>

        <Card className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Configuracoes do orçamento
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">
                Textos e contatos que saem no PDF
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Aqui voce define as condicoes do orçamento para passar mais
                segurança ao cliente sem poluir o documento.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:max-w-xs">
              O plano gratis usa os textos padrao abaixo. O Premium libera
              personalizacao completa.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingsField
              label="Validade do orçamento"
              hint="Quantidade de dias que o orçamento fica válido."
              value={
                isPremium
                  ? config.quoteValidityDays
                  : resolvedQuoteConfig.quoteValidityDays
              }
              disabled={!isPremium}
              placeholder={defaultQuoteConfig.quoteValidityDays}
              inputMode="numeric"
              maxLength={3}
              onChange={handleQuoteValidityChange}
            />

            <SettingsField
              label="Prazo"
              hint="Texto curto sobre produção e entrega."
              value={
                isPremium
                  ? config.quoteLeadTimeText
                  : resolvedQuoteConfig.quoteLeadTimeText
              }
              disabled={!isPremium}
              placeholder={defaultQuoteConfig.quoteLeadTimeText}
              maxLength={140}
              onChange={config.setQuoteLeadTimeText}
            />

            <SettingsField
              label="Forma de entrega"
              hint="Explique se frete, retirada ou entrega são combinados depois."
              value={
                isPremium
                  ? config.quoteDeliveryText
                  : resolvedQuoteConfig.quoteDeliveryText
              }
              disabled={!isPremium}
              placeholder={defaultQuoteConfig.quoteDeliveryText}
              maxLength={140}
              onChange={config.setQuoteDeliveryText}
            />

            <SettingsField
              label="Forma de pagamento"
              hint="Use um texto geral e simples para o PDF."
              value={
                isPremium
                  ? config.quotePaymentText
                  : resolvedQuoteConfig.quotePaymentText
              }
              disabled={!isPremium}
              placeholder={defaultQuoteConfig.quotePaymentText}
              maxLength={140}
              onChange={config.setQuotePaymentText}
            />

            <SettingsField
              label="Sinal ou entrada"
              hint="No gratis fica o padrão de 50%. No Premium você personaliza."
              value={
                isPremium
                  ? config.quoteAdvanceText
                  : resolvedQuoteConfig.quoteAdvanceText
              }
              disabled={!isPremium}
              placeholder={defaultQuoteConfig.quoteAdvanceText}
              maxLength={140}
              onChange={config.setQuoteAdvanceText}
            />

            <SettingsField
              label="Condição de aprovação"
              hint="Use este texto para deixar claro quando a produção começa."
              value={
                isPremium
                  ? config.quoteApprovalText
                  : resolvedQuoteConfig.quoteApprovalText
              }
              disabled={!isPremium}
              placeholder={defaultQuoteConfig.quoteApprovalText}
              maxLength={140}
              onChange={config.setQuoteApprovalText}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingsTextarea
              label="Observações"
              hint="Opcional. Use para ajustes, artes, frete ou outras condições extras."
              value={
                isPremium
                  ? config.quoteNotesText
                  : resolvedQuoteConfig.quoteNotesText
              }
              disabled={!isPremium}
              placeholder="Ex: alterações extras podem ajustar o valor final."
              maxLength={260}
              onChange={config.setQuoteNotesText}
            />

            <div className="space-y-5">
              <SettingsField
                label="Instagram"
                hint="Aparece no bloco final do orçamento, se preenchido."
                value={
                  isPremium
                    ? config.businessInstagram
                    : resolvedQuoteConfig.businessInstagram
                }
                disabled={!isPremium}
                placeholder="@seunegocio"
                maxLength={80}
                onChange={config.setBusinessInstagram}
              />

              <SettingsField
                label="WhatsApp"
                hint="Use o formato que você prefere divulgar ao cliente."
                value={
                  isPremium
                    ? config.businessWhatsapp
                    : resolvedQuoteConfig.businessWhatsapp
                }
                disabled={!isPremium}
                placeholder="(00) 00000-0000"
                maxLength={30}
                onChange={config.setBusinessWhatsapp}
              />
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
