import assert from "node:assert/strict";
import test from "node:test";
import { formatModelLabel, parseModelCatalog } from "../pi-rpc-model-parse.js";

test("current model identity uses provider and id even when display names collide", () => {
  const shared = { name: "Twin" };
  assert.equal(formatModelLabel({ model: { ...shared, provider: "provider-a", id: "id-a" } }), "provider-a / id-a");
  assert.equal(formatModelLabel({ model: { ...shared, provider: "provider-b", id: "id-b" } }), "provider-b / id-b");
});

test("model catalog still keeps display names as labels", () => {
  const catalog = parseModelCatalog({
    models: [
      { provider: "provider-a", id: "id-a", name: "Twin" },
      { provider: "provider-b", id: "id-b", name: "Twin" },
    ],
  });
  assert.deepEqual(catalog, [
    { provider: "provider-a", modelId: "id-a", label: "Twin" },
    { provider: "provider-b", modelId: "id-b", label: "Twin" },
  ]);
});
