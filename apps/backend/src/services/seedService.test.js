import test from "node:test";
import assert from "node:assert/strict";
import { shouldRunSeed } from "./seedService.js";

test("el seed corre en desarrollo", () => {
  assert.equal(shouldRunSeed({ NODE_ENV: "development" }), true);
});

test("producción no siembra salvo ALLOW_SEED=true", () => {
  assert.equal(shouldRunSeed({ NODE_ENV: "production" }), false);
  assert.equal(shouldRunSeed({ NODE_ENV: "production", ALLOW_SEED: "false" }), false);
  assert.equal(shouldRunSeed({ NODE_ENV: "production", ALLOW_SEED: "true" }), true);
});
