import { randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { isValidProviderId, isCustomModelId, isEndpointDisplayName, isPublicHttpUrl } from "../contracts/index.js";

const MAX_MODELS_FILE_BYTES = 1024 * 1024;

/** One documented OpenAI-compatible provider entry, with no credential material. */
export type OpenAiEndpointDraft = {
  providerId: string;
  displayName: string;
  baseUrl: string;
  modelId: string;
};

export type EndpointWriteFailure = "invalid" | "rejected" | "exists" | "native" | "write";

function isPlain(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isEnoent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

type Loaded =
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "document"; value: Record<string, unknown>; providers: Record<string, unknown> };

async function loadModelsDocument(file: string): Promise<Loaded> {
  let text: string;
  try {
    const info = await stat(file);
    if (!info.isFile() || info.size > MAX_MODELS_FILE_BYTES) return { kind: "invalid" };
    text = await readFile(file, "utf8");
  } catch (error) {
    return isEnoent(error) ? { kind: "missing" } : { kind: "invalid" };
  }
  if (Buffer.byteLength(text, "utf8") > MAX_MODELS_FILE_BYTES) return { kind: "invalid" };
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { kind: "invalid" }; }
  if (!isPlain(parsed)) return { kind: "invalid" };
  const providers = parsed.providers === undefined ? {} : parsed.providers;
  if (!isPlain(providers) || Object.values(providers).some(entry => !isPlain(entry))) return { kind: "invalid" };
  return { kind: "document", value: parsed, providers };
}

async function replaceFile(file: string, text: string): Promise<boolean> {
  await mkdir(path.dirname(file), { recursive: true });
  let mode = 0o600;
  try {
    const info = await stat(file);
    if (!info.isFile()) return false;
    mode = info.mode & 0o777;
  } catch (error) {
    if (!isEnoent(error)) return false;
  }
  const temporary = path.join(path.dirname(file), `.models-${randomBytes(8).toString("hex")}.tmp`);
  try {
    await writeFile(temporary, text, { mode: 0o600 });
    await chmod(temporary, mode);
    await rename(temporary, file);
    return true;
  } catch {
    await rm(temporary, { force: true }).catch(() => undefined);
    return false;
  }
}

function removableIds(providers: Record<string, unknown>, isNative: (id: string) => boolean): Set<string> {
  return new Set(Object.keys(providers).filter(id => isValidProviderId(id) && !isNative(id)));
}

/** Non-built-in provider ids present in models.json. Undefined means the file is not safe to rewrite. */
export async function listRemovableEndpointIds(file: string, isNative: (id: string) => boolean): Promise<ReadonlySet<string> | undefined> {
  const loaded = await loadModelsDocument(file);
  if (loaded.kind === "invalid") return undefined;
  if (loaded.kind === "missing") return new Set();
  return removableIds(loaded.providers, isNative);
}

/** Merge one openai-completions provider. An unsafe or colliding file is left byte-for-byte unchanged. */
export async function addOpenAiEndpoint(
  file: string,
  draft: OpenAiEndpointDraft,
  isNative: (id: string) => boolean,
): Promise<EndpointWriteFailure | undefined> {
  if (!isValidProviderId(draft.providerId) || !isEndpointDisplayName(draft.displayName)
    || !isPublicHttpUrl(draft.baseUrl) || !isCustomModelId(draft.modelId)) return "rejected";
  if (isNative(draft.providerId)) return "native";
  const loaded = await loadModelsDocument(file);
  if (loaded.kind === "invalid") return "invalid";
  const value = loaded.kind === "document" ? loaded.value : {};
  const providers = loaded.kind === "document" ? loaded.providers : {};
  if (Object.hasOwn(providers, draft.providerId)) return "exists";
  providers[draft.providerId] = {
    name: draft.displayName,
    baseUrl: draft.baseUrl,
    api: "openai-completions",
    models: [{ id: draft.modelId }],
  };
  value.providers = providers;
  return await replaceFile(file, `${JSON.stringify(value, null, 2)}\n`) ? undefined : "write";
}

/** Delete one non-built-in provider object. Built-ins and damaged files are not rewritten. */
export async function removeOpenAiEndpoint(
  file: string,
  providerId: string,
  isNative: (id: string) => boolean,
): Promise<"removed" | EndpointWriteFailure | "missing"> {
  if (!isValidProviderId(providerId)) return "rejected";
  if (isNative(providerId)) return "native";
  const loaded = await loadModelsDocument(file);
  if (loaded.kind === "invalid") return "invalid";
  if (loaded.kind === "missing" || !Object.hasOwn(loaded.providers, providerId)) return "missing";
  delete loaded.providers[providerId];
  loaded.value.providers = loaded.providers;
  return await replaceFile(file, `${JSON.stringify(loaded.value, null, 2)}\n`) ? "removed" : "write";
}
