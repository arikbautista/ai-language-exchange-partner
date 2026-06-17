// spikes/correction-quality/src/correct.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { SENTENCES } from "./sentences.js";
import { buildMessages } from "./frame.js";
import { CONFIG, OUT_DIR, CORRECTION_SYSTEM_PROMPT } from "./config.js";
import type { CorrectionEntry, CorrectionItem, Framing } from "./types.js";

const CORRECTIONS_FILE = path.join(OUT_DIR, "corrections.json");
const client = new OpenAI();

function load(): CorrectionEntry[] {
  return fs.existsSync(CORRECTIONS_FILE)
    ? (JSON.parse(fs.readFileSync(CORRECTIONS_FILE, "utf8")) as CorrectionEntry[])
    : [];
}

function save(entries: CorrectionEntry[]): void {
  const tmp = CORRECTIONS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
  fs.renameSync(tmp, CORRECTIONS_FILE);
}

function parseCorrections(raw: string, key: string): CorrectionItem[] {
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch {
    console.warn(`[WARN] ${key}: non-JSON reply, treating as no corrections: ${raw.slice(0, 80)}`);
    return [];
  }
  const list = Array.isArray(obj?.corrections) ? obj.corrections : [];
  return list.map((c: any) => ({
    original: String(c?.original ?? ""),
    suggestion: String(c?.suggestion ?? ""),
    errorClass: String(c?.errorClass ?? ""),
    explanation: String(c?.explanation ?? ""),
  }));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = load();
  const done = new Set(entries.map((e) => `${e.sentenceId}:${e.framing}:${e.model}`));
  let ran = 0, skipped = 0, estUsd = 0;

  for (const s of SENTENCES) {
    for (const framing of CONFIG.framings as readonly Framing[]) {
      const key = `${s.id}:${framing}:${CONFIG.correctionModel}`;
      if (done.has(key)) { skipped++; continue; }

      const res = await client.chat.completions.create({
        model: CONFIG.correctionModel,
        temperature: CONFIG.temperature,
        max_tokens: CONFIG.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CORRECTION_SYSTEM_PROMPT },
          ...buildMessages(s, framing),
        ],
      });
      const raw = res.choices[0]?.message?.content ?? "";
      const corrections = parseCorrections(raw, key);

      entries.push({
        sentenceId: s.id, framing, model: CONFIG.correctionModel,
        corrections, at: new Date().toISOString(),
      });
      save(entries); // crash-safe: write after every call
      estUsd += CONFIG.estUsd.correct;
      ran++;
      console.log(`${key} → ${corrections.length} correction(s)`);
    }
  }

  console.log(`\n${ran} calls run, ${skipped} skipped (cached)`);
  console.log(`est. cost this run: $${estUsd.toFixed(4)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
