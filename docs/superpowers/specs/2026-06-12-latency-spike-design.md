# Latency Spike — Design

**Date:** 2026-06-12
**Status:** Approved
**Location:** `spikes/latency/`

## Question

What is the real time-to-first-audio (TTFA) for a push-to-talk voice turn
(audio → STT → streaming LLM → TTS), and does sentence-chunked TTS get it
under ~3 seconds?

The product design promises "feels like voice messaging" (~2–3s perceived
latency). The design review flagged the latency math as optimistic: if TTS
waits for the full LLM reply, the realistic round trip is 5–8s. This spike
measures instead of estimates.

## Exit criteria

1. A p50/p90 latency table per pipeline stage (committed, reproducible).
2. A measured chunked-vs-unchunked TTFA comparison from real pipelined runs.
3. A written decision: **chunked TTS required or not** (rule pre-registered
   below).
4. A documentation-based note on Vercel serverless function constraints
   (duration limits, streaming support) relevant to M2.

## Decisions already made (with the user)

| Decision | Choice | Consequence |
|---|---|---|
| LLM stage | **gpt-4o stand-in** via existing OpenAI key (no Anthropic key) | TTFT / tokens-per-second numbers do not transfer to the planned partner model (Claude Sonnet). This caveat must appear in the findings. The model is a config value; rerunning against Sonnet later is a key + one config change. |
| TTS providers | **OpenAI TTS only** (`gpt-4o-mini-tts`, voice `alloy`, mp3) | The Google-vs-OpenAI comparison stays in M1's bake-off. The harness keeps TTS behind a small adapter so a second provider is a drop-in later. |
| Run environment | **Local (this Mac) only** | Vercel constraints are documented from official docs, not measured. Network-position differences are a stated limitation. |
| Input audio | **Reuse `spikes/stt-fidelity/audio/`** (OpenAI-voice clips) | $0 synthesis cost; clips are known-good from spike 1. |

## Architecture

Standalone package `spikes/latency/`, mirroring `spikes/stt-fidelity`
conventions: TypeScript + tsx, dotenv, node:test, atomic writes, all
tunables in a single config module (never hardcoded — repo convention).

```
spikes/latency/
  package.json         — standalone; scripts: test, run, report
  src/config.ts        — models, prompts, iteration count N, clip list, decision thresholds
  src/chunker.ts       — streaming sentence chunker (pure function, unit-tested)
  src/stats.ts         — percentile helpers (pure, unit-tested)
  src/pipeline.ts      — one end-to-end measured run, returns a timing record
  src/run.ts           — N iterations × clips → out/timings.jsonl (append-only, crash-safe)
  src/report.ts        — timings.jsonl → out/results.md (p50/p90 table + TTFA comparison)
  src/chunker.test.ts, src/stats.test.ts
  out/timings.jsonl    — committed evidence (one JSON record per run)
  out/results.md       — generated report (committed)
  README.md            — findings, decision, caveats, Vercel constraints note
```

`.env` handling: same pattern as spike 1 — `OPENAI_API_KEY` loaded via
dotenv, file gitignored, contents never printed or committed.

## The measured pipeline (one run)

Simulates the instant the user releases the push-to-talk button. One
monotonic clock (`performance.now()`); a timestamp recorded at every event.

1. **STT** — send one clip to `gpt-4o-transcribe` with the Japanese verbatim
   prompt (the exact configuration spike 1 recommended shipping). Record
   start / done.
2. **LLM** — streaming `gpt-4o` chat completion with a production-shaped
   prompt: a ~500-token Japanese conversation-partner system prompt
   (JLPT-tuned, approximating M1's) + ~4 turns of fabricated history + the
   transcript as the user turn. Record request-sent, first token, every
   sentence boundary, generation complete.
3. **TTS, truly pipelined** — the moment the chunker emits the first complete
   sentence, fire a TTS request for it *concurrently* while the LLM stream
   continues (this is the real chunked architecture, not an after-the-fact
   sum). After generation completes, also TTS the full reply text (the
   unchunked architecture). Record start / done for both.

Derived metrics per run:

- per-stage durations (STT, TTFT, first-boundary, full generation, TTS chunk,
  TTS full)
- **TTFA chunked** = button-release → first chunk's audio bytes fully
  received (real wall clock, includes the pipelining overlap)
- **TTFA unchunked** = button-release → full reply's audio bytes fully
  received, where full-TTS starts only after generation completes

Both architectures are measured from a single LLM call (two TTS calls), so
the comparison is paired — same reply, same network conditions.

## Sample size & inputs

- **N = 10 iterations × 3 clips = 30 runs**, sequential, with a short
  inter-run delay (~2s).
- Clips: three OpenAI-voice clips from spike 1 chosen for varied utterance
  length (short / medium / longer). Exact IDs picked at implementation time
  and recorded in `config.ts`.
- Each record carries an `iteration` index and a `coldStart` flag (first run
  of the session) so warm-up effects are visible, not silently pooled.
- Failed runs record the error, are excluded from percentiles, and the
  exclusion count is reported.

Estimated spend: well under $1 (~30 STT calls on 3–5s clips, 30 streaming
gpt-4o calls at roughly 700 input / 150 output tokens, 60 short TTS calls).

## Chunker

Pure function consuming streamed text deltas, emitting a chunk when a
sentence boundary appears: 。 ！ ？ plus half-width ! ? — with a
minimum-length guard (e.g., don't emit a chunk under ~6 characters; carry it
into the next sentence). This code is a candidate to lift into M2, so it
gets real unit tests: boundary split across two deltas, multiple boundaries
in one delta, fullwidth/halfwidth mix, no boundary until stream end,
min-length carry-over.

## Report

`npm run report` reads `out/timings.jsonl` and writes `out/results.md`:

| metric | p50 | p90 |
|---|---|---|
| STT round trip | | |
| LLM time-to-first-token | | |
| LLM first sentence boundary | | |
| LLM full generation | | |
| TTS first chunk | | |
| TTS full reply | | |
| **TTFA chunked** | | |
| **TTFA unchunked** | | |

Plus: per-clip breakdown, excluded-run count, cold-start runs flagged, and
the raw config (models, N) for reproducibility.

## Decision rule (pre-registered)

- Chunked TTS is **required** if unchunked TTFA p50 > 3s.
- Chunked TTS is **recommended** if unchunked TTFA p90 > 3s.
- The "feels like voice messaging" promise is **confirmed** if chunked TTFA
  p50 ≤ 3s.
- If even chunked TTFA p50 > 3s, the README must identify the dominant stage
  and state the architectural implication (this is the
  turn-based-pipeline-under-pressure outcome).

## Vercel constraints note (docs-based)

Written into the README at findings time from current Vercel documentation:
function duration limits per plan, streaming response support from
serverless functions, anything relevant to running this pipeline inside
Next.js API routes in M2. Explicitly labeled as documentation-derived, not
measured.

## Error handling

- Any API failure inside a run: capture the error message in the timing
  record, mark the run failed, continue with the next run.
- `timings.jsonl` is append-only with atomic line writes; an interrupted
  session loses at most the in-flight run.
- `report.ts` never mutates `timings.jsonl`.

## Non-goals

- Sonnet measurement (stand-in decision above; harness makes a later rerun
  cheap).
- Google Cloud TTS (M1 bake-off).
- Audio playback / mobile autoplay behavior (M2 work on real devices).
- Multi-turn context growth effects on latency (approximated only by the
  fixed fake-history prompt; real shapes come from M1 data).
- Transcription quality (spike 1's job).

## Testing

- Unit tests (node:test): chunker edge cases, percentile math (including
  small-N behavior).
- Pipeline verified by running it for real (it is the measurement
  instrument); a `--dry-run`-style mock is out of scope for a spike.

## Limitations (to restate in findings)

- gpt-4o is a stand-in for the planned Claude Sonnet partner model.
- Measured from a residential Mac, not from Vercel's network.
- TTS-synthesized input clips (clean audio); STT latency on noisy real
  speech may differ.
- Single day's measurements; no time-of-day or load variance captured.
