"use client";

import { useEffect, useRef, useState } from "react";
import { AbilityScreen } from "@/components/intake/AbilityScreen";
import { DoctorScreen } from "@/components/intake/DoctorScreen";
import { FamilyScreen } from "@/components/intake/FamilyScreen";
import { fieldId } from "@/components/intake/FieldCard";
import { PatientScreen } from "@/components/intake/PatientScreen";
import { ReviewScreen } from "@/components/intake/ReviewScreen";
import type { SummaryCache } from "@/components/intake/SummarySection";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { StepProgress } from "@/components/ui/StepProgress";
import type {
  FamilyAnswers,
  IntakeState,
  PatientAnswers,
} from "@/lib/intake/types";

type Step = IntakeState["step"];

// 画面の順番と、パンくずリストに出す名前（label は画面用の短い名前、fullName は読み上げ用の正式な名前）
const STEPS: { key: Step; label: string; fullName: string }[] = [
  { key: "ability", label: "確認", fullName: "説明できるか" },
  { key: "patient", label: "本人", fullName: "本人" },
  { key: "family", label: "家族", fullName: "家族・介護者" },
  { key: "review", label: "見直し", fullName: "入力内容の見直し" },
  { key: "doctor", label: "医師", fullName: "医師に見せる" },
];

function stepIndex(step: Step): number {
  return STEPS.findIndex((item) => item.key === step);
}

// 回答に加えて、画面の進み具合を持つ（保存はしない）
type FlowState = IntakeState & {
  reachedIndex: number; // どの画面まで通ったか（STEPS の番号）
  direction: "forward" | "back" | null; // 直前の切り替えの向き。動きの向きに使う
  isEditingFromReview: boolean; // 見直し画面の「編集」から来て、直している最中か
};

function createUnansweredPatientAnswers(): PatientAnswers {
  return {
    painLocations: { respondent: "patient", status: "unanswered" },
    painLevel: { respondent: "patient", status: "unanswered" },
    sensations: { respondent: "patient", status: "unanswered" },
    sensationOther: { respondent: "patient", status: "unanswered" },
    chiefComplaint: { respondent: "patient", status: "unanswered" },
  };
}

function createDifficultPatientAnswers(): PatientAnswers {
  const unable = {
    respondent: "patient",
    status: "unable",
    reason: "difficult_at_start",
  } as const;
  return {
    painLocations: unable,
    painLevel: unable,
    sensations: unable,
    sensationOther: unable,
    chiefComplaint: unable,
  };
}

function createUnansweredFamilyAnswers(): FamilyAnswers {
  return {
    chiefConcern: { respondent: "family", status: "unanswered" },
    onset: { respondent: "family", status: "unanswered" },
    onsetDetail: { respondent: "family", status: "unanswered" },
    course: { respondent: "family", status: "unanswered" },
    temperature: { respondent: "family", status: "unanswered" },
    foodIntake: { respondent: "family", status: "unanswered" },
    differences: { respondent: "family", status: "unanswered" },
    conditions: { respondent: "family", status: "unanswered" },
    medications: { respondent: "family", status: "unanswered" },
    allergies: { respondent: "family", status: "unanswered" },
    consultation: { respondent: "family", status: "unanswered" },
  };
}

// 画面を切り替える。向きと「どこまで通ったか」も合わせて更新する
function moveTo(state: FlowState, step: Step): FlowState {
  const from = stepIndex(state.step);
  const to = stepIndex(step);
  return {
    ...state,
    step,
    direction: to === from ? state.direction : to > from ? "forward" : "back",
    reachedIndex: Math.max(state.reachedIndex, to),
  };
}

// この流れで通る画面。最初に「難しい」を選んだときは、本人の画面を飛ばす
function flowSteps(state: FlowState) {
  return state.canSelfReport === "difficult"
    ? STEPS.filter((item) => item.key !== "patient")
    : STEPS;
}

// パンくずに出すのは、今いる画面と、それまでに通った画面だけ
function breadcrumbItems(state: FlowState): BreadcrumbItem<Step>[] {
  return flowSteps(state)
    .filter((item) => stepIndex(item.key) <= state.reachedIndex)
    .map((item) => ({ ...item, isCurrent: item.key === state.step }));
}

// 今が全体の何番目か。通常は全体を5、本人の画面を飛ばす流れでは4として数える
function flowPosition(state: FlowState) {
  const steps = flowSteps(state);
  return {
    current: steps.findIndex((item) => item.key === state.step) + 1,
    total: steps.length,
  };
}

const DIRECTION_CLASS = {
  forward: "screen-enter-forward",
  back: "screen-enter-back",
};

export function IntakeFlow() {
  const [state, setState] = useState<FlowState>({
    step: "ability",
    canSelfReport: null,
    patient: createUnansweredPatientAnswers(),
    family: createUnansweredFamilyAnswers(),
    reachedIndex: 0,
    direction: null,
    isEditingFromReview: false,
  });
  // 要約も画面の中（Reactの状態）だけで持つ。閉じたら消える
  const [summaryCache, setSummaryCache] = useState<SummaryCache | null>(null);

  // 画面（ステップ）が切り替わるたびに、ページの一番上を表示し、
  // 新しい画面の見出しにフォーカスを移す（読み上げ機能に、画面が変わったことを伝える）。
  // 見直し画面の「編集」から来たときは、その項目の位置まで表示して、そこにフォーカスを移す
  const mainRef = useRef<HTMLElement>(null);
  const shownStep = useRef(state.step);
  const fieldToShow = useRef<string | null>(null);
  useEffect(() => {
    if (shownStep.current === state.step) return;
    shownStep.current = state.step;

    const field = fieldToShow.current
      ? document.getElementById(fieldId(fieldToShow.current))
      : null;
    fieldToShow.current = null;
    if (field) {
      field.scrollIntoView({ block: "start" });
      field.focus({ preventScroll: true });
      return;
    }

    window.scrollTo(0, 0);
    mainRef.current
      ?.querySelector<HTMLElement>("[data-screen-heading]")
      ?.focus({ preventScroll: true });
  }, [state.step]);

  const hasPatientInput =
    state.canSelfReport === "able" &&
    Object.values(state.patient).some(
      (answer) => answer.status !== "unanswered",
    );

  // ふつうの画面の切り替え（「次へ」とパンくず）。「編集」の最中という印は消す
  const goToStep = (step: Step) =>
    setState((prev) => moveTo({ ...prev, isEditingFromReview: false }, step));

  // 見直し画面の「編集」。その項目を入力した画面の、その位置に移る。
  // 「難しい」の流れでは本人の画面がないので、本人の項目は最初の質問に移る
  const editFromReview = (respondent: "patient" | "family", field: string) => {
    const target: Step =
      respondent === "family"
        ? "family"
        : state.canSelfReport === "able"
          ? "patient"
          : "ability";
    fieldToShow.current = target === "ability" ? null : field;
    setState((prev) => moveTo({ ...prev, isEditingFromReview: true }, target));
  };

  const { isEditingFromReview } = state;

  return (
    <main
      ref={mainRef}
      className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-x-clip text-body"
    >
      <StepProgress {...flowPosition(state)} />
      <Breadcrumb items={breadcrumbItems(state)} onSelect={goToStep} />
      <div
        key={state.step}
        className={`flex flex-1 flex-col ${
          state.direction ? DIRECTION_CLASS[state.direction] : ""
        }`}
      >
        {state.step === "ability" && (
          <AbilityScreen
            canSelfReport={state.canSelfReport}
            hasPatientInput={hasPatientInput}
            onChooseAble={() =>
              setState((prev) =>
                moveTo(
                  {
                    ...prev,
                    canSelfReport: "able",
                    isEditingFromReview: false,
                    patient:
                      prev.canSelfReport === "difficult"
                        ? createUnansweredPatientAnswers()
                        : prev.patient,
                    // 最初の質問の答えを変えたら、先の画面は「まだ通っていない」扱いに戻す
                    reachedIndex:
                      prev.canSelfReport === "able" ? prev.reachedIndex : 0,
                  },
                  "patient",
                ),
              )
            }
            onChooseDifficult={() =>
              setState((prev) => ({
                ...prev,
                canSelfReport: "difficult",
                isEditingFromReview: false,
                patient: createDifficultPatientAnswers(),
                // 最初の質問の答えを変えたら、先の画面は「まだ通っていない」扱いに戻す
                reachedIndex:
                  prev.canSelfReport === "difficult" ? prev.reachedIndex : 0,
              }))
            }
            onNext={() => goToStep("family")}
          />
        )}
        {state.step === "patient" && (
          <PatientScreen
            answers={state.patient}
            onChange={(update) =>
              setState((prev) => ({
                ...prev,
                patient: { ...prev.patient, ...update },
              }))
            }
            onNext={() => goToStep(isEditingFromReview ? "review" : "family")}
            nextLabel={
              isEditingFromReview ? "見直しに戻る" : "次へ（家族・介護者の入力）"
            }
          />
        )}
        {state.step === "family" && (
          <FamilyScreen
            answers={state.family}
            onChange={(update) =>
              setState((prev) => ({
                ...prev,
                family: { ...prev.family, ...update },
              }))
            }
            onNext={() => goToStep("review")}
            nextLabel={isEditingFromReview ? "見直しに戻る" : "次へ（見直し）"}
          />
        )}
        {state.step === "review" && (
          <ReviewScreen
            canSelfReport={state.canSelfReport}
            patient={state.patient}
            family={state.family}
            onEdit={editFromReview}
            onNext={() => goToStep("doctor")}
          />
        )}
        {state.step === "doctor" && (
          <DoctorScreen
            canSelfReport={state.canSelfReport}
            patient={state.patient}
            family={state.family}
            summaryCache={summaryCache}
            onSummaryReady={setSummaryCache}
          />
        )}
      </div>
    </main>
  );
}
