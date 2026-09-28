import type { PromptInput } from "../../extension/contracts/index.js";

/** Bounded catalogue evidence; never guesses dispatch from a title or a single pending prompt. */
export function extensionCommandNames(data: unknown): ReadonlySet<string> | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  const commands = (data as Record<string, unknown>).commands;
  if (!Array.isArray(commands) || commands.length > 512) return;
  const names = new Set<string>();
  for (const item of commands) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const command = item as Record<string, unknown>;
    if (typeof command.name !== "string" || !command.name || Buffer.byteLength(command.name) > 200
      || /[\s/]/.test(command.name) || typeof command.source !== "string") return;
    if (command.source !== "extension") continue;
    if (names.has(command.name)) return;
    names.add(command.name);
  }
  return names;
}

/** Matches pi 0.86.1's initial slash / first literal-space dispatch on the actual plain prompt text. */
export function dispatchedExtensionCommand(input: PromptInput, names: ReadonlySet<string>): string | undefined {
  if (input.kind !== "plain") return;
  const text = input.body.trim();
  if (!text.startsWith("/")) return;
  const separator = text.indexOf(" ");
  const name = text.slice(1, separator < 0 ? undefined : separator);
  return names.has(name) ? name : undefined;
}
