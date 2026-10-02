import { open } from "node:fs/promises";
export type LocalNotes = { status: "available"; text: string } | { status: "unavailable"; reason: "unknown-version" | "missing" | "ambiguous" | "budget" | "unreadable" };
/** Only a complete exact-version section in a bounded local prefix qualifies. */
function section(prefix: string, version: string, truncated: boolean): LocalNotes {
  const headings = Array.from(prefix.matchAll(/^## \[([^\]\r\n]+)\][^\r\n]*$/gm));
  const matching = headings.filter(heading => heading[1] === version);
  if (matching.length > 1) return { status: "unavailable", reason: "ambiguous" };
  const match = matching[0];
  if (!match) return { status: "unavailable", reason: truncated ? "budget" : "missing" };
  const next = headings[headings.indexOf(match) + 1];
  if (!next && truncated) return { status: "unavailable", reason: "budget" };
  const text = Array.from(prefix.slice(match.index, next?.index).trim()).filter(char => char === "\n" || char === "\t" || char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join("").replace(/\p{Cf}/gu, "");
  return Buffer.byteLength(text) > 8192 ? { status: "unavailable", reason: "budget" } : { status: "available", text };
}
export async function localVersionNotes(file: string, version: string | null): Promise<LocalNotes> {
  if (!version) return { status: "unavailable", reason: "unknown-version" };
  let handle;
  try {
    handle = await open(file, "r"); const stat = await handle.stat(); if (!stat.isFile()) return { status: "unavailable", reason: "unreadable" };
    const buffer = Buffer.alloc(65537); const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return section(buffer.subarray(0, Math.min(bytesRead, 65536)).toString("utf8"), version, bytesRead > 65536 || stat.size > bytesRead);
  } catch { return { status: "unavailable", reason: "unreadable" }; }
  finally { await handle?.close().catch(() => undefined); }
}
