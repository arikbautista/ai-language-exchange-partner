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

// Register-diagnostic frames for the imported register sentences. The default
// frame (今日はどんな一日でしたか？) is polite but establishes no status gap, so it
// can't make a register verdict well-defined (this is why the first run's
// isolated-vs-framed delta was 0). These partner lines put the learner in a
// clearly formal relationship — a teacher / a customer speaking politely — so a
// casual reply is unambiguously a register error rather than acceptable tone.
const FRAME_OVERRIDES: Record<string, string> = {
  r1: "田中さん、明日の授業には出られますか？", // teacher → casual reply is wrong
  r2: "すみません、これお願いできますか？",       // customer → casual reply is wrong
};

// Spike 1 used errorClass "control" for correct sentences; this spike's taxonomy
// calls that "none". Map on import; everything else carries over unchanged.
const imported: TestSentence[] = STT_SENTENCES.map((s) => ({
  id: s.id,
  errorClass: (s.errorClass === "control" ? "none" : s.errorClass) as ErrorClass,
  flawed: s.flawed,
  corrected: s.corrected,
  note: s.note,
  ...(FRAME_OVERRIDES[s.id] ? { frame: FRAME_OVERRIDES[s.id] } : {}),
}));

// Expanded register set (the imported corpus has only r1/r2). Spans teacher /
// customer (imported) plus boss / interviewer, and both directions of the error:
// too-casual to a superior AND over-formal keigo to a peer. Each carries a
// register-diagnostic frame so the framed condition actually exercises register.
const addedRegister: TestSentence[] = [
  // too-casual / plain form to a superior
  { id: "r3", errorClass: "register", flawed: "部長、その資料もう送ったよ。", corrected: "部長、その資料はもうお送りしました。", note: "casual to a boss", frame: "例の資料、お客様に送っていただけましたか？" },
  { id: "r4", errorClass: "register", flawed: "御社で働きたいんだ。", corrected: "御社で働きたいです。", note: "plain form to an interviewer", frame: "なぜ当社を志望されたのですか？" },
  // over-formal keigo to a close friend — casual is what's correct here
  { id: "r5", errorClass: "register", flawed: "申し訳ありませんが、その日は予定がございます。", corrected: "ごめん、その日はちょっと無理かも。", note: "over-formal keigo to a close friend", frame: "週末さ、映画でも見に行かない？" },
  { id: "r6", errorClass: "register", flawed: "頂戴してもよろしいでしょうか。", corrected: "もらってもいい？", note: "over-humble to a close friend", frame: "これ余ってるんだけど、食べる？" },
];

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

// Register controls: casual to a PEER is correct Japanese — the mirror of r1–r6
// under a casual frame. These are the precision side of the register test: if
// hardening register detection starts flagging these, the prompt is too blunt.
const registerControls: TestSentence[] = [
  { id: "cr1", errorClass: "none", flawed: "うん、明日は暇だよ。一緒に遊ぼう。", corrected: "うん、明日は暇だよ。一緒に遊ぼう。", note: "casual to a peer — appropriate, not a register error", frame: "明日ひま？どっか行かない？" },
  { id: "cr2", errorClass: "none", flawed: "そうだね、それでいいと思うよ。", corrected: "そうだね、それでいいと思うよ。", note: "casual agreement to a peer — appropriate", frame: "この案でいこうと思うんだけど、どう？" },
];

export const SENTENCES: TestSentence[] = [...imported, ...addedRegister, ...addedControls, ...registerControls];

// Default framed-condition partner line for sentences that don't specify one.
export const DEFAULT_FRAME = "今日はどんな一日でしたか？";
