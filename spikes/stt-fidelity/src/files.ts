// spikes/stt-fidelity/src/files.ts
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Sentence } from "./sentences.js";

export type Voice = "openai" | "kyoko";

const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
export const AUDIO_DIR = path.join(ROOT, "audio");
export const OUT_DIR = path.join(ROOT, "out");

/** mp3 from OpenAI TTS, wav from macOS `say`. */
export function audioFormat(voice: Voice): "mp3" | "wav" {
  return voice === "openai" ? "mp3" : "wav";
}

/** Deterministic filename: re-synthesis is skipped while text+voice unchanged. */
export function audioFileFor(s: Sentence, voice: Voice): string {
  const h = createHash("sha256").update(`${voice}:${s.flawed}`).digest("hex").slice(0, 12);
  return path.join(AUDIO_DIR, `${s.id}-${voice}-${h}.${audioFormat(voice)}`);
}
