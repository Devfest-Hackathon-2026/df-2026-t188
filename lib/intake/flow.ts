// 画面の順番と、進み具合のバーの区切り。画面の部品から切り離して、テストできるようにしている
import { PATIENT_DETAIL_STEPS, type IntakeState } from "./types";

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
// 1つの区切りに、画面が複数入ることがある（「症状を詳しく」には詳細の画面と「どこが へん？」が入る）
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

// 画面の順番。こどもは「症状をえらぶ」→「症状をくわしく」（選んだ数だけ）→「どこが へん」（いたい のときだけ）→「どれくらい つらい」
export const STEPS: readonly StepInfo[] = [
  { key: "welcome", group: "welcome", fullName: "はじめ", segment: null },
  { key: "ability", group: "ability", fullName: "答えられるかの確認", segment: "respondent" },
  { key: "patientFeeling", group: "patient", fullName: "症状を えらぶ", segment: "chooseSymptoms" },
  ...PATIENT_DETAIL_STEPS.map((key) => ({
    key,
    group: "patient" as const,
    fullName: "症状を くわしく",
    segment: "symptomDetails" as const,
  })),
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

// 詳細の画面の何番目か（1から）。詳細の画面でなければ 0
export function detailNumber(step: Step): number {
  return (PATIENT_DETAIL_STEPS as readonly string[]).indexOf(step) + 1;
}

// こどもの答えで変わる画面。
// detailCount は詳細の画面の数（選んだ主症状の画面と「そのほか」）。
// asksBody は「どこが へん？」を出すか（症状画面.html と同じく、主症状で「いたい」を選んだときだけ）
export type ChildFlow = { detailCount: number; asksBody: boolean };

// この流れで通る画面。
// 最初に「難しい」を選んだときは、本人の画面（区切りも）を飛ばす
export function flowSteps(
  canSelfReport: CanSelfReport,
  { detailCount, asksBody }: ChildFlow,
): readonly StepInfo[] {
  return STEPS.filter((item) => {
    if (canSelfReport === "difficult" && item.group === "patient") return false;
    if (item.key === "patientBody") return asksBody;
    const number = detailNumber(item.key);
    return number === 0 || number <= detailCount;
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
