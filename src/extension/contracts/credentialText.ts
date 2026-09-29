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

/**
 * Apply the same rules for display. A private-key marker hides the whole string.
 * Bearer and field values are replaced; labels and ordinary context stay.
 */
export function redactCredentialLikeText(text: string): string {
  if (new RegExp(PRIVATE_KEY, "i").test(text)) return REDACTED;
  return text
    .replace(new RegExp("\\b(Bearer\\s+)[\\w.+/=-]+", "gi"), `$1${REDACTED}`)
    .replace(new RegExp(`(${FIELD_ASSIGNMENT}\\s*["']?)([^\\s"',;}]*)`, "gi"), `$1${REDACTED}`);
}
