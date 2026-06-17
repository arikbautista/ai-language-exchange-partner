// spikes/correction-quality/src/sentences.ts
import { SENTENCES as STT_SENTENCES } from "../../stt-fidelity/src/sentences.js";
import type { ErrorClass } from "./taxonomy.js";

export interface TestSentence {
  id: string;
  errorClass: ErrorClass;
  /** What the learner says. For controls, identical to corrected. */
  flawed: string;
  /** The natural/correct version. */
  corrected: string;
  note: string;
  /** Optional partner line for the framed condition. Defaults to a polite frame. */
  frame?: string;
}

// Spike 1 used errorClass "control" for correct sentences; this spike's taxonomy
// calls that "none". Map on import; everything else carries over unchanged.
const imported: TestSentence[] = STT_SENTENCES.map((s) => ({
  id: s.id,
  errorClass: (s.errorClass === "control" ? "none" : s.errorClass) as ErrorClass,
  flawed: s.flawed,
  corrected: s.corrected,
  note: s.note,
}));

// Expanded controls: the over-correction metric otherwise rests on spike 1's 4
// controls alone. These deliberately span the traps a nervous model might "fix".
// All are correct Japanese (flawed === corrected, errorClass "none").
const addedControls: TestSentence[] = [
  // clean polite
  { id: "cc1", errorClass: "none", flawed: "週末は家族と公園に行きました。", corrected: "週末は家族と公園に行きました。", note: "clean polite" },
  { id: "cc2", errorClass: "none", flawed: "この本はとても面白かったです。", corrected: "この本はとても面白かったです。", note: "clean polite" },
  // clean casual/plain — correct under a casual frame
  { id: "cc3", errorClass: "none", flawed: "昨日は友達と映画を見に行ったよ。", corrected: "昨日は友達と映画を見に行ったよ。", note: "clean casual", frame: "ねえ、昨日何してたの？" },
  { id: "cc4", errorClass: "none", flawed: "今日はちょっと疲れたね。", corrected: "今日はちょっと疲れたね。", note: "clean casual", frame: "おつかれ！今日どうだった？" },
  { id: "cc5", errorClass: "none", flawed: "うん、コーヒーが好きだから毎朝飲んでる。", corrected: "うん、コーヒーが好きだから毎朝飲んでる。", note: "clean casual", frame: "コーヒーって好き？" },
  // correct but filler-laden — fillers must NOT be flagged
  { id: "cc6", errorClass: "none", flawed: "えーと、私は東京に住んでいます。", corrected: "えーと、私は東京に住んでいます。", note: "filler-laden, no error" },
  { id: "cc7", errorClass: "none", flawed: "あの、すみません、これはいくらですか。", corrected: "あの、すみません、これはいくらですか。", note: "filler-laden, no error" },
  // marginal-but-acceptable — natural, slightly loose, not wrong
  { id: "cc8", errorClass: "none", flawed: "今度の休み、温泉でも行こうかなと思って。", corrected: "今度の休み、温泉でも行こうかなと思って。", note: "marginal: natural trailing-off, acceptable", frame: "連休は何か予定ある？" },
  { id: "cc9", errorClass: "none", flawed: "まあ、そうですね、悪くないと思います。", corrected: "まあ、そうですね、悪くないと思います。", note: "marginal: hedged but correct" },
];

export const SENTENCES: TestSentence[] = [...imported, ...addedControls];

// Default framed-condition partner line for sentences that don't specify one.
export const DEFAULT_FRAME = "今日はどんな一日でしたか？";
