# Latency Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure real time-to-first-audio for a push-to-talk voice turn (STT → streaming LLM → TTS) and decide whether sentence-chunked TTS is required to hit the ~3s target.

**Architecture:** Standalone TypeScript package at `spikes/latency/` mirroring `spikes/stt-fidelity/` conventions. One end-to-end pipeline run measures both TTS architectures from a single streaming LLM call: the first sentence emitted by a streaming chunker is TTS'd concurrently while the stream continues (chunked TTFA), and the full reply is TTS'd after generation completes (unchunked TTFA). Results append to a crash-safe JSONL file; a separate report script computes p50/p90 percentiles.

**Tech Stack:** TypeScript + tsx, openai SDK (existing `OPENAI_API_KEY`), dotenv, node:test. Models: `gpt-4o-transcribe` (STT), `gpt-4o` streaming (LLM stand-in for Sonnet), `gpt-4o-mini-tts` (TTS).

**Spec:** `docs/superpowers/specs/2026-06-12-latency-spike-design.md` (commit 97ee15b)

**Security note:** `spikes/latency/.env` contains the real `OPENAI_API_KEY`. Never print it, never `cat` it, never commit it (repo root `.gitignore` already ignores `.env` at every level).

---

### Task 1: Scaffold the package

**Files:**
- Create: `spikes/latency/package.json`
- Create: `spikes/latency/tsconfig.json`
- Create: `spikes/latency/.env` (copied, never committed)

- [ ] **Step 1: Write package.json**

```json
{
  "name": "latency-spike",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --import tsx --test src/chunker.test.ts src/stats.test.ts",
    "run": "tsx src/run.ts",
    "report": "tsx src/report.ts"
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

- [ ] **Step 2: Write tsconfig.json** (identical to spike 1)

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

- [ ] **Step 3: Copy the API key file without displaying it**

Run: `cp spikes/stt-fidelity/.env spikes/latency/.env`

Do NOT read, print, or echo this file's contents. Verify only its existence: `test -f spikes/latency/.env && echo exists`
Expected: `exists`

- [ ] **Step 4: Install dependencies**

Run: `cd spikes/latency && npm install`
Expected: completes without errors; `node_modules/` and `package-lock.json` appear.

- [ ] **Step 5: Verify gitignore coverage**

Run: `cd spikes/latency && git check-ignore -v .env node_modules`
Expected: both paths matched by repo-root `.gitignore` rules (`.env` and `node_modules/`). If either is NOT ignored, stop and fix `.gitignore` before committing anything.

- [ ] **Step 6: Commit**

```bash
git add spikes/latency/package.json spikes/latency/package-lock.json spikes/latency/tsconfig.json
git commit -m "Scaffold latency spike package

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Streaming sentence chunker (TDD)

The chunker is the piece most likely to be lifted into M2, so it gets real tests. Pure function, no I/O.

**Files:**
- Create: `spikes/latency/src/chunker.ts`
- Test: `spikes/latency/src/chunker.test.ts`

**Interface contract:** `createChunker(minLength)` returns `{ push(delta): string[], flush(): string | null }`. `push` accepts a streamed text delta and returns any complete sentences (boundary chars: 。！？ and half-width ! ?). A completed sentence shorter than `minLength` chars (trimmed) is not emitted; it is carried into the next sentence. `flush` returns whatever remains at stream end (trimmed), or null.

- [ ] **Step 1: Write the failing tests**

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd spikes/latency && npm test`
Expected: FAIL — cannot find module `./chunker.js`

- [ ] **Step 3: Implement the chunker**

```typescript
// spikes/latency/src/chunker.ts
const BOUNDARIES = new Set(["。", "！", "？", "!", "?"]);

export interface Chunker {
  /** Feed a streamed text delta; returns any complete sentences ready for TTS. */
  push(delta: string): string[];
  /** Stream ended: return whatever remains (trimmed), or null if nothing. */
  flush(): string | null;
}

export function createChunker(minLength = 6): Chunker {
  let buf = "";
  return {
    push(delta: string): string[] {
      buf += delta;
      const out: string[] = [];
      let start = 0;
      for (let i = 0; i < buf.length; i++) {
        if (!BOUNDARIES.has(buf[i])) continue;
        const candidate = buf.slice(start, i + 1);
        // Too short to TTS on its own — leave start in place so it merges
        // with the next sentence.
        if (candidate.trim().length < minLength) continue;
        out.push(candidate.trim());
        start = i + 1;
      }
      buf = buf.slice(start);
      return out;
    },
    flush(): string | null {
      const rest = buf.trim();
      buf = "";
      return rest.length > 0 ? rest : null;
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd spikes/latency && npm test`
Expected: chunker tests PASS (stats.test.ts doesn't exist yet — if the test script errors on the missing file, temporarily run `node --import tsx --test src/chunker.test.ts` directly; the script works as-is once Task 3 lands).

- [ ] **Step 5: Commit**

```bash
git add spikes/latency/src/chunker.ts spikes/latency/src/chunker.test.ts
git commit -m "Add streaming sentence chunker with min-length carry-over

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Percentile helper (TDD)

**Files:**
- Create: `spikes/latency/src/stats.ts`
- Test: `spikes/latency/src/stats.test.ts`

**Interface contract:** `percentile(values, p)` — nearest-rank method (smallest value ≥ p% of the sorted data: index `ceil(p/100 × n) − 1`). Copies and sorts internally. Throws on empty input or p outside (0, 100].

- [ ] **Step 1: Write the failing tests**

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd spikes/latency && npm test`
Expected: FAIL — cannot find module `./stats.js`

- [ ] **Step 3: Implement**

```typescript
// spikes/latency/src/stats.ts
/** Nearest-rank percentile: the smallest value ≥ p% of the sorted data. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) throw new Error("percentile of empty array");
  if (p <= 0 || p > 100) throw new Error(`percentile p out of range: ${p}`);
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil((p / 100) * sorted.length) - 1];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd spikes/latency && npm test`
Expected: all chunker + stats tests PASS

- [ ] **Step 5: Commit**

```bash
git add spikes/latency/src/stats.ts spikes/latency/src/stats.test.ts
git commit -m "Add nearest-rank percentile helper

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Config module

All tunables in one place (repo convention: never hardcoded). Clips reuse spike 1's OpenAI-voice audio in place — chosen short/medium/long by measured duration (2.2s / 3.9s / 5.1s).

**Files:**
- Create: `spikes/latency/src/config.ts`

- [ ] **Step 1: Write config.ts**

```typescript
// spikes/latency/src/config.ts
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const SPIKE1_AUDIO = path.join(ROOT, "..", "stt-fidelity", "audio");

export interface Clip {
  id: string;
  label: "short" | "medium" | "long";
  path: string;
}

// The exact STT configuration spike 1 recommended shipping.
const STT_VERBATIM_JA =
  "そのまま文字起こししてください。文法の間違いや言い間違い、「えーと」「あの」などのフィラーも全て含めて、話された通りに正確に書き起こしてください。修正しないでください。";

// Production-shaped system prompt (~500 tokens): approximates M1's
// JLPT-tuned conversation-partner prompt so TTFT is measured against a
// realistic input size, not a toy prompt.
const SYSTEM_PROMPT = `あなたは日本語学習者の会話パートナーです。相手は中級レベル（JLPT N4〜N2）の学習者で、読解はある程度できますが、話すことに自信がありません。リラックスした、プレッシャーのない会話相手として振る舞ってください。

ルール：
- 自然な日本語で話してください。ただし、N3前後の語彙と文法を中心に使い、難しい言葉を使う場合は、簡単な言い換えを添えてください。
- 返事は短く、会話のテンポを保ってください。2〜4文程度が目安です。長い説明はしないでください。
- 相手の文法ミスを指摘したり、訂正したりしないでください。訂正は別のシステムが担当します。あなたの役割は会話を続けることだけです。
- 相手の発言の内容に必ず反応してから、話を広げる質問を一つしてください。質問は一度に一つだけです。
- 発言が不明瞭で意味が取れない場合は、自然に聞き返してください。
- 敬語ではなく、丁寧体（です・ます）で話してください。
- 絵文字や顔文字、ローマ字は使わないでください。
- 相手が言葉に詰まっても急かさず、自然に助け舟を出してください。
- 漢字は普通に使ってください。ふりがなは不要です。

あなたのペルソナ：東京在住の30代、田中ゆきさん。映画と料理が好きで、聞き上手です。学習者の話に興味を持ち、優しく相づちを打ちながら会話を続けます。`;

// ~4 turns of fabricated history: TTFT depends on input size, so the
// prompt must look like a mid-session turn, not an opening message.
const FAKE_HISTORY: { role: "user" | "assistant"; content: string }[] = [
  { role: "user", content: "こんにちは！今日は仕事がとても忙しかったです。" },
  { role: "assistant", content: "お疲れさまでした。忙しい日が続くと大変ですね。お仕事は何をされているんですか？" },
  { role: "user", content: "ソフトウェアの会社で働いています。えーと、プログラマーです。" },
  { role: "assistant", content: "プログラマーなんですね。かっこいいです。お仕事の後は、何かリラックスする方法がありますか？" },
];

export const CONFIG = {
  sttModel: "gpt-4o-transcribe",
  sttPrompt: STT_VERBATIM_JA,
  // Stand-in for the planned Claude Sonnet partner model (decided with the
  // user; the Sonnet-transfer caveat must appear in the findings).
  llmModel: "gpt-4o",
  maxCompletionTokens: 300,
  ttsModel: "gpt-4o-mini-tts",
  ttsVoice: "alloy",
  ttsFormat: "mp3" as const,
  minChunkLength: 6,
  iterations: 10,
  interRunDelayMs: 2000,
  // Decision threshold: the "feels like voice messaging" TTFA target.
  ttfaTargetMs: 3000,
  systemPrompt: SYSTEM_PROMPT,
  fakeHistory: FAKE_HISTORY,
  clips: [
    // 薬を食べました。(2.2s)
    { id: "w1", label: "short", path: path.join(SPIKE1_AUDIO, "w1-openai-1c63ffe0f516.mp3") },
    // 週末に友達と映画を見に行きます。(3.9s)
    { id: "c2", label: "medium", path: path.join(SPIKE1_AUDIO, "c2-openai-0691bfeb58a1.mp3") },
    // えーと、駅は、あの、どこですか。(5.1s)
    { id: "f1", label: "long", path: path.join(SPIKE1_AUDIO, "f1-openai-a1b7fa841c6e.mp3") },
  ] as Clip[],
};
```

- [ ] **Step 2: Type-check and verify clip paths resolve**

Run: `cd spikes/latency && npx tsc --noEmit && tsx -e "import fs from 'node:fs'; import { CONFIG } from './src/config.js'; for (const c of CONFIG.clips) console.log(c.id, fs.existsSync(c.path));"`
Expected: `w1 true`, `c2 true`, `f1 true`

- [ ] **Step 3: Commit**

```bash
git add spikes/latency/src/config.ts
git commit -m "Add latency spike config: models, prompts, clips, thresholds

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: TTS adapter + pipeline (one measured end-to-end run)

The measurement instrument. One monotonic clock (`performance.now()`), offsets recorded at every event. The chunked-TTS request fires the instant the chunker emits the first sentence and runs **concurrently** while the LLM stream continues draining — that's the real pipelined architecture. TTS sits behind a small adapter (spec requirement: a second provider must be a drop-in later). No unit test for the pipeline itself (verified by the smoke run in Task 8 — it's an API-integration instrument, per the spec's testing section).

**Files:**
- Create: `spikes/latency/src/tts.ts`
- Create: `spikes/latency/src/pipeline.ts`

- [ ] **Step 1: Write the TTS adapter**

```typescript
// spikes/latency/src/tts.ts
import OpenAI from "openai";
import { CONFIG } from "./config.js";

/**
 * Provider adapter: synthesize `text` and resolve once the audio bytes are
 * fully received (bytes are counted, then discarded — this spike measures,
 * it doesn't keep audio). A second provider (e.g. Google Cloud TTS in M1's
 * bake-off) is a drop-in replacement for this one function.
 */
export async function synthesize(client: OpenAI, text: string): Promise<{ bytes: number }> {
  const res = await client.audio.speech.create({
    model: CONFIG.ttsModel,
    voice: CONFIG.ttsVoice,
    input: text,
    response_format: CONFIG.ttsFormat,
  });
  return { bytes: Buffer.from(await res.arrayBuffer()).length };
}
```

- [ ] **Step 2: Write pipeline.ts**

```typescript
// spikes/latency/src/pipeline.ts
import fs from "node:fs";
import { performance } from "node:perf_hooks";
import OpenAI from "openai";
import { CONFIG } from "./config.js";
import { createChunker } from "./chunker.js";
import { synthesize } from "./tts.js";

export interface RunInput {
  clipId: string;
  clipPath: string;
  iteration: number;
  coldStart: boolean;
}

export interface TimingRecord {
  at: string;
  clipId: string;
  iteration: number;
  coldStart: boolean;
  ok: boolean;
  error?: string;
  transcript?: string;
  reply?: string;
  firstChunk?: string;
  /** True when no sentence boundary appeared mid-stream; the "first chunk" is the flushed remainder. */
  chunkFromFlush?: boolean;
  ttsChunkBytes?: number;
  ttsFullBytes?: number;
  /** Event offsets in ms from t0 (simulated push-to-talk release). */
  t?: {
    sttDone: number;
    llmRequestSent: number;
    llmFirstToken: number;
    llmFirstBoundary: number;
    /** Every sentence boundary the chunker emitted, in order. */
    boundaries: number[];
    llmDone: number;
    ttsChunkStart: number;
    ttsChunkDone: number;
    ttsFullStart: number;
    ttsFullDone: number;
  };
  derived?: {
    sttMs: number;
    ttftMs: number;
    firstBoundaryMs: number;
    llmMs: number;
    ttsChunkMs: number;
    ttsFullMs: number;
    /** t0 → first chunk's audio bytes fully received (real pipelined wall clock). */
    ttfaChunkedMs: number;
    /** t0 → full reply's audio fully received, full-TTS starting only after generation completes. */
    ttfaUnchunkedMs: number;
  };
  models: { stt: string; llm: string; tts: string };
}

export async function runPipeline(client: OpenAI, input: RunInput): Promise<TimingRecord> {
  const base: TimingRecord = {
    at: new Date().toISOString(),
    clipId: input.clipId,
    iteration: input.iteration,
    coldStart: input.coldStart,
    ok: false,
    models: { stt: CONFIG.sttModel, llm: CONFIG.llmModel, tts: CONFIG.ttsModel },
  };
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);

  try {
    // 1. STT — t0 is the moment the user releases push-to-talk
    const stt = await client.audio.transcriptions.create({
      file: fs.createReadStream(input.clipPath),
      model: CONFIG.sttModel,
      language: "ja",
      prompt: CONFIG.sttPrompt,
    });
    const sttDone = ms();
    const transcript = stt.text;

    // 2. Streaming LLM with a production-shaped prompt
    const chunker = createChunker(CONFIG.minChunkLength);
    let reply = "";
    let llmFirstToken = -1;
    const boundaries: number[] = [];
    let firstChunk: string | null = null;
    let chunkFromFlush = false;
    let ttsChunkStart = -1;
    let ttsChunkDone = -1;
    let ttsChunkBytes = 0;
    let ttsChunkPromise: Promise<void> | null = null;

    const speakFirstChunk = (text: string) => {
      ttsChunkStart = ms();
      // Deliberately not awaited here: the LLM stream keeps draining while
      // this request is in flight — that overlap IS the chunked architecture.
      ttsChunkPromise = synthesize(client, text).then(({ bytes }) => {
        ttsChunkDone = ms();
        ttsChunkBytes = bytes;
      });
    };

    const llmRequestSent = ms();
    const stream = await client.chat.completions.create({
      model: CONFIG.llmModel,
      messages: [
        { role: "system", content: CONFIG.systemPrompt },
        ...CONFIG.fakeHistory,
        { role: "user", content: transcript },
      ],
      stream: true,
      max_completion_tokens: CONFIG.maxCompletionTokens,
    });

    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content ?? "";
      if (!delta) continue;
      if (llmFirstToken < 0) llmFirstToken = ms();
      reply += delta;
      const sentences = chunker.push(delta);
      for (const sentence of sentences) {
        boundaries.push(ms());
        if (firstChunk === null) {
          firstChunk = sentence;
          speakFirstChunk(sentence);
        }
      }
    }
    const llmDone = ms();

    if (firstChunk === null) {
      // Reply had no mid-stream sentence boundary; chunked degrades to
      // "first chunk = whole reply at stream end". Still measured, flagged.
      const rest = chunker.flush();
      if (!rest) throw new Error("LLM returned an empty reply");
      firstChunk = rest;
      chunkFromFlush = true;
      boundaries.push(llmDone);
      speakFirstChunk(firstChunk);
    }
    const llmFirstBoundary = boundaries[0];

    // 3. Unchunked architecture: TTS the full reply, starting only after
    // generation completes. (The chunk request is usually finished by now;
    // rare overlap is acceptable measurement noise for a spike.)
    const ttsFullStart = ms();
    const { bytes: ttsFullBytes } = await synthesize(client, reply);
    const ttsFullDone = ms();

    await ttsChunkPromise;

    return {
      ...base,
      ok: true,
      transcript,
      reply,
      firstChunk,
      chunkFromFlush,
      ttsChunkBytes,
      ttsFullBytes,
      t: { sttDone, llmRequestSent, llmFirstToken, llmFirstBoundary, boundaries, llmDone, ttsChunkStart, ttsChunkDone, ttsFullStart, ttsFullDone },
      derived: {
        sttMs: sttDone,
        ttftMs: llmFirstToken - llmRequestSent,
        firstBoundaryMs: llmFirstBoundary - llmRequestSent,
        llmMs: llmDone - llmRequestSent,
        ttsChunkMs: ttsChunkDone - ttsChunkStart,
        ttsFullMs: ttsFullDone - ttsFullStart,
        ttfaChunkedMs: ttsChunkDone,
        ttfaUnchunkedMs: ttsFullDone,
      },
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : String(e) };
  }
}
```

- [ ] **Step 3: Type-check**

Run: `cd spikes/latency && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add spikes/latency/src/tts.ts spikes/latency/src/pipeline.ts
git commit -m "Add TTS adapter and measured end-to-end pipeline with paired chunked/unchunked TTFA

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Runner

Sequential N × clips loop, crash-safe JSONL append (one `appendFileSync` per record — an interrupted session loses at most the in-flight run). `--iterations` and `--clip` flags exist so the Task 8 smoke run doesn't burn the full budget.

**Files:**
- Create: `spikes/latency/src/run.ts`

- [ ] **Step 1: Write run.ts**

```typescript
// spikes/latency/src/run.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { CONFIG, ROOT } from "./config.js";
import { runPipeline } from "./pipeline.js";

const OUT_DIR = path.join(ROOT, "out");
const TIMINGS = path.join(OUT_DIR, "timings.jsonl");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const sleep = (msec: number) => new Promise((r) => setTimeout(r, msec));

async function main() {
  const iterations = Number(arg("iterations") ?? CONFIG.iterations);
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error(`bad --iterations: ${arg("iterations")}`);
  }
  const clipFilter = arg("clip");
  const clips = clipFilter ? CONFIG.clips.filter((c) => c.id === clipFilter) : CONFIG.clips;
  if (clips.length === 0) throw new Error(`no clip matches --clip ${clipFilter}`);
  for (const c of clips) {
    if (!fs.existsSync(c.path)) throw new Error(`missing clip ${c.path} — spike 1 audio not present`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const client = new OpenAI();

  let runIndex = 0;
  let failures = 0;
  for (let iter = 0; iter < iterations; iter++) {
    for (const clip of clips) {
      const rec = await runPipeline(client, {
        clipId: clip.id,
        clipPath: clip.path,
        iteration: iter,
        coldStart: runIndex === 0,
      });
      fs.appendFileSync(TIMINGS, JSON.stringify(rec) + "\n");
      runIndex++;
      if (rec.ok) {
        const d = rec.derived!;
        console.log(
          `[${runIndex}] ${clip.id} iter ${iter} — stt ${d.sttMs}ms, ttft ${d.ttftMs}ms, ` +
            `ttfa chunked ${d.ttfaChunkedMs}ms / unchunked ${d.ttfaUnchunkedMs}ms`
        );
      } else {
        failures++;
        console.log(`[${runIndex}] ${clip.id} iter ${iter} FAILED: ${rec.error}`);
      }
      await sleep(CONFIG.interRunDelayMs);
    }
  }
  console.log(`\n${runIndex} runs (${failures} failed) appended to ${TIMINGS}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Type-check**

Run: `cd spikes/latency && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add spikes/latency/src/run.ts
git commit -m "Add sequential runner with crash-safe JSONL append

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Report generator

Reads `out/timings.jsonl` (never mutates it), writes `out/results.md` atomically (tmp + rename). Failed runs are excluded from percentiles and listed.

**Files:**
- Create: `spikes/latency/src/report.ts`

- [ ] **Step 1: Write report.ts**

```typescript
// spikes/latency/src/report.ts
import fs from "node:fs";
import path from "node:path";
import { percentile } from "./stats.js";
import { CONFIG, ROOT } from "./config.js";
import type { TimingRecord } from "./pipeline.js";

const OUT_DIR = path.join(ROOT, "out");
const TIMINGS = path.join(OUT_DIR, "timings.jsonl");
const RESULTS = path.join(OUT_DIR, "results.md");

type DerivedKey = keyof NonNullable<TimingRecord["derived"]>;

const METRICS: ReadonlyArray<readonly [string, DerivedKey]> = [
  ["STT round trip", "sttMs"],
  ["LLM time-to-first-token", "ttftMs"],
  ["LLM first sentence boundary", "firstBoundaryMs"],
  ["LLM full generation", "llmMs"],
  ["TTS first chunk", "ttsChunkMs"],
  ["TTS full reply", "ttsFullMs"],
  ["**TTFA chunked**", "ttfaChunkedMs"],
  ["**TTFA unchunked**", "ttfaUnchunkedMs"],
];

const fmt = (v: number) => `${(v / 1000).toFixed(2)}s`;

function metricTable(records: TimingRecord[]): string {
  const rows = METRICS.map(([label, key]) => {
    const vals = records.map((r) => r.derived![key]);
    return `| ${label} | ${fmt(percentile(vals, 50))} | ${fmt(percentile(vals, 90))} |`;
  });
  return ["| metric | p50 | p90 |", "|---|---|---|", ...rows].join("\n");
}

function main() {
  if (!fs.existsSync(TIMINGS)) throw new Error(`${TIMINGS} not found — run \`npm run run\` first`);
  const records = fs
    .readFileSync(TIMINGS, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as TimingRecord);
  const ok = records.filter((r) => r.ok);
  const failed = records.filter((r) => !r.ok);
  if (ok.length === 0) throw new Error("no successful runs in timings.jsonl");

  const clipIds = [...new Set(ok.map((r) => r.clipId))];
  const coldStarts = ok.filter((r) => r.coldStart).length;
  const flushChunks = ok.filter((r) => r.chunkFromFlush).length;

  const sections: string[] = [
    "# Latency Spike — Results",
    "",
    "Generated by `npm run report`. Do not edit by hand.",
    "",
    `${records.length} recorded runs: ${ok.length} ok, ${failed.length} failed (excluded from percentiles).`,
    "",
    "## All clips pooled",
    "",
    metricTable(ok),
  ];

  for (const id of clipIds) {
    const subset = ok.filter((r) => r.clipId === id);
    const label = CONFIG.clips.find((c) => c.id === id)?.label ?? "?";
    sections.push("", `## Clip ${id} (${label}, n=${subset.length})`, "", metricTable(subset));
  }

  sections.push(
    "",
    "## Notes",
    "",
    `- Cold-start runs included in the data: ${coldStarts} (flagged \`coldStart\` in timings.jsonl)`,
    `- Runs whose first chunk only appeared at stream end (no mid-stream boundary): ${flushChunks}`,
    failed.length > 0
      ? `- Excluded failures: ${failed.map((r) => `${r.clipId}#${r.iteration} (${r.error})`).join("; ")}`
      : "- Excluded failures: none",
    "",
    "## Config",
    "",
    "```json",
    JSON.stringify(
      {
        sttModel: CONFIG.sttModel,
        llmModel: CONFIG.llmModel,
        ttsModel: CONFIG.ttsModel,
        ttsVoice: CONFIG.ttsVoice,
        maxCompletionTokens: CONFIG.maxCompletionTokens,
        minChunkLength: CONFIG.minChunkLength,
        iterations: CONFIG.iterations,
        interRunDelayMs: CONFIG.interRunDelayMs,
        ttfaTargetMs: CONFIG.ttfaTargetMs,
        clips: CONFIG.clips.map((c) => `${c.id} (${c.label})`),
      },
      null,
      2
    ),
    "```",
    ""
  );

  const tmp = RESULTS + ".tmp";
  fs.writeFileSync(tmp, sections.join("\n"));
  fs.renameSync(tmp, RESULTS);
  console.log(`wrote ${RESULTS} (${ok.length} ok runs, ${failed.length} excluded)`);
}

main();
```

- [ ] **Step 2: Type-check**

Run: `cd spikes/latency && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add spikes/latency/src/report.ts
git commit -m "Add p50/p90 report generator

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Smoke run (1 iteration × 1 clip), then reset

Verifies the instrument against real APIs before spending the full budget (~$0.02 for the smoke run).

- [ ] **Step 1: Run the smoke run**

Run: `cd spikes/latency && npm run run -- --iterations 1 --clip c2`
Expected: one line like `[1] c2 iter 0 — stt NNNms, ttft NNNms, ttfa chunked NNNNms / unchunked NNNNms`, then `1 runs (0 failed) appended to .../out/timings.jsonl`

- [ ] **Step 2: Inspect the record for sanity**

Read `spikes/latency/out/timings.jsonl` and check every assertion:
- `ok: true`; `transcript` is Japanese text close to 週末に友達と映画を見に行きます。
- `reply` is a short Japanese partner response (2–4 sentences, no error correction)
- `firstChunk` is the reply's first sentence; `chunkFromFlush` is false (or true with a sensible reason)
- Event ordering holds: `sttDone < llmFirstToken ≤ llmFirstBoundary ≤ llmDone ≤ ttsFullStart < ttsFullDone`, and `ttsChunkStart ≥ llmFirstBoundary`, `ttsChunkDone > ttsChunkStart`
- The pipelining shows: `ttsChunkStart < llmDone` (chunk TTS fired while the stream was still draining) — if not, note why (very short reply is the usual cause)
- `ttfaChunkedMs < ttfaUnchunkedMs`
- `ttsChunkBytes > 0` and `ttsFullBytes > ttsChunkBytes`

If anything is off, fix the pipeline and repeat the smoke run before proceeding.

- [ ] **Step 3: Generate the report against smoke data**

Run: `cd spikes/latency && npm run report`
Expected: `out/results.md` written with the full table structure (n=1 percentiles are degenerate — that's fine, this checks the report plumbing).

- [ ] **Step 4: Reset the output directory**

The smoke records must not pollute the real dataset:

```bash
rm spikes/latency/out/timings.jsonl spikes/latency/out/results.md
```

- [ ] **Step 5: Commit any pipeline fixes made during smoke testing**

If Step 2 required code changes, commit them now (nothing to commit if the smoke run was clean):

```bash
git add spikes/latency/src/
git commit -m "Fix pipeline issues found in smoke run

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Full measurement run + committed evidence

30 sequential runs ≈ 5–8 minutes wall clock (each run ~8–15s + 2s delay). Estimated spend well under $1.

- [ ] **Step 1: Run the full measurement**

Run: `cd spikes/latency && npm run run`
Expected: 30 progress lines, ending `30 runs (0 failed) appended to .../out/timings.jsonl`. A handful of failures is acceptable (they're excluded and reported); more than ~5 failures means something systematic — investigate before continuing.

- [ ] **Step 2: Generate the report**

Run: `cd spikes/latency && npm run report`
Expected: `wrote .../out/results.md (N ok runs, M excluded)`

- [ ] **Step 3: Read out/results.md and sanity-check the numbers**

- TTFA chunked p50 should be strictly less than TTFA unchunked p50 (paired measurement guarantees the direction; the gap size is the finding)
- STT round trip should plausibly exceed clip duration × ~0.3 (it's an upload + inference)
- If any number is wildly implausible (negative, or TTFA > 60s), stop and investigate before committing.

- [ ] **Step 4: Commit the evidence**

```bash
git add spikes/latency/out/timings.jsonl spikes/latency/out/results.md
git commit -m "Add latency spike measurement data and generated report

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Findings README + Vercel constraints note

**Files:**
- Create: `spikes/latency/README.md`

- [ ] **Step 1: Fetch current Vercel function-constraint docs**

WebFetch these pages (current docs, not memory) and extract: max function duration per plan (Hobby/Pro), whether streaming responses are supported from Next.js App Router route handlers, and anything affecting a long-lived STT→LLM→TTS request:

- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/functions/configuring-functions/duration
- https://vercel.com/docs/functions/streaming-functions

- [ ] **Step 2: Apply the pre-registered decision rule to the measured numbers**

From `out/results.md`, mechanically apply the rule from the spec (no reinterpretation):

- unchunked TTFA p50 > 3s → chunked TTS **required**
- else if unchunked TTFA p90 > 3s → chunked TTS **recommended**
- chunked TTFA p50 ≤ 3s → "feels like voice messaging" promise **confirmed**
- chunked TTFA p50 > 3s → identify the dominant stage from the per-stage table and state the architectural implication (turn-based-pipeline-under-pressure outcome)

- [ ] **Step 3: Write README.md**

Structure (fill each section from the measured data — the prose is written at findings time, but every section below must be present):

```markdown
# Latency Spike — Findings

**Question:** What is the real time-to-first-audio for a push-to-talk voice turn,
and does sentence-chunked TTS get it under ~3 seconds?

**Answer:** [One-paragraph answer: the two TTFA numbers and the decision.]

## Results

[Paste the pooled p50/p90 table from out/results.md. Link to out/results.md
for per-clip breakdowns.]

## Decision

[Output of Step 2: required / recommended / confirmed, stated against the
pre-registered rule from the spec — quote the rule so the README stands alone.]

## Reading the data

[2–4 paragraphs: which stage dominates, how big the chunked-vs-unchunked gap
is, cold-start effects if visible, anything surprising.]

## Vercel constraints (documentation-derived, not measured)

[Step 1 findings: duration limits per plan, streaming support, implications
for running this pipeline in a Next.js API route in M2. Explicitly labeled
as doc-derived.]

## Limitations

- gpt-4o is a stand-in for the planned Claude Sonnet partner model — TTFT and
  tokens-per-second do not transfer; rerunning against Sonnet is a key + one
  config change (`llmModel` in src/config.ts).
- Measured from a residential Mac, not from Vercel's network.
- TTS-synthesized clean input clips; STT latency on noisy real speech may differ.
- Single day's measurements; no time-of-day or load variance captured.

## Implications for M2

[Concrete guidance: is the chunker required in the M2 voice pipeline; what
TTFA budget each stage gets; whether the streaming seam needs anything
special on Vercel.]

## Reproducing

npm install && npm test && npm run run && npm run report
(.env with OPENAI_API_KEY required; reads spike 1's audio clips in place.)
```

- [ ] **Step 4: Cross-check README against the spec's exit criteria**

All four must hold: (1) committed p50/p90 table, (2) measured chunked-vs-unchunked comparison, (3) written chunked-required decision per the pre-registered rule, (4) Vercel constraints note. Also confirm all four limitations from the spec's "Limitations" section appear.

- [ ] **Step 5: Commit**

```bash
git add spikes/latency/README.md
git commit -m "Record latency spike findings and chunked-TTS decision

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
