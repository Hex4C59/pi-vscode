/** Syntax only: matching a token never grants filesystem access or attachment admission. */
export function fileReferenceToken(text: string, caret: number): { start: number; end: number; query: string } | undefined {
  if (!Number.isSafeInteger(caret) || caret < 0 || caret > text.length || text.length > 8000) return;
  if (caret < text.length && !/\s/.test(text[caret]!)) return;
  const match = /(?:^|\s)@([^\s@]*)$/.exec(text.slice(0, caret));
  if (!match || match[1]!.length > 256 || [...match[1]!].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return;
  const query = match[1]!;
  return { start: caret - query.length - 1, end: caret, query };
}
