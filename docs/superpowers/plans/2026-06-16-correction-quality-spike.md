# Correction-Quality Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone spike that measures whether `gpt-4o-mini` is good enough to ship as the product's parallel correction pass — catch rate, false-positive (over-correction) rate, classification accuracy, plus an `gpt-4o` LLM-judge on correction-acceptability and explanation quality — across isolated vs conversationally-framed inputs.

**Architecture:** A self-contained TypeScript package at `spikes/correction-quality/`, run with `tsx`, mirroring the two existing spikes. Data-as-code sentence set (imports spike 1's corpus + expanded controls). Pipeline stages each cache to disk and are individually re-runnable: `correct` (gpt-4o-mini → `out/corrections.json`) → `judge` (gpt-4o → `out/judgments.json`) → `score` (deterministic metrics + merged judge verdicts → `out/results.md` + `out/review.md`). Pure scoring functions live in `scoring.ts` and are the only unit-tested code, per the spec's spike-grade testing rule.

**Tech Stack:** TypeScript (ESM, NodeNext), tsx, OpenAI SDK, dotenv, Node's built-in test runner. No kuroshiro (scoring is span/label/JSON, not orthographic folding).

**Spec:** `docs/superpowers/specs/2026-06-16-correction-quality-spike-design.md`

---

## File Structure

```
spikes/correction-quality/
  package.json          # standalone — own deps, tsx scripts
  tsconfig.json         # matches the other spikes
  .gitignore            # ignore node_modules
  src/config.ts         # ROOT, model ids, temperature, thresholds, prompts
  src/types.ts          # shared TS interfaces (corrections, judgments)
  src/taxonomy.ts       # v1 mistake taxonomy (data-as-code)
  src/sentences.ts      # imports spike-1 corpus + expanded controls
  src/frame.ts          # isolated vs framed message construction
  src/scoring.ts        # PURE deterministic scoring functions (unit-tested)
  src/scoring.test.ts   # the one unit test
  src/correct.ts        # gpt-4o-mini correction pass → out/corrections.json
  src/judge.ts          # gpt-4o judge → out/judgments.json
  src/score.ts          # deterministic + judge merge → out/results.md, out/review.md
  out/                  # committed evidence (corrections, judgments, results)
```

A note on cross-package import: `sentences.ts` imports spike 1's `SENTENCES`
array via the relative path `../../stt-fidelity/src/sentences.js`. `tsx` resolves
this at runtime; spike 1's `sentences.ts` has no side effects or dependencies, so
the import is safe. This is the same "reach into spike 1 in place" precedent the
latency spike set by reading `../stt-fidelity/audio/`.

---

## Task 1: Scaffold the package

**Files:**
- Create: `spikes/correction-quality/package.json`
- Create: `spikes/correction-quality/tsconfig.json`
- Create: `spikes/correction-quality/.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "correction-quality-spike",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --import tsx --test src/scoring.test.ts",
    "correct": "tsx src/correct.ts",
    "judge": "tsx src/judge.ts",
    "score": "tsx src/score.ts"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "openai": "^4.70.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`** (identical to the other spikes)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 4: Install dependencies**

Run: `cd spikes/correction-quality && npm install`
Expected: `node_modules/` created, `package-lock.json` written, no errors.

- [ ] **Step 5: Commit**

```bash
git add spikes/correction-quality/package.json spikes/correction-quality/tsconfig.json spikes/correction-quality/.gitignore spikes/correction-quality/package-lock.json
git commit -m "Scaffold correction-quality spike package"
```

---

## Task 2: Taxonomy and shared types

**Files:**
- Create: `spikes/correction-quality/src/taxonomy.ts`
- Create: `spikes/correction-quality/src/types.ts`

- [ ] **Step 1: Create `taxonomy.ts`** — the v1 mistake taxonomy as data-as-code

```ts
// spikes/correction-quality/src/taxonomy.ts

// v1 mistake taxonomy. `errorClass` values the correction pass may emit are the
// non-"none" classes. "none" is the control marker (no error present).
export type ErrorClass =
  | "particle"
  | "conjugation"
  | "word-order"
  | "word-choice"
  | "register"
  | "filler"
  | "none";

// Classes the correction pass is allowed to flag (filler/none are never flagged).
export const FLAGGABLE_CLASSES: ErrorClass[] = [
  "particle",
  "conjugation",
  "word-order",
  "word-choice",
  "register",
];

export type Treatment = "correct" | "context-dependent" | "never-flag";

export interface TaxonomyEntry {
  errorClass: ErrorClass;
  definition: string;
  example: string;
  treatment: Treatment;
}

export const TAXONOMY: TaxonomyEntry[] = [
  { errorClass: "particle",     definition: "Wrong or missing particle (は/が, に/で, を).", example: "コーヒーが飲みます → を", treatment: "correct" },
  { errorClass: "conjugation",  definition: "Wrong verb/adjective form or tense.",          example: "昨日映画を見ます → 見ました", treatment: "correct" },
  { errorClass: "word-order",   definition: "Unnatural ordering of constituents.",          example: "行きたいとても → とても行きたい", treatment: "correct" },
  { errorClass: "word-choice",  definition: "Wrong-but-plausible vocabulary.",              example: "薬を食べる → 飲む", treatment: "correct" },
  { errorClass: "register",     definition: "Casual mid-polite or vice versa.",             example: "先生、休むね → 休みます", treatment: "context-dependent" },
  { errorClass: "filler",       definition: "Fillers/hesitations (えーと、あの).",          example: "えーと、駅は…", treatment: "never-flag" },
  { errorClass: "none",         definition: "No error present (control).",                  example: "今日はいい天気ですね。", treatment: "never-flag" },
];
```

- [ ] **Step 2: Create `types.ts`** — shared interfaces for the pipeline stages

```ts
// spikes/correction-quality/src/types.ts
import type { ErrorClass } from "./taxonomy.js";

export type Framing = "isolated" | "framed";

// One correction the model proposes for a single utterance.
export interface CorrectionItem {
  original: string;     // the span of the learner's text the model flags
  suggestion: string;   // the proposed fix
  errorClass: string;   // model-provided; validated/normalized at scoring time
  explanation: string;  // learner-facing, Japanese
}

// One correction-pass call result (cached in out/corrections.json).
export interface CorrectionEntry {
  sentenceId: string;
  framing: Framing;
  model: string;
  corrections: CorrectionItem[];
  at: string;
}

// One judge verdict over a single proposed correction (cached in out/judgments.json).
export interface JudgmentEntry {
  sentenceId: string;
  framing: Framing;
  correctionIndex: number;
  model: string;
  acceptable: boolean;
  explanationQuality: "pass" | "borderline" | "fail";
  reason: string;
  at: string;
}

export type { ErrorClass };
```

- [ ] **Step 3: Type-check the two files compile** (no test — pure declarations)

Run: `cd spikes/correction-quality && npx tsc --noEmit`
Expected: no output, exit 0.

- [ ] **Step 4: Commit**

```bash
git add spikes/correction-quality/src/taxonomy.ts spikes/correction-quality/src/types.ts
git commit -m "Add v1 mistake taxonomy and pipeline types"
```

---

## Task 3: Sentence set (import spike 1 + expanded controls)

**Files:**
- Create: `spikes/correction-quality/src/sentences.ts`

- [ ] **Step 1: Create `sentences.ts`**

```ts
// spikes/correction-quality/src/sentences.ts
import { SENTENCES as STT_SENTENCES } from "../../stt-fidelity/src/sentences.js";
import type { ErrorClass } from "./taxonomy.js";

export interface TestSentence {
  id: string;
  errorClass: ErrorClass;
  /** What the learner says. For controls, identical to corrected. */
  flawed: string;
  /** The natural/correct version. */
  corrected: string;
  note: string;
  /** Optional partner line for the framed condition. Defaults to a polite frame. */
  frame?: string;
}

// Spike 1 used errorClass "control" for correct sentences; this spike's taxonomy
// calls that "none". Map on import; everything else carries over unchanged.
const imported: TestSentence[] = STT_SENTENCES.map((s) => ({
  id: s.id,
  errorClass: (s.errorClass === "control" ? "none" : s.errorClass) as ErrorClass,
  flawed: s.flawed,
  corrected: s.corrected,
  note: s.note,
}));

// Expanded controls: the over-correction metric otherwise rests on spike 1's 4
// controls alone. These deliberately span the traps a nervous model might "fix".
// All are correct Japanese (flawed === corrected, errorClass "none").
const addedControls: TestSentence[] = [
  // clean polite
  { id: "cc1", errorClass: "none", flawed: "週末は家族と公園に行きました。", corrected: "週末は家族と公園に行きました。", note: "clean polite" },
  { id: "cc2", errorClass: "none", flawed: "この本はとても面白かったです。", corrected: "この本はとても面白かったです。", note: "clean polite" },
  // clean casual/plain — correct under a casual frame
  { id: "cc3", errorClass: "none", flawed: "昨日は友達と映画を見に行ったよ。", corrected: "昨日は友達と映画を見に行ったよ。", note: "clean casual", frame: "ねえ、昨日何してたの？" },
  { id: "cc4", errorClass: "none", flawed: "今日はちょっと疲れたね。", corrected: "今日はちょっと疲れたね。", note: "clean casual", frame: "おつかれ！今日どうだった？" },
  { id: "cc5", errorClass: "none", flawed: "うん、コーヒーが好きだから毎朝飲んでる。", corrected: "うん、コーヒーが好きだから毎朝飲んでる。", note: "clean casual", frame: "コーヒーって好き？" },
  // correct but filler-laden — fillers must NOT be flagged
  { id: "cc6", errorClass: "none", flawed: "えーと、私は東京に住んでいます。", corrected: "えーと、私は東京に住んでいます。", note: "filler-laden, no error" },
  { id: "cc7", errorClass: "none", flawed: "あの、すみません、これはいくらですか。", corrected: "あの、すみません、これはいくらですか。", note: "filler-laden, no error" },
  // marginal-but-acceptable — natural, slightly loose, not wrong
  { id: "cc8", errorClass: "none", flawed: "今度の休み、温泉でも行こうかなと思って。", corrected: "今度の休み、温泉でも行こうかなと思って。", note: "marginal: natural trailing-off, acceptable", frame: "連休は何か予定ある？" },
  { id: "cc9", errorClass: "none", flawed: "まあ、そうですね、悪くないと思います。", corrected: "まあ、そうですね、悪くないと思います。", note: "marginal: hedged but correct" },
];

export const SENTENCES: TestSentence[] = [...imported, ...addedControls];

// Default framed-condition partner line for sentences that don't specify one.
export const DEFAULT_FRAME = "今日はどんな一日でしたか？";
```

- [ ] **Step 2: Verify the set loads, ids are unique, and controls are well-formed**

Run:
```bash
cd spikes/correction-quality && npx tsx -e "import('./src/sentences.ts').then(({SENTENCES})=>{const ids=SENTENCES.map(s=>s.id);const dup=ids.filter((id,i)=>ids.indexOf(id)!==i);const badControls=SENTENCES.filter(s=>s.errorClass==='none'&&s.flawed!==s.corrected);console.log('total',SENTENCES.length,'controls',SENTENCES.filter(s=>s.errorClass==='none').length,'dups',dup,'badControls',badControls.map(s=>s.id));})"
```
Expected: `total 30 controls 13 dups [] badControls []` (counts: 26 imported [17 flawed + 4 control→none] ... actually 21 imported + 9 added = 30; controls = 4 imported-as-none + 9 added = 13). No duplicate ids, no malformed controls.

- [ ] **Step 3: Commit**

```bash
git add spikes/correction-quality/src/sentences.ts
git commit -m "Add sentence set: import spike-1 corpus + expanded over-correction controls"
```

---

## Task 4: Deterministic scoring functions (the one unit-tested module)

**Files:**
- Create: `spikes/correction-quality/src/scoring.ts`
- Test: `spikes/correction-quality/src/scoring.test.ts`

This is the only unit-tested code in the spike (spec: "exactly one unit test: the
deterministic scorer"). Write the tests first.

- [ ] **Step 1: Write the failing test `scoring.test.ts`**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd spikes/correction-quality && npm test`
Expected: FAIL — `Cannot find module './scoring.js'` (or "errorRegion is not a function").

- [ ] **Step 3: Implement `scoring.ts`**

```ts
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
  const idx = flawed.indexOf(original);
  if (idx === -1) return "ambiguous";
  const region = errorRegion(flawed, corrected);
  // zero-width region (identical strings) can't be overlapped
  if (region.end <= region.start) return "no";
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd spikes/correction-quality && npm test`
Expected: all tests pass (`# pass 12`, `# fail 0`).

- [ ] **Step 5: Commit**

```bash
git add spikes/correction-quality/src/scoring.ts spikes/correction-quality/src/scoring.test.ts
git commit -m "Add deterministic scoring functions with unit tests"
```

---

## Task 5: Config and prompts

**Files:**
- Create: `spikes/correction-quality/src/config.ts`

- [ ] **Step 1: Create `config.ts`**

```ts
// spikes/correction-quality/src/config.ts
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
export const OUT_DIR = path.join(ROOT, "out");

// The pre-registered correction prompt. The spike's verdict is conditional on
// THIS prompt (see spec limitations); it is committed so results are interpretable.
export const CORRECTION_SYSTEM_PROMPT = `あなたは日本語学習者の発話をチェックする校正アシスタントです。相手はJLPT N4〜N2の中級学習者です。学習者の日本語に、不自然な点や文法的な誤りがあれば指摘してください。

ルール：
- あなたは会話を止めないための裏方です。指摘は後でまとめて学習者に見せます。会話相手ではありません。
- 「えーと」「あの」などのフィラーや言いよどみは誤りではありません。絶対に指摘しないでください。
- カジュアルな口調そのものは誤りではありません。会話相手の口調や場面に対して不適切な場合のみ、register（丁寧さ）の問題として指摘してください。
- 自然で正しい文には何も指摘しないでください。無理に直さないでください。迷ったら指摘しないでください。
- errorClass は次のいずれかだけを使ってください：particle, conjugation, word-order, word-choice, register。
- explanation は中級学習者向けに、日本語で1〜2文の短い説明にしてください。
- 出力は必ず次のJSON形式のみ。前後に文章を付けないでください：
{"corrections": [{"original": "誤った部分の原文", "suggestion": "修正案", "errorClass": "種類", "explanation": "短い説明"}]}
指摘がなければ {"corrections": []} を返してください。`;

// The judge grades ONE proposed correction against a reference rubric.
export function judgeSystemPrompt(): string {
  return `あなたは日本語教育の専門家として、校正アシスタントが出した1件の指摘を評価します。

入力として、学習者の元の文、参照（正しい例）、誤りの説明（rubric）、そして校正アシスタントの指摘（original / suggestion / errorClass / explanation）が与えられます。

次の2点を判定してください：
1. acceptable: suggestion は学習者の誤りを解消する、自然で正しい日本語ですか？ 参照と完全に一致しなくても、妥当な修正であれば true。誤りを直せていない、または新たな誤りを生んでいる場合は false。
2. explanationQuality: explanation は正確で、中級学習者の役に立ちますか？ "pass"（正確で役立つ）/ "borderline"（間違ってはいないが弱い）/ "fail"（不正確または誤解を招く）。

出力は必ず次のJSON形式のみ：
{"acceptable": true, "explanationQuality": "pass", "reason": "短い理由"}`;
}

export const CONFIG = {
  // Model under test — the planned cheap correction pass.
  correctionModel: "gpt-4o-mini",
  // Stronger judge model (different role, not a comparison).
  judgeModel: "gpt-4o",
  // Pinned for stable reruns and an honest cache (spec).
  temperature: 0,
  maxTokens: 800,
  framings: ["isolated", "framed"] as const,
  // Pre-registered decision thresholds.
  thresholds: {
    catch: 0.85,         // >= of flawed sentences flagged
    controlClean: 0.90,  // >= of controls left untouched
    acceptable: 0.90,    // >= of caught errors judged acceptable
    classify: 0.80,      // soft bar for classification usefulness
  },
  // Rough cost estimate per call for the running total (gpt-4o-mini ~ $0.0002,
  // gpt-4o judge ~ $0.005 per short call).
  estUsd: { correct: 0.0002, judge: 0.005 },
};
```

- [ ] **Step 2: Verify config loads and ROOT resolves**

Run: `cd spikes/correction-quality && npx tsx -e "import('./src/config.ts').then(({CONFIG,OUT_DIR})=>console.log(CONFIG.correctionModel, CONFIG.judgeModel, OUT_DIR))"`
Expected: prints `gpt-4o-mini gpt-4o /…/spikes/correction-quality/out`.

- [ ] **Step 3: Commit**

```bash
git add spikes/correction-quality/src/config.ts
git commit -m "Add config: models, temperature=0, thresholds, correction + judge prompts"
```

---

## Task 6: Message framing

**Files:**
- Create: `spikes/correction-quality/src/frame.ts`

- [ ] **Step 1: Create `frame.ts`**

```ts
// spikes/correction-quality/src/frame.ts
import type { TestSentence } from "./sentences.js";
import { DEFAULT_FRAME } from "./sentences.js";
import type { Framing } from "./types.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Build the conversation the correction pass sees (system prompt added by caller).
// - isolated: just the learner's utterance as a lone user message.
// - framed:   a one-line partner turn (assistant) the learner is replying to,
//             then the learner's utterance. This is what makes register verdicts
//             well-defined and lets context suppress over-correction.
export function buildMessages(s: TestSentence, framing: Framing): ChatMessage[] {
  if (framing === "isolated") {
    return [{ role: "user", content: s.flawed }];
  }
  const partnerLine = s.frame ?? DEFAULT_FRAME;
  return [
    { role: "assistant", content: partnerLine },
    { role: "user", content: s.flawed },
  ];
}
```

- [ ] **Step 2: Verify framing for one flawed and one casual control**

Run:
```bash
cd spikes/correction-quality && npx tsx -e "import('./src/sentences.ts').then(async ({SENTENCES})=>{const {buildMessages}=await import('./src/frame.ts');const p1=SENTENCES.find(s=>s.id==='p1');const cc3=SENTENCES.find(s=>s.id==='cc3');console.log(JSON.stringify(buildMessages(p1,'isolated')));console.log(JSON.stringify(buildMessages(cc3,'framed')));})"
```
Expected: isolated p1 = one user message with the flawed sentence; framed cc3 = assistant line `ねえ、昨日何してたの？` then the user sentence.

- [ ] **Step 3: Commit**

```bash
git add spikes/correction-quality/src/frame.ts
git commit -m "Add isolated vs framed message construction"
```

---

## Task 7: Correction pass (live gpt-4o-mini)

**Files:**
- Create: `spikes/correction-quality/src/correct.ts`

API-wrapper script — no unit test (spec). Verified by a cached live run.

- [ ] **Step 1: Create `correct.ts`**

```ts
// spikes/correction-quality/src/correct.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { SENTENCES } from "./sentences.js";
import { buildMessages } from "./frame.js";
import { CONFIG, OUT_DIR, CORRECTION_SYSTEM_PROMPT } from "./config.js";
import type { CorrectionEntry, CorrectionItem, Framing } from "./types.js";

const CORRECTIONS_FILE = path.join(OUT_DIR, "corrections.json");
const client = new OpenAI();

function load(): CorrectionEntry[] {
  return fs.existsSync(CORRECTIONS_FILE)
    ? (JSON.parse(fs.readFileSync(CORRECTIONS_FILE, "utf8")) as CorrectionEntry[])
    : [];
}

function save(entries: CorrectionEntry[]): void {
  const tmp = CORRECTIONS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
  fs.renameSync(tmp, CORRECTIONS_FILE);
}

function parseCorrections(raw: string, key: string): CorrectionItem[] {
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch {
    console.warn(`[WARN] ${key}: non-JSON reply, treating as no corrections: ${raw.slice(0, 80)}`);
    return [];
  }
  const list = Array.isArray(obj?.corrections) ? obj.corrections : [];
  return list.map((c: any) => ({
    original: String(c?.original ?? ""),
    suggestion: String(c?.suggestion ?? ""),
    errorClass: String(c?.errorClass ?? ""),
    explanation: String(c?.explanation ?? ""),
  }));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = load();
  const done = new Set(entries.map((e) => `${e.sentenceId}:${e.framing}:${e.model}`));
  let ran = 0, skipped = 0, estUsd = 0;

  for (const s of SENTENCES) {
    for (const framing of CONFIG.framings as readonly Framing[]) {
      const key = `${s.id}:${framing}:${CONFIG.correctionModel}`;
      if (done.has(key)) { skipped++; continue; }

      const res = await client.chat.completions.create({
        model: CONFIG.correctionModel,
        temperature: CONFIG.temperature,
        max_tokens: CONFIG.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CORRECTION_SYSTEM_PROMPT },
          ...buildMessages(s, framing),
        ],
      });
      const raw = res.choices[0]?.message?.content ?? "";
      const corrections = parseCorrections(raw, key);

      entries.push({
        sentenceId: s.id, framing, model: CONFIG.correctionModel,
        corrections, at: new Date().toISOString(),
      });
      save(entries); // crash-safe: write after every call
      estUsd += CONFIG.estUsd.correct;
      ran++;
      console.log(`${key} → ${corrections.length} correction(s)`);
    }
  }

  console.log(`\n${ran} calls run, ${skipped} skipped (cached)`);
  console.log(`est. cost this run: $${estUsd.toFixed(4)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Create a `.env` with the OpenAI key** (the same key from spikes 1–2)

Run: confirm `spikes/correction-quality/.env` exists with `OPENAI_API_KEY=...`. (Reuse the key; `.env` is already gitignored via the root `.gitignore`. If not present, copy from `../stt-fidelity/.env`.)

- [ ] **Step 3: Smoke-test on two sentences first** (cheap sanity check before the full run)

Run:
```bash
cd spikes/correction-quality && npx tsx -e "import('./src/sentences.ts').then(async ({SENTENCES})=>{const OpenAI=(await import('openai')).default;await import('dotenv/config');const {CONFIG,CORRECTION_SYSTEM_PROMPT}=await import('./src/config.ts');const {buildMessages}=await import('./src/frame.ts');const c=new OpenAI();for(const id of ['p1','c1']){const s=SENTENCES.find(x=>x.id===id);const r=await c.chat.completions.create({model:CONFIG.correctionModel,temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:CORRECTION_SYSTEM_PROMPT},...buildMessages(s,'isolated')]});console.log(id,r.choices[0].message.content);}})"
```
Expected: `p1` returns a JSON object with a `corrections` array containing a particle fix (を for が); `c1` returns `{"corrections": []}`. If `c1` returns a flag, the prompt is over-correcting — note it but proceed (the spike measures exactly this).

- [ ] **Step 4: Run the full correction pass**

Run: `cd spikes/correction-quality && npm run correct`
Expected: ~60 lines (`<id>:<framing>:gpt-4o-mini → N correction(s)`), `out/corrections.json` written, est. cost printed (well under $1). Re-running prints all skipped.

- [ ] **Step 5: Commit the code and the evidence**

```bash
git add spikes/correction-quality/src/correct.ts spikes/correction-quality/out/corrections.json
git commit -m "Add correction pass and run gpt-4o-mini over the corpus"
```

---

## Task 8: Judge pass (live gpt-4o)

**Files:**
- Create: `spikes/correction-quality/src/judge.ts`

- [ ] **Step 1: Create `judge.ts`**

```ts
// spikes/correction-quality/src/judge.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { SENTENCES, type TestSentence } from "./sentences.js";
import { CONFIG, OUT_DIR, judgeSystemPrompt } from "./config.js";
import type { CorrectionEntry, JudgmentEntry } from "./types.js";

const CORRECTIONS_FILE = path.join(OUT_DIR, "corrections.json");
const JUDGMENTS_FILE = path.join(OUT_DIR, "judgments.json");
const client = new OpenAI();

function load(): JudgmentEntry[] {
  return fs.existsSync(JUDGMENTS_FILE)
    ? (JSON.parse(fs.readFileSync(JUDGMENTS_FILE, "utf8")) as JudgmentEntry[])
    : [];
}

function save(entries: JudgmentEntry[]): void {
  const tmp = JUDGMENTS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
  fs.renameSync(tmp, JUDGMENTS_FILE);
}

function userPayload(s: TestSentence, c: CorrectionEntry["corrections"][number]): string {
  return JSON.stringify({
    学習者の元の文: s.flawed,
    参照_正しい例: s.corrected,
    誤りの説明_rubric: s.note,
    指摘: { original: c.original, suggestion: c.suggestion, errorClass: c.errorClass, explanation: c.explanation },
  });
}

async function main() {
  const corrections = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, "utf8")) as CorrectionEntry[];
  const byId = new Map<string, TestSentence>(SENTENCES.map((s) => [s.id, s]));
  const entries = load();
  const done = new Set(entries.map((e) => `${e.sentenceId}:${e.framing}:${e.correctionIndex}:${e.model}`));
  let ran = 0, skipped = 0, estUsd = 0;

  for (const ce of corrections) {
    const s = byId.get(ce.sentenceId);
    if (!s) throw new Error(`unknown sentence id ${ce.sentenceId}`);
    // Judge only flagged corrections on non-control sentences; acceptability needs
    // a reference error. Corrections on controls are deterministic false positives.
    if (s.errorClass === "none") continue;

    for (let i = 0; i < ce.corrections.length; i++) {
      const key = `${ce.sentenceId}:${ce.framing}:${i}:${CONFIG.judgeModel}`;
      if (done.has(key)) { skipped++; continue; }

      const res = await client.chat.completions.create({
        model: CONFIG.judgeModel,
        temperature: CONFIG.temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: judgeSystemPrompt() },
          { role: "user", content: userPayload(s, ce.corrections[i]) },
        ],
      });
      const raw = res.choices[0]?.message?.content ?? "{}";
      let v: any = {};
      try { v = JSON.parse(raw); } catch { console.warn(`[WARN] ${key}: non-JSON judge reply`); }

      entries.push({
        sentenceId: ce.sentenceId, framing: ce.framing, correctionIndex: i,
        model: CONFIG.judgeModel,
        acceptable: Boolean(v?.acceptable),
        explanationQuality: ["pass", "borderline", "fail"].includes(v?.explanationQuality) ? v.explanationQuality : "fail",
        reason: String(v?.reason ?? ""),
        at: new Date().toISOString(),
      });
      save(entries); // crash-safe
      estUsd += CONFIG.estUsd.judge;
      ran++;
      console.log(`${key} → acceptable=${entries[entries.length - 1].acceptable} expl=${entries[entries.length - 1].explanationQuality}`);
    }
  }

  console.log(`\n${ran} judgments run, ${skipped} skipped (cached)`);
  console.log(`est. cost this run: $${estUsd.toFixed(4)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the judge pass**

Run: `cd spikes/correction-quality && npm run judge`
Expected: one line per proposed correction on a flawed sentence (`acceptable=…  expl=…`), `out/judgments.json` written, est. cost printed. Controls are skipped (judge never runs on `none`).

- [ ] **Step 3: Commit the code and evidence**

```bash
git add spikes/correction-quality/src/judge.ts spikes/correction-quality/out/judgments.json
git commit -m "Add judge pass and run gpt-4o over proposed corrections"
```

---

## Task 9: Scoring aggregator → results.md + review.md

**Files:**
- Create: `spikes/correction-quality/src/score.ts`

- [ ] **Step 1: Create `score.ts`**

```ts
// spikes/correction-quality/src/score.ts
import fs from "node:fs";
import path from "node:path";
import { SENTENCES, type TestSentence } from "./sentences.js";
import { CONFIG, OUT_DIR } from "./config.js";
import { overlapVerdict, classMatches } from "./scoring.js";
import type { CorrectionEntry, JudgmentEntry, Framing } from "./types.js";

const CORRECTIONS_FILE = path.join(OUT_DIR, "corrections.json");
const JUDGMENTS_FILE = path.join(OUT_DIR, "judgments.json");
const RESULTS_FILE = path.join(OUT_DIR, "results.md");
const REVIEW_FILE = path.join(OUT_DIR, "review.md");

const pct = (n: number, d: number) => (d === 0 ? "—" : `${Math.round((100 * n) / d)}% (${n}/${d})`);

async function main() {
  const corrections = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, "utf8")) as CorrectionEntry[];
  const judgments = fs.existsSync(JUDGMENTS_FILE)
    ? (JSON.parse(fs.readFileSync(JUDGMENTS_FILE, "utf8")) as JudgmentEntry[]) : [];
  const byId = new Map<string, TestSentence>(SENTENCES.map((s) => [s.id, s]));
  const judgeBy = new Map<string, JudgmentEntry>(
    judgments.map((j) => [`${j.sentenceId}:${j.framing}:${j.correctionIndex}`, j]));

  const framings = CONFIG.framings as readonly Framing[];
  const review: string[] = [];

  // Aggregate per framing.
  interface Agg { caughtN: number; flawedN: number; acceptN: number; acceptDen: number;
    classN: number; classDen: number; controlCleanN: number; controlN: number; }
  const agg: Record<Framing, Agg> = {
    isolated: { caughtN: 0, flawedN: 0, acceptN: 0, acceptDen: 0, classN: 0, classDen: 0, controlCleanN: 0, controlN: 0 },
    framed:   { caughtN: 0, flawedN: 0, acceptN: 0, acceptDen: 0, classN: 0, classDen: 0, controlCleanN: 0, controlN: 0 },
  };

  for (const ce of corrections) {
    const s = byId.get(ce.sentenceId)!;
    const a = agg[ce.framing];

    if (s.errorClass === "none") {
      a.controlN++;
      if (ce.corrections.length === 0) a.controlCleanN++;
      else review.push(
        `## ${ce.sentenceId}/${ce.framing} — CONTROL flagged (false positive?)\n` +
        `- sentence: ${s.flawed}\n- flags: ${ce.corrections.map((c) => `${c.original}→${c.suggestion} [${c.errorClass}]`).join("; ")}\n- tag: \n`);
      continue;
    }

    // Flawed sentence: did any correction overlap the known error region?
    a.flawedN++;
    let caught = false;
    let ambiguous = false;
    let catchIndex = -1;
    ce.corrections.forEach((c, i) => {
      const v = overlapVerdict(c.original, s.flawed, s.corrected);
      if (v === "yes" && !caught) { caught = true; catchIndex = i; }
      if (v === "ambiguous") ambiguous = true;
    });

    if (caught) {
      a.caughtN++;
      // classification accuracy on the catching correction
      a.classDen++;
      if (classMatches(ce.corrections[catchIndex].errorClass, s.errorClass)) a.classN++;
      // acceptability from the judge on the catching correction
      const j = judgeBy.get(`${ce.sentenceId}:${ce.framing}:${catchIndex}`);
      if (j) { a.acceptDen++; if (j.acceptable) a.acceptN++; }
    } else if (ambiguous || ce.corrections.length > 0) {
      review.push(
        `## ${ce.sentenceId}/${ce.framing} — no clean catch (review)\n` +
        `- flawed:    ${s.flawed}\n- corrected: ${s.corrected}\n- note:      ${s.note}\n` +
        `- flags: ${ce.corrections.map((c) => `${c.original}→${c.suggestion} [${c.errorClass}]`).join("; ") || "(none)"}\n- tag: \n`);
    }
  }

  // --- results.md ---
  const L: string[] = ["# Correction-quality results", "",
    `Model under test: \`${CONFIG.correctionModel}\` · judge: \`${CONFIG.judgeModel}\` · temperature ${CONFIG.temperature}`, "",
    "## Headline metrics (per framing)", "",
    "| metric | isolated | framed | threshold |", "|---|---|---|---|"];
  for (const f of framings) { /* placeholder to keep column order */ void f; }
  const row = (label: string, pick: (a: Agg) => string, thr: string) =>
    L.push(`| ${label} | ${pick(agg.isolated)} | ${pick(agg.framed)} | ${thr} |`);
  row("catch rate", (a) => pct(a.caughtN, a.flawedN), `≥ ${CONFIG.thresholds.catch * 100}%`);
  row("control-clean", (a) => pct(a.controlCleanN, a.controlN), `≥ ${CONFIG.thresholds.controlClean * 100}%`);
  row("correction-acceptable (judge)", (a) => pct(a.acceptN, a.acceptDen), `≥ ${CONFIG.thresholds.acceptable * 100}%`);
  row("classification accuracy", (a) => pct(a.classN, a.classDen), `≥ ${CONFIG.thresholds.classify * 100}%`);

  // Per-class catch (pooled across framings), directional only.
  L.push("", "## Catch rate by class (pooled, directional — small n)", "", "| class | caught / flawed |", "|---|---|");
  const flawedClasses = [...new Set(SENTENCES.filter((s) => s.errorClass !== "none").map((s) => s.errorClass))];
  for (const cls of flawedClasses) {
    const ids = new Set(SENTENCES.filter((s) => s.errorClass === cls).map((s) => s.id));
    let c = 0, n = 0;
    for (const ce of corrections) {
      if (!ids.has(ce.sentenceId)) continue;
      const s = byId.get(ce.sentenceId)!;
      n++;
      if (ce.corrections.some((x) => overlapVerdict(x.original, s.flawed, s.corrected) === "yes")) c++;
    }
    L.push(`| ${cls} | ${pct(c, n)} |`);
  }

  // Judge integrity sample: list verdicts for hand-validation.
  L.push("", "## Judge verdicts (sample for hand-validation — check ~15)", "");
  for (const j of judgments) {
    const s = byId.get(j.sentenceId)!;
    const ce = corrections.find((e) => e.sentenceId === j.sentenceId && e.framing === j.framing)!;
    const c = ce.corrections[j.correctionIndex];
    L.push(`- **${j.sentenceId}/${j.framing}#${j.correctionIndex}** acceptable=${j.acceptable} expl=${j.explanationQuality} · ${s.flawed} → ${c?.suggestion} · ${j.reason}`);
  }
  fs.writeFileSync(RESULTS_FILE, L.join("\n") + "\n");

  // --- review.md (don't clobber manual tags) ---
  const rl = ["# Manual review", "", "Tag false-positive controls and ambiguous catches.", "", ...review];
  const hasManualTags = fs.existsSync(REVIEW_FILE) && /^- tag: \S/m.test(fs.readFileSync(REVIEW_FILE, "utf8"));
  if (hasManualTags) {
    fs.writeFileSync(REVIEW_FILE + ".new", rl.join("\n") + "\n");
    console.warn(`[WARN] ${REVIEW_FILE} has manual tags; wrote review.md.new instead`);
  } else {
    fs.writeFileSync(REVIEW_FILE, rl.join("\n") + "\n");
  }

  console.log(`scored ${corrections.length} correction entries → ${RESULTS_FILE}`);
  console.log(`${review.length} items to review → ${REVIEW_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run scoring**

Run: `cd spikes/correction-quality && npm run score`
Expected: `out/results.md` and `out/review.md` written; console prints counts. Open `results.md` and confirm the headline table has isolated + framed columns with the four metrics and threshold column, plus the per-class and judge sections.

- [ ] **Step 3: Sanity-check the numbers against raw data**

Run: `cd spikes/correction-quality && head -30 out/results.md`
Expected: catch rate and control-clean are populated percentages, not `—`. If `correction-acceptable` is `—`, the judge pass didn't run — run `npm run judge` then `npm run score` again.

- [ ] **Step 4: Commit**

```bash
git add spikes/correction-quality/src/score.ts spikes/correction-quality/out/results.md spikes/correction-quality/out/review.md
git commit -m "Add scoring aggregator producing results.md and review.md"
```

---

## Task 10: Judge-integrity validation + findings README

**Files:**
- Create: `spikes/correction-quality/README.md`
- Modify: `spikes/correction-quality/out/review.md` (hand tags)

- [ ] **Step 1: Hand-validate ~15 judge verdicts**

Open `out/results.md` "Judge verdicts" section. For ~15 spread across pass/borderline/fail, independently judge each `suggestion`/`explanation` yourself and note agree/disagree. This is the judge-trust check the spec mandates — record the agreement count (e.g. "13/15 agree").

- [ ] **Step 2: Hand-tag the review file**

Open `out/review.md`. For each flagged control, tag whether it's a genuine false positive or an acceptable/defensible flag. For each ambiguous catch, tag `caught` / `missed` / `mistranscribed-style`. These tags feed the adjusted numbers in the README.

- [ ] **Step 3: Apply the pre-registered decision rule and write `README.md`**

Write findings following the spike-1/spike-2 README shape: **Question**, **Answer** (bold one-liner), **Results** (the headline table + per-class), **Decision** (apply the pre-registered rule mechanically: viable iff catch ≥ 85% AND control-clean ≥ 90% AND acceptable ≥ 90%; state the isolated-vs-framed delta and which of options a/b/c/d it implies), **Judge integrity** (the agreement count + caveat), **Reading the data**, **Limitations** (conditional-on-prompt; authored single-error data; small control n; per-class directional), **Implications for M3/M4** (correction prompt liftable? does it need conversation context? is classification reliable enough for M4 mistake-pattern memory?), **Reproducing** (the `npm run correct → judge → score` sequence). Pick exactly one recommendation: (a) ship as-is · (b) ship with conversation context · (c) ship with a hardened prompt · (d) insufficient — escalate.

- [ ] **Step 4: Commit the findings**

```bash
git add spikes/correction-quality/README.md spikes/correction-quality/out/review.md
git commit -m "Record correction-quality findings and recommendation"
```

- [ ] **Step 5: Update project memory**

Mark step 3 of the pre-M0 plan done in the memory note `pre-m0-review-next-steps.md` (the ✅/outcome line), consistent with how steps 1 and 2 were recorded.

---

## Self-Review (completed by plan author)

**Spec coverage:**
- gpt-4o-mini alone under test → Task 7 (`correctionModel`, no second correction model). ✓
- LLM judge with reference rubric + stronger model → Task 8 (`judgeModel: gpt-4o`, `userPayload` passes `corrected` + note). ✓
- Judge integrity hand-validation → Task 10 Step 1 + results.md judge section. ✓
- Isolated vs framed as a variable → Task 6 (`buildMessages`), aggregated per framing in Task 9. ✓
- v1 taxonomy deliverable → Task 2 (`taxonomy.ts`). ✓
- Sentence set imports spike 1 + expanded controls → Task 3. ✓
- Deterministic catch/false-positive/class + review fallback for ambiguous → Task 4 (`overlapVerdict` returns `ambiguous`), Task 9 routes ambiguous to review.md. ✓
- temperature 0 → Task 5 (`CONFIG.temperature`), used in Tasks 7–8. ✓
- Pre-registered thresholds 85/90/90 → Task 5 (`thresholds`), applied in Task 9 table + Task 10 decision. ✓
- Caching/crash-safe writes per stage → Tasks 7–8 (`done` set + tmp/rename `save`). ✓
- One unit test on the scorer → Task 4. ✓
- Exit criteria (README with scorecard + framing comparison + judge agreement + recommendation) → Task 10. ✓
- Cost guardrail (per-run est. total) → Tasks 7–8 (`estUsd`). ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete. The `for (const f of framings)` no-op in score.ts Step 1 is intentional (documented) and harmless; columns are emitted explicitly.

**Type consistency:** `CorrectionEntry`/`JudgmentEntry`/`Framing`/`CorrectionItem` defined in Task 2 `types.ts`, imported unchanged in Tasks 7–9. `overlapVerdict`/`classMatches`/`normalizeClass`/`errorRegion` defined in Task 4, consumed in Task 9. `buildMessages` defined Task 6, used Task 7. `CONFIG` fields (`correctionModel`, `judgeModel`, `temperature`, `framings`, `thresholds`, `estUsd`, `maxTokens`) defined Task 5, used consistently. `OUT_DIR` exported from config (Task 5), used in Tasks 7–9.
