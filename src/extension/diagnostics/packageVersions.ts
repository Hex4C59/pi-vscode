import path from "node:path";
import { open } from "node:fs/promises";
export type PackageVersions = { extension: string | null; piRuntime: string | null; vscode: string | null };
export function safeVersion(value: unknown): string | null {
  return typeof value === "string" && value.length <= 80 && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value) ? value : null;
}
async function manifestVersion(file: string, expectedName: string): Promise<string | null> {
  let handle;
  try {
    handle = await open(file, "r"); const stat = await handle.stat();
    if (!stat.isFile() || stat.size > 32768) return null;
    const buffer = Buffer.alloc(32769); const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead > 32768) return null;
    const data: unknown = JSON.parse(buffer.subarray(0, bytesRead).toString("utf8"));
    if (!data || typeof data !== "object" || !("name" in data) || data.name !== expectedName || !("version" in data)) return null;
    return safeVersion(data.version);
  } catch { return null; }
  finally { await handle?.close().catch(() => undefined); }
}
/** Read fixed installation manifests only, not declarations, network or user files. */
export async function installedVersions(root: string, hostVersion?: string): Promise<PackageVersions> {
  const [extension, piRuntime] = await Promise.all([
    manifestVersion(path.join(root, "package.json"), "pi-vscode"),
    manifestVersion(path.join(root, "node_modules/@earendil-works/pi-coding-agent/package.json"), "@earendil-works/pi-coding-agent"),
  ]);
  return { extension, piRuntime, vscode: safeVersion(hostVersion) };
}
