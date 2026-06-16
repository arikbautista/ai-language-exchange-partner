// spikes/latency/src/run.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { CONFIG, ROOT } from "./config.js";
import { runPipeline } from "./pipeline.js";

const OUT_DIR = path.join(ROOT, "out");
const TIMINGS = path.join(OUT_DIR, "timings.jsonl");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const sleep = (msec: number) => new Promise((r) => setTimeout(r, msec));

async function main() {
  const iterations = Number(arg("iterations") ?? CONFIG.iterations);
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error(`bad --iterations: ${arg("iterations")}`);
  }
  const clipFilter = arg("clip");
  const clips = clipFilter ? CONFIG.clips.filter((c) => c.id === clipFilter) : CONFIG.clips;
  if (clips.length === 0) throw new Error(`no clip matches --clip ${clipFilter}`);
  for (const c of clips) {
    if (!fs.existsSync(c.path)) throw new Error(`missing clip ${c.path} — spike 1 audio not present`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const client = new OpenAI();

  let runIndex = 0;
  let failures = 0;
  for (let iter = 0; iter < iterations; iter++) {
    for (const clip of clips) {
      const rec = await runPipeline(client, {
        clipId: clip.id,
        clipPath: clip.path,
        iteration: iter,
        coldStart: runIndex === 0,
      });
      fs.appendFileSync(TIMINGS, JSON.stringify(rec) + "\n");
      runIndex++;
      if (rec.ok) {
        const d = rec.derived!;
        console.log(
          `[${runIndex}] ${clip.id} iter ${iter} — stt ${d.sttMs}ms, ttft ${d.ttftMs}ms, ` +
            `ttfa chunked ${d.ttfaChunkedMs}ms / unchunked ${d.ttfaUnchunkedMs}ms`
        );
      } else {
        failures++;
        console.log(`[${runIndex}] ${clip.id} iter ${iter} FAILED: ${rec.error}`);
      }
      await sleep(CONFIG.interRunDelayMs);
    }
  }
  console.log(`\n${runIndex} runs (${failures} failed) appended to ${TIMINGS}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
