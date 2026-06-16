# Correction-Quality Spike — Design

**Date:** 2026-06-16
**Status:** Approved
**Context:** Third of the pre-M0 de-risking spikes agreed in the 2026-06-11 design
review (after STT fidelity and latency). The corrections layer (M3) is the
product's reason to exist: a parallel cheap-model pass produces tap-to-reveal
corrections on the user's message bubble plus an end-of-session recap. Whether
that works hinges on the cheap model being good enough — it must catch real
learner errors, propose valid fixes, and (most importantly) *not* over-correct
clean or casual speech, which would nag the low-pressure learner this product is
built for. The original step-3 framing was "Haiku vs Sonnet"; the 2026-06-16
model switch makes `gpt-4o-mini` the planned correction model, so this spike
re-points to validating it.

## Question to answer

Is `gpt-4o-mini` good enough to ship as the parallel correction pass — does it
catch intermediate-learner (N4–N2) Japanese errors, propose acceptable fixes,
classify them usefully, and avoid over-correcting clean or casual speech — and
does feeding it conversational context change that?

## Decisions made during brainstorm

- **Model under test: `gpt-4o-mini` alone.** Not a bake-off. The question is
  "is the planned cheap correction model good enough?", scored against ground
  truth — no second correction model. (The judge below is a *different* role, not
  a comparison.)
- **Soft scoring: LLM judge (`gpt-4o`).** A deliberate departure from the STT
  spike's no-model-judging-a-model stance, accepted because correction quality is
  irreducibly soft: a learner sentence has several valid corrections and
  explanation usefulness is subjective, neither of which exact-matches the single
  `corrected` ground-truth string. Integrity guards (below) keep it honest: the
  judge grades against a reference rubric, uses a stronger model than the one
  under test, and a sample of its verdicts is hand-validated.
- **Input framing: both isolated and conversationally framed, as a variable.**
  Each test sentence is run twice — on its own, and wrapped as a reply to a
  one-line synthetic partner prompt. This is the only way to measure
  over-correction of natural casual speech (casual register is an *error* in an
  isolated polite sentence but *correct* under a casual frame) and quantifies how
  much context the real parallel pass needs.
- **Sentence set: reuse the STT fidelity corpus** (imported across packages, the
  precedent the latency spike set reading `../stt-fidelity/` in place), plus a
  few added "correct casual" controls. One shared corpus keeps all three spikes
  comparable.
- **Deliverable includes a v1 mistake taxonomy** (`src/taxonomy.ts`), the
  labeling scheme this eval scores against and the seed for M3's correction
  prompt and M4's mistake-pattern memory.
- **API key:** the same OpenAI key from spikes 1–2. Full run is one correction
  call per `sentence × framing` (~50) plus one judge call per *proposed*
  correction (fewer — controls should yield none), comfortably under $1.

## Structure

Standalone in-repo package, same pattern as the first two spikes.

```
spikes/correction-quality/
  package.json          # standalone — own deps, run via tsx, root stays clean
  README.md             # findings + recommendation land here when done
  src/config.ts         # model ids (under-test + judge), thresholds — never hardcoded
  src/sentences.ts      # imports the stt-fidelity set + adds "correct casual" controls
  src/taxonomy.ts       # v1 mistake taxonomy (data-as-code)
  src/frame.ts          # synthetic one-line partner prompts → conversational framing
  src/correct.ts        # gpt-4o-mini correction pass → out/corrections.json (cached)
  src/judge.ts          # gpt-4o judge on soft dims → out/judgments.json (cached)
  src/score.ts          # deterministic + merge judge → out/results.md + out/review.md
  out/                  # committed — corrections, judgments, results are the evidence
```

Dependencies: OpenAI SDK, tsx, TypeScript. (kuroshiro/kuromoji not needed —
scoring here is span/label/JSON, not orthographic folding.)

Every API stage is cached on disk so reruns never re-spend, matching the
crash-safe append pattern of the existing spikes:

- corrections keyed by `sentenceId × framing × model`
- judgments keyed by `correction-id`

Model ids and thresholds live in `src/config.ts` as config values, per the
project's never-hardcode-models / cost-guardrail convention.

## v1 mistake taxonomy (`src/taxonomy.ts`)

Each class carries a label, definition, canonical example, and **treatment** —
how the pipeline should act on it — because that treatment is what M3's
correction prompt and M4's mistake-pattern memory consume.

| Class | What it is | Treatment |
|---|---|---|
| `particle` | wrong/missing particle (は/が, に/で, を) | correct |
| `conjugation` | wrong verb/adjective form or tense | correct |
| `word-order` | unnatural ordering | correct |
| `word-choice` | wrong-but-plausible vocabulary | correct |
| `register` | casual mid-polite (or vice-versa) | **context-dependent** — only an error if the frame's register conflicts |
| `filler` | えーと、あの, hesitations | **never flag** — feature of natural speech (STT-spike finding) |
| `none` | no error present (controls) | must produce zero corrections |

Two additions beyond the STT set's six classes:

- **`register` is explicitly context-dependent** — the reason the isolated-vs-framed
  variable exists. The taxonomy encodes that register verdicts depend on the frame
  so both scorer and judge treat them accordingly.
- **`filler` and `none` carry "do not correct" treatment** — the false-positive
  traps. Flagging a filler or inventing an error on a clean sentence is worse than
  missing a real error.

The taxonomy is **versioned (v1) and expected to change.** If the eval shows
gpt-4o-mini systematically conflating classes or needing a split, that is a
finding and a documented v2 follow-up — not chased now.

## Sentence set (`src/sentences.ts`)

Imports the STT fidelity corpus (17 flawed + 4 control) verbatim for cross-spike
comparability, and adds a small number of **"correct casual" controls** —
grammatical sentences in plain/casual form — so the framed run can show whether
the model wrongly flags casual register when a casual partner frame licenses it.
Each entry keeps the existing shape (`id`, `errorClass`, `flawed`, `corrected`,
note); controls use `errorClass: none` with `flawed === corrected`.

## Conversational framing (`src/frame.ts`)

For the framed condition, each sentence is wrapped as the learner's reply to a
one-line synthetic partner turn. Frames are fixed (data-as-code, not generated)
so the run stays deterministic and reruns are stable. A casual-register control
gets a casual partner frame; a polite sentence gets a polite frame — the frame is
what makes a register verdict correct or incorrect.

## Correction pass (`src/correct.ts`)

Runs the model under test (`gpt-4o-mini`) once per `sentence × framing`. The
prompt instructs it to act as the product's parallel correction pass for an N4–N2
learner: identify errors that matter, ignore fillers, stay gentle, and — critically
— return nothing when the sentence is fine. Output is **structured JSON**: a list
of `{ original, suggestion, errorClass, explanation }` items, or an empty list.
This contract mirrors the product's tap-to-reveal model and is itself a reusable
M3 artifact. Results appended to `out/corrections.json`; already-run combos
skipped. Per-call cost estimated and totaled per run.

## Judge (`src/judge.ts`)

Runs `gpt-4o` over each proposed correction on the two **soft** dimensions only:

- **Correction acceptability** — is the suggestion valid Japanese that resolves
  the learner's error? The judge is given the ground-truth `corrected` string and
  the error note as a rubric, so it grades against a reference rather than
  freeform opinion (this is what lets a valid *alternative* correction pass).
- **Explanation quality** — pass / borderline / fail: is the learner-facing
  explanation accurate and useful for an N4–N2 learner?

The deterministic metrics (catch, false-positive, classification) do **not** go
through the judge. Judgments appended to `out/judgments.json`, keyed by
correction-id, cached.

## Scoring (`src/score.ts`)

Deterministic metrics computed directly; judge verdicts merged in. Output
`out/results.md` (per-class scorecard + isolated-vs-framed comparison +
judge-agreement section) and `out/review.md` (anything ambiguous, for quick hand
inspection).

| Metric | How | Source |
|---|---|---|
| **Catch rate (recall)** | did the model flag the intended error span on a flawed sentence? | deterministic |
| **False-positive rate** | any flag on a `none`/`filler` control, or an *extra* flag beyond the intended error | deterministic |
| **Classification accuracy** | model's `errorClass` vs ground truth, with a synonym-normalization map | deterministic |
| **Correction acceptability** | valid fix that resolves the error (rubric: `corrected` + note) | judge |
| **Explanation quality** | accurate + useful for N4–N2 (pass/borderline/fail) | judge |
| **Context delta** | isolated vs framed, same sentence — esp. effect on `register` false positives | descriptive |

## Pre-registered decision rule

Locked before any measurement, applied mechanically afterward (as the latency
spike's TTFA rule was).

- `gpt-4o-mini` is **viable as the correction pass** if all three hold:
  **catch ≥ 85%**, **control-clean ≥ 90%** (false-positive ≤ 10%), and
  **correction-acceptable ≥ 90%** (judge).
- Catch high but **false-positives high** → it over-corrects. Check the **context
  delta** first: if the framed run already pulls false-positives under 10%, the
  fix is "give the correction pass conversation context," not "change the model."
  Otherwise → prompt-hardening lever, documented for M3.
- **Classification unreliable** (< ~80%) but catch/precision fine → ship
  gpt-4o-mini for the correction *text*, but M4's mistake-pattern memory needs a
  separate/stronger labeling source. Stated as an M4 implication, not a blocker.
- **Even framed false-positives stay high** → gpt-4o-mini is **not viable alone**;
  escalate (stronger model, or a two-stage cheap-flag-then-verify pass). This is
  the real no-ship outcome.

## Judge integrity check

Because a model is grading a model, the spike hand-validates a sample of judge
verdicts (~15, spread across pass/borderline/fail) and reports judge–human
agreement in the README. If the judge can't be trusted, every soft metric is
suspect and the findings say so explicitly.

## Testing & error handling

Spike-grade. Fail loudly; rely on caching for cheap reruns. Exactly one unit
test: the deterministic scorer (catch/miss/false-positive classification +
class-label normalization), because every quantitative conclusion flows through
it. No tests for the API-wrapper scripts or the judge.

## Exit criteria

Done when `spikes/correction-quality/README.md` contains the per-class scorecard,
the isolated-vs-framed comparison, the judge-agreement number, and a written
recommendation choosing one of:

- **(a)** ship `gpt-4o-mini` as-is
- **(b)** ship `gpt-4o-mini` *with conversation context*
- **(c)** ship with a hardened correction prompt
- **(d)** `gpt-4o-mini` insufficient — escalate (stronger model or two-stage pass)

Findings flow into the M3 design, the M4 memory assumptions, and the v2 taxonomy.

## Out of scope

- Multi-turn conversation eval (correction behavior across accumulating turns) —
  an M3-implementation concern, not a spike question; the isolated-vs-framed
  variable already captures the context effect without the non-determinism.
- A second correction model / bake-off — the question is "is gpt-4o-mini good
  enough?", not "which is best."
- Recap-quality evaluation (the end-of-session summary) — separate from per-turn
  correction quality; revisit in M3.
- Real learner-written sentences — the corpus is authored test data; collecting
  real intermediate-learner error samples is a later (pre-beta) step.
- Latency/cost of the correction pass under load — covered by the cost-logging
  guardrail in M5, not here.
