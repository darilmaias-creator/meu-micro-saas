"use client";

import { useEffect, useState } from "react";
import {
  BarChart2,
  Calculator,
  Crown,
  LogOut,
  Package,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { getProviders, signIn, signOut, useSession } from "next-auth/react";

import CalculatorTab from "./CalculatorTab";
import DashboardTab from "./DashboardTab";
import InventoryTab from "./InventoryTab";
import ProfileModal from "./ProfileModal";
import SalesTab from "./SalesTab";
import { useAppData } from "./hooks/useAppData";

type AuthMode = "login" | "register";
type AuthFeedback =
  | {
      tone: "error" | "success";
      message: string;
    }
  | null;

function mapAuthErrorMessage(errorCode: string | null) {
  switch (errorCode) {
    case "Configuration":
      return "A autenticacao do servidor ainda nao esta configurada corretamente.";
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

export default function MainApp() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authFeedback, setAuthFeedback] = useState<AuthFeedback>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  useEffect(() => {
    const errorMessage = mapAuthErrorMessage(searchParams.get("error"));

    if (errorMessage) {
      setAuthFeedback({
        tone: "error",
        message: errorMessage,
      });
    }
  }, [searchParams]);

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
        callbackUrl: "/",
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
    } catch {
      setAuthFeedback({
        tone: "error",
        message: "Nao foi possivel concluir a autenticacao agora.",
      });
    } finally {
      setIsSubmittingAuth(false);
    }
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
            Entre com e-mail e senha ou use sua conta Google para acessar o
            sistema e manter sua operacao em um unico lugar.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthFeedback(null);
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

          <div className="space-y-3 mb-6 text-left">
            {authMode === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
                className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder={authMode === "register" ? "Minimo de 6 caracteres" : "******"}
              />
            </div>

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
              type="button"
              onClick={handleCredentialsAuth}
              disabled={isSubmittingAuth}
              className="w-full bg-amber-600 text-white font-bold text-base py-3 px-4 rounded-xl hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmittingAuth
                ? "Processando..."
                : authMode === "register"
                  ? "Criar conta com e-mail"
                  : "Entrar com e-mail"}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase">Ou</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
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
        </div>
      </div>
    );
  }

  return <AuthenticatedApp key={session.user.id} session={session} />;
}

function AuthenticatedApp({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState("calculator");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const appData = useAppData(session.user.id);

  if (!appData.isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl font-bold text-amber-600 animate-pulse">Sincronizando banco de dados...</p>
      </div>
    );
  }

  const isPremium = session.user.isPremium;
  const displayHeaderAvatar = isPremium ? session.user?.image : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 relative overflow-x-hidden">
      <div className="bg-amber-600 text-white py-4 shadow-md sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Calculator size={28} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight drop-shadow-sm">Calculadora do Produtor</h1>
                <span className="text-xs text-amber-200 uppercase tracking-wider font-bold">Orçamentos claros. Clientes seguros. Negócios fechados.</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 text-sm bg-amber-700/30 px-3 py-1.5 rounded-full hover:bg-amber-700/45 transition-colors"
              >
                {displayHeaderAvatar ? (
                  <img
                    src={displayHeaderAvatar}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-amber-300 object-cover bg-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-amber-300 bg-white flex items-center justify-center">
                    <UserRound size={16} className="text-slate-400" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <span className="block font-bold text-amber-50 leading-tight">{session.user?.name?.split(" ")[0]}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-amber-100/90">
                    <Crown size={10} />
                    {isPremium ? "Premium" : "Gratis"}
                  </span>
                </div>
              </button>
              <button
                onClick={() => signOut()}
                className="bg-amber-700/50 hover:bg-amber-800 p-2 rounded-lg transition-colors text-amber-100 hover:text-white"
                title="Sair da Conta"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <div className="flex bg-amber-700/50 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
            <button onClick={() => setActiveTab("calculator")} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "calculator" ? "bg-white text-amber-700 shadow" : "text-amber-50 hover:bg-amber-700"}`}>
              <Calculator size={16} /> Ficha Técnica
            </button>
            <button onClick={() => setActiveTab("inventory")} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "inventory" ? "bg-white text-amber-700 shadow" : "text-amber-50 hover:bg-amber-700"}`}>
              <Package size={16} /> Estoque Físico
            </button>
            <button onClick={() => setActiveTab("sales")} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "sales" ? "bg-white text-amber-700 shadow" : "text-amber-50 hover:bg-amber-700"}`}>
              <ShoppingBag size={16} /> Nova Venda
            </button>
            <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "dashboard" ? "bg-white text-amber-700 shadow" : "text-amber-50 hover:bg-amber-700"}`}>
              <BarChart2 size={16} /> Visão Geral
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "inventory" && (
          <InventoryTab
            insumos={appData.insumos}
            setInsumos={appData.setInsumos}
            unit={appData.config.unit}
            isPremium={isPremium}
          />
        )}

        {activeTab === "calculator" && (
          <CalculatorTab appData={appData} isPremium={isPremium} />
        )}

        {activeTab === "sales" && (
          <SalesTab appData={appData} isPremium={isPremium} />
        )}

        {activeTab === "dashboard" && <DashboardTab appData={appData} />}
      </main>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
