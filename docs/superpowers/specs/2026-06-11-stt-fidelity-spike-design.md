# STT Fidelity Spike — Design

**Date:** 2026-06-11
**Status:** Approved
**Context:** First of the pre-M0 de-risking spikes agreed in the 2026-06-11 design review. The correction layer (M3) depends on STT transcripts that faithfully reflect what the learner actually said. Modern STT models are trained to produce fluent text and may silently normalize broken learner Japanese into correct Japanese, which would make corrections impossible and the recap fiction.

## Question to answer

Does `gpt-4o-transcribe` preserve Japanese learner errors, or normalize them away — and if it normalizes, which alternative path (verbatim prompting, whisper-1, audio-native LLM) preserves them?

## Decisions made during brainstorm

- **Audio source: TTS-synthesized only** (no self-recordings in this phase). Ground truth is the exact input text, enabling deterministic scoring. Limitation accepted: the "anglicized pronunciation" failure mode is untestable in this phase; adding real recordings later ("phase B") is just dropping files into the audio directory.
- **Transcription paths: 5** — `gpt-4o-transcribe` bare, `gpt-4o-transcribe` with two verbatim-prompt variants, `whisper-1` bare, and an audio-capable LLM (`gpt-4o-audio` family) instructed to transcribe as heard. Covers all candidate architectures in one run.
- **Location: in-repo at `spikes/stt-fidelity/`**, standalone package (own `package.json`, run via `tsx`) so the repo root stays clean. Sentence set and harness are intended for reuse as the seed of M3's correction eval set.
- **Scoring: deterministic normalize-and-diff**, not LLM-judged. An experiment about model trust should not depend on another model's judgment, and exact ground truth makes diffing credible.
- **API key:** user is creating a new OpenAI key. One $5 credit purchase covers the spike (~$1/full run) and the upcoming latency spike. Setup step includes setting a monthly usage limit and disabling auto-recharge.

## Structure

```
spikes/stt-fidelity/
  package.json          # standalone — own deps, root stays clean
  README.md             # findings + recommendation land here when done
  src/sentences.ts      # the dataset (data-as-code: typed, reviewable)
  src/synthesize.ts     # sentences → audio files
  src/transcribe.ts     # audio files → out/transcripts.json
  src/score.ts          # transcripts → out/results.md + out/review.md
  audio/                # gitignored (regenerable for pennies)
  out/                  # committed (transcripts + results are the evidence)
```

Dependencies: OpenAI SDK, kuroshiro + kuromoji (early test drive of the planned Japanese tooling), tsx, TypeScript.

## Sentence set (~20 entries)

Each entry: `id`, `errorClass`, `flawed` text, `corrected` text, one-line note on what is wrong.

Error classes:

| Class | Example flaw |
|---|---|
| particle choice | は/が, に/で, を misuse |
| verb conjugation | wrong tense/form |
| word order | unnatural ordering |
| word choice | wrong-but-plausible vocabulary |
| register mismatch | casual form mid-polite-sentence |
| fillers/hesitations | えーと、あの mid-sentence |
| control (correct) | 3–4 fully correct sentences |

Controls act as a sanity check: they should transcribe near-perfectly; if not, the voice or path is suspect.

## Synthesis (`synthesize`)

Two voices per sentence:

1. **OpenAI TTS** (exact model pinned at implementation time)
2. **macOS built-in Japanese voice** (`say -v Kyoko`) — free, local, and breaks the OpenAI-TTS→OpenAI-STT circularity (same-vendor audio may be unusually easy for the STT model)

Audio files cached on disk, keyed by hash of (text, voice). Re-running never re-spends.

## Transcription matrix (`transcribe`)

~20 sentences × 2 voices × 5 paths ≈ 200 calls (~$1). Results appended to `out/transcripts.json`; already-run combos are skipped (cache key: audio hash × path). Per-call cost estimated and totaled per run — the project's cost-guardrail convention starts here.

## Scoring (`score`)

Normalize both sides — kuroshiro to hiragana, strip punctuation and whitespace (orthographic variance like kanji-vs-kana is not an error) — then classify deterministically:

- transcript matches `flawed` → **preserved** (what we want)
- transcript matches `corrected` → **normalized** (the smoking gun)
- matches neither → emitted to `out/review.md` for quick manual tagging: near-preserved / near-normalized / mistranscribed

Output `out/results.md`: preservation-rate table (error class × path), per-sentence detail, control sanity-check section.

## Testing & error handling

Spike-grade. Fail loudly; rely on caching for cheap reruns. Exactly one unit test: the scorer's normalize-and-classify logic against fixture strings, because every conclusion flows through it. No tests for the API-wrapper scripts.

## Exit criteria

Done when `spikes/stt-fidelity/README.md` contains the preservation-rate table and a written recommendation choosing one of:

- **(a)** STT as planned (`gpt-4o-transcribe` bare)
- **(b)** STT + verbatim prompt
- **(c)** audio-native LLM transcription path
- **(d)** transcript confirm/edit step required in the product UX

Findings flow back into the product design docs and the M2/M3 milestone assumptions.

## Out of scope

- Real learner recordings (phase B, later — harness accepts dropped-in files)
- Non-OpenAI STT vendors (Google, Deepgram — only if all five paths fail)
- Latency measurement (Step 2, separate spike)
- Correction-quality evaluation (Step 3, separate spike — reuses this sentence set)
