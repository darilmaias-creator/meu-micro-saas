"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import type {
  AnnouncementAudience,
  AnnouncementKind,
  AnnouncementRecord,
} from "@/lib/announcements/types";

const DEFAULT_LOGO_URL = createDefaultAppDataState().config.userLogo;

type AnnouncementManagerResponse = {
  ok: boolean;
  activeAnnouncement: AnnouncementRecord | null;
  recentAnnouncements: AnnouncementRecord[];
  message?: string;
};

type AnnouncementEmailDeliverySummary = {
  enabled: boolean;
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  sampleErrors: string[];
};

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

const ANNOUNCEMENT_KIND_OPTIONS: Array<{
  value: AnnouncementKind;
  label: string;
}> = [
  { value: "info", label: "Informacao" },
  { value: "success", label: "Promocao / cupom" },
  { value: "warning", label: "Aviso importante" },
];

function formatAnnouncementDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Data invalida";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeAnnouncementTargetEmailsInput(rawValue: string) {
  const parsed = rawValue
    .split(/[\n,;]+/g)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(parsed));
}

export default function BusinessSettingsPage() {
  const { data: session, status } = useSession();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [announcementStatus, setAnnouncementStatus] = useState<string | null>(null);
  const [isAnnouncementSectionEnabled, setIsAnnouncementSectionEnabled] =
    useState(false);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isPublishingAnnouncement, setIsPublishingAnnouncement] = useState(false);
  const [isClosingAnnouncement, setIsClosingAnnouncement] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] =
    useState<AnnouncementRecord | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    AnnouncementRecord[]
  >([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementKind, setAnnouncementKind] =
    useState<AnnouncementKind>("info");
  const [announcementCtaLabel, setAnnouncementCtaLabel] = useState("");
  const [announcementCtaUrl, setAnnouncementCtaUrl] = useState("");
  const [announcementEndsAt, setAnnouncementEndsAt] = useState("");
  const [announcementAudience, setAnnouncementAudience] =
    useState<AnnouncementAudience>("all");
  const [announcementTargetEmailsInput, setAnnouncementTargetEmailsInput] =
    useState("");
  const [announcementSendEmailUsers, setAnnouncementSendEmailUsers] =
    useState(true);

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

  async function loadAnnouncementManagerData() {
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    setIsLoadingAnnouncements(true);
    setAnnouncementError(null);

    try {
      const response = await fetch("/api/announcements/manage", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        setIsAnnouncementSectionEnabled(false);
        setActiveAnnouncement(null);
        setRecentAnnouncements([]);
        return;
      }

      const result = (await response.json()) as AnnouncementManagerResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Nao foi possivel carregar os avisos.");
      }

      setIsAnnouncementSectionEnabled(true);
      setActiveAnnouncement(result.activeAnnouncement);
      setRecentAnnouncements(result.recentAnnouncements);
    } catch (error) {
      setIsAnnouncementSectionEnabled(true);
      setAnnouncementError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os avisos agora.",
      );
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    void loadAnnouncementManagerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id]);

  function clearAnnouncementForm() {
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setAnnouncementKind("info");
    setAnnouncementCtaLabel("");
    setAnnouncementCtaUrl("");
    setAnnouncementEndsAt("");
    setAnnouncementAudience("all");
    setAnnouncementTargetEmailsInput("");
    setAnnouncementSendEmailUsers(true);
  }

  async function handlePublishAnnouncement() {
    setAnnouncementStatus(null);
    setAnnouncementError(null);
    setIsPublishingAnnouncement(true);

    try {
      const payload = {
        title: announcementTitle,
        message: announcementMessage,
        kind: announcementKind,
        audience: announcementAudience,
        targetEmails:
          announcementAudience === "selected"
            ? normalizeAnnouncementTargetEmailsInput(announcementTargetEmailsInput)
            : [],
        ctaLabel: announcementCtaLabel,
        ctaUrl: announcementCtaUrl,
        endsAt: announcementEndsAt
          ? new Date(`${announcementEndsAt}T23:59:59`).toISOString()
          : null,
        sendEmailUsers: announcementSendEmailUsers,
      };

      const response = await fetch("/api/announcements/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        emailDelivery?: AnnouncementEmailDeliverySummary;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Nao foi possivel publicar o aviso.");
      }

      setAnnouncementStatus(result.message ?? "Aviso publicado com sucesso.");
      if (result.emailDelivery?.sampleErrors?.length) {
        setAnnouncementError(
          `Aviso publicado, mas tivemos alerta no envio por e-mail: ${result.emailDelivery.sampleErrors[0]}`,
        );
      }
      clearAnnouncementForm();
      await loadAnnouncementManagerData();
    } catch (error) {
      setAnnouncementError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel publicar o aviso agora.",
      );
    } finally {
      setIsPublishingAnnouncement(false);
    }
  }

  async function handleCloseAnnouncement() {
    if (!activeAnnouncement?.id) {
      return;
    }

    setAnnouncementStatus(null);
    setAnnouncementError(null);
    setIsClosingAnnouncement(true);

    try {
      const response = await fetch("/api/announcements/manage", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: activeAnnouncement.id }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Nao foi possivel encerrar o aviso.");
      }

      setAnnouncementStatus(result.message ?? "Aviso encerrado com sucesso.");
      await loadAnnouncementManagerData();
    } catch (error) {
      setAnnouncementError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel encerrar o aviso agora.",
      );
    } finally {
      setIsClosingAnnouncement(false);
    }
  }

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

        {isAnnouncementSectionEnabled && (
          <Card className="space-y-5 border-sky-200 bg-gradient-to-br from-white via-sky-50/40 to-indigo-50/50">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Caixa de mensagens do app
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Aviso no topo do app (global ou direcionado)
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Tudo que voce publicar aqui aparece no topo do app para os
                  usuarios logados.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadAnnouncementManagerData()}
                disabled={isLoadingAnnouncements}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingAnnouncements ? "Atualizando..." : "Atualizar lista"}
              </button>
            </div>

            {announcementStatus && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {announcementStatus}
              </div>
            )}

            {announcementError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {announcementError}
              </div>
            )}

            {activeAnnouncement ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Aviso ativo agora
                </p>
                <p className="mt-1 text-base font-black text-slate-900">
                  {activeAnnouncement.title}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {activeAnnouncement.message}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {activeAnnouncement.audience === "selected"
                    ? `Direcionado para ${activeAnnouncement.targetEmails.length} e-mail(s).`
                    : "Visivel para todos os usuarios."}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Publicado em {formatAnnouncementDate(activeAnnouncement.createdAt)}
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void handleCloseAnnouncement()}
                    disabled={isClosingAnnouncement}
                    className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-rose-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isClosingAnnouncement
                      ? "Encerrando aviso..."
                      : "Encerrar aviso ativo"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Nenhum aviso ativo no momento.
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SettingsField
                label="Titulo do aviso"
                hint="Exemplo: Cupom de lancamento para novos assinantes."
                value={announcementTitle}
                disabled={isPublishingAnnouncement}
                placeholder="Titulo curto do aviso"
                maxLength={90}
                onChange={setAnnouncementTitle}
              />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Tipo do aviso
                </label>
                <select
                  value={announcementKind}
                  onChange={(event) =>
                    setAnnouncementKind(event.target.value as AnnouncementKind)
                  }
                  disabled={isPublishingAnnouncement}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {ANNOUNCEMENT_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Isso muda apenas a cor do aviso no app.
                </p>
              </div>
            </div>

            <SettingsTextarea
              label="Mensagem"
              hint='Texto principal do aviso. Para banner clicavel, use: <a href="https://..."><img src="https://..." alt="Banner" /></a>'
              value={announcementMessage}
              disabled={isPublishingAnnouncement}
              placeholder='Ex: <a href="https://calculaartesao.com.br/assinatura/checkout?cupom=LANCAMENTO30"><img src="https://i.postimg.cc/0QCr506G/image.png" alt="Banner" /></a>'
              maxLength={420}
              onChange={setAnnouncementMessage}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Destino do aviso
                </label>
                <select
                  value={announcementAudience}
                  onChange={(event) =>
                    setAnnouncementAudience(
                      event.target.value as AnnouncementAudience,
                    )
                  }
                  disabled={isPublishingAnnouncement}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="all">Todos os usuarios</option>
                  <option value="selected">Somente e-mails de teste</option>
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Use &quot;Somente e-mails de teste&quot; para validar tudo antes do disparo geral.
                </p>
              </div>

              <SettingsField
                label="Texto do botao (opcional)"
                hint="Ex: Ver cupom"
                value={announcementCtaLabel}
                disabled={isPublishingAnnouncement}
                placeholder="Texto do botao"
                maxLength={40}
                onChange={setAnnouncementCtaLabel}
              />

              <SettingsField
                label="Link do botao (opcional)"
                hint="Aceita link completo (https://...) ou rota interna (/assinatura)."
                value={announcementCtaUrl}
                disabled={isPublishingAnnouncement}
                placeholder="https://..."
                maxLength={280}
                onChange={setAnnouncementCtaUrl}
              />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Data limite (opcional)
                </label>
                <input
                  type="date"
                  value={announcementEndsAt}
                  onChange={(event) => setAnnouncementEndsAt(event.target.value)}
                  disabled={isPublishingAnnouncement}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Se preencher, o aviso para nessa data automaticamente.
                </p>
              </div>
            </div>

            {announcementAudience === "selected" && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  E-mails de destino (teste)
                </label>
                <textarea
                  rows={3}
                  value={announcementTargetEmailsInput}
                  onChange={(event) =>
                    setAnnouncementTargetEmailsInput(event.target.value)
                  }
                  disabled={isPublishingAnnouncement}
                  placeholder="exemplo1@email.com, exemplo2@email.com"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const currentEmails = normalizeAnnouncementTargetEmailsInput(
                        announcementTargetEmailsInput,
                      );
                      const adminEmail = session.user.email?.trim().toLowerCase();

                      if (!adminEmail) {
                        return;
                      }

                      if (currentEmails.includes(adminEmail)) {
                        return;
                      }

                      const updatedEmails = [...currentEmails, adminEmail].join(", ");
                      setAnnouncementTargetEmailsInput(updatedEmails);
                    }}
                    disabled={isPublishingAnnouncement || !session.user.email}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Usar meu e-mail de admin
                  </button>
                  <p className="text-xs text-slate-600">
                    Separe por virgula, ponto e virgula ou quebra de linha.
                  </p>
                </div>
              </div>
            )}

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={announcementSendEmailUsers}
                onChange={(event) =>
                  setAnnouncementSendEmailUsers(event.target.checked)
                }
                disabled={isPublishingAnnouncement}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-400"
              />
              <span>
                <strong>Enviar tambem por e-mail para os usuarios</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Usa o remetente configurado no Resend (ex: novidades@calculaartesao.com.br).
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handlePublishAnnouncement()}
                disabled={
                  isPublishingAnnouncement ||
                  !announcementTitle.trim() ||
                  !announcementMessage.trim() ||
                  (announcementAudience === "selected" &&
                    normalizeAnnouncementTargetEmailsInput(
                      announcementTargetEmailsInput,
                    ).length === 0)
                }
                className="inline-flex items-center justify-center rounded-xl border border-sky-600 bg-sky-700 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPublishingAnnouncement
                  ? "Publicando aviso..."
                  : announcementAudience === "selected"
                    ? "Publicar aviso de teste"
                    : "Publicar para todos"}
              </button>

              <button
                type="button"
                onClick={clearAnnouncementForm}
                disabled={isPublishingAnnouncement}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpar formulario
              </button>
            </div>

            {recentAnnouncements.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ultimos avisos publicados
                </p>
                <ul className="mt-3 space-y-3">
                  {recentAnnouncements.slice(0, 5).map((announcement) => (
                    <li
                      key={announcement.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-slate-900">
                          {announcement.title}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            announcement.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {announcement.isActive ? "Ativo" : "Encerrado"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatAnnouncementDate(announcement.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
