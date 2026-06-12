import test from "node:test";
import assert from "node:assert/strict";
import { stripNoise, classify } from "./normalize.js";

test("stripNoise removes punctuation and whitespace, keeps long-vowel mark", () => {
  assert.equal(stripNoise("えーと、駅は どこですか。"), "えーと駅はどこですか");
});

test("stripNoise folds full-width forms via NFKC", () => {
  assert.equal(stripNoise("ＪＬＰＴ？"), "JLPT");
});

test("classify: transcript matching flawed text is preserved", () => {
  const v = classify({
    transcript: "くすりを たべました。",
    flawed: "くすりをたべました",
    corrected: "くすりをのみました",
  });
  assert.equal(v, "preserved");
});

test("classify: transcript matching corrected text is normalized", () => {
  const v = classify({
    transcript: "くすりをのみました。",
    flawed: "くすりをたべました",
    corrected: "くすりをのみました",
  });
  assert.equal(v, "normalized");
});

test("classify: transcript matching neither needs review", () => {
  const v = classify({
    transcript: "くすりをかいました",
    flawed: "くすりをたべました",
    corrected: "くすりをのみました",
  });
  assert.equal(v, "review");
});

test("classify: control sentence transcribed exactly is control_ok", () => {
  const v = classify({
    transcript: "きょうはいいてんきですね。",
    flawed: "きょうはいいてんきですね",
    corrected: "きょうはいいてんきですね",
  });
  assert.equal(v, "control_ok");
});

test("classify: control sentence transcribed wrong is review", () => {
  const v = classify({
    transcript: "きょうはいいてんきでした",
    flawed: "きょうはいいてんきですね",
    corrected: "きょうはいいてんきですね",
  });
  assert.equal(v, "review");
});
