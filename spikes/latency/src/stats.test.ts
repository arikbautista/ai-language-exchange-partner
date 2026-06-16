// spikes/latency/src/stats.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { percentile } from "./stats.js";

test("throws on empty input", () => {
  assert.throws(() => percentile([], 50));
});

test("single value is every percentile", () => {
  assert.equal(percentile([42], 50), 42);
  assert.equal(percentile([42], 90), 42);
});

test("p50 uses nearest-rank and sorts unsorted input", () => {
  assert.equal(percentile([40, 10, 30, 20], 50), 20);
});

test("p90 of 1..10 is the 9th value", () => {
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90), 9);
});

test("throws on out-of-range p", () => {
  assert.throws(() => percentile([1], 0));
  assert.throws(() => percentile([1], 101));
});
