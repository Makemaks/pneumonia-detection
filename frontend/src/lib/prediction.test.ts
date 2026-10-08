import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePrediction, validateImage } from "./prediction.ts";

test("normal predictions preserve the pneumonia score, not a mislabeled confidence", () => {
  const result = parsePrediction({
    label: "NORMAL",
    probability: 0.13,
    threshold: 0.5,
  });
  assert.equal(result.probability, 0.13);
  assert.equal((1 - result.probability).toFixed(2), "0.87");
});
test("the API uses an inclusive pneumonia threshold", () => {
  assert.equal(
    parsePrediction({ label: "PNEUMONIA", probability: 0.5, threshold: 0.5 })
      .label,
    "PNEUMONIA",
  );
  assert.equal(
    parsePrediction({ label: "NORMAL", probability: 0, threshold: 0.5 })
      .probability,
    0,
  );
  assert.equal(
    parsePrediction({ label: "PNEUMONIA", probability: 1, threshold: 0.5 })
      .probability,
    1,
  );
});
test("malformed or contradictory server responses cannot be shown as a result", () => {
  for (const value of [
    null,
    {},
    { label: "OTHER", probability: 0.7, threshold: 0.5 },
    { label: "NORMAL", probability: 0.7, threshold: 0.5 },
    ...[NaN, Infinity, -0.1, 1.1, "0.7"].map((probability) => ({
      label: "PNEUMONIA",
      probability,
      threshold: 0.5,
    })),
    ...[NaN, Infinity, -0.1, 1.1, undefined].map((threshold) => ({
      label: "PNEUMONIA",
      probability: 0.7,
      threshold,
    })),
  ])
    assert.throws(() => parsePrediction(value));
});
test("only nonempty JPEG and PNG files within the size limit are accepted", () => {
  assert.equal(
    validateImage(new File(["image"], "scan.png", { type: "image/png" })),
    null,
  );
  assert.equal(
    validateImage(new File(["image"], "scan.jpg", { type: "image/jpeg" })),
    null,
  );
  assert.match(
    validateImage(new File(["scan"], "scan.svg", { type: "image/svg+xml" }))!,
    /JPEG or PNG/,
  );
  assert.match(
    validateImage(new File([], "scan.png", { type: "image/png" }))!,
    /empty/,
  );
  assert.equal(
    validateImage(
      new File([new Uint8Array(5_000_000)], "limit.png", { type: "image/png" }),
    ),
    null,
  );
  assert.match(
    validateImage(
      new File([new Uint8Array(5_000_001)], "large.png", { type: "image/png" }),
    )!,
    /too large/,
  );
});
