"use client";

import { useEffect, useRef, useState } from "react";
import { AbilityScreen } from "@/components/intake/AbilityScreen";
import { DoctorScreen } from "@/components/intake/DoctorScreen";
import { FamilyScreen } from "@/components/intake/FamilyScreen";
import { PatientScreen } from "@/components/intake/PatientScreen";
import type { SummaryCache } from "@/components/intake/SummarySection";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import type {
  FamilyAnswers,
  IntakeState,
  PatientAnswers,
} from "@/lib/intake/types";

type Step = IntakeState["step"];

// 画面の順番と、パンくずリストに出す名前
const STEPS: { key: Step; label: string }[] = [
  { key: "ability", label: "説明できるか" },
  { key: "patient", label: "本人" },
  { key: "family", label: "家族・介護者" },
  { key: "doctor", label: "医師に見せる" },
];

function stepIndex(step: Step): number {
  return STEPS.findIndex((item) => item.key === step);
}

// 回答に加えて、画面の進み具合を持つ（保存はしない）
type FlowState = IntakeState & {
  reachedIndex: number; // どの画面まで通ったか（STEPS の番号）
  direction: "forward" | "back" | null; // 直前の切り替えの向き。動きの向きに使う
};

function createUnansweredPatientAnswers(): PatientAnswers {
  return {
    painLocations: { respondent: "patient", status: "unanswered" },
    painLevel: { respondent: "patient", status: "unanswered" },
    sensations: { respondent: "patient", status: "unanswered" },
    chiefComplaint: { respondent: "patient", status: "unanswered" },
  };
}

function createDifficultPatientAnswers(): PatientAnswers {
  return {
    painLocations: {
      respondent: "patient",
      status: "unable",
      reason: "difficult_at_start",
    },
    painLevel: {
      respondent: "patient",
      status: "unable",
      reason: "difficult_at_start",
    },
    sensations: {
      respondent: "patient",
      status: "unable",
      reason: "difficult_at_start",
    },
    chiefComplaint: {
      respondent: "patient",
      status: "unable",
      reason: "difficult_at_start",
    },
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

function breadcrumbItems(state: FlowState): BreadcrumbItem<Step>[] {
  return STEPS.map(({ key, label }, index) => {
    if (key === state.step) return { key, label, state: "current" };
    // 最初に「難しい」を選んだときは、本人の画面を飛ばす
    if (key === "patient" && state.canSelfReport === "difficult") {
      return { key, label, state: "skipped" };
    }
    return {
      key,
      label,
      state: index <= state.reachedIndex ? "visited" : "upcoming",
    };
  });
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
  });
  // 要約も画面の中（Reactの状態）だけで持つ。閉じたら消える
  const [summaryCache, setSummaryCache] = useState<SummaryCache | null>(null);

  // 画面（ステップ）が切り替わるたびに、ページの一番上を表示し、
  // 新しい画面の見出しにフォーカスを移す（読み上げ機能に、画面が変わったことを伝える）
  const mainRef = useRef<HTMLElement>(null);
  const shownStep = useRef(state.step);
  useEffect(() => {
    if (shownStep.current === state.step) return;
    shownStep.current = state.step;
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

  const goToStep = (step: Step) => setState((prev) => moveTo(prev, step));

  // 本人の回答の画面。「難しい」を選んでいるときは最初の質問に戻る
  const goToPatientSide = () =>
    setState((prev) =>
      moveTo(prev, prev.canSelfReport === "able" ? "patient" : "ability"),
    );

  return (
    <main
      ref={mainRef}
      className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-x-clip text-body"
    >
      <Breadcrumb items={breadcrumbItems(state)} onSelect={goToStep} />
      <div
        key={state.step}
        className={state.direction ? DIRECTION_CLASS[state.direction] : ""}
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
            onNext={() => goToStep("family")}
            onBack={() => goToStep("ability")}
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
            onNext={() => goToStep("doctor")}
            onBack={goToPatientSide}
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
