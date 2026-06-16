// spikes/latency/src/config.ts
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const SPIKE1_AUDIO = path.join(ROOT, "..", "stt-fidelity", "audio");

export interface Clip {
  id: string;
  label: "short" | "medium" | "long";
  path: string;
}

// The exact STT configuration spike 1 recommended shipping.
const STT_VERBATIM_JA =
  "そのまま文字起こししてください。文法の間違いや言い間違い、「えーと」「あの」などのフィラーも全て含めて、話された通りに正確に書き起こしてください。修正しないでください。";

// Production-shaped system prompt (~500 tokens): approximates M1's
// JLPT-tuned conversation-partner prompt so TTFT is measured against a
// realistic input size, not a toy prompt.
const SYSTEM_PROMPT = `あなたは日本語学習者の会話パートナーです。相手は中級レベル（JLPT N4〜N2）の学習者で、読解はある程度できますが、話すことに自信がありません。リラックスした、プレッシャーのない会話相手として振る舞ってください。

ルール：
- 自然な日本語で話してください。ただし、N3前後の語彙と文法を中心に使い、難しい言葉を使う場合は、簡単な言い換えを添えてください。
- 返事は短く、会話のテンポを保ってください。2〜4文程度が目安です。長い説明はしないでください。
- 相手の文法ミスを指摘したり、訂正したりしないでください。訂正は別のシステムが担当します。あなたの役割は会話を続けることだけです。
- 相手の発言の内容に必ず反応してから、話を広げる質問を一つしてください。質問は一度に一つだけです。
- 発言が不明瞭で意味が取れない場合は、自然に聞き返してください。
- 敬語ではなく、丁寧体（です・ます）で話してください。
- 絵文字や顔文字、ローマ字は使わないでください。
- 相手が言葉に詰まっても急かさず、自然に助け舟を出してください。
- 漢字は普通に使ってください。ふりがなは不要です。

あなたのペルソナ：東京在住の30代、田中ゆきさん。映画と料理が好きで、聞き上手です。学習者の話に興味を持ち、優しく相づちを打ちながら会話を続けます。`;

// ~4 turns of fabricated history: TTFT depends on input size, so the
// prompt must look like a mid-session turn, not an opening message.
const FAKE_HISTORY: { role: "user" | "assistant"; content: string }[] = [
  { role: "user", content: "こんにちは！今日は仕事がとても忙しかったです。" },
  { role: "assistant", content: "お疲れさまでした。忙しい日が続くと大変ですね。お仕事は何をされているんですか？" },
  { role: "user", content: "ソフトウェアの会社で働いています。えーと、プログラマーです。" },
  { role: "assistant", content: "プログラマーなんですね。かっこいいです。お仕事の後は、何かリラックスする方法がありますか？" },
];

export const CONFIG = {
  sttModel: "gpt-4o-transcribe",
  sttPrompt: STT_VERBATIM_JA,
  // Stand-in for the planned Claude Sonnet partner model (decided with the
  // user; the Sonnet-transfer caveat must appear in the findings).
  llmModel: "gpt-4o",
  maxCompletionTokens: 300,
  ttsModel: "gpt-4o-mini-tts",
  ttsVoice: "alloy",
  ttsFormat: "mp3" as const,
  minChunkLength: 6,
  iterations: 10,
  interRunDelayMs: 2000,
  // Decision threshold: the "feels like voice messaging" TTFA target.
  ttfaTargetMs: 3000,
  systemPrompt: SYSTEM_PROMPT,
  fakeHistory: FAKE_HISTORY,
  clips: [
    // 薬を食べました。(2.2s)
    { id: "w1", label: "short", path: path.join(SPIKE1_AUDIO, "w1-openai-1c63ffe0f516.mp3") },
    // 週末に友達と映画を見に行きます。(3.9s)
    { id: "c2", label: "medium", path: path.join(SPIKE1_AUDIO, "c2-openai-0691bfeb58a1.mp3") },
    // えーと、駅は、あの、どこですか。(5.1s)
    { id: "f1", label: "long", path: path.join(SPIKE1_AUDIO, "f1-openai-a1b7fa841c6e.mp3") },
  ] as Clip[],
};
