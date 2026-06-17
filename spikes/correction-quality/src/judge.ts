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
