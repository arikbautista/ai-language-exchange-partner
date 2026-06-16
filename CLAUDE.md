# AI Japanese Conversation Partner

A mobile-first PWA giving intermediate Japanese learners (JLPT N4–N2) a low-pressure AI conversation partner: voice conversation, gentle corrections, and per-user memory.

## Status

Pre-implementation. The product design and milestone roadmap below were approved on 2026-06-10. No application code exists yet — the next step is brainstorming and spec'ing milestone M0.

## Key product decisions (approved, don't relitigate without the user)

- Positioned as a **conversation partner**, not "language exchange" — no AI-mimics-a-learner role switching.
- Target user: intermediate (N4–N2), the "can read but freeze when speaking" learner.
- **Voice from day one as a turn-based push-to-talk pipeline** (STT → LLM → TTS), not realtime speech-to-speech. Every utterance must exist as text — that's what powers corrections, vocab tracking, and memory. Keep an architectural seam for a future realtime "call mode" premium feature.
- **Corrections never interrupt conversation**: a parallel cheap-model pass produces tap-to-reveal corrections on the user's message bubble plus an end-of-session recap.
- **Per-user memory is the moat**: vocab + mistake patterns are tracked and injected into the partner's system prompt each session. Ships before beta (M4).
- Cut or deferred: user-to-user matching (cut entirely), pronunciation scoring, Anki/SRS export, realtime call mode, payments (limits in MVP, Stripe post-beta).

## Tech stack (planned)

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, as a PWA — **no separate backend** (no Express); Next.js API routes only
- Supabase (Postgres + Auth) + Drizzle ORM
- Vercel AI SDK as the model abstraction layer — OpenAI `gpt-4o` for the partner, `gpt-4o-mini` for the parallel correction pass (provisional, chosen 2026-06-16 for single-provider simplicity; the SDK keeps the seam to switch the partner back to Claude Sonnet later). Model IDs are always config values, never hardcoded.
- STT: OpenAI `gpt-4o-transcribe`; TTS: Google Cloud TTS vs. OpenAI TTS (bake-off scheduled in M1)
- kuroshiro + kuromoji for tokenization and the furigana toggle
- Vercel hosting; PostHog analytics

## Roadmap

Milestone-based, deliberately no calendar deadlines. Each milestone gets its own brainstorm → spec → plan cycle before implementation.

| Milestone | Goal | Done when |
|---|---|---|
| M0 | Foundation: scaffold, Supabase auth, Drizzle migrations, Vercel deploy, PWA manifest | Sign in on a phone to an empty app in production |
| M1 | Text conversation core: streaming chat, JLPT-tuned prompt, persistence, mobile UI, TTS bake-off | Real Japanese text conversation on a phone in production |
| M2 | Voice: push-to-talk, STT, TTS playback, mobile audio quirks | Full voice loop works on a real phone |
| M3 | Corrections + recap: parallel correction pass, tap-to-reveal UI, session recap, vocab/mistake extraction | Sessions end with a recap |
| M4 | Memory, scenarios & personas, furigana toggle | Partner remembers you across sessions |
| M5 | Beta launch: limits, cost logging, analytics, landing page, ~20 beta users | Strangers using it, retention data flowing |

Post-beta backlog (ordered): SRS cards from own mistakes → Stripe + paid tier → realtime call mode (premium) → pronunciation feedback.

## Working conventions

- Each milestone ends with something working and deployed.
- Cost guardrails from day one: log per-turn API cost; the free-tier daily message limit is a config value, never hardcoded.
