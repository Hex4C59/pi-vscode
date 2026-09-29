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
