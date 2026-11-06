import type {
  BodyPart,
  Course,
  Feeling,
  FoodIntake,
  Onset,
  Sensation,
} from "./options";

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
  feelings: Answer<Feeling[], "patient">; // どんなかんじが する？
  painLocations: Answer<BodyPart[], "patient">;
  painLevel: Answer<PainLevel, "patient">;
  sensations: Answer<Sensation[], "patient">;
  sensationOther: Answer<string, "patient">; // 感覚のその他（本人が自分の言葉で書く）
  chiefComplaint: Answer<string, "patient">; // 主訴：本人の言葉
};

// 家族の回答には「回答困難」がないので、型から外す
export type FamilyAnswer<T> = Exclude<
  Answer<T, "family">,
  { status: "unable" }
>;

export type Temperature =
  | { kind: "measured"; celsius: string } // 入力した文字のまま持つ
  | { kind: "not_measured" }; // 測っていない

// 文字で書くか、「ない」「わからない」を選ぶ項目
export type TextOrNone =
  | { kind: "text"; text: string }
  | { kind: "none" } // ない
  | { kind: "dont_know" }; // わからない

export type FamilyAnswers = {
  age: FamilyAnswer<string>; // 年齢（歳）。入力した文字のまま持つ。Gemini には送らない
  weight: FamilyAnswer<string>; // 体重（kg）。入力した文字のまま持つ。Gemini には送らない
  chiefConcern: FamilyAnswer<string>; // 主訴：保護者から見て、今いちばん心配な症状
  onset: FamilyAnswer<Onset>; // いつから
  onsetDetail: FamilyAnswer<string>; // くわしい時刻など
  course: FamilyAnswer<Course>; // 経過
  temperature: FamilyAnswer<Temperature>;
  foodIntake: FamilyAnswer<FoodIntake>;
  differences: FamilyAnswer<string>; // 普段との違い
  conditions: FamilyAnswer<string>; // 持病・これまでの病気
  medications: FamilyAnswer<TextOrNone>; // 飲んでいる薬
  allergies: FamilyAnswer<TextOrNone>;
  consultation: FamilyAnswer<string>; // 今日相談したいこと
};

export type IntakeState = {
  step: "welcome" | "ability" | "patient" | "family" | "review" | "doctor";
  canSelfReport: "able" | "difficult" | null; // null はまだ選んでいない状態
  patient: PatientAnswers;
  family: FamilyAnswers;
};
