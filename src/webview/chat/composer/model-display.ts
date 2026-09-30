/** Dedicated model-id abbreviations confirmed for composer presentation. */
const ABBREVIATIONS = new Set(["gpt"]);

export function formatModelId(modelId: string): string {
  return modelId.split(/([\s-])/).map(formatModelToken).join("");
}

export function displayModelId(chatModel: string | null): string | null {
  if (!chatModel) return null;
  const separator = " / ";
  const index = chatModel.indexOf(separator);
  return formatModelId(index === -1 ? chatModel : chatModel.slice(index + separator.length));
}

export function formatThinkingLabel(level: string, translated: string, locale: string): string {
  if (locale.startsWith("zh")) return translated;
  if (!level) return translated;
  return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}

function formatModelToken(token: string): string {
  if (token === "-" || token === " " || token === "") return token;
  if (/^\d+$/.test(token)) return token;
  const lower = token.toLowerCase();
  if (ABBREVIATIONS.has(lower)) return lower.toUpperCase();
  const first = token.charAt(0);
  if (!first || !/[a-zA-Z]/.test(first)) return token;
  return `${first.toUpperCase()}${token.slice(1).toLowerCase()}`;
}
