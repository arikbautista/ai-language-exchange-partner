// spikes/correction-quality/src/frame.ts
import type { TestSentence } from "./sentences.js";
import { DEFAULT_FRAME } from "./sentences.js";
import type { Framing } from "./types.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Build the conversation the correction pass sees (system prompt added by caller).
// - isolated: just the learner's utterance as a lone user message.
// - framed:   a one-line partner turn (assistant) the learner is replying to,
//             then the learner's utterance. This is what makes register verdicts
//             well-defined and lets context suppress over-correction.
export function buildMessages(s: TestSentence, framing: Framing): ChatMessage[] {
  if (framing === "isolated") {
    return [{ role: "user", content: s.flawed }];
  }
  const partnerLine = s.frame ?? DEFAULT_FRAME;
  return [
    { role: "assistant", content: partnerLine },
    { role: "user", content: s.flawed },
  ];
}
