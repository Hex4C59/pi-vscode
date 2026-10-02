export type DiagramFailure = "unsafe" | "unsupported" | "too-large" | "invalid" | "busy" | "cancelled" | "timeout";
/** Conservative presentation grammar, not upstream source configuration authority. */
export function diagramSourceFailure(source: string): DiagramFailure | undefined {
  if (source.length > 4096 || source.split(/[;\n]/).length > 40 || source.split("\n").some(line => line.length > 256)) return "too-large";
  if (!/^\s*(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\b|^\s*sequenceDiagram\b/.test(source)) return "unsupported";
  if (/[<@&$`\\]/.test(source) || /%%|^\s*---|:\/\/|\b(?:https?|data|javascript|vbscript|file):/im.test(source)
    || /\b(?:fa[bslr]?|mdi|logos?):/i.test(source) || /\p{Cf}/u.test(source)
    || /\b(?:click|style|classDef|class|linkStyle|href|src|url|image|img|icon|callback|load|init|config)\b/i.test(source)) return "unsafe";
  if (Array.from(source).some(char => char.charCodeAt(0) < 32 && char !== "\n" && char !== "\t" || char.charCodeAt(0) === 127)) return "unsafe";
  const words = source.match(/[\p{L}\p{M}\p{N}_]+/gu) ?? [];
  return words.length > 128 || new Set(words).size > 64 ? "too-large" : undefined;
}

/** Marked also emits code tokens for unfinished fences; only a real closing fence qualifies. */
export function closedMermaidFence(raw: string): boolean {
  const lines = raw.trimEnd().split("\n");
  const first = lines[0]?.match(/^ {0,3}(`{3,}|~{3,})mermaid\s*$/i);
  const last = lines.at(-1)?.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
  return lines.length > 1 && !!first && !!last && first[1]![0] === last[1]![0] && last[1]!.length >= first[1]!.length;
}
