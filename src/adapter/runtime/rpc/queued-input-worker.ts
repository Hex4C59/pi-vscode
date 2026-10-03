import { mkdtemp, open, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import type { QueuedCommandResource } from "./queued-input-expansion.js";

const LIMIT = 128 * 1024;
function validate(value: unknown): value is QueuedCommandResource {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const r = value as Record<string, unknown>;
  return Object.keys(r).length === 4 && typeof r.body === "string" && r.body.length <= 8000
    && typeof r.name === "string" && (r.body.trimStart() === `/${r.name}` || r.body.trimStart().startsWith(`/${r.name} `))
    && (r.source === "prompt" || r.source === "skill") && typeof r.path === "string" && path.isAbsolute(r.path);
}
async function readSource(file: string): Promise<Buffer> {
  const handle = await open(file, "r");
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > LIMIT) throw new Error("capacity");
    const buffer = Buffer.alloc(LIMIT + 1); let bytes = 0;
    while (bytes < buffer.length) {
      const read = await handle.read(buffer, bytes, buffer.length - bytes, bytes);
      if (!read.bytesRead) break;
      bytes += read.bytesRead;
    }
    if (bytes > LIMIT) throw new Error("capacity");
    return buffer.subarray(0, bytes);
  } finally { await handle.close(); }
}
const digest = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");
/** Public SDK only; no extensions, model invocation, user settings or session persistence. */
async function expand(r: QueuedCommandResource): Promise<string> {
  const { createAgentSession, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager } = await import("@earendil-works/pi-coding-agent");
  const source = await readSource(r.path);
  const before = digest(source);
  const isolated = await mkdtemp(path.join(tmpdir(), "pi-queued-expansion-"));
  try {
    const capturedPath = path.join(isolated, path.basename(r.path));
    await writeFile(capturedPath, source);
    const settings = SettingsManager.inMemory();
    const loader = new DefaultResourceLoader({ cwd: isolated, agentDir: isolated, settingsManager: settings,
      noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true,
      additionalSkillPaths: r.source === "skill" ? [capturedPath] : [],
      skillsOverride: base => ({ ...base, skills: base.skills.map(skill => ({ ...skill, baseDir: path.dirname(r.path) })) }),
      additionalPromptTemplatePaths: r.source === "prompt" ? [capturedPath] : [] });
    await loader.reload();
    const known = r.source === "prompt" ? loader.getPrompts().prompts.some(p => p.name === r.name)
      : loader.getSkills().skills.some(s => `skill:${s.name}` === r.name);
    if (!known) throw new Error("unavailable");
    const modelRuntime = await ModelRuntime.create({ credentials: { read: async () => undefined, list: async () => [], modify: async () => { throw new Error("disabled"); }, delete: async () => { throw new Error("disabled"); } }, modelsPath: null, modelsStorePath: path.join(isolated, "models"), refreshOnCreate: false });
    const { session } = await createAgentSession({ cwd: isolated, agentDir: isolated, resourceLoader: loader,
      settingsManager: settings, sessionManager: SessionManager.inMemory(isolated), modelRuntime, noTools: "all" });
    try {
      await session.steer(r.body.trimStart());
      const queued = session.clearQueue();
      if (queued.steering.length !== 1 || queued.followUp.length) throw new Error("unavailable");
      // Source-map only the generated temporary skill location, preserving original relative-reference semantics.
      const text = queued.steering[0].split(capturedPath).join(r.path);
      if (!text.trim() || Buffer.byteLength(text, "utf8") > LIMIT) throw new Error("capacity");
      if (digest(await readSource(r.path)) !== before) throw new Error("source-changed");
      return text;
    } finally { session.dispose(); }
  } finally { await rm(isolated, { recursive: true, force: true }); }
}
async function main(): Promise<void> {
  try {
    const chunks: Buffer[] = []; let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > 48 * 1024) throw new Error("capacity");
      chunks.push(Buffer.from(chunk));
    }
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!validate(value)) throw new Error("unavailable");
    process.stdout.write(JSON.stringify({ ok: true, text: await expand(value) }) + "\n");
  } catch (error) {
    const code = error instanceof Error && ["capacity", "source-changed"].includes(error.message) ? error.message : "command-unavailable";
    process.stdout.write(JSON.stringify({ ok: false, code }) + "\n");
  }
}
if (process.argv.includes("--expand-queued-input")) void main();
