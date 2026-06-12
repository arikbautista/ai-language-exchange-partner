/** Punctuation, brackets, quotes, and whitespace — orthographic noise, not errors.
 *  Deliberately does NOT include ー (long-vowel mark), which is meaningful in kana. */
const NOISE =
  /[、。！？!?.,．，…‥・：:；;「」『』（）()\[\]｛｝{}〈〉《》【】\s'"""''〜~＝=－—–-]/gu;

export function stripNoise(text: string): string {
  return text.normalize("NFKC").replace(NOISE, "");
}

export type Verdict = "preserved" | "normalized" | "control_ok" | "review";

export function classify(args: {
  transcript: string;
  flawed: string;
  corrected: string;
}): Verdict {
  const t = stripNoise(args.transcript);
  const f = stripNoise(args.flawed);
  const c = stripNoise(args.corrected);
  if (f === c) return t === f ? "control_ok" : "review";
  if (t === f) return "preserved";
  if (t === c) return "normalized";
  return "review";
}
