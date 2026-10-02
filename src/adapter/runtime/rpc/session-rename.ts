import { containsCredentialLikeText } from "../../../extension/contracts/index.js";
import { sameNativePath } from "../../index.js";

export type OpenedConversation = { id: string; path: string };
export function validRenameInput(name: string): boolean {
  return name.length > 0 && name.length <= 200 && name === name.trim()
    && Array.from(name, character => character.charCodeAt(0)).every(code => code >= 32 && (code < 127 || code > 159)) && !containsCredentialLikeText(name);
}
/** Exact public identity and idle readback; the returned name stays literal for confirmation. */
export function renamedConversation(data: unknown, expected: OpenedConversation, requestedName?: string) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  const state = data as Record<string, unknown>;
  if (state.sessionId !== expected.id || typeof state.sessionFile !== "string" || !sameNativePath(state.sessionFile, expected.path)
    || state.isStreaming !== false || state.isCompacting !== false || state.pendingMessageCount !== 0
    || (state.sessionName != null && typeof state.sessionName !== "string")) return;
  if (requestedName !== undefined && state.sessionName !== requestedName) return;
  return { id: expected.id, path: expected.path, name: typeof state.sessionName === "string" ? state.sessionName : null };
}
