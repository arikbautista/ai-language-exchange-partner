# Follow-up: harden register detection, then re-run this spike

**Status:** ✅ resolved 2026-06-19 · **Blocks:** ~~wiring corrections into M3~~ (cleared)
**Created:** 2026-06-16 (from the correction-quality spike's outcome (c))

## Resolution (2026-06-19)

Done. The register instruction in `CORRECTION_SYSTEM_PROMPT` (`src/config.ts`) now has an
explicit two-direction trigger (too-casual to a named superior; over-formal keigo to a peer)
with the casual-tone guard kept. The register set was expanded 2 → 6 with diagnostic frames,
and matched casual-to-peer controls (`cr1`/`cr2`) were added.

**Register went 0/4 → mostly-caught with precision untouched.** Three runs (baseline + two
prompt iterations) showed register **recall is prompt-brittle** (67–83% depending on wording,
temp 0, n=12) while **precision is bulletproof** (control-clean **100% every run**, incl.
casual-to-peer — so the precision/recall tension this brief worried about resolved entirely on
the precision side). The shipped prompt ("run 3", current in `src/config.ts`): catch 84/84%,
control-clean 100/100%, correction-acceptable **100/100%**, register pooled 67% (8/12).
All four grammar classes clean; the dominant under-politeness direction (`r1`/`r3`/`r4`)
solid; residual misses are `r2` and over-formal-isolated `r5`.

**Against the acceptance criteria below:** control-clean ✅ (100% ≥90), correction-acceptable
✅ (100% ≥90), register catch ⚠️ landed at 67–83% rather than cleanly clearing 85% — but we
**deliberately stopped tuning**: a tighter prompt that recovered one case lost another, which
on a 12-sentence authored corpus is fitting noise. For a low-pressure partner a *missed*
register flag is the gentlest failure (it just stays quiet), and over-correction never
happened — so this is shippable. Carry the caveat forward: instrument register catch against
**real M3 telemetry** instead of more authored sentences. Full write-up in `README.md`
(2026-06-19 update). The original brief below is preserved as the record of the investigation.

---

This is a self-contained brief for an agent picking up the one unresolved finding
from the correction-quality spike. Read `README.md` in this directory first for the
full results; this file is the actionable next step.

## The problem in one paragraph

`gpt-4o-mini` is a strong correction pass on every axis **except register**, where it
caught **0 of 4** errors (both framings). It is not a model-capability problem — the
model can clearly produce register corrections; it stayed silent because the
pre-registered prompt tells it to be conservative about politeness. Before
corrections go into M3, harden the register instruction and re-run this harness to
confirm register catch improves **without** introducing over-correction of
legitimately-casual speech (the two pull against each other — that tension is the
whole investigation).

## Exact evidence

The two register sentences (in `src/sentences.ts`), and what the model did
(`out/corrections.json`):

| id | flawed | reference fix | model output |
|---|---|---|---|
| `r1` | 先生、明日休む**ね**。 | 先生、明日休み**ます**。 | `[]` (no correction) in both isolated & framed |
| `r2` | お客様、ちょっと待っ**て**。 | お客様、少々お待ち**ください**。 | `[]` (no correction) in both isolated & framed |

Both sentences **name the addressee** (先生 / お客様) right in the text, so the
politeness mismatch is self-evident even without conversational context — yet the
model said nothing.

## Why it happened (root cause)

The correction system prompt in `src/config.ts` (`CORRECTION_SYSTEM_PROMPT`) contains:

> カジュアルな口調そのものは誤りではありません。会話相手の口調や場面に対して不適切な場合のみ、register（丁寧さ）の問題として指摘してください。

This rule exists on purpose — it's what gives the spike its **100% control-clean**
result (the model never over-corrects the casual-but-correct controls `cc3`/`cc4`/`cc5`
like うん、コーヒーが好きだから毎朝飲んでる). The model applied it too conservatively:
it treated "casual to a teacher/customer" as acceptable casual tone rather than an
inappropriate-register error. The fix must sharpen *when* register is wrong without
telling the model to flag all casual speech.

A second factor: in the **framed** condition the default partner line
(`DEFAULT_FRAME = "今日はどんな一日でしたか？"` in `src/sentences.ts`) is polite but not
register-diagnostic, so framing added zero signal (isolated vs framed delta = 0). The
context lever was never actually tested for register.

## The task

1. **Harden the register instruction** in `CORRECTION_SYSTEM_PROMPT` (`src/config.ts`).
   Give the model an explicit trigger rather than a vague "when inappropriate," e.g.:
   *flag plain/casual or タメ口 forms (〜ね/〜て/〜だ/dictionary-form sentence endings)
   as register when the utterance addresses or names a clearly higher-status listener
   — 先生・お客様・上司・部長・お医者さん etc. — or when the conversational frame
   establishes a formal/keigo context.* Keep the existing "casual tone by itself is not
   an error" guard so the casual controls stay clean.
2. **Add register-diagnostic frames** so the context lever is actually exercised: give
   `r1`/`r2` (and any new register sentences) a `frame` field that establishes the
   formal relationship, and add a matched *casual* control under a casual frame that
   must stay unflagged. This tests the real question: does context let the model
   separate "casual, and that's fine" from "casual, and that's wrong here?"
3. **Expand the register set** from 2 sentences. With n=2 the metric is coarse; add
   ~4–6 register errors spanning teacher / customer / boss / stranger and both
   too-casual and over-formal (e.g. unnecessary 尊敬語 with a close friend), so the
   re-run gives a real per-class read.
4. **Re-run and re-score.** Because every stage caches, delete the cached outputs first:
   ```bash
   cd spikes/correction-quality
   rm out/corrections.json out/judgments.json   # keep review.md if you've hand-tagged it
   npm run correct && npm run judge && npm run score
   ```
   (Needs `.env` with `OPENAI_API_KEY`; full run ≈ $0.14.)

## Acceptance criteria

- **Register catch rises materially** (target: clears the same ≥85% bar the other real-error classes meet, on the expanded set).
- **control-clean stays ≥ 90%** — specifically, the casual-but-correct controls
  (`cc3`/`cc4`/`cc5` and any new casual-framed control) remain **unflagged**. If
  hardening register starts flagging legitimate casual speech, the prompt is too blunt;
  iterate on the trigger wording.
- **correction-acceptable stays ≥ 90%** on the new register corrections (judge + a quick
  human eyeball, since register fixes like 〜ます／お〜ください are keigo-sensitive).

## Watch out for

- **The precision/recall tension is the point.** The easy win (flag all casual) tanks
  control-clean. The whole task is finding prompt wording that catches `r1`/`r2` while
  leaving `cc3`/`cc4`/`cc5` alone. Report both numbers, not just register catch.
- **Don't change `temperature` off 0** — it's pinned for reproducible reruns.
- **The judge leans lenient on explanation quality** (see README's judge-integrity
  section); for register specifically, hand-check that explanations correctly name the
  social context, not just "use 〜ます."

## Pointers

- Prompt to edit: `src/config.ts` → `CORRECTION_SYSTEM_PROMPT`
- Sentences / frames: `src/sentences.ts` (`r1`, `r2`, the `cc*` controls, `DEFAULT_FRAME`)
- Scoring (no change needed): `src/score.ts`, `src/scoring.ts` (register is in `FLAGGABLE_CLASSES`)
- Spec (pre-registered rule + rationale): `../../docs/superpowers/specs/2026-06-16-correction-quality-spike-design.md`
- Results land in: `out/results.md` (headline + per-class), `out/review.md` (ambiguous/false-positive cases)
