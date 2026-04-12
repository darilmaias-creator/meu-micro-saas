"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Crown,
  Download,
  ImagePlus,
  Lock,
  Share2,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import {
  FREE_NAME_CHANGE_LIMIT,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
} from "@/lib/auth/profile-rules";
import {
  normalizeAppDataState,
  type AppDataState,
} from "@/lib/app-data/defaults";
import type { BackupFrequency } from "@/lib/account/backup-config";
import {
  PREMIUM_FOUNDER_LIMIT,
  PREMIUM_FOUNDER_PRICE_BRL,
  PREMIUM_STANDARD_PRICE_BRL,
  formatBrlPriceFromCents,
} from "@/lib/billing/plans";
import { clearLocalAppDataCache } from "./hooks/useAppData";

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRestoreAppData: (value: Partial<AppDataState>) => void;
};

type ProfileFeedback =
  | {
      tone: "error" | "success";
      message: string;
    }
  | null;

function isAppDataBackupCandidate(value: unknown): value is Partial<AppDataState> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return (
    "config" in value ||
    "insumos" in value ||
    "savedProducts" in value ||
    "sales" in value ||
    "quotes" in value
  );
}

const BACKUP_FREQUENCY_LABELS: Record<BackupFrequency, string> = {
  off: "Desligado",
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensal",
};

const SHOW_EMAIL_BACKUP_ACTION = false;

export default function ProfileModal({
  isOpen,
  onClose,
  onRestoreAppData,
}: ProfileModalProps) {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [feedback, setFeedback] = useState<ProfileFeedback>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharingBackup, setIsSharingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSavingBackupSettings, setIsSavingBackupSettings] = useState(false);
  const [isSendingBackupEmail, setIsSendingBackupEmail] = useState(false);
  const [isStartingPremiumCheckout, setIsStartingPremiumCheckout] =
    useState(false);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [backupFrequency, setBackupFrequency] = useState<BackupFrequency>("off");

  useEffect(() => {
    if (!isOpen || !session?.user) {
      return;
    }

    setName(session.user.name ?? "");
    setImagePreview(session.user.image ?? "");
    setDeleteConfirmation("");
    setBackupEmail(session.user.backupEmail ?? session.user.email ?? "");
    setBackupFrequency(session.user.backupFrequency ?? "off");
    setFeedback(null);
  }, [isOpen, session]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    feedbackRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [feedback]);

  if (!isOpen || !session?.user) {
    return null;
  }

  const { user } = session;
  const isPremium = user.isPremium;
  const canChangeName = user.canChangeName;
  const canChangePhoto = user.canChangePhoto;
  const remainingNameChanges = user.freeNameChangesRemaining;
  const initialName = user.name ?? "";
  const initialImage = user.image ?? "";
  const displayProfilePhoto = isPremium ? imagePreview : "";
  const hasProfileChanges =
    name.trim() !== initialName || imagePreview !== initialImage;
  const canDeleteAccount = deleteConfirmation.trim().toUpperCase() === "EXCLUIR";
  const founderPriceLabel = formatBrlPriceFromCents(PREMIUM_FOUNDER_PRICE_BRL);
  const standardPriceLabel = formatBrlPriceFromCents(
    PREMIUM_STANDARD_PRICE_BRL,
  );
  const hasStripeBilling = Boolean(user.stripeCustomerId);
  const stripeSubscriptionStatusLabel = user.stripeSubscriptionStatus
    ? user.stripeSubscriptionStatus.replaceAll("_", " ")
    : null;

  async function handleStartPremiumCheckout() {
    setFeedback(null);
    setIsStartingPremiumCheckout(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; url?: string }
        | null;

      if (!response.ok || !result?.url) {
        setFeedback({
          tone: "error",
          message:
            result?.message ?? "Nao foi possivel abrir o checkout agora.",
        });
        return;
      }

      window.location.href = result.url;
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel abrir o checkout agora.",
      });
    } finally {
      setIsStartingPremiumCheckout(false);
    }
  }

  async function handleOpenBillingPortal() {
    setFeedback(null);
    setIsOpeningBillingPortal(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; url?: string }
        | null;

      if (!response.ok || !result?.url) {
        setFeedback({
          tone: "error",
          message:
            result?.message ??
            "Nao foi possivel abrir o gerenciamento da assinatura agora.",
        });
        return;
      }

      window.location.href = result.url;
    } catch {
      setFeedback({
        tone: "error",
        message:
          "Nao foi possivel abrir o gerenciamento da assinatura agora.",
      });
    } finally {
      setIsOpeningBillingPortal(false);
    }
  }

  async function handleSaveProfile() {
    setFeedback(null);

    if (!hasProfileChanges) {
      setFeedback({
        tone: "error",
        message: "Nenhuma alteracao foi feita no perfil.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          image: canChangePhoto ? imagePreview : undefined,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message:
            result?.message ?? "Nao foi possivel atualizar o seu perfil agora.",
        });
        return;
      }

      await update();

      setFeedback({
        tone: "success",
        message: result?.message ?? "Perfil atualizado com sucesso.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel atualizar o seu perfil agora.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleImageUpload() {
    if (!canChangePhoto) {
      setFeedback({
        tone: "error",
        message: "A troca de foto esta disponivel apenas para usuarios premium.",
      });
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      setFeedback({
        tone: "error",
        message: "Escolha uma foto com no maximo 800 KB.",
      });
      event.target.value = "";
      return;
    }

    const fileToDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
            return;
          }

          reject(new Error("INVALID_IMAGE"));
        };

        reader.onerror = () => reject(new Error("INVALID_IMAGE"));
        reader.readAsDataURL(file);
      });

    try {
      const dataUrl = await fileToDataUrl();
      setImagePreview(dataUrl);
      setFeedback(null);
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel carregar a imagem selecionada.",
      });
    } finally {
      event.target.value = "";
    }
  }

  async function handleExportData() {
    setFeedback(null);
    setIsExporting(true);

    try {
      const backupFile = await fetchBackupFile();

      downloadBackupFile(backupFile);

      setFeedback({
        tone: "success",
        message: "Backup baixado com sucesso em arquivo JSON.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getBackupActionErrorMessage(error, "baixar"),
      });
    } finally {
      setIsExporting(false);
    }
  }

  function handleRestoreBackupClick() {
    backupInputRef.current?.click();
  }

  async function handleSaveBackupSettings() {
    setFeedback(null);
    setIsSavingBackupSettings(true);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backupEmail,
          backupFrequency,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message:
            result?.message ??
            "Nao foi possivel salvar as preferencias de backup agora.",
        });
        return;
      }

      await update();

      setFeedback({
        tone: "success",
        message:
          result?.message ?? "Preferencias de backup salvas com sucesso.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel salvar as preferencias de backup agora.",
      });
    } finally {
      setIsSavingBackupSettings(false);
    }
  }

  async function handleSendBackupEmailNow() {
    setFeedback(null);
    setIsSendingBackupEmail(true);

    try {
      const response = await fetch("/api/account/backup-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backupEmail,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message:
            result?.message ??
            "Nao foi possivel enviar o backup por e-mail agora.",
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: result?.message ?? "Backup enviado por e-mail com sucesso.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel enviar o backup por e-mail agora.",
      });
    } finally {
      setIsSendingBackupEmail(false);
    }
  }

  async function handleShareBackup() {
    setFeedback(null);
    setIsSharingBackup(true);

    try {
      const backupFile = await fetchBackupFile();
      const supportsFileShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [backupFile] });

      if (!supportsFileShare) {
        downloadBackupFile(backupFile);
        setFeedback({
          tone: "success",
          message:
            "Seu navegador nao suporta compartilhamento direto. O backup foi baixado para voce.",
        });
        return;
      }

      await navigator.share({
        title: "Backup da conta",
        text: "Backup da conta da Calculadora do Produtor.",
        files: [backupFile],
      });

      setFeedback({
        tone: "success",
        message:
          "Backup preparado para compartilhamento. Escolha onde deseja salvar ou enviar.",
      });
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        setFeedback({
          tone: "error",
          message: "O compartilhamento foi cancelado antes de concluir.",
        });
      } else {
        try {
          const backupFile = await fetchBackupFile();
          downloadBackupFile(backupFile);
          setFeedback({
            tone: "success",
            message:
              "Esse navegador nao conseguiu abrir o compartilhamento. O backup foi baixado para voce.",
          });
        } catch {
        setFeedback({
          tone: "error",
          message: getBackupActionErrorMessage(error, "compartilhar"),
        });
        }
      }
    } finally {
      setIsSharingBackup(false);
    }
  }

  async function handleBackupFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFeedback(null);
    setIsRestoring(true);

    try {
      const fileContents = await file.text();
      const parsedPayload = JSON.parse(fileContents) as
        | {
            appData?: Partial<AppDataState>;
          }
        | Partial<AppDataState>;

      const rawAppData =
        parsedPayload &&
        typeof parsedPayload === "object" &&
        "appData" in parsedPayload &&
        parsedPayload.appData &&
        typeof parsedPayload.appData === "object"
          ? parsedPayload.appData
          : parsedPayload;

      if (!isAppDataBackupCandidate(rawAppData)) {
        setFeedback({
          tone: "error",
          message:
            "Esse arquivo nao parece ser um backup valido exportado pelo app.",
        });
        return;
      }

      const normalizedAppData = normalizeAppDataState(rawAppData);

      const confirmed = window.confirm(
        "Restaurar esse backup vai substituir os dados atuais da conta por esse arquivo. Deseja continuar?",
      );

      if (!confirmed) {
        return;
      }

      const response = await fetch("/api/app-data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedAppData),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message:
            result?.message ?? "Nao foi possivel restaurar o backup agora.",
        });
        return;
      }

      onRestoreAppData(normalizedAppData);
      setFeedback({
        tone: "success",
        message:
          "Backup restaurado com sucesso. Seus dados principais da conta foram atualizados.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message:
          "Nao foi possivel ler esse arquivo de backup. Confira se ele e um JSON valido exportado pelo app.",
      });
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  }

  async function handleDeleteAccount() {
    setFeedback(null);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmationText: deleteConfirmation.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message:
            result?.message ?? "Nao foi possivel excluir a sua conta agora.",
        });
        return;
      }

      clearLocalAppDataCache(user.id);
      await signOut({ callbackUrl: "/" });
    } catch {
      setFeedback({
        tone: "error",
        message: "Nao foi possivel excluir a sua conta agora.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function fetchBackupFile() {
    const response = await fetch("/api/account", {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | { message?: string }
      | null;

    if (!response.ok || !payload) {
      throw new Error(
        (payload as { message?: string } | null)?.message ??
          "Nao foi possivel preparar o backup agora.",
      );
    }

    const timestamp = new Date().toISOString().replaceAll(":", "-");
    const filename = `backup-calculadora-do-produtor-${timestamp}.json`;
    const fileContents = JSON.stringify(payload, null, 2);

    return new File([fileContents], filename, {
      type: "text/plain;charset=utf-8",
      lastModified: Date.now(),
    });
  }

  function downloadBackupFile(file: File) {
    const downloadUrl = window.URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = file.name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 1000);
  }

  function getBackupActionErrorMessage(error: unknown, action: "baixar" | "compartilhar") {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return action === "baixar"
      ? "Nao foi possivel exportar os dados agora."
      : "Nao foi possivel compartilhar o backup agora.";
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex min-h-full items-start justify-center py-3 sm:items-center sm:py-6">
        <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="shrink-0 bg-amber-600 px-5 py-4 text-white sm:px-6 sm:py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100 font-bold">
              Meu Perfil
            </p>
            <h2 className="text-2xl font-black mt-1">Gerencie sua conta</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 hover:bg-white/25 transition-colors p-2"
            aria-label="Fechar perfil"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
          <div className="flex flex-col md:flex-row gap-5 md:items-center">
            <div className="w-28 h-28 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {displayProfilePhoto ? (
                <img
                  src={displayProfilePhoto}
                  alt="Foto do perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound size={40} className="text-slate-400" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    isPremium
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Crown size={13} />
                  {isPremium ? "Plano Premium" : "Plano Gratis"}
                </span>

                {!isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Nome restante: {remainingNameChanges}/{FREE_NAME_CHANGE_LIMIT}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500">
                {isPremium
                  ? "Seu plano permite alterar nome e foto sempre que precisar."
                  : canChangeName
                    ? "Atencao: no modo gratis voce so podera alterar o nome uma unica vez. Depois disso, novas trocas exigem o plano premium."
                    : "Voce ja usou a unica troca de nome do plano gratis. A partir daqui, novas mudancas exigem o plano premium."}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={!canChangePhoto}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {canChangePhoto ? <Upload size={16} /> : <Lock size={16} />}
                  {canChangePhoto ? "Trocar foto" : "Foto so no Premium"}
                </button>

                {canChangePhoto && imagePreview && (
                  <button
                    type="button"
                    onClick={() => setImagePreview("")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ImagePlus size={16} />
                    Remover foto
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!canChangeName}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={user.email ?? ""}
                disabled
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500 bg-slate-50"
              />
            </div>
          </div>

          {!isPremium && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No plano gratis:
              {" "}
              voce pode trocar o nome uma unica vez e a foto fica bloqueada para
              usuarios premium.
            </div>
          )}

          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                  <Crown size={13} />
                  Premium
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isPremium ? "Sua assinatura Premium" : "Destrave o plano Premium"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {isPremium
                      ? user.founderOfferApplied
                        ? `Seu valor de lançamento ficou travado em ${founderPriceLabel}/mes.`
                        : `Sua conta esta no valor normal de ${standardPriceLabel}/mes.`
                      : `Oferta de lancamento: ${founderPriceLabel}/mes para os ${PREMIUM_FOUNDER_LIMIT} primeiros pagantes. Depois, ${standardPriceLabel}/mes.`}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-700">
                  <p>
                    Premium libera troca de foto, altera nome sem limite e
                    remove restricoes do plano gratis.
                  </p>
                  {isPremium && stripeSubscriptionStatusLabel && (
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status da assinatura: {stripeSubscriptionStatusLabel}
                    </p>
                  )}
                  {isPremium && !hasStripeBilling && (
                    <p className="mt-2 text-xs text-slate-500">
                      Essa conta premium foi liberada manualmente. O
                      gerenciamento automatico pela Stripe aparece nas novas
                      assinaturas pagas.
                    </p>
                  )}
                  {isPremium && user.stripeCurrentPeriodEnd && (
                    <p className="mt-1 text-xs text-slate-500">
                      Periodo atual ate{" "}
                      {new Date(user.stripeCurrentPeriodEnd).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 md:w-auto">
                {!isPremium && (
                  <button
                    type="button"
                    onClick={handleStartPremiumCheckout}
                    disabled={isStartingPremiumCheckout}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
                  >
                    <Crown size={16} />
                    {isStartingPremiumCheckout
                      ? "Abrindo checkout..."
                      : "Assinar Premium"}
                  </button>
                )}

                {hasStripeBilling && (
                  <button
                    type="button"
                    onClick={handleOpenBillingPortal}
                    disabled={isOpeningBillingPortal}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Crown size={16} />
                    {isOpeningBillingPortal
                      ? "Abrindo portal..."
                      : "Gerenciar assinatura"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Backup da conta
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Baixe um arquivo JSON com seu perfil, configuracoes, insumos,
                  produtos, vendas e orcamentos.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  A restauracao pelo arquivo reaplica os dados principais do app
                  na conta atual. Login, e-mail e senha nao sao trocados pelo
                  backup.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      E-mail para backup
                    </label>
                    <input
                      type="email"
                      value={backupEmail}
                      onChange={(event) => setBackupEmail(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Frequencia automatica
                    </label>
                    <select
                      value={backupFrequency}
                      onChange={(event) =>
                        setBackupFrequency(event.target.value as BackupFrequency)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    >
                      {Object.entries(BACKUP_FREQUENCY_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSaveBackupSettings}
                  disabled={isSavingBackupSettings}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload size={16} />
                  {isSavingBackupSettings ? "Salvando..." : "Salvar automacao"}
                </button>
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={16} />
                  {isExporting ? "Exportando..." : "Exportar backup"}
                </button>
                <button
                  type="button"
                  onClick={handleShareBackup}
                  disabled={isSharingBackup}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Share2 size={16} />
                  {isSharingBackup ? "Compartilhando..." : "Compartilhar backup"}
                </button>
                <button
                  type="button"
                  onClick={handleRestoreBackupClick}
                  disabled={isRestoring}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload size={16} />
                  {isRestoring ? "Restaurando..." : "Restaurar backup"}
                </button>
                {SHOW_EMAIL_BACKUP_ACTION && (
                  <button
                    type="button"
                    onClick={handleSendBackupEmailNow}
                    disabled={isSendingBackupEmail}
                    className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download size={16} />
                    {isSendingBackupEmail ? "Enviando..." : "Enviar por e-mail agora"}
                  </button>
                )}
              </div>
            </div>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleBackupFileChange}
            />
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-red-100 p-2 text-red-700">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-red-900">
                  Zona de perigo
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Ao excluir a conta, seu perfil e todos os dados sincronizados
                  serao removidos do sistema.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
                Digite EXCLUIR para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                placeholder="EXCLUIR"
              />
            </div>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={!canDeleteAccount || isDeleting}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={16} />
              {isDeleting ? "Excluindo conta..." : "Excluir minha conta"}
            </button>
          </div>

          {feedback && (
            <div
              ref={feedbackRef}
              className={`rounded-2xl px-4 py-3 text-sm ${
                feedback.tone === "error"
                  ? "bg-red-50 text-red-700 border border-red-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
