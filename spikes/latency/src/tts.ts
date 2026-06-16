// spikes/latency/src/tts.ts
import OpenAI from "openai";
import { CONFIG } from "./config.js";

/**
 * Provider adapter: synthesize `text` and resolve once the audio bytes are
 * fully received (bytes are counted, then discarded — this spike measures,
 * it doesn't keep audio). A second provider (e.g. Google Cloud TTS in M1's
 * bake-off) is a drop-in replacement for this one function.
 */
export async function synthesize(client: OpenAI, text: string): Promise<{ bytes: number }> {
  const res = await client.audio.speech.create({
    model: CONFIG.ttsModel,
    voice: CONFIG.ttsVoice,
    input: text,
    response_format: CONFIG.ttsFormat,
  });
  return { bytes: Buffer.from(await res.arrayBuffer()).length };
}
