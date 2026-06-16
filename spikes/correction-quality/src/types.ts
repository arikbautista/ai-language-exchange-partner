// spikes/correction-quality/src/types.ts
import type { ErrorClass } from "./taxonomy.js";

export type Framing = "isolated" | "framed";

// One correction the model proposes for a single utterance.
export interface CorrectionItem {
  original: string;     // the span of the learner's text the model flags
  suggestion: string;   // the proposed fix
  errorClass: string;   // model-provided; validated/normalized at scoring time
  explanation: string;  // learner-facing, Japanese
}

// One correction-pass call result (cached in out/corrections.json).
export interface CorrectionEntry {
  sentenceId: string;
  framing: Framing;
  model: string;
  corrections: CorrectionItem[];
  at: string;
}

// One judge verdict over a single proposed correction (cached in out/judgments.json).
export interface JudgmentEntry {
  sentenceId: string;
  framing: Framing;
  correctionIndex: number;
  model: string;
  acceptable: boolean;
  explanationQuality: "pass" | "borderline" | "fail";
  reason: string;
  at: string;
}

export type { ErrorClass };
