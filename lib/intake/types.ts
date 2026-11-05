import type { BodyPart, Sensation } from "./options";

// respondent は「誰の欄の回答か」を表す。本人と家族の回答を型で混ぜないようにする
export type Respondent = "patient" | "family";

export type UnableReason =
  | "difficult_at_start" // 画面1で「難しい」を選んだ
  | "pressed_unable"; // 画面2で「答えられない」を押した

export type Answer<T, R extends Respondent> =
  | { respondent: R; status: "unanswered" } // 未回答
  | { respondent: R; status: "answered"; value: T } // 回答あり
  | { respondent: R; status: "unable"; reason: UnableReason }; // 回答困難

export type PainLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type PatientAnswers = {
  painLocations: Answer<BodyPart[], "patient">;
  painLevel: Answer<PainLevel, "patient">;
  sensations: Answer<Sensation[], "patient">;
  concerns: Answer<string, "patient">;
};

export type IntakeState = {
  step: "ability" | "patient";
  canSelfReport: "able" | "difficult" | null; // null はまだ選んでいない状態
  patient: PatientAnswers;
};
