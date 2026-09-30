/** Host-owned credential-like text rules. No Node, VS Code or filesystem dependencies. */

const REDACTED = "[redacted]";
const PRIVATE_KEY = "-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----";
const BEARER_VALUE = "\\bBearer\\s+[\\w.+/=-]+";
const FIELD_ASSIGNMENT = "[\"']?(?:api[_ -]?key|authorization|password|secret|access[_ -]?token)[\"']?\\s*[:=]";

/** True when the text matches a private-key marker, credential field assignment or Bearer value. */
export function containsCredentialLikeText(text: string): boolean {
  return new RegExp(PRIVATE_KEY, "i").test(text)
    || new RegExp(BEARER_VALUE, "i").test(text)
    || new RegExp(FIELD_ASSIGNMENT, "i").test(text);
}

function quotedEnd(text: string, start: number): { end: number; closed: boolean } {
  const quote = text[start];
  for (let index = start + 1; index < text.length; index++) {
    if (text[index] === "\\") index++;
    else if (text[index] === quote) return { end: index + 1, closed: true };
  }
  return { end: text.length, closed: false };
}

function skipWhitespace(text: string, start: number): number {
  let index = start;
  while (index < text.length && /\s/.test(text[index])) index++;
  return index;
}

function redactFields(text: string): string {
  const fields = new RegExp(`${FIELD_ASSIGNMENT}\\s*`, "gi");
  const chunks: string[] = [];
  let copied = 0;
  for (let match = fields.exec(text); match; match = fields.exec(text)) {
    const start = fields.lastIndex;
    const quote = text[start];
    let end = start;
    if (quote === '"' || quote === "'") {
      const quoted = quotedEnd(text, start);
      end = quoted.end;
      chunks.push(text.slice(copied, start), quote, REDACTED, quoted.closed ? quote : "");
    } else {
      while (end < text.length && !/[\s"',;}]/.test(text[end])) end++;
      chunks.push(text.slice(copied, start), REDACTED);
    }
    copied = end;
    fields.lastIndex = end;
  }
  chunks.push(text.slice(copied));
  return chunks.join("");
}

function redactUnstructured(text: string): string {
  if (new RegExp(PRIVATE_KEY, "i").test(text)) return REDACTED;
  const bearerSafe = text.replace(new RegExp("\\b(Bearer\\s+)[\\w.+/=-]+", "gi"), `$1${REDACTED}`);
  return redactFields(bearerSafe);
}

function jsonValueEnd(text: string, start: number): number {
  let depth = 0;
  let index = start;
  while (index < text.length) {
    const character = text[index];
    if (character === '"') {
      index = quotedEnd(text, index).end;
      continue;
    }
    if (character === "{" || character === "[") depth++;
    else if (character === "}" || character === "]") {
      if (!depth) break;
      depth--;
      if (!depth) return index + 1;
    } else if (!depth && (character === "," || /\s/.test(character))) break;
    index++;
  }
  return index;
}

function redactJson(text: string): string | undefined {
  try { JSON.parse(text); } catch { return undefined; }
  const chunks: string[] = [];
  let copied = 0;
  let index = 0;
  while (index < text.length) {
    if (text[index] !== '"') { index++; continue; }
    const end = quotedEnd(text, index).end;
    const value: string = JSON.parse(text.slice(index, end));
    const next = skipWhitespace(text, end);
    const isKey = text[next] === ":";
    if (isKey && new RegExp(`${FIELD_ASSIGNMENT}$`, "i").test(`${JSON.stringify(value)}:`)) {
      const start = skipWhitespace(text, next + 1);
      index = jsonValueEnd(text, start);
      chunks.push(text.slice(copied, start), JSON.stringify(REDACTED));
      copied = index;
      continue;
    }
    const display = redactUnstructured(value);
    if (display !== value) {
      chunks.push(text.slice(copied, index), JSON.stringify(display));
      copied = end;
    }
    index = end;
  }
  chunks.push(text.slice(copied));
  return chunks.join("");
}

/** Private-key markers hide the whole display string; credential values hide in full. */
export function redactCredentialLikeText(text: string): string {
  if (new RegExp(PRIVATE_KEY, "i").test(text)) return REDACTED;
  return redactJson(text) ?? redactUnstructured(text);
}
