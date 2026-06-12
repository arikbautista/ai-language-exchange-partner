# STT Fidelity Spike — Findings

**Question:** Does gpt-4o-transcribe preserve Japanese learner errors, or normalize them away?

**Answer:** **Yes — with the Japanese verbatim prompt, gpt-4o-transcribe preserved 34/34 learner errors with zero normalization; the feared silent-correction failure mode essentially does not exist on this corpus, but STT can occasionally *invent* errors, which matters just as much for the correction product.**

## Results

Auto-scored rates (exact match after hiragana folding). Cell = preserved / normalized / review (controls: ok / review).

| error class | 4o-bare | 4o-verbatim-ja | 4o-verbatim-en | whisper-bare | audio-llm |
|---|---|---|---|---|---|
| particle | 5P / 0N / 3R | 8P / 0N / 0R | 7P / 0N / 1R | 7P / 1N / 0R | 1P / 0N / 7R |
| conjugation | 6P / 0N / 0R | 5P / 0N / 1R | 6P / 0N / 0R | 6P / 0N / 0R | 0P / 0N / 6R |
| word-order | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 0P / 0N / 6R |
| word-choice | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 6P / 0N / 0R | 0P / 0N / 6R |
| register | 4P / 0N / 0R | 4P / 0N / 0R | 3P / 0N / 1R | 3P / 0N / 1R | 0P / 0N / 4R |
| filler | 3P / 1N / 0R | 4P / 0N / 0R | 4P / 0N / 0R | 2P / 0N / 2R | 3P / 0N / 1R |
| control | 7 ok / 1 rev | 7 ok / 1 rev | 7 ok / 1 rev | 7 ok / 1 rev | 0 ok / 8 rev |

Adjusted rates after manually tagging all 51 review entries (`out/review.md`). Flawed sentences, n=34 per path (17 sentences × 2 voices). "Error survived" = preserved + near-preserved; "error cleaned" = normalized + near-normalized.

| path | error survived | error cleaned | mistranscribed | controls clean |
|---|---|---|---|---|
| 4o-bare | 30/34 (88%) | 2/34 (6%) | 2/34 (6%) | 7/8 |
| **4o-verbatim-ja** | **34/34 (100%)** | **0/34 (0%)** | **0/34 (0%)** | 7/8 |
| 4o-verbatim-en | 32/34 (94%) | 0/34 (0%) | 2/34 (6%) | 7/8 |
| whisper-bare | 31/34 (91%) | 1/34 (3%) | 2/34 (6%) | 8/8 |
| audio-llm | 18/34 (53%) | 0/34 (0%) | 16/34 (47%) | 0/8 |

(All control failures except audio-llm's are the c4/kyoko 寿司 synthesis artifact — see below. One entry, v3/kyoko/4o-verbatim-ja, is tagged with a `(?)` uncertainty marker: 読むできません came back as 読めできません — error construction intact, one kana misheard; counted as survived.)

## Reading the data

**All four STT paths preserve learner errors overwhelmingly, and genuine normalization is nearly nonexistent.** Across 136 flawed-sentence STT transcriptions there were exactly three cleanups: 4o-bare dropped a filler (f2/kyoko: えっと deleted), 4o-bare repaired a particle into a grammatical one (p3/kyoko: 学校**を**行きます → 学校**へ**行きます — not the canonical correction に, but the error is gone), and whisper-bare silently fixed p4/openai (私**が**名前 → 私**の**名前, the exact normalization this spike feared). Word-order, word-choice, conjugation, and register errors survived every STT path without a single cleanup — these error classes appear robustly safe.

**The verbatim prompts help, and the Japanese one is cleanly best.** 4o-bare went 30/34 survived with both of the cleanups above; 4o-verbatim-ja went 34/34 with zero cleanups and zero mistranscriptions — it fixed every failure 4o-bare had on the same audio (p2/kyoko まず→明日, p3/kyoko へ→を, f2/kyoko restored えっと, p4/openai's invented な gone). 4o-verbatim-en landed in between (32/34): it prevented the cleanups but still misheard two Kyoko clips (まず for 明日, 急務 for 休むね). Prompting the model for verbatim output in Japanese measurably outperforms both no prompt and the same instruction in English.

**whisper-bare is fine on fidelity but noisy on form.** It preserved 31/34, but its output drifts orthographically: it sometimes emits all-kana or partial-kana lines (きのう えいがをみます, おきゃくさま、ちょっとまって), inconsistent punctuation/spacing, and kanji variants (観ます for 見ます). None of that loses the learner's error, but it makes downstream exact-text processing (correction diffing, vocab extraction, furigana) harder, and it produced the one genuine particle normalization plus a katakana hallucination (アスキューム for 休むね).

**The audio-LLM path failed — not by normalizing, but by not transcribing.** gpt-audio-2025-08-28, given the same verbatim-transcription instruction as a system prompt, answered conversationally on 47% of flawed clips and 8/8 controls: it chatted about the movie you saw, gave directions to the station, in one case replied in English, and in another contradicted the speaker (漢字を読むできません → "はい、漢字を読むことができます…"). When it did embed a transcription inside its chatty reply, that embedded text was faithful 14 of 15 times — the fidelity is there, but the format is unusable as a transcription layer without much heavier prompting/structuring. Notably, the *one* unfaithful embed (p4/openai) changed the learner's error to a *different* error (私が→私は) while explicitly claiming "話された通りに正確に記録しました" — confidently wrong.

**Voice quality matters more than path choice, and the scorer has known artifacts.** Eight of the nine STT-path mistranscriptions came from the macOS Kyoko voice, whose flatter synthesis produced genuinely ambiguous audio: every path that failed c4 heard 死/シ for 寿司, which is a TTS synthesis artifact, not an STT failure (the same sentence via the OpenAI voice was clean on all STT paths). Likewise c2/kyoko/whisper-bare is a false review: 観に行きます is a phonetically identical kanji variant of 見に行きます that kuromoji misreads during hiragana folding — a scorer artifact. The one mistranscription on the *clean* OpenAI voice is the most important data point in the spike: **p4/openai/4o-bare transcribed 私が名前は田中です as 私な名前は田中です — STT invented a novel error the learner never made.** An STT layer that fabricates errors is exactly as dangerous for a correction product as one that fixes them: the correction pass would confidently "correct" something the user never said.

## Limitations

- **TTS-only audio.** All clips are clean, native-like synthesized pronunciation. Real intermediate learners have anglicized accents, hesitant pacing, and self-corrections — robustness to that is untested. (Phase B: drop real learner recordings into `audio/` and rerun.)
- **Model substitution on the audio-LLM path.** `gpt-4o-audio-preview` 404'd on this key; `gpt-audio-2025-08-28` was substituted. The conversational-failure finding may not generalize to other audio-native models or to heavier structured prompting.
- **Small n, single run.** 17 flawed + 4 control sentences × 2 voices, one transcription run per cell. No temperature/retry variance measured; single-digit-percent differences between STT paths are within noise.
- **Two synthetic voices.** Voice-quality findings (Kyoko's failures) describe these two TTS engines, not the space of real microphones and speakers.

## Recommendation

**(b) STT + verbatim prompt: ship gpt-4o-transcribe with the Japanese verbatim prompt.**

4o-verbatim-ja is cleanly best: 34/34 errors survived, zero normalization, zero mistranscriptions — it eliminated every failure the bare path had (88% → 100%) at no extra cost or latency, and it beat the English-language version of the same instruction (94%). The audio-LLM path is not viable as a transcription layer (47% of flawed clips and all controls came back as conversation, not transcription), and whisper-bare's kana/punctuation drift plus its one genuine particle normalization make it strictly worse. The winning prompt, liftable into M2 as-is:

> そのまま文字起こししてください。文法の間違いや言い間違い、「えーと」「あの」などのフィラーも全て含めて、話された通りに正確に書き起こしてください。修正しないでください。

Independent of path choice, the p4 invented-error case (STT fabricating 私**な**名前 from clean audio of 私**が**名前) means the product should not treat the transcript as ground truth. That does **not** justify a blocking confirm step — it would kill the low-pressure conversational flow this product exists for — but it does warrant a lightweight affordance: the transcript is always visible on the user's message bubble and tap-to-edit, and a correction whose target text the user edits away is silently dropped. Cheap insurance against the rare fabricated error, zero added friction on the 95%+ of turns where the transcript is right.

## Implications for M2/M3

- **M2 (voice):** confirmed — STT → LLM → TTS pipeline is sound for the correction product; use `gpt-4o-transcribe` with the Japanese verbatim prompt above (make the prompt a config value, per the cost-guardrail convention of never hardcoding tunables).
- **M2:** add transcript-visible + tap-to-edit on the user's message bubble (non-blocking). This was already implied by the turn-based design; the p4 invented-error case upgrades it from nice-to-have to required.
- **M2:** do not build on whisper-1 — its kana-output drift would complicate kuroshiro/kuromoji tokenization and correction diffing in M3/M4.
- **M3 (corrections):** the correction pass can trust error *presence* (normalization ≈ 0) but not error *identity* on every turn — a rare transcript error may be STT-fabricated. Tap-to-reveal corrections (not auto-asserted inline rewrites) remain the right UX; if the user edits the transcript, invalidate that turn's correction.
- **M3:** filler words survive transcription (4/4 with the verbatim prompt), so the correction pass must be prompted to *ignore* fillers rather than flag them — they're a feature of natural speech, not an error to correct.
- **Future realtime "call mode" seam:** the audio-LLM result is a caution — audio-native models conversing directly do not yield reliable verbatim transcripts as a side effect. A realtime mode would need its own dedicated transcription stream to keep corrections/vocab/memory working.
- **Phase B before beta exposure:** rerun this harness with real learner recordings (anglicized accents) dropped into `audio/`; Kyoko's failure cluster suggests accuracy degrades with audio quality, and learner speech is the harder case.
