// ─── In-process OpenAI usage tracker ──────────────────────────────
// Accumulates token usage from each successful AI call in memory.
// Data is lost on server restart — this is intentional (no persistence needed).

export type CallType = "narration" | "epilogue";

export interface CallRecord {
  timestamp: number; // Unix ms
  type: CallType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Estimated cost in USD */
  costUsd: number;
}

// gpt-4o-mini pricing (per 1M tokens)
const PRICE_INPUT_PER_M = 0.15;
const PRICE_OUTPUT_PER_M = 0.6;

export function estimateCost(
  promptTokens: number,
  completionTokens: number,
): number {
  return (
    (promptTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (completionTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

// ─── Mutable store (module-level singleton) ─────────────────────────

const records: CallRecord[] = [];

export function recordUsage(
  type: CallType,
  model: string,
  promptTokens: number,
  completionTokens: number,
): void {
  records.push({
    timestamp: Date.now(),
    type,
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    costUsd: estimateCost(promptTokens, completionTokens),
  });
}

// ─── Aggregated stats ───────────────────────────────────────────────

export interface TypeStats {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface UsageStats {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  byType: Record<CallType, TypeStats>;
  /** Last 50 calls, newest first */
  recentCalls: CallRecord[];
  /** Unix ms of first tracked call, or null */
  trackingSince: number | null;
}

export function getUsageStats(): UsageStats {
  const empty = (): TypeStats => ({
    calls: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  });

  const byType: Record<CallType, TypeStats> = {
    narration: empty(),
    epilogue: empty(),
  };

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let estimatedCostUsd = 0;

  for (const r of records) {
    const t = byType[r.type];
    t.calls += 1;
    t.promptTokens += r.promptTokens;
    t.completionTokens += r.completionTokens;
    t.totalTokens += r.totalTokens;
    t.costUsd += r.costUsd;

    totalPromptTokens += r.promptTokens;
    totalCompletionTokens += r.completionTokens;
    estimatedCostUsd += r.costUsd;
  }

  return {
    totalCalls: records.length,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens: totalPromptTokens + totalCompletionTokens,
    estimatedCostUsd,
    byType,
    recentCalls: [...records].reverse().slice(0, 50),
    trackingSince: records[0]?.timestamp ?? null,
  };
}
