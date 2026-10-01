import { containsCredentialLikeText, redactCredentialLikeText, type CommandCatalogue, type CommandCatalogueRow, type PromptInput } from "../../extension/contracts/index.js";

const COMMAND_SOURCES = new Set(["extension", "prompt", "skill"]);
const COMMAND_LOCATIONS = new Set(["user", "project", "path"]);
const COMMAND_KEYS = new Set(["name", "description", "source", "location", "path", "sourceInfo"]);

export type { CommandCatalogue, CommandCatalogueRow };

/** Public pi SourceInfo is host-only; only its non-temporary scope is projected. */
function commandSourceInfo(value: unknown): { path: string; location?: "user" | "project" } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const info = value as Record<string, unknown>;
  const allowed = new Set(["path", "source", "scope", "origin", "baseDir"]);
  if (Object.keys(info).some(key => !allowed.has(key))) return;
  if (typeof info.path !== "string" || typeof info.source !== "string") return;
  if (info.baseDir !== undefined && typeof info.baseDir !== "string") return;
  if (info.origin !== "package" && info.origin !== "top-level") return;
  if (info.scope !== "user" && info.scope !== "project" && info.scope !== "temporary") return;
  return { path: info.path, ...(info.scope !== "temporary" ? { location: info.scope } : {}) };
}

function presentCommandRow(item: unknown): CommandCatalogueRow | undefined {
  if (!item || typeof item !== "object" || Array.isArray(item)) return;
  const command = item as Record<string, unknown>;
  for (const key of Object.keys(command)) if (!COMMAND_KEYS.has(key)) return;
  const { name, source } = command;
  if (typeof name !== "string" || !name || Buffer.byteLength(name) > 200 || /[\s/]/.test(name) || containsCredentialLikeText(name)) return;
  if (typeof source !== "string" || !COMMAND_SOURCES.has(source)) return;
  const metadata = command.sourceInfo !== undefined ? commandSourceInfo(command.sourceInfo) : undefined;
  if (command.sourceInfo !== undefined && !metadata) return;
  const row: CommandCatalogueRow = { name, source: source as CommandCatalogueRow["source"] };
  if (command.description !== undefined) {
    if (typeof command.description !== "string") return;
    // Optional copy is withheld rather than projecting embedded filesystem paths.
    const describesPath = /(?:^|[\s"'`([{=:])(?:\/|~\/)/.test(command.description)
      || (typeof command.path === "string" && command.path.length > 0 && command.description.includes(command.path))
      || (metadata !== undefined && metadata.path.length > 0 && command.description.includes(metadata.path));
    const description = redactCredentialLikeText(command.description).slice(0, 500);
    if (!describesPath && description) row.description = description;
  }
  if (command.location !== undefined) {
    if (typeof command.location !== "string" || !COMMAND_LOCATIONS.has(command.location)) return;
    row.location = command.location as CommandCatalogueRow["location"];
  }
  if (command.path !== undefined && typeof command.path !== "string") return;
  if (metadata?.location) row.location = metadata.location;
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
