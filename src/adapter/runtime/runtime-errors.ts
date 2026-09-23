export function boundUserFacingDetail(detail: string, max = 300): string {
  const trimmed = detail.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

export function formatRuntimeError(detail: string): string {
  const normalized = detail.trim();
  if (/\b503\b|service temporarily unavailable|service unavailable/i.test(normalized)) {
    return "Model service is temporarily unavailable. Check the provider status or switch models, then try again.";
  }
  if (/\b429\b|rate limit|too many requests/i.test(normalized)) {
    return "Model rate limit reached. Wait a moment or switch models, then try again.";
  }
  return boundUserFacingDetail(normalized || "Assistant request failed.");
}
