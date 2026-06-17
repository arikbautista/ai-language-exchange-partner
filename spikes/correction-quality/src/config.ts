// spikes/correction-quality/src/config.ts
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
export const OUT_DIR = path.join(ROOT, "out");

// The pre-registered correction prompt. The spike's verdict is conditional on
// THIS prompt (see spec limitations); it is committed so results are interpretable.
export const CORRECTION_SYSTEM_PROMPT = `あなたは日本語学習者の発話をチェックする校正アシスタントです。相手はJLPT N4〜N2の中級学習者です。学習者の日本語に、不自然な点や文法的な誤りがあれば指摘してください。

ルール：
- あなたは会話を止めないための裏方です。指摘は後でまとめて学習者に見せます。会話相手ではありません。
- 「えーと」「あの」などのフィラーや言いよどみは誤りではありません。絶対に指摘しないでください。
- カジュアルな口調そのものは誤りではありません。会話相手の口調や場面に対して不適切な場合のみ、register（丁寧さ）の問題として指摘してください。
- 自然で正しい文には何も指摘しないでください。無理に直さないでください。迷ったら指摘しないでください。
- errorClass は次のいずれかだけを使ってください：particle, conjugation, word-order, word-choice, register。
- explanation は中級学習者向けに、日本語で1〜2文の短い説明にしてください。
- 出力は必ず次のJSON形式のみ。前後に文章を付けないでください：
{"corrections": [{"original": "誤った部分の原文", "suggestion": "修正案", "errorClass": "種類", "explanation": "短い説明"}]}
指摘がなければ {"corrections": []} を返してください。`;

// The judge grades ONE proposed correction against a reference rubric.
export function judgeSystemPrompt(): string {
  return `あなたは日本語教育の専門家として、校正アシスタントが出した1件の指摘を評価します。

入力として、学習者の元の文、参照（正しい例）、誤りの説明（rubric）、そして校正アシスタントの指摘（original / suggestion / errorClass / explanation）が与えられます。

次の2点を判定してください：
1. acceptable: suggestion は学習者の誤りを解消する、自然で正しい日本語ですか？ 参照と完全に一致しなくても、妥当な修正であれば true。誤りを直せていない、または新たな誤りを生んでいる場合は false。
2. explanationQuality: explanation は正確で、中級学習者の役に立ちますか？ "pass"（正確で役立つ）/ "borderline"（間違ってはいないが弱い）/ "fail"（不正確または誤解を招く）。

出力は必ず次のJSON形式のみ：
{"acceptable": true, "explanationQuality": "pass", "reason": "短い理由"}`;
}

export const CONFIG = {
  // Model under test — the planned cheap correction pass.
  correctionModel: "gpt-4o-mini",
  // Stronger judge model (different role, not a comparison).
  judgeModel: "gpt-4o",
  // Pinned for stable reruns and an honest cache (spec).
  temperature: 0,
  maxTokens: 800,
  framings: ["isolated", "framed"] as const,
  // Pre-registered decision thresholds.
  thresholds: {
    catch: 0.85,         // >= of flawed sentences flagged
    controlClean: 0.90,  // >= of controls left untouched
    acceptable: 0.90,    // >= of caught errors judged acceptable
    classify: 0.80,      // soft bar for classification usefulness
  },
  // Rough cost estimate per call for the running total (gpt-4o-mini ~ $0.0002,
  // gpt-4o judge ~ $0.005 per short call).
  estUsd: { correct: 0.0002, judge: 0.005 },
};
