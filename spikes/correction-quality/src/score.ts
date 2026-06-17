// spikes/correction-quality/src/score.ts
import fs from "node:fs";
import path from "node:path";
import { SENTENCES, type TestSentence } from "./sentences.js";
import { CONFIG, OUT_DIR } from "./config.js";
import { FLAGGABLE_CLASSES } from "./taxonomy.js";
import { overlapVerdict, classMatches } from "./scoring.js";
import type { CorrectionEntry, JudgmentEntry, Framing } from "./types.js";

const CORRECTIONS_FILE = path.join(OUT_DIR, "corrections.json");
const JUDGMENTS_FILE = path.join(OUT_DIR, "judgments.json");
const RESULTS_FILE = path.join(OUT_DIR, "results.md");
const REVIEW_FILE = path.join(OUT_DIR, "review.md");

const pct = (n: number, d: number) => (d === 0 ? "—" : `${Math.round((100 * n) / d)}% (${n}/${d})`);

// A sentence is a "never-flag" case (control bucket) when its class is NOT a real
// error the model should flag — that's both "none" controls AND "filler" (fillers
// must be ignored, not corrected). Real-error classes are the catch bucket.
const isFlaggable = (cls: string): boolean => (FLAGGABLE_CLASSES as readonly string[]).includes(cls);

async function main() {
  const corrections = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, "utf8")) as CorrectionEntry[];
  const judgments = fs.existsSync(JUDGMENTS_FILE)
    ? (JSON.parse(fs.readFileSync(JUDGMENTS_FILE, "utf8")) as JudgmentEntry[]) : [];
  const byId = new Map<string, TestSentence>(SENTENCES.map((s) => [s.id, s]));
  const judgeBy = new Map<string, JudgmentEntry>(
    judgments.map((j) => [`${j.sentenceId}:${j.framing}:${j.correctionIndex}`, j]));

  const review: string[] = [];

  interface Agg { caughtN: number; flawedN: number; acceptN: number; acceptDen: number;
    classN: number; classDen: number; controlCleanN: number; controlN: number; }
  const mkAgg = (): Agg => ({ caughtN: 0, flawedN: 0, acceptN: 0, acceptDen: 0, classN: 0, classDen: 0, controlCleanN: 0, controlN: 0 });
  const agg: Record<Framing, Agg> = { isolated: mkAgg(), framed: mkAgg() };

  for (const ce of corrections) {
    const s = byId.get(ce.sentenceId)!;
    const a = agg[ce.framing];

    if (!isFlaggable(s.errorClass)) {
      // never-flag bucket: controls (none) + fillers. Clean = zero corrections.
      a.controlN++;
      if (ce.corrections.length === 0) a.controlCleanN++;
      else review.push(
        `## ${ce.sentenceId}/${ce.framing} — never-flag sentence flagged (false positive?)\n` +
        `- class: ${s.errorClass}\n- sentence: ${s.flawed}\n- flags: ${ce.corrections.map((c) => `${c.original}→${c.suggestion} [${c.errorClass}]`).join("; ")}\n- tag: \n`);
      continue;
    }

    // Flawed (real-error) sentence: did any correction overlap the known error region?
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
      a.classDen++;
      if (classMatches(ce.corrections[catchIndex].errorClass, s.errorClass)) a.classN++;
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
  const row = (label: string, pick: (a: Agg) => string, thr: string) =>
    L.push(`| ${label} | ${pick(agg.isolated)} | ${pick(agg.framed)} | ${thr} |`);
  row("catch rate", (a) => pct(a.caughtN, a.flawedN), `≥ ${CONFIG.thresholds.catch * 100}%`);
  row("control-clean", (a) => pct(a.controlCleanN, a.controlN), `≥ ${CONFIG.thresholds.controlClean * 100}%`);
  row("correction-acceptable (judge)", (a) => pct(a.acceptN, a.acceptDen), `≥ ${CONFIG.thresholds.acceptable * 100}%`);
  row("classification accuracy", (a) => pct(a.classN, a.classDen), `≥ ${CONFIG.thresholds.classify * 100}%`);

  // Per-class catch (pooled across framings), directional only.
  L.push("", "## Catch rate by class (pooled, directional — small n)", "", "| class | caught / flawed |", "|---|---|");
  for (const cls of FLAGGABLE_CLASSES) {
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
