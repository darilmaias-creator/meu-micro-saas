import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import type { AssistantContext } from "@/lib/assistant-context";
import type { ActiveTab } from "@/lib/app-tabs";
import {
  detectAssistantIntent,
  type AssistantIntent,
} from "@/lib/assistant-intents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type GeminiAssistantPayload = {
  activeTab?: ActiveTab;
  assistantContext?: AssistantContext;
  conversationHistory?: Array<{
    role?: "bot" | "user";
    text?: string;
  }>;
  message?: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const TAB_LABELS: Record<ActiveTab, string> = {
  calculator: "Calcular Preço",
  dashboard: "Resumo",
  inventory: "Meus Materiais",
  operationCosts: "Custos da Operação",
  sales: "Orçamentos e Vendas",
};

const INTENT_TARGETS: Partial<
  Record<
    AssistantIntent,
    {
      targetTab?: ActiveTab;
      targetTabs?: ActiveTab[];
      targetHref?: string;
      targetLabel?: string;
    }
  >
> = {
  HELP_ADD_MATERIALS: { targetTabs: ["inventory", "calculator"] },
  HELP_BEST_PRACTICES: { targetTabs: ["dashboard", "calculator"] },
  HELP_CALCULATE_COST: { targetTab: "calculator" },
  HELP_GETTING_STARTED: { targetTabs: ["inventory", "calculator"] },
  HELP_OPTIMIZE_PRICE: { targetTabs: ["dashboard", "calculator"] },
  HELP_PREMIUM_FEATURES: {
    targetHref: "/premium",
    targetLabel: "Ver Premium",
  },
  HELP_SUGGEST_PRICE: { targetTab: "calculator" },
  HELP_TROUBLESHOOT: { targetTabs: ["calculator", "inventory"] },
};

function sanitizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function sanitizeHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (message): message is { role: "bot" | "user"; text: string } =>
        Boolean(message) &&
        typeof message === "object" &&
        ((message as { role?: unknown }).role === "bot" ||
          (message as { role?: unknown }).role === "user") &&
        typeof (message as { text?: unknown }).text === "string",
    )
    .map((message) => ({
      role: message.role,
      text: message.text.slice(0, 800),
    }))
    .slice(-12);
}

function sanitizeAssistantContext(
  value: unknown,
  sessionUserId: string,
): AssistantContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const context = value as AssistantContext;

  if (context.user?.id !== sessionUserId) {
    return null;
  }

  return {
    appData: {
      insumos: Array.isArray(context.appData?.insumos)
        ? context.appData.insumos.slice(0, 20)
        : [],
      quotes: Array.isArray(context.appData?.quotes)
        ? context.appData.quotes.slice(0, 20)
        : [],
      sales: Array.isArray(context.appData?.sales)
        ? context.appData.sales.slice(0, 20)
        : [],
      savedProducts: Array.isArray(context.appData?.savedProducts)
        ? context.appData.savedProducts.slice(0, 20)
        : [],
    },
    systemPrompt: sanitizeText(context.systemPrompt),
    user: {
      id: sessionUserId,
      isPremium: Boolean(context.user?.isPremium),
      name: sanitizeText(context.user?.name) || null,
      sector: sanitizeText(context.user?.sector) || null,
    },
  };
}

function extractGeneratedText(payload: unknown) {
  const responsePayload = payload as GeminiGenerateContentResponse | null;
  const candidate = Array.isArray(responsePayload?.candidates)
    ? responsePayload.candidates[0]
    : null;

  return candidate?.content?.parts?.[0]?.text?.trim() ?? "";
}

function buildAssistantPrompt({
  activeTab,
  assistantContext,
  conversationHistory,
  message,
}: {
  activeTab: ActiveTab;
  assistantContext: AssistantContext;
  conversationHistory: ReturnType<typeof sanitizeHistory>;
  message: string;
}) {
  const appDataSummary = {
    insumos: assistantContext.appData.insumos,
    orcamentos: assistantContext.appData.quotes,
    produtosSalvos: assistantContext.appData.savedProducts,
    vendas: assistantContext.appData.sales,
  };

  return [
    assistantContext.systemPrompt,
    "",
    "Contexto operacional:",
    `- Aba atual: ${TAB_LABELS[activeTab]}`,
    `- Usuario: ${assistantContext.user.name ?? "sem nome informado"}`,
    `- Plano: ${assistantContext.user.isPremium ? "Premium" : "Gratis"}`,
    `- Setor: ${assistantContext.user.sector ?? "nao informado"}`,
    "",
    "Dados reais do usuario em JSON:",
    JSON.stringify(appDataSummary, null, 2),
    "",
    "Historico recente da conversa em JSON:",
    JSON.stringify(conversationHistory, null, 2),
    "",
    "Regras obrigatorias:",
    "- Responda sempre em portugues do Brasil.",
    "- Seja pratico, curto e acolhedor.",
    "- Use os dados reais do usuario quando eles ajudarem.",
    "- Nao invente produtos, insumos, vendas, margens ou orcamentos.",
    "- Se nao houver dados suficientes, diga isso e peca a proxima informacao.",
    "- Nao prometa resultado financeiro garantido.",
    "- Para valores exatos, oriente o usuario a preencher a calculadora do app.",
    "- Use no maximo 220 palavras.",
    "",
    `Pergunta atual do usuario: ${message}`,
  ].join("\n");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para usar o assistente IA." },
      { status: 401 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "O Gemini ainda nao esta configurado no servidor. Usando fallback local.",
      },
      { status: 503 },
    );
  }

  let body: GeminiAssistantPayload;

  try {
    body = (await request.json()) as GeminiAssistantPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler a mensagem enviada." },
      { status: 400 },
    );
  }

  const message = sanitizeText(body.message);

  if (!message) {
    return NextResponse.json(
      { message: "Digite uma pergunta para o assistente responder." },
      { status: 400 },
    );
  }

  const assistantContext = sanitizeAssistantContext(
    body.assistantContext,
    session.user.id,
  );

  if (!assistantContext) {
    return NextResponse.json(
      { message: "Nao foi possivel validar o contexto do assistente." },
      { status: 400 },
    );
  }

  const activeTab =
    body.activeTab && body.activeTab in TAB_LABELS ? body.activeTab : "calculator";
  const conversationHistory = sanitizeHistory(body.conversationHistory);
  const prompt = buildAssistantPrompt({
    activeTab,
    assistantContext,
    conversationHistory,
    message,
  });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );

    const payload =
      (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            payload?.error?.message ??
            "Nao foi possivel gerar uma resposta com Gemini agora.",
        },
        { status: response.status },
      );
    }

    const generatedText = extractGeneratedText(payload);

    if (!generatedText) {
      return NextResponse.json(
        {
          message:
            "O Gemini respondeu, mas nao retornou um texto valido para o chat.",
        },
        { status: 502 },
      );
    }

    const intent = detectAssistantIntent(message);

    return NextResponse.json({
      intent,
      response: generatedText,
      ...(intent ? INTENT_TARGETS[intent] : {}),
    });
  } catch (error) {
    console.error("[ai-assistant:gemini]", error);

    return NextResponse.json(
      { message: "Nao foi possivel chamar o Gemini agora." },
      { status: 500 },
    );
  }
}
