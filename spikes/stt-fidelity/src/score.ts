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
