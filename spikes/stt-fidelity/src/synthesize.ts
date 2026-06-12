// spikes/stt-fidelity/src/synthesize.ts
import "dotenv/config";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import OpenAI from "openai";
import { SENTENCES } from "./sentences.js";
import { AUDIO_DIR, audioFileFor, type Voice } from "./files.js";

const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";
const OPENAI_TTS_VOICE = "alloy";
// Rough public-pricing estimate, $ per input character. Spike-grade.
const EST_TTS_USD_PER_CHAR = 0.000015;

const client = new OpenAI();

async function synthOpenai(text: string, file: string): Promise<void> {
  const res = await client.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice: OPENAI_TTS_VOICE,
    input: text,
    response_format: "mp3",
  });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

function synthKyoko(text: string, file: string): void {
  execFileSync("say", [
    "-v", "Kyoko",
    "-o", file,
    "--file-format=WAVE",
    "--data-format=LEI16@22050",
    text,
  ]);
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  let created = 0, skipped = 0, paidChars = 0;

  for (const s of SENTENCES) {
    for (const voice of ["openai", "kyoko"] as Voice[]) {
      const file = audioFileFor(s, voice);
      if (fs.existsSync(file)) { skipped++; continue; }
      if (voice === "openai") {
        await synthOpenai(s.flawed, file);
        paidChars += s.flawed.length;
      } else {
        synthKyoko(s.flawed, file);
      }
      created++;
      console.log(`created ${file}`);
    }
  }

  console.log(`\n${created} created, ${skipped} skipped (cached)`);
  console.log(`est. OpenAI TTS cost this run: $${(paidChars * EST_TTS_USD_PER_CHAR).toFixed(4)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
