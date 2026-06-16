import test from "node:test";
import assert from "node:assert/strict";
import { errorRegion, overlapVerdict, normalizeClass, classMatches } from "./scoring.js";

// errorRegion: the differing slice of `flawed` vs `corrected`
test("errorRegion finds the single differing character", () => {
  // コーヒーが飲みます vs コーヒーを飲みます → the differing char is が (index 4)
  const r = errorRegion("コーヒーが飲みます", "コーヒーを飲みます");
  assert.deepEqual(r, { start: 4, end: 5 });
});

test("errorRegion handles insertion (flawed shorter)", () => {
  // 読むできません vs 読むことができません → flawed is missing こと…が; region is where they diverge
  const r = errorRegion("漢字を読むできません", "漢字を読むことができません");
  assert.equal(r.start, 5); // diverge right after 読む
  assert.equal(r.end, r.start); // pure insertion ⇒ zero-width region in `flawed`
});

test("errorRegion of identical strings is empty", () => {
  const r = errorRegion("今日はいい天気ですね", "今日はいい天気ですね");
  assert.equal(r.start, r.end);
});

// overlapVerdict: does the model's flagged `original` cover the error region?
test("overlapVerdict yes when original contains the error region", () => {
  const v = overlapVerdict("が", "コーヒーが飲みます", "コーヒーを飲みます");
  assert.equal(v, "yes");
});

test("overlapVerdict yes when original is a wider clause covering the error", () => {
  const v = overlapVerdict("コーヒーが", "コーヒーが飲みます", "コーヒーを飲みます");
  assert.equal(v, "yes");
});

test("overlapVerdict no when original is a real substring elsewhere", () => {
  const v = overlapVerdict("飲みます", "コーヒーが飲みます", "コーヒーを飲みます");
  assert.equal(v, "no");
});

test("overlapVerdict ambiguous when original is not a substring of flawed", () => {
  const v = overlapVerdict("コーヒーを", "コーヒーが飲みます", "コーヒーを飲みます");
  assert.equal(v, "ambiguous");
});

test("overlapVerdict ambiguous on a pure-insertion error (zero-width region)", () => {
  // flawed is shorter (missing ことが) → zero-width region → can't decide → ambiguous
  const v = overlapVerdict("読む", "漢字を読むできません", "漢字を読むことができません");
  assert.equal(v, "ambiguous");
});

// normalizeClass: map model-emitted class strings to the taxonomy
test("normalizeClass maps exact taxonomy labels", () => {
  assert.equal(normalizeClass("particle"), "particle");
});

test("normalizeClass maps common synonyms and casing", () => {
  assert.equal(normalizeClass("Particle"), "particle");
  assert.equal(normalizeClass("word order"), "word-order");
  assert.equal(normalizeClass("vocabulary"), "word-choice");
  assert.equal(normalizeClass("verb conjugation"), "conjugation");
});

test("normalizeClass returns unknown for unrecognized labels", () => {
  assert.equal(normalizeClass("spelling"), "unknown");
});

test("classMatches compares against ground-truth class", () => {
  assert.equal(classMatches("Particle", "particle"), true);
  assert.equal(classMatches("word order", "word-order"), true);
  assert.equal(classMatches("particle", "conjugation"), false);
});
