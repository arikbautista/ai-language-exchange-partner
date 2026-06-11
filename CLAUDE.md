# AI Japanese Conversation Partner

A mobile-first PWA giving intermediate Japanese learners (JLPT N4–N2) a low-pressure AI conversation partner: voice conversation, gentle corrections, and per-user memory.

## Status

Pre-implementation. The approved product design spec and milestone roadmap live in Notion (links below). No application code exists yet — the next step is brainstorming and spec'ing milestone M0.

## Source of truth

- Notion root page: [AI Japanese Language Exchange Partner](https://app.notion.com/p/1f23b7663ce680e4bdbcc60150df7912)
  - **Product Design Spec** — approved 2026-06-10
  - **Roadmap & Milestones** — M0–M5; each milestone gets its own brainstorm → spec → plan cycle before implementation

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
- Vercel AI SDK as the model abstraction layer — Claude Sonnet for the partner, a cheap fast model (e.g., Haiku) for the parallel correction pass
- STT: OpenAI `gpt-4o-transcribe`; TTS: Google Cloud TTS vs. OpenAI TTS (bake-off scheduled in M1)
- kuroshiro + kuromoji for tokenization and the furigana toggle
- Vercel hosting; PostHog analytics

## Working conventions

- Milestone-based roadmap (M0 foundation → M5 beta launch), deliberately no calendar deadlines.
- Each milestone ends with something working and deployed.
- Cost guardrails from day one: log per-turn API cost; the free-tier daily message limit is a config value, never hardcoded.
