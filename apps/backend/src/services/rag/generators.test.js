import test from "node:test";
import assert from "node:assert/strict";
import { bedrockEnabled } from "./generators.js";

test("Bedrock se desactiva sin keys ni instance profile", () => {
  assert.equal(bedrockEnabled({}), false);
  assert.equal(bedrockEnabled({ BEDROCK_USE_INSTANCE_PROFILE: "false" }), false);
});

test("Bedrock usa el instance profile de EC2 sin copiar keys", () => {
  assert.equal(bedrockEnabled({ BEDROCK_USE_INSTANCE_PROFILE: "true" }), true);
});

test("Bedrock sigue activo con access key explícita", () => {
  assert.equal(bedrockEnabled({ AWS_ACCESS_KEY_ID: "AKIAEXAMPLE" }), true);
});
