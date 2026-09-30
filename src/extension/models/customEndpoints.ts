import { isValidProviderId, isCustomModelId, isEndpointDisplayName, isPublicHttpUrl } from "../contracts/index.js";
import {
  endpointWriteRefusal, readEndpointDocument, writeEndpointDocument,
  type EndpointFileSnapshot, type EndpointFileSystem, type EndpointWriteResult,
} from "./endpointFileTransaction.js";

/** One documented OpenAI-compatible provider entry, with no credential material. */
export type OpenAiEndpointDraft = {
  providerId: string;
  displayName: string;
  baseUrl: string;
  modelId: string;
};

function isPlain(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

type Document = { value: Record<string, unknown>; providers: Record<string, unknown> };

function parseDocument(snapshot: EndpointFileSnapshot): Document | undefined {
  if (snapshot.kind === "missing") return { value: {}, providers: {} };
  let parsed: unknown;
  try { parsed = JSON.parse(snapshot.bytes.toString("utf8")); } catch { return undefined; }
  if (!isPlain(parsed)) return undefined;
  const providers = parsed.providers === undefined ? {} : parsed.providers;
  if (!isPlain(providers) || Object.values(providers).some(entry => !isPlain(entry))) return undefined;
  return { value: parsed, providers };
}

/** Non-built-in provider ids present in models.json. Undefined means the file is not safe to rewrite. */
export async function listRemovableEndpointIds(file: string, isNative: (id: string) => boolean): Promise<ReadonlySet<string> | undefined> {
  const snapshot = await readEndpointDocument(file);
  if (snapshot.kind === "invalid") return undefined;
  const document = parseDocument(snapshot);
  return document ? new Set(Object.keys(document.providers).filter(id => isValidProviderId(id) && !isNative(id))) : undefined;
}

/** Merge only after acquiring the shared file lock; refusal never continues credential actions. */
export async function addOpenAiEndpoint(
  file: string, draft: OpenAiEndpointDraft, isNative: (id: string) => boolean, fs?: EndpointFileSystem,
): Promise<EndpointWriteResult> {
  if (!isValidProviderId(draft.providerId) || !isEndpointDisplayName(draft.displayName)
    || !isPublicHttpUrl(draft.baseUrl) || !isCustomModelId(draft.modelId)) return endpointWriteRefusal("rejected");
  if (isNative(draft.providerId)) return endpointWriteRefusal("native");
  return writeEndpointDocument(file, snapshot => {
    const document = parseDocument(snapshot);
    if (!document) return { kind: "refused", reason: "invalid" };
    if (Object.hasOwn(document.providers, draft.providerId)) return { kind: "refused", reason: "exists" };
    document.providers[draft.providerId] = {
      name: draft.displayName, baseUrl: draft.baseUrl, api: "openai-completions", models: [{ id: draft.modelId }],
    };
    document.value.providers = document.providers;
    return { kind: "replace", text: `${JSON.stringify(document.value, null, 2)}\n` };
  }, fs);
}

/** Delete only one non-built-in provider while holding the shared file lock. */
export async function removeOpenAiEndpoint(
  file: string, providerId: string, isNative: (id: string) => boolean, fs?: EndpointFileSystem,
): Promise<EndpointWriteResult> {
  if (!isValidProviderId(providerId)) return endpointWriteRefusal("rejected");
  if (isNative(providerId)) return endpointWriteRefusal("native");
  return writeEndpointDocument(file, snapshot => {
    const document = parseDocument(snapshot);
    if (!document) return { kind: "refused", reason: "invalid" };
    if (!Object.hasOwn(document.providers, providerId)) return { kind: "refused", reason: "missing" };
    delete document.providers[providerId];
    document.value.providers = document.providers;
    return { kind: "replace", text: `${JSON.stringify(document.value, null, 2)}\n` };
  }, fs);
}
