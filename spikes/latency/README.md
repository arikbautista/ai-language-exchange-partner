# Latency Spike — Findings

**Question:** What is the real time-to-first-audio (TTFA) for a push-to-talk voice
turn (audio → STT → streaming LLM → TTS), and does sentence-chunked TTS get it
under ~3 seconds?

**Answer:** **Chunked TTS is required, and it works.** Without chunking, the
median voice turn takes **3.34s** to first audio — over the ~3s "feels like voice
messaging" bar. Firing TTS on the first sentence the moment it streams out of the
LLM brings the median down to **2.58s**, under the bar. The win is real but the
margin is thin: chunked TTFA is **3.90s at p90**, so the slowest ~10% of turns
still spill past 3s, and the headroom shrinks further once the real partner model
(Claude Sonnet, not this spike's gpt-4o stand-in) sets the true time-to-first-token.

## Results

30 runs (10 iterations × 3 clips of varied length), 0 failures. All clips pooled:

| metric | p50 | p90 |
|---|---|---|
| STT round trip | 0.71s | 1.03s |
| LLM time-to-first-token | 0.38s | 0.70s |
| LLM first sentence boundary | 0.43s | 0.72s |
| LLM full generation | 0.69s | 0.95s |
| TTS first chunk | 1.46s | 1.78s |
| TTS full reply | 1.88s | 2.87s |
| **TTFA chunked** | **2.58s** | **3.90s** |
| **TTFA unchunked** | **3.34s** | **5.43s** |

Per-clip breakdowns (short/medium/long) and the raw config are in
[`out/results.md`](out/results.md); every run's full event timeline is in
[`out/timings.jsonl`](out/timings.jsonl).

## Decision

The decision rule was pre-registered in the
[design spec](../../docs/superpowers/specs/2026-06-12-latency-spike-design.md)
before any measurement:

> - Chunked TTS is **required** if unchunked TTFA p50 > 3s.
> - Chunked TTS is **recommended** if unchunked TTFA p90 > 3s.
> - The "feels like voice messaging" promise is **confirmed** if chunked TTFA p50 ≤ 3s.
> - If even chunked TTFA p50 > 3s, identify the dominant stage and state the
>   architectural implication.

Applying it mechanically to the numbers above:

- Unchunked TTFA p50 = **3.34s > 3s → chunked TTS is REQUIRED.**
- Chunked TTFA p50 = **2.58s ≤ 3s → the "feels like voice messaging" promise is CONFIRMED at the median.**
- Chunked TTFA p90 = 3.90s > 3s → the slowest decile still exceeds the target; chunking moves the median under the bar but does not guarantee every turn.

The design review's worry — that an unchunked turn lands in the 5–8s range — is
half-confirmed: unchunked p50 is 3.34s (better than feared) but unchunked **p90
is 5.43s**, squarely in that range. Chunking is what keeps the typical turn snappy.

## Reading the data

**TTS is the dominant stage, by a wide margin.** The first TTS chunk takes
1.46s at p50 — more than STT (0.71s) and time-to-first-token (0.38s) combined.
Everything before TTS is fast; the audio synthesis is the bottleneck. This is the
single most important lever for M2: a faster first-chunk TTS (smaller first
sentence, a lower-latency TTS model/endpoint, or streaming TTS that emits audio
before the full sentence is synthesized) buys more than any other optimization.

**Chunking works by hiding the LLM and full-synthesis tail behind the first
sentence.** In the unchunked path, TTS can't start until generation finishes
(0.69s p50) and then must synthesize the whole reply (1.88s p50). In the chunked
path, TTS starts ~0.43s in (the moment the first sentence boundary streams out)
and only has to synthesize that short first sentence (1.46s). The whole-reply
generation and full synthesis happen concurrently or are simply never on the
critical path to *first* audio. That overlap is the entire benefit, and the
smoke-test trace confirmed it is real pipelining: the chunk TTS request fired
while the LLM stream was still producing later sentences.

**The tail is driven by upstream API jitter, not by the architecture.** Two of
the 30 runs hit transient spikes — one 6.98s time-to-first-token, one 6.29s STT
round trip — and those are what pull p90 up. They're genuine production
conditions (residential network + first-party API variance), captured rather
than smoothed away. The cold-start run (first of the session) was also among the
slower ones and is flagged in the data.

## Vercel constraints (documentation-derived, not measured)

From current Vercel docs (fetched 2026-06-16); these were **not** measured by
this spike, which ran locally:

- **Function duration is not a concern.** Node.js functions get a 300s default
  on every plan (Hobby's max is also 300s; Pro/Enterprise are configurable up to
  800s, 1800s in beta). A ~3–6s voice turn sits comfortably inside even the
  Hobby limit. Set `export const maxDuration` on the M2 route handler to a small
  safety margin (e.g. 30–60s) rather than relying on the 300s default.
- **Streaming from a Next.js App Router route handler is supported**, and the
  max-duration clock explicitly includes time spent streaming the response. The
  chunked architecture — stream audio chunks back to the client as they're
  synthesized — is a first-class pattern on Vercel, not a workaround.
- **Request/response body cap is 4.5 MB.** The user's uploaded push-to-talk clip
  and any audio returned in a single response body must stay under it. Short
  turns are tiny (this spike's clips are 30–90 KB), but a long recording or a
  long full-reply mp3 could approach the limit — another reason to stream audio
  back in chunks rather than buffer a single large response.
- **I/O wait is not billed as active CPU.** Vercel bills active CPU time, and
  time spent awaiting STT/LLM/TTS calls doesn't count. A pipeline that is almost
  entirely I/O wait (as this one is) is cheap to run on Vercel regardless of wall
  time. For long-lived HTTP/1.1 connections, stream heartbeat/progress data to
  keep intermediaries from dropping the idle socket.

## Limitations

- **gpt-4o is a stand-in for the planned Claude Sonnet partner model.** The LLM
  numbers (TTFT 0.38s p50, full generation 0.69s p50) do **not** transfer to
  Sonnet. This matters more than it first appears: in the chunked path the LLM's
  only contribution to first-audio is time-to-first-boundary (~0.43s), so a
  slower Sonnet TTFT would push chunked TTFA up roughly point-for-point. If
  Sonnet's first-token latency is ~1s instead of ~0.4s, chunked TTFA p50 would
  land near 3.2s — back over target. Rerunning against Sonnet is a key + one
  config change (`llmModel` in `src/config.ts`).
- **Measured from a residential Mac, not Vercel's network.** Vercel's
  datacenter-to-API-provider path will differ (likely lower and more consistent
  latency to OpenAI than a home connection).
- **TTS-synthesized clean input clips** (reused from the STT fidelity spike).
  STT latency on noisy real-learner speech may differ.
- **Single day, single session.** No time-of-day or sustained-load variance
  captured; n=30 means p90 rests on ~3 runs.

## Implications for M2

- **Build the sentence chunker into the voice pipeline from the start** — it's
  required, not an optimization to defer. `src/chunker.ts` here is liftable
  as-is (it already has unit tests).
- **Budget the TTFA like this:** STT ~0.7s + LLM-to-first-sentence ~0.5s (with a
  Sonnet caveat — measure it) + first-chunk TTS ~1.5s. TTS is where the time
  goes; prioritize a low-latency first chunk (short opening sentence, streaming
  TTS if available) over shaving STT or LLM.
- **Stream audio chunks back from the Next.js route handler** rather than
  buffering the full reply — it matches Vercel's streaming model, keeps responses
  under the 4.5 MB body cap, and is the mechanism that delivers the chunked TTFA
  win to the actual client.
- **Re-measure with Sonnet before locking the M2 latency budget.** The median is
  under target today, but the margin is thin and the real partner model is the
  one variable this spike couldn't measure.

## Reproducing

```bash
npm install            # deps
npm test               # chunker + percentile unit tests
npm run run            # 30 runs against the live API (needs .env w/ OPENAI_API_KEY)
npm run report         # regenerate out/results.md from out/timings.jsonl
```

Reads spike 1's audio clips in place from `../stt-fidelity/audio/`. Spend for the
full run was well under $1. `npm run run -- --iterations N --clip <id>` runs a
smaller subset.
