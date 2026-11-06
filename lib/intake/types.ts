import type {
  BodyPart,
  DiscomfortLevel,
  Feeling,
  FoodIntake,
  Onset,
} from "./options";

// respondent は「誰の欄の回答か」を表す。本人と保護者の回答を型で混ぜないようにする
export type Respondent = "patient" | "family";

// 回答困難は、最初の質問で「難しい」を選んだときだけ
export type UnableReason = "difficult_at_start";

export type Answer<T, R extends Respondent> =
  | { respondent: R; status: "unanswered" } // 未回答
  | { respondent: R; status: "answered"; value: T } // 回答あり
  | { respondent: R; status: "unable"; reason: UnableReason }; // 回答困難

export type PatientAnswers = {
  bodyParts: Answer<BodyPart[], "patient">; // どこが へん？
  feelings: Answer<Feeling[], "patient">; // どんな かんじ？
  discomfort: Answer<DiscomfortLevel, "patient">; // どれくらい つらい？
};

// 保護者の回答には「回答困難」がないので、型から外す
export type FamilyAnswer<T> = Exclude<
  Answer<T, "family">,
  { status: "unable" }
>;

export type Temperature =
  | { kind: "measured"; celsius: string } // 入力した文字のまま持つ
  | { kind: "not_measured" }; // 測っていない

// 最初に「ある／ない／わからない」を選ぶ項目。
// 「ある」のときだけ text を持つので、ほかに変えると書いた内容は消える
export type Presence =
  | { kind: "yes"; text: string } // text が空なら「あり（内容の記入なし）」
  | { kind: "no" }
  | { kind: "dont_know" };

export type FamilyAnswers = {
  chiefConcern: FamilyAnswer<string>; // 一番心配なこと（任意）
  onset: FamilyAnswer<Onset>; // いつから
  temperature: FamilyAnswer<Temperature>;
  foodIntake: FamilyAnswer<FoodIntake>; // 食べる・飲む
  medications: FamilyAnswer<Presence>; // 飲んでいる薬。Gemini には送らない
  allergies: FamilyAnswer<Presence>; // Gemini には送らない
  conditions: FamilyAnswer<Presence>; // 持病。Gemini には送らない
  age: FamilyAnswer<string>; // 年齢（歳）。入力した文字のまま持つ。Gemini には送らない
  weight: FamilyAnswer<string>; // 体重（kg）。入力した文字のまま持つ。Gemini には送らない
};

export type IntakeState = {
  step:
    | "welcome"
    | "ability"
    | "patientBody"
    | "patientFeeling"
    | "patientDiscomfort"
    | "familyConcern"
    | "familyCondition"
    | "familyHistory"
    | "review"
    | "doctor";
  canSelfReport: "able" | "difficult" | null; // null はまだ選んでいない状態
  patient: PatientAnswers;
  family: FamilyAnswers;
};
