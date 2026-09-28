export function boundUserFacingDetail(detail: string, max = 300): string {
  const trimmed = detail.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

export function isAuthenticationError(detail: string): boolean {
  return /\b401\b|\b403\b|unauthorized|authentication|invalid api.?key|no api.?key|missing.{0,20}credential/i.test(detail);
}

export function formatRuntimeError(detail: string): string {
  const normalized = detail.trim();
  // Provider bodies are untrusted and may echo credentials. Classify them in
  // the host, but never forward any part of the original body to the Webview.
  if (isAuthenticationError(normalized)) {
    return "Model authentication failed. Check pi credentials and provider access, then try again.";
  }
  if (/\b503\b|service temporarily unavailable|service unavailable/i.test(normalized)) {
    return "Model service is temporarily unavailable. Check the provider status or switch models, then try again.";
  }
  if (/\b429\b|rate limit|too many requests/i.test(normalized)) {
    return "Model rate limit reached. Wait a moment or switch models, then try again.";
  }
  return "Model request failed. Check the selected model and provider configuration, then try again.";
}
