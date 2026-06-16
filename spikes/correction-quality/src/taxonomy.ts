// spikes/correction-quality/src/taxonomy.ts

// v1 mistake taxonomy. `errorClass` values the correction pass may emit are the
// non-"none" classes. "none" is the control marker (no error present).
export type ErrorClass =
  | "particle"
  | "conjugation"
  | "word-order"
  | "word-choice"
  | "register"
  | "filler"
  | "none";

// Classes the correction pass is allowed to flag (filler/none are never flagged).
export const FLAGGABLE_CLASSES: ErrorClass[] = [
  "particle",
  "conjugation",
  "word-order",
  "word-choice",
  "register",
];

export type Treatment = "correct" | "context-dependent" | "never-flag";

export interface TaxonomyEntry {
  errorClass: ErrorClass;
  definition: string;
  example: string;
  treatment: Treatment;
}

export const TAXONOMY: TaxonomyEntry[] = [
  { errorClass: "particle",     definition: "Wrong or missing particle (は/が, に/で, を).", example: "コーヒーが飲みます → を", treatment: "correct" },
  { errorClass: "conjugation",  definition: "Wrong verb/adjective form or tense.",          example: "昨日映画を見ます → 見ました", treatment: "correct" },
  { errorClass: "word-order",   definition: "Unnatural ordering of constituents.",          example: "行きたいとても → とても行きたい", treatment: "correct" },
  { errorClass: "word-choice",  definition: "Wrong-but-plausible vocabulary.",              example: "薬を食べる → 飲む", treatment: "correct" },
  { errorClass: "register",     definition: "Casual mid-polite or vice versa.",             example: "先生、休むね → 休みます", treatment: "context-dependent" },
  { errorClass: "filler",       definition: "Fillers/hesitations (えーと、あの).",          example: "えーと、駅は…", treatment: "never-flag" },
  { errorClass: "none",         definition: "No error present (control).",                  example: "今日はいい天気ですね。", treatment: "never-flag" },
];
