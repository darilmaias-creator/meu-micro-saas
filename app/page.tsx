"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Calculator } from "lucide-react";
import { getProviders, signIn, useSession } from "next-auth/react";

import AuthenticatedAppShell from "./AuthenticatedAppShell";
import type { ActiveTab } from "../lib/app-tabs";
import { getPathForActiveTab, resolveActiveTabFromParam } from "../lib/app-tabs";

type AuthMode = "login" | "register" | "forgotPassword";
type AuthFeedback =
  | {
      tone: "error" | "success";
      message: string;
    }
  | null;

const PASSWORD_RECOVERY_AVAILABLE = false;

function mapAuthErrorMessage(errorCode: string | null) {
  switch (errorCode) {
    case "Configuration":
      return "A autenticacao do servidor ainda nao esta configurada corretamente.";
    case "Storage":
      return "Nao foi possivel acessar os dados de autenticacao no banco.";
    case "AccessDenied":
      return "O login foi bloqueado pela configuracao atual.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
      return "Nao foi possivel entrar com o Google agora.";
    case "Callback":
      return "A autenticacao falhou no retorno do servidor.";
    case "CredentialsSignin":
      return "E-mail ou senha invalidos.";
    default:
      return null;
  }
}

function mapAuthStatusMessage(searchParams: URLSearchParams): AuthFeedback {
  const errorMessage = mapAuthErrorMessage(searchParams.get("error"));

  if (errorMessage) {
    return {
      tone: "error",
      message: errorMessage,
    };
  }

  if (searchParams.get("reset") === "password-updated") {
    return {
      tone: "success",
      message: "Senha redefinida com sucesso. Agora entre com a sua nova senha.",
    };
  }

  if (searchParams.get("auth") === "required") {
    return {
      tone: "error",
      message: "Entre na sua conta para acessar essa area protegida.",
    };
  }

  return null;
}

function resolvePostLoginPath(searchParams: URLSearchParams) {
  const nextPath = searchParams.get("next");

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    if (searchParams.has("tab")) {
      return getPathForActiveTab(resolveActiveTabFromParam(searchParams.get("tab")));
    }

    return "/";
  }

  return nextPath;
}

export default function MainApp() {
  const { data: session, status } = useSession();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authFeedback, setAuthFeedback] = useState<AuthFeedback>(null);
  const [initialAuthenticatedTab, setInitialAuthenticatedTab] =
    useState<ActiveTab>("calculator");
  const [postLoginPath, setPostLoginPath] = useState("/");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    setAuthFeedback(mapAuthStatusMessage(searchParams));
    setPostLoginPath(resolvePostLoginPath(searchParams));
    setInitialAuthenticatedTab(resolveActiveTabFromParam(searchParams.get("tab")));

    if (searchParams.get("auth") === "required") {
      setAuthMode("login");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProviders() {
      try {
        const providers = await getProviders();

        if (!isMounted) {
          return;
        }

        setIsGoogleEnabled(Boolean(providers?.google));
      } catch {
        if (!isMounted) {
          return;
        }

        setIsGoogleEnabled(false);
      } finally {
        if (isMounted) {
          setProvidersLoaded(true);
        }
      }
    }

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCredentialsAuth() {
    setAuthFeedback(null);
    setIsSubmittingAuth(true);

    try {
      if (authMode === "forgotPassword") {
        const forgotPasswordResponse = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        });

        const forgotPasswordResult =
          (await forgotPasswordResponse.json().catch(() => null)) as
            | { message?: string }
            | null;

        if (!forgotPasswordResponse.ok) {
          setAuthFeedback({
            tone: "error",
            message:
              forgotPasswordResult?.message ??
              "Nao foi possivel iniciar a recuperacao de senha agora.",
          });
          return;
        }

        setAuthFeedback({
          tone: "success",
          message:
            forgotPasswordResult?.message ??
            "Se existir uma conta com este e-mail, enviaremos um link de recuperacao em instantes.",
        });
        return;
      }

      if (authMode === "register") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        });

        const registerResult = (await registerResponse.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!registerResponse.ok) {
          setAuthFeedback({
            tone: "error",
            message: registerResult?.message ?? "Nao foi possivel criar sua conta agora.",
          });
          return;
        }

        setAuthFeedback({
          tone: "success",
          message: "Conta criada com sucesso. Entrando na sua area...",
        });
      }

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: postLoginPath,
      });

      if (loginResult?.error) {
        setAuthFeedback({
          tone: "error",
          message:
            authMode === "register" &&
            loginResult.error === "CredentialsSignin"
              ? "Sua conta foi criada, mas o login automatico falhou. Tente entrar novamente."
              : mapAuthErrorMessage(loginResult.error) ??
                "Nao foi possivel concluir a autenticacao agora.",
        });
        return;
      }

      setName("");
      setPassword("");

      if (postLoginPath !== "/") {
        window.location.assign(loginResult?.url ?? postLoginPath);
      }
    } catch {
      setAuthFeedback({
        tone: "error",
        message: "Nao foi possivel concluir a autenticacao agora.",
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleCredentialsAuth();
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-amber-600 animate-pulse">Carregando aplicação...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="bg-amber-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Calculator size={48} className="text-amber-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3">Calculadora do Produtor</h1>
          <p className="text-slate-500 mb-6 text-sm">
            {authMode === "forgotPassword"
              ? "Informe o e-mail da conta para receber o link de recuperacao."
              : "Entre com e-mail e senha ou use sua conta Google para acessar o sistema e manter sua operacao em um unico lugar."}
          </p>

          {!PASSWORD_RECOVERY_AVAILABLE && authMode === "register" && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              <p className="font-bold mb-1">Aviso importante sobre senha</p>
              <p>
                No momento, a recuperacao de senha por e-mail ainda nao esta
                liberada para todos os usuarios.
              </p>
              <p className="mt-1">
                Para ter mais seguranca e evitar bloqueio de acesso, recomendamos
                criar a conta usando o Google sempre que possivel.
              </p>
              <p className="mt-1 text-amber-800">
                A recuperacao de senha sera liberada em novas atualizacoes.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthFeedback(null);
                setPassword("");
              }}
              className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${
                authMode === "login"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setAuthFeedback(null);
                setPassword("");
              }}
              className={`rounded-xl py-2.5 text-sm font-bold transition-colors ${
                authMode === "register"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form
            className="space-y-3 mb-6 text-left"
            onSubmit={handleCredentialsSubmit}
          >
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="seu@email.com"
              />
            </div>
            {authMode !== "forgotPassword" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder={authMode === "register" ? "Minimo de 6 caracteres" : "******"}
                />
              </div>
            )}

            {authFeedback && (
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  authFeedback.tone === "error"
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}
              >
                {authFeedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full bg-amber-600 text-white font-bold text-base py-3 px-4 rounded-xl hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmittingAuth
                ? "Processando..."
                : authMode === "register"
                  ? "Criar conta com e-mail"
                  : authMode === "forgotPassword"
                    ? "Enviar link de recuperacao"
                    : "Entrar com e-mail"}
            </button>

            {authMode === "login" && PASSWORD_RECOVERY_AVAILABLE && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("forgotPassword");
                  setAuthFeedback(null);
                  setPassword("");
                }}
                className="w-full text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors"
              >
                Esqueci minha senha
              </button>
            )}

            {authMode === "forgotPassword" && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthFeedback(null);
                }}
                className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Voltar para entrar
              </button>
            )}
          </form>

          {authMode !== "forgotPassword" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-xs font-bold text-slate-400 uppercase">Ou</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: postLoginPath })}
                disabled={!isGoogleEnabled}
                className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-base py-3 px-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com o Google
              </button>

              {providersLoaded && !isGoogleEnabled && (
                <p className="text-xs text-slate-400 mt-3">
                  O login com Google esta indisponivel agora. Confira
                  {" "}
                  <code>GOOGLE_CLIENT_ID</code>
                  {" "}
                  e
                  {" "}
                  <code>GOOGLE_CLIENT_SECRET</code>
                  {" "}
                  no arquivo de ambiente.
                </p>
              )}
            </>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/politicas/cancelamento-e-reembolso"
              className="text-xs font-bold text-slate-500 transition-colors hover:text-amber-700"
            >
              Politica de cancelamento e reembolso
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedAppShell
      key={`${session.user.id}:${initialAuthenticatedTab}`}
      session={session}
      initialTab={initialAuthenticatedTab}
    />
  );
}
