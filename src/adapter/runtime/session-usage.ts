import type { SessionUsage } from "../../extension/contracts/index.js";

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const money = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;

export function sessionUsageIdentity(value: unknown): { id: string; path: string } | undefined {
  if (!record(value) || typeof value.sessionId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(value.sessionId)
    || typeof value.sessionFile !== "string") return;
  return { id: value.sessionId, path: value.sessionFile };
}

function knownPricing(state: unknown): boolean {
  if (!record(state) || !record(state.model) || !record(state.model.cost)) return false;
  const rates = ["input", "output", "cacheRead", "cacheWrite"].map(key => state.model && record(state.model)
    && record(state.model.cost) ? state.model.cost[key] : undefined);
  return rates.every(money) && rates.some(rate => typeof rate === "number" && rate > 0);
}

/** Public RPC statistics are projected into fixed numbers; original metadata stays host-only. */
export function sessionUsageNumbers(data: unknown, state: unknown): SessionUsage | undefined {
  if (!record(data) || !record(data.tokens)) return;
  const { input, output, cacheRead, cacheWrite, total } = data.tokens;
  if (!count(input) || !count(output) || !count(cacheRead) || !count(cacheWrite) || !count(total) || !money(data.cost)) return;
  let context: SessionUsage["context"] = null;
  if (data.contextUsage !== undefined) {
    if (!record(data.contextUsage)) return;
    const { tokens, contextWindow, percent } = data.contextUsage;
    if (!(tokens === null || count(tokens)) || !count(contextWindow) || !contextWindow
      || !(percent === null || (money(percent) && percent <= 100))) return;
    context = { tokens, contextWindow, percent };
  }
  return { tokens: { input, output, cacheRead, cacheWrite, total }, context, cost: data.cost === 0 && !knownPricing(state) ? null : data.cost };
}
