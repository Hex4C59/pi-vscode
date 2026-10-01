import { redactCredentialLikeText, type PromptInput } from "../../extension/contracts/index.js";

const COMMAND_SOURCES = new Set(["extension", "prompt", "skill"]);
const COMMAND_LOCATIONS = new Set(["user", "project", "path"]);
const COMMAND_KEYS = new Set(["name", "description", "source", "location", "path"]);

export type CommandCatalogueRow = {
  name: string;
  description?: string;
  source: "extension" | "prompt" | "skill";
  location?: "user" | "project" | "path";
};

export type CommandCatalogue =
  | { status: "empty" }
  | { status: "ready"; rows: readonly CommandCatalogueRow[] }
  | { status: "unavailable" };

function presentCommandRow(item: unknown): CommandCatalogueRow | undefined {
  if (!item || typeof item !== "object" || Array.isArray(item)) return;
  const command = item as Record<string, unknown>;
  for (const key of Object.keys(command)) if (!COMMAND_KEYS.has(key)) return;
  const { name, source } = command;
  if (typeof name !== "string" || !name || Buffer.byteLength(name) > 200 || /[\s/]/.test(name)) return;
  if (typeof source !== "string" || !COMMAND_SOURCES.has(source)) return;
  const row: CommandCatalogueRow = { name, source: source as CommandCatalogueRow["source"] };
  if (command.description !== undefined) {
    if (typeof command.description !== "string") return;
    const description = redactCredentialLikeText(command.description.slice(0, 500));
    if (description) row.description = description;
  }
  if (command.location !== undefined) {
    if (typeof command.location !== "string" || !COMMAND_LOCATIONS.has(command.location)) return;
    row.location = command.location as CommandCatalogueRow["location"];
  }
  if (command.path !== undefined && typeof command.path !== "string") return;
  return row;
}

/** Presentation snapshot for the composer menu; never includes filesystem paths. */
export function presentCommandCatalogue(data: unknown): CommandCatalogue {
  if (!data || typeof data !== "object" || Array.isArray(data)) return { status: "unavailable" };
  const commands = (data as Record<string, unknown>).commands;
  if (!Array.isArray(commands) || commands.length > 512) return { status: "unavailable" };
  if (commands.length === 0) return { status: "empty" };
  const rows: CommandCatalogueRow[] = [];
  const names = new Set<string>();
  for (const item of commands) {
    const row = presentCommandRow(item);
    if (!row || names.has(row.name)) return { status: "unavailable" };
    names.add(row.name);
    rows.push(row);
  }
  return { status: "ready", rows };
}

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
