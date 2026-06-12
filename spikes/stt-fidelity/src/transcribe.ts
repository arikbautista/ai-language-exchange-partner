// spikes/stt-fidelity/src/transcribe.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { SENTENCES } from "./sentences.js";
import { OUT_DIR, audioFileFor, audioFormat, type Voice } from "./files.js";

const VERBATIM_JA =
  "そのまま文字起こししてください。文法の間違いや言い間違い、「えーと」「あの」などのフィラーも全て含めて、話された通りに正確に書き起こしてください。修正しないでください。";
const VERBATIM_EN =
  "Transcribe the Japanese audio verbatim, exactly as spoken. Preserve all grammatical errors, wrong particles, and fillers (えーと, あの). Do not correct or clean up the speech.";

interface SttPath { id: string; kind: "stt"; model: string; prompt?: string }
interface LlmPath { id: string; kind: "llm"; model: string; system: string }
type TranscriptionPath = SttPath | LlmPath;

const PATHS: TranscriptionPath[] = [
  { id: "4o-bare", kind: "stt", model: "gpt-4o-transcribe" },
  { id: "4o-verbatim-ja", kind: "stt", model: "gpt-4o-transcribe", prompt: VERBATIM_JA },
  { id: "4o-verbatim-en", kind: "stt", model: "gpt-4o-transcribe", prompt: VERBATIM_EN },
  { id: "whisper-bare", kind: "stt", model: "whisper-1" },
  // gpt-4o-audio-preview unavailable on this key; substituted with gpt-audio-2025-08-28
  { id: "audio-llm", kind: "llm", model: "gpt-audio-2025-08-28", system: VERBATIM_JA },
];

export interface TranscriptEntry {
  sentenceId: string;
  voice: Voice;
  pathId: string;
  model: string;
  transcript: string;
  at: string;
}

const TRANSCRIPTS_FILE = path.join(OUT_DIR, "transcripts.json");
// Rough estimates: STT ≈ $0.006/min ≈ $0.0006 per ~6s clip; audio-LLM ≈ $0.01/clip.
const EST_USD = { stt: 0.0006, llm: 0.01 };

const client = new OpenAI();

function load(): TranscriptEntry[] {
  return fs.existsSync(TRANSCRIPTS_FILE)
    ? (JSON.parse(fs.readFileSync(TRANSCRIPTS_FILE, "utf8")) as TranscriptEntry[])
    : [];
}

async function transcribeStt(p: SttPath, file: string): Promise<string> {
  const res = await client.audio.transcriptions.create({
    file: fs.createReadStream(file),
    model: p.model,
    language: "ja",
    ...(p.prompt ? { prompt: p.prompt } : {}),
  });
  return res.text;
}

async function transcribeLlm(p: LlmPath, file: string, voice: Voice): Promise<string> {
  const res = await client.chat.completions.create({
    model: p.model,
    modalities: ["text"],
    messages: [
      { role: "system", content: p.system },
      {
        role: "user",
        content: [
          {
            type: "input_audio",
            input_audio: {
              data: fs.readFileSync(file).toString("base64"),
              format: audioFormat(voice),
            },
          },
        ],
      },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "";
  if (!text) console.warn(`[WARN] empty transcript from ${p.model} for ${file}`);
  return text;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = load();
  const done = new Set(entries.map((e) => `${e.sentenceId}:${e.voice}:${e.pathId}:${e.model}`));
  let ran = 0, skipped = 0, estUsd = 0;

  for (const s of SENTENCES) {
    for (const voice of ["openai", "kyoko"] as Voice[]) {
      const file = audioFileFor(s, voice);
      if (!fs.existsSync(file)) throw new Error(`missing audio ${file} — run synthesize first`);
      for (const p of PATHS) {
        const key = `${s.id}:${voice}:${p.id}:${p.model}`;
        if (done.has(key)) { skipped++; continue; }
        const transcript =
          p.kind === "stt" ? await transcribeStt(p, file) : await transcribeLlm(p, file, voice);
        entries.push({
          sentenceId: s.id, voice, pathId: p.id, model: p.model,
          transcript, at: new Date().toISOString(),
        });
        // write after every call: crash-safe, never re-spends
        const tmp = TRANSCRIPTS_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(entries, null, 2));
        fs.renameSync(tmp, TRANSCRIPTS_FILE);
        estUsd += EST_USD[p.kind];
        ran++;
        console.log(`${key} → ${transcript}`);
      }
    }
  }

  console.log(`\n${ran} calls run, ${skipped} skipped (cached)`);
  console.log(`est. cost this run: $${estUsd.toFixed(3)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
