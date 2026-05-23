import type { ActiveTab } from "@/lib/app-tabs";
import type { AssistantContext } from "@/lib/assistant-context";

export type AssistantAutoTriggerId =
  | "first_access"
  | "first_product_created"
  | "free_insumo_limit_reached"
  | "low_margin_detected"
  | "inactive_7_days";

export type AssistantAutoTrigger = {
  id: AssistantAutoTriggerId;
  targetHref?: string;
  targetLabel?: string;
  targetTab?: ActiveTab;
  targetTabs?: ActiveTab[];
  text: string;
};

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export function getAssistantShownTriggersStorageKey(userId: string) {
  return `calcula-artesao:assistant-shown-triggers:${userId}`;
}

export function getAssistantLastSeenStorageKey(userId: string) {
  return `calcula-artesao:assistant-last-seen:${userId}`;
}

export function readShownAssistantTriggers(value: string | null) {
  if (!value) {
    return new Set<AssistantAutoTriggerId>();
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (!Array.isArray(parsedValue)) {
      return new Set<AssistantAutoTriggerId>();
    }

    return new Set(
      parsedValue.filter((item): item is AssistantAutoTriggerId =>
        [
          "first_access",
          "first_product_created",
          "free_insumo_limit_reached",
          "low_margin_detected",
          "inactive_7_days",
        ].includes(String(item)),
      ),
    );
  } catch {
    return new Set<AssistantAutoTriggerId>();
  }
}

export function serializeShownAssistantTriggers(
  triggers: Set<AssistantAutoTriggerId>,
) {
  return JSON.stringify([...triggers]);
}

function hasBeenShown(
  shownTriggers: Set<AssistantAutoTriggerId>,
  triggerId: AssistantAutoTriggerId,
) {
  return shownTriggers.has(triggerId);
}

function getDaysSinceLastSeen(lastSeenAt: string | null, now: Date) {
  if (!lastSeenAt) {
    return null;
  }

  const lastSeenDate = new Date(lastSeenAt);
  const elapsedMs = now.getTime() - lastSeenDate.getTime();

  if (!Number.isFinite(elapsedMs) || elapsedMs < SEVEN_DAYS_IN_MS) {
    return null;
  }

  return Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
}

export function getNextAssistantAutoTrigger(input: {
  assistantContext: AssistantContext;
  hasConversationStarted: boolean;
  lastSeenAt: string | null;
  shownTriggers: Set<AssistantAutoTriggerId>;
}) {
  const { assistantContext, hasConversationStarted, lastSeenAt, shownTriggers } =
    input;
  const { appData, user } = assistantContext;
  const inactiveDays = getDaysSinceLastSeen(lastSeenAt, new Date());
  const lowMarginProducts = appData.savedProducts.filter(
    (product) => product.margin !== null && product.margin < 30,
  );

  if (
    inactiveDays !== null &&
    !hasBeenShown(shownTriggers, "inactive_7_days")
  ) {
    return {
      id: "inactive_7_days",
      text:
        "Oi! Sentimos sua falta! 👋\n\nQuer que eu te ajude a criar um novo produto?",
      targetTab: "calculator",
    } satisfies AssistantAutoTrigger;
  }

  if (!hasConversationStarted && !hasBeenShown(shownTriggers, "first_access")) {
    return {
      id: "first_access",
      text:
        "Olá! Bem-vindo ao Calcula Artesão! 👋\n\nSou seu assistente de IA. Vou ajudar você a calcular o preço certo.\n\nQual é o seu tipo de artesanato?",
      targetTabs: ["inventory", "calculator"],
    } satisfies AssistantAutoTrigger;
  }

  if (
    appData.savedProducts.length === 1 &&
    !hasBeenShown(shownTriggers, "first_product_created")
  ) {
    return {
      id: "first_product_created",
      text:
        "Parabéns! 🎉 Você criou seu primeiro produto!\n\nQuer que eu te ajude a otimizar o preço?",
      targetTabs: ["dashboard", "calculator"],
    } satisfies AssistantAutoTrigger;
  }

  if (
    !user.isPremium &&
    appData.insumos.length >= 20 &&
    !hasBeenShown(shownTriggers, "free_insumo_limit_reached")
  ) {
    return {
      id: "free_insumo_limit_reached",
      text:
        "Vejo que você tem 20 insumos (limite do plano grátis).\n\nQuer testar Premium para ilimitado?",
      targetHref: "/premium",
      targetLabel: "Testar Premium",
    } satisfies AssistantAutoTrigger;
  }

  if (
    lowMarginProducts.length > 0 &&
    !hasBeenShown(shownTriggers, "low_margin_detected")
  ) {
    return {
      id: "low_margin_detected",
      text:
        "Notei que alguns dos seus produtos têm margem baixa (< 30%).\n\nQuer que eu te ajude a otimizar?",
      targetTabs: ["dashboard", "calculator"],
    } satisfies AssistantAutoTrigger;
  }

  return null;
}
