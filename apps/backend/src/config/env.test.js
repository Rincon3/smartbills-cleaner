import test from "node:test";
import assert from "node:assert/strict";
import { assertProductionSecrets } from "./env.js";

test("en local no exige JWT_SECRET", () => {
  assert.doesNotThrow(() => assertProductionSecrets({ NODE_ENV: "development" }));
});

test("en producción rechaza JWT_SECRET ausente o change-me", () => {
  assert.throws(
    () => assertProductionSecrets({ NODE_ENV: "production" }),
    /JWT_SECRET/
  );
  assert.throws(
    () => assertProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "change-me" }),
    /JWT_SECRET/
  );
});

test("en producción acepta un secreto real", () => {
  assert.doesNotThrow(() =>
    assertProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "a-long-random-value" })
  );
});
