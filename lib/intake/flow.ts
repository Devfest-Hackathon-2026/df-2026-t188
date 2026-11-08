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

// 進み具合のバーの区切り（かずまさんの v3 のデザインの7区切り）。
// 1つの区切りに、画面が複数入ることがある（あとで「症状を詳しく」に詳細の画面を足すため）
export type ProgressSegment =
  | "respondent" // 誰が答えるか
  | "chooseSymptoms" // 症状を選ぶ
  | "symptomDetails" // 症状を詳しく
  | "discomfort" // つらさを選ぶ
  | "profile" // 基本情報
  | "familyRecord" // 家族からの記録
  | "review"; // 確認

export const PROGRESS_SEGMENTS: readonly ProgressSegment[] = [
  "respondent",
  "chooseSymptoms",
  "symptomDetails",
  "discomfort",
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

// 画面の順番。こどもは「どんな かんじ」→「どこが へん」→「どれくらい つらい」の順
export const STEPS: readonly StepInfo[] = [
  { key: "welcome", group: "welcome", fullName: "はじめ", segment: null },
  { key: "ability", group: "ability", fullName: "答えられるかの確認", segment: "respondent" },
  { key: "patientFeeling", group: "patient", fullName: "どんな かんじ", segment: "chooseSymptoms" },
  { key: "patientBody", group: "patient", fullName: "どこが へん", segment: "symptomDetails" },
  { key: "patientDiscomfort", group: "patient", fullName: "どれくらい つらい", segment: "discomfort" },
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

// この流れで通る画面。最初に「難しい」を選んだときは、本人の画面（区切りも）を飛ばす
export function flowSteps(canSelfReport: CanSelfReport): readonly StepInfo[] {
  return canSelfReport === "difficult"
    ? STEPS.filter((item) => item.group !== "patient")
    : STEPS;
}

// 進み具合のバー。区切りは、この流れで通る画面が持つ区切りの数
// （「できる」なら7、「難しい」ならこどもの3区切りを飛ばして4）。
// current は今の区切りが何番目か。バーを出さない画面では null
export function progressOf(
  step: Step,
  canSelfReport: CanSelfReport,
): { total: number; current: number } | null {
  const segment = stepInfo(step).segment;
  if (segment === null) return null;
  const steps = flowSteps(canSelfReport);
  const segments = PROGRESS_SEGMENTS.filter((item) =>
    steps.some((info) => info.segment === item),
  );
  return { total: segments.length, current: segments.indexOf(segment) + 1 };
}
