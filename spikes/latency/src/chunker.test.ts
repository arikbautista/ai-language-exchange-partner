// spikes/latency/src/chunker.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createChunker } from "./chunker.js";

test("emits each sentence when multiple boundaries arrive in one delta", () => {
  const c = createChunker(2);
  assert.deepEqual(c.push("こんにちは。元気ですか？今日もいい天気ですね。"), [
    "こんにちは。",
    "元気ですか？",
    "今日もいい天気ですね。",
  ]);
  assert.equal(c.flush(), null);
});

test("handles a sentence split across deltas", () => {
  const c = createChunker(2);
  assert.deepEqual(c.push("こんにち"), []);
  assert.deepEqual(c.push("は。元気"), ["こんにちは。"]);
  assert.deepEqual(c.push("ですか？"), ["元気ですか？"]);
});

test("treats half-width ! and ? as boundaries", () => {
  const c = createChunker(2);
  assert.deepEqual(c.push("いいね!ほんとう?"), ["いいね!", "ほんとう?"]);
});

test("returns remaining text at stream end when no boundary appeared", () => {
  const c = createChunker(2);
  assert.deepEqual(c.push("そうです"), []);
  assert.deepEqual(c.push("ね"), []);
  assert.equal(c.flush(), "そうですね");
});

test("carries a too-short sentence into the next chunk", () => {
  const c = createChunker(6);
  // 「はい。」 is 3 chars — below minLength 6, so it merges with the next sentence
  assert.deepEqual(c.push("はい。今日は映画を見ました。"), ["はい。今日は映画を見ました。"]);
});

test("flush returns null when nothing is buffered", () => {
  const c = createChunker(6);
  assert.equal(c.flush(), null);
});
