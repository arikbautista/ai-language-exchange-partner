# AI Japanese Conversation Partner

> For learners who can read Japanese but freeze when speaking — a patient native-speaker partner who remembers you.

A mobile-first web app (PWA) for intermediate Japanese learners (JLPT N4–N2): hold a button, speak Japanese, and converse with an AI partner who replies in JLPT-tuned Japanese — by voice and text — corrects you gently without breaking the flow, and remembers your vocabulary and recurring mistakes across sessions.

## Why

Intermediate learners have great tools for vocab (Anki, WaniKani) and grammar (Genki), but conversation practice means either expensive scheduled tutoring or the anxiety of real humans. This app is the missing piece: unlimited, judgment-free speaking practice that adapts to you.

## Core loop

1. Pick a partner persona or a scenario (restaurant, meeting someone, job interview…)
2. Converse by push-to-talk voice or text — transcript always visible, furigana toggle
3. Corrections accumulate quietly: tap a badge on your message to see the natural phrasing
4. End every session with a recap: mistakes, natural alternatives, new vocabulary
5. Next session, your partner remembers you — your words, your weak spots, your story

## Status

🏗️ Pre-implementation. Design spec and milestone roadmap are complete; build starts with M0 (foundation).

| Milestone | Goal |
|---|---|
| M0 | Foundation: scaffolding, auth, deploy pipeline |
| M1 | Text conversation core + TTS bake-off |
| M2 | Voice: push-to-talk in, spoken replies out |
| M3 | Corrections + session recap |
| M4 | Memory, scenarios & personas |
| M5 | Beta launch |

## Tech stack

Next.js (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase (Postgres + Auth) · Drizzle · Vercel AI SDK (gpt-4o partner / gpt-4o-mini corrections) · OpenAI STT · Google Cloud or OpenAI TTS · kuroshiro/kuromoji · Vercel · PostHog

See `CLAUDE.md` for the full design decisions and roadmap details.
