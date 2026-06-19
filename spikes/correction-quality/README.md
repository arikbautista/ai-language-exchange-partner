# Correction-Quality Spike — Findings

**Question:** Is `gpt-4o-mini` good enough to ship as the parallel correction pass —
does it catch intermediate-learner (N4–N2) Japanese errors, propose acceptable
fixes, classify them usefully, and avoid over-correcting clean or casual speech —
and does conversational context change that?

**Answer:** **Yes, with one fix first. gpt-4o-mini never over-corrected (control-clean 100%, including casual and filler traps), every fix it proposed was acceptable Japanese (acceptable 100%), and it caught particle / conjugation / word-order / word-choice errors essentially perfectly. Its one real weakness is register: it flagged 0 of 4 register errors, because the prompt tells it to be conservative about politeness. That's a prompt fix, not a model limitation — so the recommendation is (c): harden the register instruction and re-test before M3. Conversational context made no difference here (isolated vs framed delta = 0).**

## Update (2026-06-19): register hardening — resolved

The register fix from recommendation (c) is done; see [`FOLLOWUP-register.md`](FOLLOWUP-register.md)
for the full brief. The correction prompt in `src/config.ts` now carries an explicit
two-direction register trigger (too-casual to a named superior; over-formal keigo to a
peer) while keeping the "casual tone alone isn't an error" guard. The register set was
expanded 2 → 6 (teacher/customer/boss/interviewer + over-formal) with register-diagnostic
frames, plus matched casual-to-peer controls (`cr1`/`cr2`).

**Outcome: register went from a total blind spot (0/4) to mostly-caught, with precision
untouched.** Across three runs (baseline + two prompt iterations) the lesson was that
register **recall is prompt-brittle** at this corpus size — it swings 67–83% depending on
wording, at temperature 0, on n=12 register data points — while **precision is bulletproof**
(control-clean stayed **100% in every run**, including casual-to-peer). The shipped prompt
("run 3", current in `src/config.ts`) is the safest config:

| metric (run 3) | isolated | framed |
|---|---|---|
| catch rate | 84% (16/19) | 84% (16/19) |
| control-clean | 100% (17/17) | 100% (17/17) |
| correction-acceptable (judge) | 100% (16/16) | 100% (16/16) |
| register catch (pooled) | 67% (8/12) | |

Run 3 nails all four grammar classes (particle/conjugation*/word-order/word-choice) and
every correction it makes is judge-acceptable. Register recall is lumpier than the grammar
classes: the dominant **under-politeness** direction is solid (`r1`/`r3`/`r4` caught), while
boundary cases (`r2` お客様、ちょっと待って and over-formal-isolated `r5`) are the residual
misses. We **stopped prompt-golfing deliberately** — a tighter prompt that recovered one
case lost another, which on a 12-sentence authored corpus is fitting noise, not improvement.

**Why this is shippable.** For a low-pressure conversation partner, a *missed* register flag
is the gentlest possible failure — the partner just stays quiet, which is its stated
philosophy. Over-correction would be the damaging failure, and that never happened. So
register's ~70% recall / 100% precision is acceptable for M3; the residual misses are soft
spots to watch against **real M3 telemetry**, not more authored sentences.

(*conjugation shows 67% via the known `v3` insertion scorer-artifact; true ≈100% — see
`out/review.md`.)

## Results

30 sentences × 2 framings (isolated / framed) = 60 correction calls (`gpt-4o-mini`,
temperature 0); 26 proposed corrections judged by `gpt-4o`. Identical numbers in
both framings.

| metric | isolated | framed | threshold | |
|---|---|---|---|---|
| catch rate | 80% (12/15) | 80% (12/15) | ≥ 85% | ❌ as-measured / ✅ adjusted (see below) |
| control-clean (no over-correction) | 100% (15/15) | 100% (15/15) | ≥ 90% | ✅ |
| correction-acceptable (judge) | 100% (12/12) | 100% (12/12) | ≥ 90% | ✅ |
| classification accuracy | 92% (11/12) | 92% (11/12) | ≥ 80% | ✅ |

Catch rate by class (pooled across framings, directional — n is small):

| class | caught / flawed | |
|---|---|---|
| particle | 100% (8/8) | ✅ |
| conjugation | 67% (4/6) | scorer artifact — see v3 below; true ≈ 100% |
| word-order | 100% (6/6) | ✅ |
| word-choice | 100% (6/6) | ✅ |
| register | 0% (0/4) | ❌ the one real gap |

Full evidence: `out/corrections.json` (every model reply), `out/judgments.json`
(every judge verdict), `out/results.md` (scorecard + judge sample),
`out/review.md` (hand-tagged ambiguous cases).

## Decision

The decision rule was pre-registered in the
[design spec](../../docs/superpowers/specs/2026-06-16-correction-quality-spike-design.md)
before measurement:

> gpt-4o-mini is **viable** if catch ≥ 85% AND control-clean ≥ 90% AND
> correction-acceptable ≥ 90%.

Applied mechanically to the as-measured numbers, **catch (80%) misses the 85% bar**
while the other two clear theirs. But 2 of the 3 misses per framing are the `v3`
insertion case, which the deterministic scorer cannot auto-confirm (a pure
insertion produces a zero-width error region → `overlapVerdict` returns
"ambiguous" → routed to review). The model's fix for `v3`
(漢字を読む**できません** → 読む**ことが**できません) is correct and was judged
acceptable — confirmed in the manual review (`out/review.md`). **Crediting `v3` as a
catch lifts catch to 87% (13/15), clearing the bar.** All three viability
conditions then hold.

**The one genuine, reproducible gap is register: 0/4, in both framings.** This is
not noise and not a scorer artifact — gpt-4o-mini simply returned zero corrections
for 先生、明日休む**ね** (casual to a teacher) and お客様、ちょっと待っ**て**
(casual to a customer). The addressee (先生 / お客様) is named in the sentence, so
the politeness mismatch is self-evident; the model stayed silent because the
pre-registered prompt instructs it that "casual tone itself is not an error —
only flag it when inappropriate to the context." It followed that instruction too
conservatively.

**Recommendation: (c) ship gpt-4o-mini as the correction pass, but harden the
register instruction in the prompt and re-run this spike before building M3.**
gpt-4o-mini is otherwise a strong fit: zero over-correction, 100% acceptable fixes,
solid classification, near-perfect catch on the other four error classes — at
~$0.0002 per turn.

## Judge integrity

The judge approved 26/26 corrections at "pass", which on its own looks like
rubber-stamping. An independent second-rater pass (Claude, reading the Japanese —
a different assessor than the gpt-4o judge) **agreed with all 26 acceptability
verdicts**: every fix gpt-4o-mini proposed genuinely is correct Japanese, so 100%
is the right answer, not laziness. The judge actively discriminated on `v2`, where
the model suggested 寒い**ので** while the reference answer was 寒い**から** — both
valid — and the judge accepted the alternative rather than demanding a string
match. That is exactly the behavior the LLM-judge was chosen to provide. The only
disagreement: one explanation (`p2/isolated`, a slightly garbled
"主語…目的語" wording) reads as borderline to the second rater where the judge said
pass — a mild lean toward leniency on explanation quality, worth watching but not
disqualifying. Net: on this corpus the judge is trustworthy.

## Reading the data

**Over-correction — the cardinal sin — simply did not happen.** All 15 controls
per framing came back clean: clean polite, clean casual (うん、コーヒーが好きだから
毎朝飲んでる), filler-laden-but-correct (えーと、私は東京に住んでいます), and the
marginal/hedged cases. gpt-4o-mini left every one of them alone. For a low-pressure
conversation partner whose worst failure mode is nagging the learner, this is the
most important result in the spike.

**Fillers were correctly ignored, confirming the STT spike's hand-off.** `f1`/`f2`
(えーと、あの mid-sentence) drew zero flags — the prompt's "never flag fillers" rule
works, so the corrections layer won't punish natural disfluency.

**The four "real grammar" classes are basically solved.** Particle, conjugation
(modulo the v3 scoring artifact), word-order, and word-choice were caught every
time, with fixes that match or acceptably differ from the reference, and
explanations a learner can use ("薬は通常「飲む」と言います", "「着る」は服に使う動詞で、
帽子には「かぶる」を使います").

**Register is the blind spot, and it's a prompt-tuning problem.** The model can
clearly produce register corrections; it chose not to, by instruction. Hardening
the prompt (e.g. "if the learner addresses 先生/お客様/上司 etc. with plain/casual
forms, flag it as register") is the obvious next lever — and the right place to
test whether a register-diagnostic conversational frame helps, which this spike's
generic frame did not.

**Isolated vs framed delta = 0.** Identical results in both conditions. The default
frame (今日はどんな一日でしたか？) was not register-diagnostic and the model wasn't
over-correcting in the first place, so context had nothing to change. This does
**not** prove context is useless for corrections — only that a generic polite frame
doesn't move these particular metrics. A targeted re-test (register-relevant frames)
is needed to answer the context question properly.

## Limitations

- **The verdict is conditional on one prompt.** This measures gpt-4o-mini through a
  single pre-registered correction prompt (committed in `src/config.ts`). The
  register gap is the clearest evidence: it's a property of the prompt's
  conservative register instruction, not of the model. A different prompt would
  likely move register sharply; the other classes have less headroom to move.
- **Authored test data, one error per flawed sentence, small n.** 15 real-error
  sentences (n ≈ 3–5 per class) plus 15 controls. Per-class rates are directional;
  pooled metrics are the real read. Real learner utterances stack multiple errors
  and carry anglicized phrasing — untested here.
- **The judge leans lenient on explanation quality** (26/26 pass; one borderline by
  the second rater). Fine for a go/no-go signal; for fine-grained explanation
  tuning, use a stricter rubric or more hand-rating.
- **temperature 0, single run.** No run-to-run variance captured (deliberately
  pinned for reproducibility).

## Implications for M3 / M4

- **M3 (corrections):** gpt-4o-mini is the right model for the parallel correction
  pass — cheap, precise (no over-correction), and accurate on the fixes it makes.
  Ship it with the **hardened register prompt** (`src/config.ts`, "run 3") — the
  register follow-up is resolved (see the 2026-06-19 update above and
  [`FOLLOWUP-register.md`](FOLLOWUP-register.md)). Carry forward the documented register
  caveat: ~70% recall / 100% precision, lumpy on boundary cases — instrument register
  catch against real learner utterances in M3 rather than tuning further on authored
  data. The structured-JSON output contract
  (`{corrections:[{original,suggestion,errorClass,explanation}]}`) is liftable into M3 as-is.
- **M3:** the correction pass should run with conversation context regardless of
  this spike's null delta — context is needed to make register judgeable at all, and
  the generic frame here didn't test that. Add register-diagnostic frames when
  re-testing.
- **M4 (memory / mistake patterns):** classification is reliable enough (92%) to
  seed mistake-pattern tracking, but not airtight — the v2 particle/conjugation
  mislabel shows class boundaries blur. If M4's memory leans on error-class
  aggregates, expect ~1-in-12 mislabels and don't treat a single class tag as ground
  truth.
- **v2 taxonomy:** the particle/conjugation boundary (だ-insertion, ので/から) and the
  particle/word-order overlap are the fuzzy seams; revisit when the corpus grows.

## Reproducing

```bash
npm install            # deps
npm test               # scorer unit tests (12)
npm run correct        # gpt-4o-mini correction pass → out/corrections.json (needs .env w/ OPENAI_API_KEY)
npm run judge          # gpt-4o judge → out/judgments.json
npm run score          # deterministic + judge merge → out/results.md, out/review.md
```

All stages cache to disk (crash-safe, keyed per call), so reruns never re-spend.
Full run was ~$0.14 (correction ~$0.012, judge ~$0.13). After editing the prompt,
delete `out/corrections.json` + `out/judgments.json` and rerun to re-measure.
