"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, ImagePlus, Lock, Upload, UserRound, X } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  FREE_NAME_CHANGE_LIMIT,
  MAX_PROFILE_IMAGE_SIZE_BYTES,
} from "@/lib/auth/profile-rules";

type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ProfileFeedback =
  | {
      tone: "error" | "success";
      message: string;
    }
  | null;

export default function ProfileModal({
  isOpen,
  onClose,
}: ProfileModalProps) {
  const { data: session, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [feedback, setFeedback] = useState<ProfileFeedback>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !session?.user) {
      return;
    }

    setName(session.user.name ?? "");
    setImagePreview(session.user.image ?? "");
    setFeedback(null);
  }, [isOpen, session]);

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

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-center justify-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-amber-600 text-white px-6 py-5 flex items-start justify-between gap-4">
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

        <div className="p-6 md:p-7 space-y-6">
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

          {feedback && (
            <div
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
  );
}
