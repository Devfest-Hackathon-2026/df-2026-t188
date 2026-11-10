// 画面の順番と、進み具合のバーの区切り。画面の部品から切り離して、テストできるようにしている
import type { IntakeState } from "./types";

export type Step = IntakeState["step"];
export type CanSelfReport = IntakeState["canSelfReport"];

// 画面のまとまり。「難しい」のときは patient のまとまりを飛ばす
export type StepGroup =
  | "welcome"
  | "ability"
  | "patient"
  | "family"
  | "review"
  | "doctor"
  | "end";

// 進み具合のバーの区切り（7区切り）。こどもは「主訴 → 場所 → 程度 → そのほか」の順で、
// 場所（「いたい」のときだけ）と 程度 は1つの区切りに入れる
export type ProgressSegment =
  | "respondent" // 誰が答えるか
  | "chooseSymptoms" // 症状を選ぶ（主訴）
  | "placeAndDiscomfort" // 場所とつらさ
  | "other" // ほかにも
  | "profile" // 基本情報
  | "familyRecord" // 家族からの記録
  | "review"; // 確認

export const PROGRESS_SEGMENTS: readonly ProgressSegment[] = [
  "respondent",
  "chooseSymptoms",
  "placeAndDiscomfort",
  "other",
  "profile",
  "familyRecord",
  "review",
];

export type StepInfo = {
  key: Step;
  group: StepGroup;
  fullName: string; // 「もどる」で読み上げ機能に伝える、戻り先の名前
  segment: ProgressSegment | null; // バーのどの区切りか。バーを出さない画面は null
};

// 画面の順番。こどもは「どんなかんじ」→「どこが へん」（いたい のときだけ）→「どれくらい つらい」
// →「ほかにも きになることは ある？」
export const STEPS: readonly StepInfo[] = [
  { key: "welcome", group: "welcome", fullName: "はじめ", segment: null },
  { key: "ability", group: "ability", fullName: "答えられるかの確認", segment: "respondent" },
  { key: "patientFeeling", group: "patient", fullName: "症状を えらぶ", segment: "chooseSymptoms" },
  { key: "patientBody", group: "patient", fullName: "どこが へん", segment: "placeAndDiscomfort" },
  { key: "patientDiscomfort", group: "patient", fullName: "どれくらい つらい", segment: "placeAndDiscomfort" },
  { key: "patientOther", group: "patient", fullName: "ほかに きになること", segment: "other" },
  { key: "patientBreak", group: "patient", fullName: "こどもの おわり", segment: null },
  { key: "familyProfile", group: "family", fullName: "お子さんのこと", segment: "profile" },
  { key: "familyRecord", group: "family", fullName: "家族からの記録", segment: "familyRecord" },
  { key: "review", group: "review", fullName: "入力内容の見直し", segment: "review" },
  { key: "doctor", group: "doctor", fullName: "医師に見せる", segment: null },
  { key: "end", group: "end", fullName: "おわり", segment: null },
];

export function stepIndex(step: Step): number {
  return STEPS.findIndex((item) => item.key === step);
}

export function stepInfo(step: Step): StepInfo {
  return STEPS[stepIndex(step)];
}

// こどもの答えで変わる画面。
// asksBody は「どこが へん？」を出すか（主症状で「いたい」を選んだときだけ）
export type ChildFlow = { asksBody: boolean };

// この流れで通る画面。
// 最初に「難しい」を選んだときは、本人の画面（区切りも）を飛ばす
export function flowSteps(
  canSelfReport: CanSelfReport,
  { asksBody }: ChildFlow,
): readonly StepInfo[] {
  return STEPS.filter((item) => {
    if (canSelfReport === "difficult" && item.group === "patient") return false;
    if (item.key === "patientBody") return asksBody;
    return true;
  });
}

// 進み具合のバー。区切りは、この流れで通る画面が持つ区切りの数
// （「できる」なら7、「難しい」ならこどもの3区切りを飛ばして4）。
// current は今の区切りが何番目か。区切りに画面が複数あるときは、
// inSegment に「区切りの中の何画面目か」と「画面の数」を入れる。バーを出さない画面では null
export function progressOf(
  step: Step,
  canSelfReport: CanSelfReport,
  child: ChildFlow,
): {
  total: number;
  current: number;
  inSegment: { index: number; count: number } | null;
} | null {
  const segment = stepInfo(step).segment;
  if (segment === null) return null;
  const steps = flowSteps(canSelfReport, child);
  const segments = PROGRESS_SEGMENTS.filter((item) =>
    steps.some((info) => info.segment === item),
  );
  const stepsInSegment = steps.filter((info) => info.segment === segment);
  return {
    total: segments.length,
    current: segments.indexOf(segment) + 1,
    inSegment:
      stepsInSegment.length > 1
        ? {
            index: stepsInSegment.findIndex((info) => info.key === step) + 1,
            count: stepsInSegment.length,
          }
        : null,
  };
}
