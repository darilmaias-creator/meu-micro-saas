export type ConversationMessage = {
  role: "bot" | "user";
  text: string;
};

export interface ConversationContext {
  userId: string;
  sector: string;
  isPremium: boolean;
  messagesCount: number;
  lastProductCreated?: string;
  lastProblem?: string;
  suggestedMargin?: number;
  conversationHistory: ConversationMessage[];
}

type ConversationContextInput = Pick<
  ConversationContext,
  "isPremium" | "sector" | "userId"
>;

export function createConversationContext({
  isPremium,
  sector,
  userId,
}: ConversationContextInput): ConversationContext {
  return {
    userId,
    sector,
    isPremium,
    messagesCount: 0,
    conversationHistory: [],
  };
}

export function getConversationContextStorageKey(userId: string) {
  return `calcula-artesao:assistant-context:${userId}`;
}

export function normalizeConversationContext(
  value: unknown,
  fallback: ConversationContext,
): ConversationContext {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<ConversationContext>;
  const conversationHistory = Array.isArray(candidate.conversationHistory)
    ? candidate.conversationHistory
        .filter(
          (message): message is ConversationMessage =>
            Boolean(message) &&
            typeof message === "object" &&
            (message as ConversationMessage).role !== undefined &&
            ["bot", "user"].includes((message as ConversationMessage).role) &&
            typeof (message as ConversationMessage).text === "string",
        )
        .slice(-20)
    : [];

  return {
    ...fallback,
    messagesCount:
      typeof candidate.messagesCount === "number" &&
      Number.isFinite(candidate.messagesCount)
        ? candidate.messagesCount
        : fallback.messagesCount,
    lastProductCreated:
      typeof candidate.lastProductCreated === "string"
        ? candidate.lastProductCreated
        : undefined,
    lastProblem:
      typeof candidate.lastProblem === "string" ? candidate.lastProblem : undefined,
    suggestedMargin:
      typeof candidate.suggestedMargin === "number" &&
      Number.isFinite(candidate.suggestedMargin)
        ? candidate.suggestedMargin
        : undefined,
    conversationHistory,
  };
}

export function appendConversationMessages(
  context: ConversationContext,
  messages: ConversationMessage[],
) {
  return {
    ...context,
    messagesCount: context.messagesCount + messages.length,
    conversationHistory: [
      ...context.conversationHistory,
      ...messages,
    ].slice(-20),
  };
}
