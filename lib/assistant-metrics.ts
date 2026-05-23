export interface AgentMetrics {
  messagesPerSession: number;
  averageSessionDuration: number;
  userRetention: number;
  problemsSolved: number;
  productsCreatedAfterHelp: number;
  priceOptimizationAttempts: number;
  userSatisfactionScore: number;
  helpfulnessRating: number;
  trialSignupsFromAgent: number;
  premiumConversionsFromAgent: number;
}

export type AgentMetricsState = {
  activeDays: string[];
  helpfulnessNegative: number;
  helpfulnessPositive: number;
  lastProductCount: number;
  premiumConversionsFromAgent: number;
  priceOptimizationAttempts: number;
  problemsSolved: number;
  productsCreatedAfterHelp: number;
  sessions: number;
  totalMessages: number;
  totalSessionDurationMs: number;
  trialSignupsFromAgent: number;
};

export function createDefaultAgentMetricsState(
  productCount = 0,
): AgentMetricsState {
  return {
    activeDays: [],
    helpfulnessNegative: 0,
    helpfulnessPositive: 0,
    lastProductCount: productCount,
    premiumConversionsFromAgent: 0,
    priceOptimizationAttempts: 0,
    problemsSolved: 0,
    productsCreatedAfterHelp: 0,
    sessions: 0,
    totalMessages: 0,
    totalSessionDurationMs: 0,
    trialSignupsFromAgent: 0,
  };
}

export function getAgentMetricsStorageKey(userId: string) {
  return `calcula-artesao:assistant-metrics:${userId}`;
}

export function normalizeAgentMetricsState(
  value: unknown,
  fallback: AgentMetricsState,
): AgentMetricsState {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<AgentMetricsState>;

  return {
    activeDays: Array.isArray(candidate.activeDays)
      ? candidate.activeDays
          .filter((activeDay): activeDay is string => typeof activeDay === "string")
          .slice(-30)
      : fallback.activeDays,
    helpfulnessNegative: getSafeNumber(candidate.helpfulnessNegative),
    helpfulnessPositive: getSafeNumber(candidate.helpfulnessPositive),
    lastProductCount:
      getSafeNumber(candidate.lastProductCount) || fallback.lastProductCount,
    premiumConversionsFromAgent: getSafeNumber(
      candidate.premiumConversionsFromAgent,
    ),
    priceOptimizationAttempts: getSafeNumber(candidate.priceOptimizationAttempts),
    problemsSolved: getSafeNumber(candidate.problemsSolved),
    productsCreatedAfterHelp: getSafeNumber(candidate.productsCreatedAfterHelp),
    sessions: getSafeNumber(candidate.sessions),
    totalMessages: getSafeNumber(candidate.totalMessages),
    totalSessionDurationMs: getSafeNumber(candidate.totalSessionDurationMs),
    trialSignupsFromAgent: getSafeNumber(candidate.trialSignupsFromAgent),
  };
}

function getSafeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function markAgentSessionStarted(
  state: AgentMetricsState,
  now = new Date(),
) {
  const activeDay = now.toISOString().slice(0, 10);

  return {
    ...state,
    activeDays: Array.from(new Set([...state.activeDays, activeDay])).slice(-30),
    sessions: state.sessions + 1,
  };
}

export function addAgentSessionDuration(
  state: AgentMetricsState,
  durationMs: number,
) {
  return {
    ...state,
    totalSessionDurationMs:
      state.totalSessionDurationMs + Math.max(0, Math.round(durationMs)),
  };
}

export function calculateAgentMetrics(state: AgentMetricsState): AgentMetrics {
  const totalRatings = state.helpfulnessPositive + state.helpfulnessNegative;
  const helpfulnessRating =
    totalRatings > 0 ? (state.helpfulnessPositive / totalRatings) * 100 : 0;
  const userSatisfactionScore =
    totalRatings > 0 ? 1 + (state.helpfulnessPositive / totalRatings) * 4 : 0;

  return {
    messagesPerSession:
      state.sessions > 0 ? state.totalMessages / state.sessions : 0,
    averageSessionDuration:
      state.sessions > 0
        ? state.totalSessionDurationMs / state.sessions / 60_000
        : 0,
    userRetention: state.sessions > 1 || state.activeDays.length > 1 ? 100 : 0,
    problemsSolved: state.problemsSolved,
    productsCreatedAfterHelp: state.productsCreatedAfterHelp,
    priceOptimizationAttempts: state.priceOptimizationAttempts,
    userSatisfactionScore,
    helpfulnessRating,
    trialSignupsFromAgent: state.trialSignupsFromAgent,
    premiumConversionsFromAgent: state.premiumConversionsFromAgent,
  };
}

export function formatAgentMetricsDashboard(metrics: AgentMetrics) {
  return `📊 Métricas do Agente IA

Engajamento:
- Mensagens por sessão: ${metrics.messagesPerSession.toFixed(1)}
- Duração média: ${metrics.averageSessionDuration.toFixed(1)} min
- Retenção: ${metrics.userRetention.toFixed(0)}%

Efetividade:
- Problemas resolvidos: ${metrics.problemsSolved}
- Produtos criados após ajuda: ${metrics.productsCreatedAfterHelp}
- Otimizações: ${metrics.priceOptimizationAttempts}

Satisfação:
- Score: ${metrics.userSatisfactionScore.toFixed(1)}/5
- Útil: ${metrics.helpfulnessRating.toFixed(0)}%

Conversão:
- Trials: ${metrics.trialSignupsFromAgent}
- Premium: ${metrics.premiumConversionsFromAgent}`;
}
