import assert from "node:assert/strict";
import { test } from "node:test";
import { containsCredentialLikeText, redactCredentialLikeText } from "../index.js";
import { bearerText, fieldAssignmentText, ordinaryText, privateKeyText } from "./credential-samples.js";

test("shared credential rules detect the three families and leave ordinary text unchanged", () => {
  assert.equal(containsCredentialLikeText(ordinaryText), false);
  assert.equal(redactCredentialLikeText(ordinaryText), ordinaryText);

  assert.equal(containsCredentialLikeText(privateKeyText), true);
  assert.equal(redactCredentialLikeText(`keep\n${privateKeyText}\ntrail`), "[redacted]");
  assert.equal(redactCredentialLikeText(privateKeyText).includes("MII-synthetic-body"), false);

  assert.equal(containsCredentialLikeText(fieldAssignmentText), true);
  assert.equal(redactCredentialLikeText(`note ${fieldAssignmentText} tail`), "note password=[redacted] tail");

  assert.equal(containsCredentialLikeText(bearerText), true);
  assert.equal(redactCredentialLikeText(`use ${bearerText} later`), "use Bearer [redacted] later");
});

test("field assignment without a value and Bearer after an authorization label stay covered", () => {
  assert.equal(containsCredentialLikeText("password="), true);
  assert.equal(redactCredentialLikeText("password="), "password=[redacted]");
  const labeled = redactCredentialLikeText("Authorization: Bearer synthetic-token");
  assert.equal(labeled.includes("synthetic-token"), false);
});

test("JSON credential strings hide spaces, escaped quotes and nested values without changing context", () => {
  const input = ' { "note": "keep spacing", "nested": {"password": "SYNTHETIC_ALPHA \\" SYNTHETIC_BETA"}, "secret": "", "count": 1e2 } ';
  const expected = ' { "note": "keep spacing", "nested": {"password": "[redacted]"}, "secret": "[redacted]", "count": 1e2 } ';
  assert.doesNotThrow(() => JSON.parse(input));
  const display = redactCredentialLikeText(input);
  assert.equal(display, expected);
  assert.doesNotThrow(() => JSON.parse(display));
  assert.equal(redactCredentialLikeText(display), display);
});

test("JSON escaped credential field names are interpreted as keys, not raw substrings", () => {
  const input = '{"pass\\u0077ord":"SYNTHETIC_ALPHA SYNTHETIC_BETA","note":"ordinary"}';
  assert.equal(redactCredentialLikeText(input), '{"pass\\u0077ord":"[redacted]","note":"ordinary"}');
});

for (const [input, expected] of [
  ['note password="SYNTHETIC_ALPHA SYNTHETIC_BETA" tail', 'note password="[redacted]" tail'],
  ["note secret='SYNTHETIC_ALPHA \\' SYNTHETIC_BETA' tail", "note secret='[redacted]' tail"],
  [String.raw`api_key="SYNTHETIC_ALPHA \" SYNTHETIC_BETA"; password=other`, 'api_key="[redacted]"; password=[redacted]'],
  ['password="SYNTHETIC_ALPHA SYNTHETIC_BETA', 'password="[redacted]'],
  ["secret='SYNTHETIC_ALPHA \\' SYNTHETIC_BETA", "secret='[redacted]"],
  ['password=""; secret=; note=ordinary', 'password="[redacted]"; secret=[redacted]; note=ordinary'],
]) {
  test(`unstructured credential values are fully hidden: ${input}`, () => {
    assert.equal(redactCredentialLikeText(input), expected);
  });
}

test("structured credential values cannot spill into arrays, objects or sibling fields", () => {
  const input = '{"secret":["SYNTHETIC_ALPHA",{"nested":"SYNTHETIC_BETA"}],"password":{"x":[1,2]},"api_key":null,"note":1e2}';
  assert.equal(redactCredentialLikeText(input), '{"secret":"[redacted]","password":"[redacted]","api_key":"[redacted]","note":1e2}');
  const ordinary = ' {"note": "keep \\u0061 spelling", "count": 1e2, "nested": [true, null]} ';
  assert.equal(redactCredentialLikeText(ordinary), ordinary);
});

test("quoted credential values respect even and odd backslashes before quotes", () => {
  const input = String.raw`password="SYNTHETIC \\" visible; secret="SYNTHETIC \\\" HIDDEN" tail`;
  assert.equal(redactCredentialLikeText(input), 'password="[redacted]" visible; secret="[redacted]" tail');
});

test("credential-like text inside JSON key labels stays redacted", () => {
  const input = '{"Bearer SYNTHETIC_TOKEN":"ordinary","secret=SYNTHETIC_VALUE":"visible","password":"SYNTHETIC_BODY"}';
  assert.equal(redactCredentialLikeText(input), '{"Bearer [redacted]":"ordinary","secret=[redacted]":"visible","password":"[redacted]"}');
});

test("credential markers in JSON string context do not hide unrelated sibling fields", () => {
  const input = '{"note":"use password=synthetic before retry","other":"visible"}';
  assert.equal(redactCredentialLikeText(input), '{"note":"use password=[redacted] before retry","other":"visible"}');
});
