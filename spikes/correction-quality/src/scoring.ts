// spikes/correction-quality/src/scoring.ts
import type { ErrorClass } from "./taxonomy.js";

export interface Region { start: number; end: number }

// The differing slice of `flawed` relative to `corrected`, by common
// prefix/suffix. Approximate by design — ambiguous cases fall to manual review.
export function errorRegion(flawed: string, corrected: string): Region {
  let start = 0;
  const minLen = Math.min(flawed.length, corrected.length);
  while (start < minLen && flawed[start] === corrected[start]) start++;
  let endF = flawed.length;
  let endC = corrected.length;
  while (endF > start && endC > start && flawed[endF - 1] === corrected[endC - 1]) {
    endF--;
    endC--;
  }
  return { start, end: Math.max(start, endF) };
}

export type Overlap = "yes" | "no" | "ambiguous";

// Does the model's flagged `original` cover the error region of `flawed`?
// - not a substring of flawed        → "ambiguous" (hand-review)
// - substring overlapping the region  → "yes"
// - substring not touching the region → "no"
export function overlapVerdict(original: string, flawed: string, corrected: string): Overlap {
  if (!original) return "ambiguous";
  // NB: first occurrence only — if `original` repeats and the earlier copy isn't the
  // error, this can yield a wrong "no". Rare in the corpus; manual review backstops it.
  const idx = flawed.indexOf(original);
  if (idx === -1) return "ambiguous";
  const region = errorRegion(flawed, corrected);
  // Zero-width region = pure insertion (or identical strings): we can't locate the
  // error span by prefix/suffix diff, so we can't confidently say yes/no. Route to
  // manual review rather than falsely reporting a confident "no".
  if (region.end <= region.start) return "ambiguous";
  const spanStart = idx;
  const spanEnd = idx + original.length;
  const overlaps = spanStart < region.end && spanEnd > region.start;
  return overlaps ? "yes" : "no";
}

const CLASS_SYNONYMS: Record<string, ErrorClass> = {
  "particle": "particle",
  "particles": "particle",
  "conjugation": "conjugation",
  "verb conjugation": "conjugation",
  "verb-conjugation": "conjugation",
  "tense": "conjugation",
  "word-order": "word-order",
  "word order": "word-order",
  "order": "word-order",
  "word-choice": "word-choice",
  "word choice": "word-choice",
  "vocabulary": "word-choice",
  "vocab": "word-choice",
  "lexical": "word-choice",
  "register": "register",
  "politeness": "register",
  "formality": "register",
};

export function normalizeClass(raw: string): ErrorClass | "unknown" {
  return CLASS_SYNONYMS[raw.trim().toLowerCase()] ?? "unknown";
}

export function classMatches(modelClass: string, truthClass: ErrorClass): boolean {
  return normalizeClass(modelClass) === truthClass;
}
