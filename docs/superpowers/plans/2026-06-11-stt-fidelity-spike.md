# STT Fidelity Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Determine whether `gpt-4o-transcribe` preserves Japanese learner errors or normalizes them away, across 5 transcription paths, with a deterministic scoring harness.

**Architecture:** A standalone TypeScript CLI package at `spikes/stt-fidelity/` with three cached pipeline stages (`synthesize` → `transcribe` → `score`). TTS-synthesized audio means ground truth is the exact input text, so scoring is normalize-and-diff (kuroshiro to hiragana, strip punctuation), not LLM-judged. Ambiguous results fall into a manual-review file.

**Tech Stack:** Node 20+, TypeScript via tsx, OpenAI SDK (TTS, STT, audio-LLM), macOS `say` (Kyoko voice), kuroshiro + kuroshiro-analyzer-kuromoji, node:test.

**Spec:** `docs/superpowers/specs/2026-06-11-stt-fidelity-spike-design.md`

**Prerequisites (user-provided):**
- `spikes/stt-fidelity/.env` contains a real `OPENAI_API_KEY` (file already exists with a placeholder; it is gitignored)
- OpenAI account has ~$5 credit, a monthly usage limit set, auto-recharge disabled
- macOS with the Kyoko Japanese voice installed (verified in Task 1)

---

## File structure

```
spikes/stt-fidelity/
  package.json           # standalone package; scripts for each stage
  tsconfig.json
  README.md              # findings + recommendation (Task 7)
  .env                   # OPENAI_API_KEY (exists, gitignored)
  src/sentences.ts       # dataset: 20 sentences, typed
  src/files.ts           # shared paths + audio filename convention (cache keys)
  src/normalize.ts       # stripNoise + classify (the only unit-tested logic)
  src/normalize.test.ts
  src/synthesize.ts      # sentences → audio/ (OpenAI TTS + say -v Kyoko)
  src/transcribe.ts      # audio/ → out/transcripts.json (5 paths, cached)
  src/score.ts           # transcripts → out/results.md + out/review.md
  audio/                 # gitignored (already in root .gitignore)
  out/                   # committed — transcripts and results are the evidence
```

---

### Task 1: Scaffold the spike package

**Files:**
- Create: `spikes/stt-fidelity/package.json`
- Create: `spikes/stt-fidelity/tsconfig.json`
- Create: `spikes/stt-fidelity/out/.gitkeep`

- [ ] **Step 1: Verify prerequisites**

Run: `grep -c "paste-your-key-here" spikes/stt-fidelity/.env || echo "key set"`
Expected: `key set` (if it prints `1`, STOP and ask the user to paste their key)

Run: `say -v '?' | grep -i kyoko`
Expected: a line like `Kyoko  ja_JP  # こんにちは...` (if empty, STOP — ask the user to install the Kyoko voice in System Settings → Accessibility → Spoken Content → System Voice → Manage Voices)

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "stt-fidelity-spike",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --import tsx --test src/normalize.test.ts",
    "synthesize": "tsx src/synthesize.ts",
    "transcribe": "tsx src/transcribe.ts",
    "score": "tsx src/score.ts"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "kuroshiro": "^1.2.0",
    "kuroshiro-analyzer-kuromoji": "^1.1.0",
    "openai": "^4.70.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

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

- [ ] **Step 4: Install and verify**

Run: `cd spikes/stt-fidelity && npm install`
Expected: completes without errors; `node_modules/` appears (kuromoji pulls a ~17MB dictionary — that's normal)

Run: `cd spikes/stt-fidelity && touch out/.gitkeep && git status --short`
Expected: new files listed; `node_modules/`, `.env`, `audio/` NOT listed (gitignored — `node_modules` via npm convention needs checking: if `node_modules` appears, add `node_modules/` to the root `.gitignore` before committing)

- [ ] **Step 5: Commit**

```bash
git add spikes/stt-fidelity/package.json spikes/stt-fidelity/tsconfig.json spikes/stt-fidelity/package-lock.json spikes/stt-fidelity/out/.gitkeep .gitignore
git commit -m "Scaffold stt-fidelity spike package

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Sentence dataset

**Files:**
- Create: `spikes/stt-fidelity/src/sentences.ts`

- [ ] **Step 1: Write `src/sentences.ts`** (data-as-code; no test — it's data)

```typescript
export type ErrorClass =
  | "particle"
  | "conjugation"
  | "word-order"
  | "word-choice"
  | "register"
  | "filler"
  | "control";

export interface Sentence {
  id: string;
  errorClass: ErrorClass;
  /** What the learner actually says (with the error). For controls, identical to corrected. */
  flawed: string;
  /** The natural/correct version. */
  corrected: string;
  note: string;
}

export const SENTENCES: Sentence[] = [
  // --- particle choice ---
  { id: "p1", errorClass: "particle", flawed: "私は毎朝コーヒーが飲みます。", corrected: "私は毎朝コーヒーを飲みます。", note: "を→が on direct object" },
  { id: "p2", errorClass: "particle", flawed: "明日、友達は会います。", corrected: "明日、友達に会います。", note: "に→は with 会う" },
  { id: "p3", errorClass: "particle", flawed: "電車で学校を行きます。", corrected: "電車で学校に行きます。", note: "に→を with 行く" },
  { id: "p4", errorClass: "particle", flawed: "私が名前は田中です。", corrected: "私の名前は田中です。", note: "の→が possessive" },
  // --- verb conjugation ---
  { id: "v1", errorClass: "conjugation", flawed: "昨日、映画を見ます。", corrected: "昨日、映画を見ました。", note: "missing past tense with 昨日" },
  { id: "v2", errorClass: "conjugation", flawed: "寒いだから、コートを着ました。", corrected: "寒いから、コートを着ました。", note: "い-adjective + だ" },
  { id: "v3", errorClass: "conjugation", flawed: "漢字を読むできません。", corrected: "漢字を読むことができません。", note: "missing こと nominalizer" },
  // --- word order ---
  { id: "o1", errorClass: "word-order", flawed: "私は日本に行きたいとても。", corrected: "私はとても日本に行きたいです。", note: "adverb after the verb" },
  { id: "o2", errorClass: "word-order", flawed: "これは本の私です。", corrected: "これは私の本です。", note: "reversed の possession" },
  // --- word choice ---
  { id: "w1", errorClass: "word-choice", flawed: "薬を食べました。", corrected: "薬を飲みました。", note: "食べる→飲む for medicine" },
  { id: "w2", errorClass: "word-choice", flawed: "帽子を着ています。", corrected: "帽子をかぶっています。", note: "着る→かぶる for hats" },
  { id: "w3", errorClass: "word-choice", flawed: "昨日、約束を作りました。", corrected: "昨日、約束をしました。", note: "作る→する for promises" },
  // --- register mismatch ---
  { id: "r1", errorClass: "register", flawed: "先生、明日休むね。", corrected: "先生、明日休みます。", note: "casual to a teacher" },
  { id: "r2", errorClass: "register", flawed: "お客様、ちょっと待って。", corrected: "お客様、少々お待ちください。", note: "casual to a customer" },
  // --- fillers / hesitations ---
  { id: "f1", errorClass: "filler", flawed: "えーと、駅は、あの、どこですか。", corrected: "駅はどこですか。", note: "filler words mid-sentence" },
  { id: "f2", errorClass: "filler", flawed: "私は、えっと、学生です。", corrected: "私は学生です。", note: "えっと hesitation" },
  // --- controls (correct sentences; flawed === corrected) ---
  { id: "c1", errorClass: "control", flawed: "今日はいい天気ですね。", corrected: "今日はいい天気ですね。", note: "control" },
  { id: "c2", errorClass: "control", flawed: "週末に友達と映画を見に行きます。", corrected: "週末に友達と映画を見に行きます。", note: "control" },
  { id: "c3", errorClass: "control", flawed: "すみません、駅までの行き方を教えてください。", corrected: "すみません、駅までの行き方を教えてください。", note: "control" },
  { id: "c4", errorClass: "control", flawed: "日本料理の中で寿司が一番好きです。", corrected: "日本料理の中で寿司が一番好きです。", note: "control" },
];
```

- [ ] **Step 2: Type-check**

Run: `cd spikes/stt-fidelity && npx tsc --noEmit`
Expected: no output (clean)

- [ ] **Step 3: Commit**

```bash
git add spikes/stt-fidelity/src/sentences.ts
git commit -m "Add flawed-Japanese sentence dataset for STT spike

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Normalize + classify (TDD — the one unit-tested module)

**Files:**
- Create: `spikes/stt-fidelity/src/normalize.ts`
- Test: `spikes/stt-fidelity/src/normalize.test.ts`

Note: `classify` operates on strings that `score.ts` will have already converted to hiragana via kuroshiro. Kanji→kana conversion is NOT tested here (it's a library call); only the pure logic is.

- [ ] **Step 1: Write the failing test**

```typescript
// spikes/stt-fidelity/src/normalize.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd spikes/stt-fidelity && npm test`
Expected: FAIL — `Cannot find module` for `./normalize.js`

- [ ] **Step 3: Write minimal implementation**

```typescript
// spikes/stt-fidelity/src/normalize.ts
/** Punctuation, brackets, quotes, and whitespace — orthographic noise, not errors.
 *  Deliberately does NOT include ー (long-vowel mark), which is meaningful in kana. */
const NOISE =
  /[、。！？!?.,．，…‥・：:；;「」『』（）()\[\]｛｝{}〈〉《》【】\s'"“”‘’〜~＝=－—–-]/gu;

export function stripNoise(text: string): string {
  return text.normalize("NFKC").replace(NOISE, "");
}

export type Verdict = "preserved" | "normalized" | "control_ok" | "review";

export function classify(args: {
  transcript: string;
  flawed: string;
  corrected: string;
}): Verdict {
  const t = stripNoise(args.transcript);
  const f = stripNoise(args.flawed);
  const c = stripNoise(args.corrected);
  if (f === c) return t === f ? "control_ok" : "review";
  if (t === f) return "preserved";
  if (t === c) return "normalized";
  return "review";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd spikes/stt-fidelity && npm test`
Expected: `pass 7` / `fail 0`

- [ ] **Step 5: Commit**

```bash
git add spikes/stt-fidelity/src/normalize.ts spikes/stt-fidelity/src/normalize.test.ts
git commit -m "Add normalize/classify scoring logic with tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Synthesis stage

**Files:**
- Create: `spikes/stt-fidelity/src/files.ts`
- Create: `spikes/stt-fidelity/src/synthesize.ts`

- [ ] **Step 1: Write `src/files.ts`** (shared filename convention = the cache key)

```typescript
// spikes/stt-fidelity/src/files.ts
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Sentence } from "./sentences.js";

export type Voice = "openai" | "kyoko";

const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
export const AUDIO_DIR = path.join(ROOT, "audio");
export const OUT_DIR = path.join(ROOT, "out");

/** mp3 from OpenAI TTS, wav from macOS `say`. */
export function audioFormat(voice: Voice): "mp3" | "wav" {
  return voice === "openai" ? "mp3" : "wav";
}

/** Deterministic filename: re-synthesis is skipped while text+voice unchanged. */
export function audioFileFor(s: Sentence, voice: Voice): string {
  const h = createHash("sha256").update(`${voice}:${s.flawed}`).digest("hex").slice(0, 12);
  return path.join(AUDIO_DIR, `${s.id}-${voice}-${h}.${audioFormat(voice)}`);
}
```

- [ ] **Step 2: Write `src/synthesize.ts`**

```typescript
// spikes/stt-fidelity/src/synthesize.ts
import "dotenv/config";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import OpenAI from "openai";
import { SENTENCES } from "./sentences.js";
import { AUDIO_DIR, audioFileFor, type Voice } from "./files.js";

const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";
const OPENAI_TTS_VOICE = "alloy";
// Rough public-pricing estimate, $ per input character. Spike-grade.
const EST_TTS_USD_PER_CHAR = 0.000015;

const client = new OpenAI();

async function synthOpenai(text: string, file: string): Promise<void> {
  const res = await client.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice: OPENAI_TTS_VOICE,
    input: text,
    response_format: "mp3",
  });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

function synthKyoko(text: string, file: string): void {
  execFileSync("say", [
    "-v", "Kyoko",
    "-o", file,
    "--file-format=WAVE",
    "--data-format=LEI16@22050",
    text,
  ]);
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  let created = 0, skipped = 0, paidChars = 0;

  for (const s of SENTENCES) {
    for (const voice of ["openai", "kyoko"] as Voice[]) {
      const file = audioFileFor(s, voice);
      if (fs.existsSync(file)) { skipped++; continue; }
      if (voice === "openai") {
        await synthOpenai(s.flawed, file);
        paidChars += s.flawed.length;
      } else {
        synthKyoko(s.flawed, file);
      }
      created++;
      console.log(`created ${file}`);
    }
  }

  console.log(`\n${created} created, ${skipped} skipped (cached)`);
  console.log(`est. OpenAI TTS cost this run: $${(paidChars * EST_TTS_USD_PER_CHAR).toFixed(4)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Type-check, then run it**

Run: `cd spikes/stt-fidelity && npx tsc --noEmit`
Expected: clean

Run: `cd spikes/stt-fidelity && npm run synthesize`
Expected: 40 `created ...` lines (20 sentences × 2 voices), then `40 created, 0 skipped`, est. cost ≈ $0.01

- [ ] **Step 4: Verify caching and audio sanity**

Run: `cd spikes/stt-fidelity && npm run synthesize`
Expected: `0 created, 40 skipped (cached)` — no API spend on rerun

Run: `ls spikes/stt-fidelity/audio | wc -l && afplay "$(ls spikes/stt-fidelity/audio/p1-openai-*.mp3)"`
Expected: `40`; you hear a natural Japanese voice saying 私は毎朝コーヒーが飲みます (WITH the が error — listen for it; if TTS audibly "fixed" the text, note it in the README later)

- [ ] **Step 5: Commit (code only — audio/ is gitignored)**

```bash
git add spikes/stt-fidelity/src/files.ts spikes/stt-fidelity/src/synthesize.ts
git commit -m "Add TTS synthesis stage (OpenAI + macOS Kyoko, cached)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Transcription matrix

**Files:**
- Create: `spikes/stt-fidelity/src/transcribe.ts`

- [ ] **Step 1: Write `src/transcribe.ts`**

```typescript
// spikes/stt-fidelity/src/transcribe.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { SENTENCES } from "./sentences.js";
import { OUT_DIR, audioFileFor, audioFormat, type Voice } from "./files.js";

const VERBATIM_JA =
  "そのまま文字起こししてください。文法の間違いや言い間違い、「えーと」「あの」などのフィラーも全て含めて、話された通りに正確に書き起こしてください。修正しないでください。";
const VERBATIM_EN =
  "Transcribe the Japanese audio verbatim, exactly as spoken. Preserve all grammatical errors, wrong particles, and fillers (えーと, あの). Do not correct or clean up the speech.";

interface SttPath { id: string; kind: "stt"; model: string; prompt?: string }
interface LlmPath { id: string; kind: "llm"; model: string; system: string }
type TranscriptionPath = SttPath | LlmPath;

const PATHS: TranscriptionPath[] = [
  { id: "4o-bare", kind: "stt", model: "gpt-4o-transcribe" },
  { id: "4o-verbatim-ja", kind: "stt", model: "gpt-4o-transcribe", prompt: VERBATIM_JA },
  { id: "4o-verbatim-en", kind: "stt", model: "gpt-4o-transcribe", prompt: VERBATIM_EN },
  { id: "whisper-bare", kind: "stt", model: "whisper-1" },
  { id: "audio-llm", kind: "llm", model: "gpt-4o-audio-preview", system: VERBATIM_JA },
];

export interface TranscriptEntry {
  sentenceId: string;
  voice: Voice;
  pathId: string;
  model: string;
  transcript: string;
  at: string;
}

const TRANSCRIPTS_FILE = path.join(OUT_DIR, "transcripts.json");
// Rough estimates: STT ≈ $0.006/min ≈ $0.0006 per ~6s clip; audio-LLM ≈ $0.01/clip.
const EST_USD = { stt: 0.0006, llm: 0.01 };

const client = new OpenAI();

function load(): TranscriptEntry[] {
  return fs.existsSync(TRANSCRIPTS_FILE)
    ? (JSON.parse(fs.readFileSync(TRANSCRIPTS_FILE, "utf8")) as TranscriptEntry[])
    : [];
}

async function transcribeStt(p: SttPath, file: string): Promise<string> {
  const res = await client.audio.transcriptions.create({
    file: fs.createReadStream(file),
    model: p.model,
    language: "ja",
    ...(p.prompt ? { prompt: p.prompt } : {}),
  });
  return res.text;
}

async function transcribeLlm(p: LlmPath, file: string, voice: Voice): Promise<string> {
  const res = await client.chat.completions.create({
    model: p.model,
    modalities: ["text"],
    messages: [
      { role: "system", content: p.system },
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: fs.readFileSync(file).toString("base64"),
              format: audioFormat(voice),
            },
          },
        ],
      },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = load();
  const done = new Set(entries.map((e) => `${e.sentenceId}:${e.voice}:${e.pathId}`));
  let ran = 0, skipped = 0, estUsd = 0;

  for (const s of SENTENCES) {
    for (const voice of ["openai", "kyoko"] as Voice[]) {
      const file = audioFileFor(s, voice);
      if (!fs.existsSync(file)) throw new Error(`missing audio ${file} — run synthesize first`);
      for (const p of PATHS) {
        const key = `${s.id}:${voice}:${p.id}`;
        if (done.has(key)) { skipped++; continue; }
        const transcript =
          p.kind === "stt" ? await transcribeStt(p, file) : await transcribeLlm(p, file, voice);
        entries.push({
          sentenceId: s.id, voice, pathId: p.id, model: p.model,
          transcript, at: new Date().toISOString(),
        });
        // write after every call: crash-safe, never re-spends
        fs.writeFileSync(TRANSCRIPTS_FILE, JSON.stringify(entries, null, 2));
        estUsd += EST_USD[p.kind];
        ran++;
        console.log(`${key} → ${transcript}`);
      }
    }
  }

  console.log(`\n${ran} calls run, ${skipped} skipped (cached)`);
  console.log(`est. cost this run: $${estUsd.toFixed(3)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Type-check, then smoke-test resumability**

Run: `cd spikes/stt-fidelity && npx tsc --noEmit`
Expected: clean

Run: `cd spikes/stt-fidelity && npm run transcribe` — let it print ~10 lines, then hit Ctrl-C
Expected: each line shows `key → transcript`; transcripts are plausible Japanese

Run: `cd spikes/stt-fidelity && npm run transcribe` (again, to completion this time)
Expected: previously-completed combos counted as skipped; finishes with `... skipped (cached)`; total entries = 200 (20 sentences × 2 voices × 5 paths); est. cost ≈ $0.5–0.8 across both runs

If `gpt-4o-audio-preview` errors as unknown model, list audio-capable models with `curl -s https://api.openai.com/v1/models -H "Authorization: Bearer $(grep OPENAI_API_KEY .env | cut -d= -f2)" | grep -o '"[^"]*audio[^"]*"' | sort -u` and pin the closest current `gpt-4o-audio*` id in `PATHS`.

- [ ] **Step 3: Verify entry count**

Run: `cd spikes/stt-fidelity && node -e "console.log(JSON.parse(require('fs').readFileSync('out/transcripts.json','utf8')).length)"`
Expected: `200`

- [ ] **Step 4: Commit code + transcripts (the evidence)**

```bash
git add spikes/stt-fidelity/src/transcribe.ts spikes/stt-fidelity/out/transcripts.json
git commit -m "Add transcription matrix: 5 paths x 2 voices x 20 sentences

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Scoring + reports

**Files:**
- Create: `spikes/stt-fidelity/src/score.ts`

- [ ] **Step 1: Write `src/score.ts`**

```typescript
// spikes/stt-fidelity/src/score.ts
import fs from "node:fs";
import path from "node:path";
import KuroshiroMod from "kuroshiro";
import KuromojiAnalyzerMod from "kuroshiro-analyzer-kuromoji";
import { SENTENCES, type Sentence } from "./sentences.js";
import { OUT_DIR } from "./files.js";
import { classify, stripNoise, type Verdict } from "./normalize.js";
import type { TranscriptEntry } from "./transcribe.js";

// kuroshiro ships CJS with a default-export quirk under ESM; unwrap defensively
const Kuroshiro: any = (KuroshiroMod as any).default ?? KuroshiroMod;
const KuromojiAnalyzer: any = (KuromojiAnalyzerMod as any).default ?? KuromojiAnalyzerMod;

const TRANSCRIPTS_FILE = path.join(OUT_DIR, "transcripts.json");
const RESULTS_FILE = path.join(OUT_DIR, "results.md");
const REVIEW_FILE = path.join(OUT_DIR, "review.md");

interface Scored extends TranscriptEntry {
  verdict: Verdict;
  transcriptHira: string;
}

async function main() {
  const kuroshiro = new Kuroshiro();
  await kuroshiro.init(new KuromojiAnalyzer());
  const toHira = async (t: string): Promise<string> =>
    stripNoise(await kuroshiro.convert(stripNoise(t), { to: "hiragana" }));

  const entries = JSON.parse(fs.readFileSync(TRANSCRIPTS_FILE, "utf8")) as TranscriptEntry[];
  const byId = new Map<string, Sentence>(SENTENCES.map((s) => [s.id, s]));
  const pathIds = [...new Set(entries.map((e) => e.pathId))];
  const classes = [...new Set(SENTENCES.map((s) => s.errorClass))];

  const scored: Scored[] = [];
  for (const e of entries) {
    const s = byId.get(e.sentenceId);
    if (!s) throw new Error(`unknown sentence id ${e.sentenceId}`);
    const [t, f, c] = await Promise.all([toHira(e.transcript), toHira(s.flawed), toHira(s.corrected)]);
    scored.push({ ...e, transcriptHira: t, verdict: classify({ transcript: t, flawed: f, corrected: c }) });
  }

  // --- results.md ---
  const lines: string[] = ["# STT fidelity results", ""];
  lines.push("Cell = preserved / normalized / review (controls: ok / review).", "");
  lines.push(`| error class | ${pathIds.join(" | ")} |`);
  lines.push(`|---|${pathIds.map(() => "---").join("|")}|`);
  for (const cls of classes) {
    const cells = pathIds.map((p) => {
      const rows = scored.filter((x) => x.pathId === p && byId.get(x.sentenceId)!.errorClass === cls);
      const n = (v: Verdict) => rows.filter((x) => x.verdict === v).length;
      return cls === "control"
        ? `${n("control_ok")} ok / ${n("review")} rev`
        : `${n("preserved")}P / ${n("normalized")}N / ${n("review")}R`;
    });
    lines.push(`| ${cls} | ${cells.join(" | ")} |`);
  }
  lines.push("", "## Per-sentence detail", "");
  for (const x of scored) {
    const s = byId.get(x.sentenceId)!;
    lines.push(`- **${x.sentenceId}/${x.voice}/${x.pathId}** [${x.verdict}] said: ${s.flawed} → got: ${x.transcript}`);
  }
  fs.writeFileSync(RESULTS_FILE, lines.join("\n") + "\n");

  // --- review.md (manual tagging of ambiguous cases) ---
  const review = scored.filter((x) => x.verdict === "review");
  const rl: string[] = ["# Manual review", "", "Tag each: `near-preserved`, `near-normalized`, or `mistranscribed`.", ""];
  for (const x of review) {
    const s = byId.get(x.sentenceId)!;
    rl.push(`## ${x.sentenceId}/${x.voice}/${x.pathId}`);
    rl.push(`- said (flawed): ${s.flawed}`);
    rl.push(`- corrected:     ${s.corrected}`);
    rl.push(`- transcript:    ${x.transcript}`);
    rl.push(`- tag: `);
    rl.push("");
  }
  fs.writeFileSync(REVIEW_FILE, rl.join("\n") + "\n");

  console.log(`scored ${scored.length} transcripts → ${RESULTS_FILE}`);
  console.log(`${review.length} ambiguous → ${REVIEW_FILE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Type-check and run**

Run: `cd spikes/stt-fidelity && npx tsc --noEmit`
Expected: clean

Run: `cd spikes/stt-fidelity && npm run score`
Expected: `scored 200 transcripts → .../out/results.md` and an ambiguous count (typically 10–60; kuromoji init takes a few seconds first)

- [ ] **Step 3: Sanity-check the results table**

Run: `head -30 spikes/stt-fidelity/out/results.md`
Expected: the rate table renders; the `control` row should be mostly `ok` — if controls are heavily `review`, normalization/voice quality is broken: STOP and investigate before trusting any other row (check a control's per-sentence detail line; common causes: kuroshiro producing different readings for the same kanji on both sides — should be rare since both sides go through the same converter — or genuinely bad TTS audio)

- [ ] **Step 4: Commit**

```bash
git add spikes/stt-fidelity/src/score.ts spikes/stt-fidelity/out/results.md spikes/stt-fidelity/out/review.md
git commit -m "Add scoring stage and generated results

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Manual review + findings README (human-in-the-loop)

**Files:**
- Modify: `spikes/stt-fidelity/out/review.md` (fill in `tag:` lines — **requires the user or careful judgment**)
- Create: `spikes/stt-fidelity/README.md`

- [ ] **Step 1: Manual-tag ambiguous transcripts**

Open `out/review.md`. For each entry, compare the transcript against flawed/corrected and fill `tag:` with `near-preserved` (error survived, minor orthographic drift), `near-normalized` (error partly cleaned up), or `mistranscribed` (neither — STT heard something else). This step needs human Japanese judgment — present the entries to the user if uncertain.

- [ ] **Step 2: Re-read totals and write `README.md`**

Structure (write actual findings, not placeholders):

```markdown
# STT Fidelity Spike — Findings

**Question:** Does gpt-4o-transcribe preserve Japanese learner errors, or normalize them away?

## Results
[paste the rate table from out/results.md, adjusted with manual tags from out/review.md]

## Reading the data
[2–4 paragraphs: which error classes get normalized, by which paths; voice differences
(openai vs kyoko); whether verbatim prompts help; control sanity-check outcome;
note the TTS-only limitation — anglicized pronunciation untested (phase B: real recordings)]

## Recommendation
One of:
(a) STT as planned (gpt-4o-transcribe bare)
(b) STT + verbatim prompt — include the winning prompt
(c) audio-native LLM transcription path
(d) transcript confirm/edit step required in product UX

[1 paragraph justifying the choice with numbers from the table]

## Implications for M2/M3
[bullets: what this changes in milestone assumptions]
```

- [ ] **Step 3: Commit**

```bash
git add spikes/stt-fidelity/README.md spikes/stt-fidelity/out/review.md
git commit -m "Record STT fidelity findings and recommendation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Close the loop outside the repo**

Report the recommendation to the user; they (or you, via Notion tools in-session) update the Notion design-review page Step 1 with the outcome. Notion is never referenced from repo files.

---

## Execution notes

- Tasks 1–3 need no API key or audio; Tasks 4–6 spend real money (≈ $1 total) and need the `.env` key. Task 4 Step 1's verification gate in Task 1 must have passed.
- Model IDs (`gpt-4o-mini-tts`, `gpt-4o-transcribe`, `gpt-4o-audio-preview`) are pin-at-implementation values; if any 404s as unknown, list available models (Task 5 Step 2 shows how) and substitute the closest current id — record any substitution in the README.
- Every stage is rerunnable: synthesis caches by file existence, transcription by (sentence, voice, path) key, scoring is pure. Deleting `out/transcripts.json` re-spends ~$1; deleting `audio/` re-spends ~$0.01.
