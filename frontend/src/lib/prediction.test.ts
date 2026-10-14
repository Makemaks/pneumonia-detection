import { test } from "node:test";
import assert from "node:assert/strict";
import { CLASS_ORDER, parsePrediction, validateImage } from "./prediction.ts";

const version = "7a90abfa3695f61a17e4a2dd959c0da822080b21";
const validResponse = {
  model: "FT-004",
  model_version: version,
  label: "NORMAL",
  probabilities: { NORMAL: 0.63, VIRAL: 0.27, BACTERIAL: 0.1 },
  class_order: [...CLASS_ORDER],
  member_count: 3,
};

test("all three independent model scores and model provenance are preserved", () => {
  const result = parsePrediction(validResponse);
  assert.deepEqual(result.probabilities, { NORMAL: 0.63, VIRAL: 0.27, BACTERIAL: 0.1 });
  assert.equal(result.model, "FT-004");
  assert.equal(result.model_version, version);
  assert.equal(result.member_count, 3);
  assert.deepEqual(result.class_order, CLASS_ORDER);
});
test("the largest mean score selects each class without a binary threshold", () => {
  for (const label of CLASS_ORDER) {
    const probabilities = Object.fromEntries(CLASS_ORDER.map((key) => [key, key === label ? 0.6 : 0.2]));
    assert.equal(parsePrediction({ ...validResponse, label, probabilities }).label, label);
  }
  assert.equal(parsePrediction({
    ...validResponse,
    label: "VIRAL",
    probabilities: { NORMAL: 0.32, VIRAL: 0.35, BACTERIAL: 0.33 },
  }).label, "VIRAL");
});
test("ties follow the recorded class order and floating-point sum rounding is accepted", () => {
  assert.equal(parsePrediction({
    ...validResponse,
    probabilities: { NORMAL: 0.5, VIRAL: 0.5, BACTERIAL: 0 },
  }).label, "NORMAL");
  assert.equal(parsePrediction({
    ...validResponse,
    label: "VIRAL",
    probabilities: { NORMAL: 0, VIRAL: 0.5, BACTERIAL: 0.5 },
  }).label, "VIRAL");
  assert.equal(parsePrediction({
    ...validResponse,
    probabilities: { NORMAL: 0.33333334, VIRAL: 0.33333334, BACTERIAL: 0.33333334 },
  }).label, "NORMAL");
  assert.equal(parsePrediction({
    ...validResponse,
    probabilities: { NORMAL: 1, VIRAL: 0, BACTERIAL: 0 },
  }).probabilities.NORMAL, 1);
});
test("malformed models, classes and scores cannot be shown as FT-004 results", () => {
  for (const value of [
    null,
    [],
    {},
    { label: "NORMAL", probability: 0.13, threshold: 0.5 },
    { ...validResponse, model: "FT-010" },
    { ...validResponse, model_version: undefined },
    { ...validResponse, model_version: "latest" },
    { ...validResponse, member_count: 1 },
    { ...validResponse, class_order: ["NORMAL", "BACTERIAL", "VIRAL"] },
    { ...validResponse, class_order: ["NORMAL", "VIRAL"] },
    { ...validResponse, probabilities: null },
    { ...validResponse, probabilities: [0.63, 0.27, 0.1] },
    { ...validResponse, probabilities: { NORMAL: 0.8, VIRAL: 0.2 } },
    { ...validResponse, probabilities: { ...validResponse.probabilities, OTHER: 0 } },
    ...[NaN, Infinity, -0.1, 1.1, "0.7", undefined].map((score) => ({
      ...validResponse,
      probabilities: { ...validResponse.probabilities, VIRAL: score },
    })),
  ])
    assert.throws(() => parsePrediction(value));
});
test("scores must sum to one and the label must match the deterministic argmax", () => {
  for (const value of [
    { ...validResponse, label: "OTHER" },
    { ...validResponse, label: "BACTERIAL" },
    { ...validResponse, probabilities: { NORMAL: 0, VIRAL: 0, BACTERIAL: 0 } },
    { ...validResponse, probabilities: { NORMAL: 0.7, VIRAL: 0.3, BACTERIAL: 0.1 } },
    { ...validResponse, probabilities: { NORMAL: 0.7, VIRAL: 0.2, BACTERIAL: 0.09 } },
    { ...validResponse, label: "VIRAL", probabilities: { NORMAL: 0.5, VIRAL: 0.5, BACTERIAL: 0 } },
  ]) assert.throws(() => parsePrediction(value));
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
