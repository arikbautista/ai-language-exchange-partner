export type ErrorClass =
  | "particle"
  | "conjugation"
  | "word-order"
  | "word-choice"
  | "register"
  | "filler"
  | "control";

export interface Sentence {
  id: string;
  errorClass: ErrorClass;
  /** What the learner actually says (with the error). For controls, identical to corrected. */
  flawed: string;
  /** The natural/correct version. */
  corrected: string;
  note: string;
}

// Arrow in notes reads correct→error: "を→が" means the learner used が where を belongs.
export const SENTENCES: Sentence[] = [
  // --- particle choice ---
  { id: "p1", errorClass: "particle", flawed: "私は毎朝コーヒーが飲みます。", corrected: "私は毎朝コーヒーを飲みます。", note: "を→が on direct object" },
  { id: "p2", errorClass: "particle", flawed: "明日、友達は会います。", corrected: "明日、友達に会います。", note: "に→は with 会う" },
  { id: "p3", errorClass: "particle", flawed: "電車で学校を行きます。", corrected: "電車で学校に行きます。", note: "に→を with 行く" },
  { id: "p4", errorClass: "particle", flawed: "私が名前は田中です。", corrected: "私の名前は田中です。", note: "の→が possessive" },
  // --- verb conjugation ---
  { id: "v1", errorClass: "conjugation", flawed: "昨日、映画を見ます。", corrected: "昨日、映画を見ました。", note: "missing past tense with 昨日" },
  { id: "v2", errorClass: "conjugation", flawed: "寒いだから、コートを着ました。", corrected: "寒いから、コートを着ました。", note: "い-adjective + だ" },
  { id: "v3", errorClass: "conjugation", flawed: "漢字を読むできません。", corrected: "漢字を読むことができません。", note: "missing こと nominalizer and が before できる" },
  // --- word order ---
  { id: "o1", errorClass: "word-order", flawed: "私は日本に行きたいとても。", corrected: "私はとても日本に行きたい。", note: "adverb after the verb" },
  { id: "o2", errorClass: "word-order", flawed: "これは本の私です。", corrected: "これは私の本です。", note: "reversed の possession" },
  { id: "o3", errorClass: "word-order", flawed: "映画を見ました昨日。", corrected: "昨日、映画を見ました。", note: "temporal adverb after predicate" },
  // --- word choice ---
  { id: "w1", errorClass: "word-choice", flawed: "薬を食べました。", corrected: "薬を飲みました。", note: "食べる→飲む for medicine" },
  { id: "w2", errorClass: "word-choice", flawed: "帽子を着ています。", corrected: "帽子をかぶっています。", note: "着る→かぶる for hats" },
  { id: "w3", errorClass: "word-choice", flawed: "昨日、約束を作りました。", corrected: "昨日、約束をしました。", note: "作る→する for promises" },
  // --- register mismatch ---
  { id: "r1", errorClass: "register", flawed: "先生、明日休むね。", corrected: "先生、明日休みます。", note: "casual to a teacher" },
  { id: "r2", errorClass: "register", flawed: "お客様、ちょっと待って。", corrected: "お客様、少々お待ちください。", note: "casual to a customer" },
  // --- fillers / hesitations ---
  { id: "f1", errorClass: "filler", flawed: "えーと、駅は、あの、どこですか。", corrected: "駅はどこですか。", note: "filler words mid-sentence" },
  { id: "f2", errorClass: "filler", flawed: "私は、えっと、学生です。", corrected: "私は学生です。", note: "えっと hesitation" },
  // --- controls (correct sentences; flawed === corrected) ---
  { id: "c1", errorClass: "control", flawed: "今日はいい天気ですね。", corrected: "今日はいい天気ですね。", note: "control" },
  { id: "c2", errorClass: "control", flawed: "週末に友達と映画を見に行きます。", corrected: "週末に友達と映画を見に行きます。", note: "control" },
  { id: "c3", errorClass: "control", flawed: "すみません、駅までの行き方を教えてください。", corrected: "すみません、駅までの行き方を教えてください。", note: "control" },
  { id: "c4", errorClass: "control", flawed: "日本料理の中で寿司が一番好きです。", corrected: "日本料理の中で寿司が一番好きです。", note: "control" },
];
