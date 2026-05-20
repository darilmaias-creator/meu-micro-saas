"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CornerDownLeft,
  MessageCircleQuestion,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { getPathForActiveTab, type ActiveTab } from "@/lib/app-tabs";

type AppHelpAssistantProps = {
  activeTab: ActiveTab;
};

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  targetTab?: ActiveTab;
  targetTabs?: ActiveTab[];
};

type QuickAction = {
  id: string;
  label: string;
  prompt: string;
};

const TAB_LABELS: Record<ActiveTab, string> = {
  calculator: "Calcular Preço",
  inventory: "Meus Materiais",
  operationCosts: "Custos da Operação",
  sales: "Orçamentos e Vendas",
  dashboard: "Resumo",
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "start",
    label: "Como eu começo?",
    prompt: "como começo no app",
  },
  {
    id: "materials",
    label: "Meus Materiais",
    prompt: "me explica meus materiais",
  },
  {
    id: "pricing",
    label: "Calcular preço",
    prompt: "me explica calcular preço",
  },
  {
    id: "quotes",
    label: "Orçamentos e vendas",
    prompt: "me explica orçamentos",
  },
  {
    id: "all-tabs",
    label: "Explicar cada aba",
    prompt: "pode explicar cada um e como uso cada aba",
  },
];

type BotReply = {
  text: string;
  targetTab?: ActiveTab;
  targetTabs?: ActiveTab[];
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function buildBotReply(userPrompt: string, activeTab: ActiveTab) {
  void activeTab;
  const normalizedPrompt = normalizeText(userPrompt);

  if (normalizedPrompt.length <= 2) {
    return {
      text:
        "Pode escrever sua dúvida com mais detalhe? Exemplo: “como criar meu primeiro orçamento?”.",
      targetTab: "sales",
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["cada um", "cada uma"])) {
    return {
      text:
        "Perfeito, vamos por partes:\n1) Meus Materiais: aqui você cadastra seus insumos e preços.\n2) Calcular Preço: aqui monta a ficha técnica e vê o preço sugerido.\n3) Orçamentos e Vendas: aqui cria o orçamento do cliente e registra venda.\n4) Custos da Operação: aqui registra custos do negócio (aluguel, luz, etc.).\n5) Resumo: aqui vê uma visão geral para decidir melhor.\n\nSe quiser, te levo direto para a aba que você escolher.",
      targetTabs: [
        "inventory",
        "calculator",
        "sales",
        "operationCosts",
        "dashboard",
      ],
    } satisfies BotReply;
  }

  if (
    includesAny(normalizedPrompt, [
      "cada aba",
      "explica cada",
      "como uso cada",
      "me explica tudo",
      "como funciona o app",
      "explicar abas",
      "me explica as abas",
      "como usar as abas",
    ])
  ) {
    return {
      text:
        "Claro! Resumo simples:\n1) Meus Materiais: cadastre nome, preço e estoque dos insumos.\n2) Calcular Preço: monte a ficha técnica e veja custo + preço sugerido.\n3) Orçamentos e Vendas: gere proposta para cliente e registre venda.\n4) Custos da Operação: registre aluguel, luz e outros custos do negócio.\n5) Resumo: acompanhe a visão geral dos resultados.",
      targetTabs: [
        "inventory",
        "calculator",
        "sales",
        "operationCosts",
        "dashboard",
      ],
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["como comeco", "por onde comeco", "primeiro passo", "sou iniciante", "nao sei por onde comecar"])) {
    return {
      text:
        "Perfeito. Caminho mais fácil:\n1) Cadastre um insumo em Meus Materiais.\n2) Vá em Calcular Preço e monte a primeira ficha técnica.\n3) Vá em Orçamentos e Vendas para gerar a proposta.\n\nSe seguir essa ordem, você já consegue vender com preço mais seguro.",
      targetTab: "inventory" as const,
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["material", "estoque", "insumo"])) {
    return {
      text:
        "Na aba Meus Materiais você cadastra cada insumo com preço e estoque. Exemplo: fita, cola, tecido, embalagem. Esses dados entram automaticamente nos cálculos depois.",
      targetTab: "inventory" as const,
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["ficha", "preco", "precificar", "margem"])) {
    return {
      text:
        "Na aba Calcular Preço você monta a ficha técnica do produto, define sua margem e o app mostra o preço sugerido com base no custo real.",
      targetTab: "calculator" as const,
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["orcamento", "venda", "cliente"])) {
    return {
      text:
        "Em Orçamentos e Vendas você cria propostas para clientes, registra vendas e mantém o histórico organizado. É a parte prática para fechar pedido.",
      targetTab: "sales" as const,
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["custo", "fixo", "operacao"])) {
    return {
      text:
        "Na aba Custos da Operação você registra custos fixos e variáveis do negócio para ter visão do custo real mensal da sua operação.",
      targetTab: "operationCosts" as const,
    } satisfies BotReply;
  }

  if (includesAny(normalizedPrompt, ["resumo", "dashboard", "relatorio"])) {
    return {
      text:
        "No Resumo você acompanha a visão geral do período: resultados, sinais de atenção e dados para decidir mais rápido.",
      targetTab: "dashboard" as const,
    } satisfies BotReply;
  }

  return {
    text:
      "Entendi sua dúvida. Posso te explicar cada aba em linguagem simples ou te levar direto para a área certa.\n\nSe quiser o passo a passo completo, clique em “Explicar cada aba”.",
    targetTabs: ["inventory", "calculator", "sales", "operationCosts", "dashboard"],
  } satisfies BotReply;
}

function createBotMessage(
  text: string,
  options?: { targetTab?: ActiveTab; targetTabs?: ActiveTab[] },
): ChatMessage {
  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "bot",
    text,
    targetTab: options?.targetTab,
    targetTabs: options?.targetTabs,
  };
}

function createUserMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: "user",
    text,
  };
}

export default function AppHelpAssistant({ activeTab }: AppHelpAssistantProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bot-initial",
      role: "bot",
      text: "Oi! Sou sua ajuda rápida. Me pergunte sobre qualquer aba do app e eu te levo para a área certa.",
    },
  ]);

  const chatSummary = useMemo(
    () => `Você está em ${TAB_LABELS[activeTab]}.`,
    [activeTab],
  );

  function submitPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      return;
    }

    const userMessage = createUserMessage(trimmedPrompt);
    const botReply = buildBotReply(trimmedPrompt, activeTab);

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      createBotMessage(botReply.text, {
        targetTab: botReply.targetTab,
        targetTabs: botReply.targetTabs,
      }),
    ]);
    setInputValue("");
  }

  function goToTab(tab: ActiveTab) {
    router.push(getPathForActiveTab(tab));
    setIsOpen(false);
  }

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[45] md:bottom-6 md:right-6">
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                Ajuda do app
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                Assistente de navegação
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">{chatSummary}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Fechar assistente"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "bot"
                    ? "border border-amber-100 bg-amber-50/70 text-slate-800"
                    : "ml-7 bg-slate-900 text-white"
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>

                {message.role === "bot" && message.targetTab && (
                  <button
                    type="button"
                    onClick={() => goToTab(message.targetTab as ActiveTab)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                  >
                    Ir para {TAB_LABELS[message.targetTab]}
                    <ArrowRight size={12} />
                  </button>
                )}

                {message.role === "bot" &&
                  !message.targetTab &&
                  message.targetTabs &&
                  message.targetTabs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.targetTabs.map((tabId) => (
                        <button
                          key={`${message.id}-${tabId}`}
                          type="button"
                          onClick={() => goToTab(tabId)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-1 text-[11px] font-bold text-white transition-colors hover:bg-amber-700"
                        >
                          {TAB_LABELS[tabId]}
                          <ArrowRight size={11} />
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((quickAction) => (
                <button
                  key={quickAction.id}
                  type="button"
                  onClick={() => submitPrompt(quickAction.prompt)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                >
                  {quickAction.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitPrompt(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ex: Como faço meu primeiro orçamento?"
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-black outline-none transition-colors focus:border-amber-500"
              />
              <button
                type="submit"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white transition-colors hover:bg-amber-700"
                aria-label="Enviar dúvida"
              >
                <Send size={16} />
              </button>
            </form>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
              <CornerDownLeft size={12} />
              Versão de teste inicial para orientar por aba.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow-lg transition-colors hover:bg-amber-50"
      >
        <Sparkles size={14} />
        Ajuda
        <MessageCircleQuestion size={16} />
      </button>
    </div>
  );
}
