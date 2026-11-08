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

export type StepInfo = {
  key: Step;
  group: StepGroup;
  fullName: string; // 「もどる」で読み上げ機能に伝える、戻り先の名前
  hasProgress: boolean; // 進み具合のバーに区切りを持つ画面か（質問と見直しの画面だけ）
};

// 画面の順番。こどもは「どんな かんじ」→「どこが へん」→「どれくらい つらい」の順
export const STEPS: readonly StepInfo[] = [
  { key: "welcome", group: "welcome", fullName: "はじめ", hasProgress: false },
  { key: "ability", group: "ability", fullName: "答えられるかの確認", hasProgress: true },
  { key: "patientFeeling", group: "patient", fullName: "どんな かんじ", hasProgress: true },
  { key: "patientBody", group: "patient", fullName: "どこが へん", hasProgress: true },
  { key: "patientDiscomfort", group: "patient", fullName: "どれくらい つらい", hasProgress: true },
  { key: "patientBreak", group: "patient", fullName: "こどもの おわり", hasProgress: false },
  { key: "familyProfile", group: "family", fullName: "お子さんのこと", hasProgress: true },
  { key: "familyConcern", group: "family", fullName: "心配なこと・いつから", hasProgress: true },
  { key: "familyCondition", group: "family", fullName: "熱・食べる飲む", hasProgress: true },
  { key: "familyHistory", group: "family", fullName: "薬・アレルギー・持病", hasProgress: true },
  { key: "review", group: "review", fullName: "入力内容の見直し", hasProgress: true },
  { key: "doctor", group: "doctor", fullName: "医師に見せる", hasProgress: false },
  { key: "end", group: "end", fullName: "おわり", hasProgress: false },
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

// 進み具合のバー。区切りは、この流れで通る「区切りを持つ画面」の数
// （「できる」なら9、「難しい」なら6）。区切りを持たない画面では null
export function progressOf(
  step: Step,
  canSelfReport: CanSelfReport,
): { total: number; current: number } | null {
  const steps = flowSteps(canSelfReport).filter((item) => item.hasProgress);
  const index = steps.findIndex((item) => item.key === step);
  return index === -1 ? null : { total: steps.length, current: index + 1 };
}
