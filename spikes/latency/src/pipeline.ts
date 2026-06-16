// spikes/latency/src/pipeline.ts
import fs from "node:fs";
import { performance } from "node:perf_hooks";
import OpenAI from "openai";
import { CONFIG } from "./config.js";
import { createChunker } from "./chunker.js";
import { synthesize } from "./tts.js";

export interface RunInput {
  clipId: string;
  clipPath: string;
  iteration: number;
  coldStart: boolean;
}

export interface TimingRecord {
  at: string;
  clipId: string;
  iteration: number;
  coldStart: boolean;
  ok: boolean;
  error?: string;
  transcript?: string;
  reply?: string;
  firstChunk?: string;
  /** True when no sentence boundary appeared mid-stream; the "first chunk" is the flushed remainder. */
  chunkFromFlush?: boolean;
  ttsChunkBytes?: number;
  ttsFullBytes?: number;
  /** Event offsets in ms from t0 (simulated push-to-talk release). */
  t?: {
    sttDone: number;
    llmRequestSent: number;
    llmFirstToken: number;
    llmFirstBoundary: number;
    /** Every sentence boundary the chunker emitted, in order. */
    boundaries: number[];
    llmDone: number;
    ttsChunkStart: number;
    ttsChunkDone: number;
    ttsFullStart: number;
    ttsFullDone: number;
  };
  derived?: {
    sttMs: number;
    ttftMs: number;
    firstBoundaryMs: number;
    llmMs: number;
    ttsChunkMs: number;
    ttsFullMs: number;
    /** t0 → first chunk's audio bytes fully received (real pipelined wall clock). */
    ttfaChunkedMs: number;
    /** t0 → full reply's audio fully received, full-TTS starting only after generation completes. */
    ttfaUnchunkedMs: number;
  };
  models: { stt: string; llm: string; tts: string };
}

export async function runPipeline(client: OpenAI, input: RunInput): Promise<TimingRecord> {
  const base: TimingRecord = {
    at: new Date().toISOString(),
    clipId: input.clipId,
    iteration: input.iteration,
    coldStart: input.coldStart,
    ok: false,
    models: { stt: CONFIG.sttModel, llm: CONFIG.llmModel, tts: CONFIG.ttsModel },
  };
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);

  try {
    // 1. STT — t0 is the moment the user releases push-to-talk
    const stt = await client.audio.transcriptions.create({
      file: fs.createReadStream(input.clipPath),
      model: CONFIG.sttModel,
      language: "ja",
      prompt: CONFIG.sttPrompt,
    });
    const sttDone = ms();
    const transcript = stt.text;

    // 2. Streaming LLM with a production-shaped prompt
    const chunker = createChunker(CONFIG.minChunkLength);
    let reply = "";
    let llmFirstToken = -1;
    const boundaries: number[] = [];
    let firstChunk: string | null = null;
    let chunkFromFlush = false;
    let ttsChunkStart = -1;
    let ttsChunkDone = -1;
    let ttsChunkBytes = 0;
    let ttsChunkPromise: Promise<void> | null = null;

    const speakFirstChunk = (text: string) => {
      ttsChunkStart = ms();
      // Deliberately not awaited here: the LLM stream keeps draining while
      // this request is in flight — that overlap IS the chunked architecture.
      ttsChunkPromise = synthesize(client, text).then(({ bytes }) => {
        ttsChunkDone = ms();
        ttsChunkBytes = bytes;
      });
    };

    const llmRequestSent = ms();
    const stream = await client.chat.completions.create({
      model: CONFIG.llmModel,
      messages: [
        { role: "system", content: CONFIG.systemPrompt },
        ...CONFIG.fakeHistory,
        { role: "user", content: transcript },
      ],
      stream: true,
      max_completion_tokens: CONFIG.maxCompletionTokens,
    });

    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content ?? "";
      if (!delta) continue;
      if (llmFirstToken < 0) llmFirstToken = ms();
      reply += delta;
      const sentences = chunker.push(delta);
      for (const sentence of sentences) {
        boundaries.push(ms());
        if (firstChunk === null) {
          firstChunk = sentence;
          speakFirstChunk(sentence);
        }
      }
    }
    const llmDone = ms();

    if (firstChunk === null) {
      // Reply had no mid-stream sentence boundary; chunked degrades to
      // "first chunk = whole reply at stream end". Still measured, flagged.
      const rest = chunker.flush();
      if (!rest) throw new Error("LLM returned an empty reply");
      firstChunk = rest;
      chunkFromFlush = true;
      boundaries.push(llmDone);
      speakFirstChunk(firstChunk);
    }
    const llmFirstBoundary = boundaries[0];

    // 3. Unchunked architecture: TTS the full reply, starting only after
    // generation completes. (The chunk request is usually finished by now;
    // rare overlap is acceptable measurement noise for a spike.)
    const ttsFullStart = ms();
    const { bytes: ttsFullBytes } = await synthesize(client, reply);
    const ttsFullDone = ms();

    await ttsChunkPromise;

    return {
      ...base,
      ok: true,
      transcript,
      reply,
      firstChunk,
      chunkFromFlush,
      ttsChunkBytes,
      ttsFullBytes,
      t: { sttDone, llmRequestSent, llmFirstToken, llmFirstBoundary, boundaries, llmDone, ttsChunkStart, ttsChunkDone, ttsFullStart, ttsFullDone },
      derived: {
        sttMs: sttDone,
        ttftMs: llmFirstToken - llmRequestSent,
        firstBoundaryMs: llmFirstBoundary - llmRequestSent,
        llmMs: llmDone - llmRequestSent,
        ttsChunkMs: ttsChunkDone - ttsChunkStart,
        ttsFullMs: ttsFullDone - ttsFullStart,
        ttfaChunkedMs: ttsChunkDone,
        ttfaUnchunkedMs: ttsFullDone,
      },
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : String(e) };
  }
}
