"use client";

import { useEffect, useRef, useState } from "react";
import { AbilityScreen } from "@/components/intake/AbilityScreen";
import { DoctorScreen } from "@/components/intake/DoctorScreen";
import { FamilyScreen, type FamilyPage } from "@/components/intake/FamilyScreen";
import { fieldId } from "@/components/intake/FieldCard";
import {
  PatientScreen,
  type PatientQuestion,
} from "@/components/intake/PatientScreen";
import { ReviewScreen } from "@/components/intake/ReviewScreen";
import type { SummaryCache } from "@/components/intake/SummarySection";
import { useStepHistory } from "@/components/intake/useStepHistory";
import { WelcomeScreen } from "@/components/intake/WelcomeScreen";
import { BackButton } from "@/components/ui/BackButton";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { TopBar, type TopBarTone } from "@/components/ui/TopBar";
import type {
  FamilyAnswers,
  IntakeState,
  PatientAnswers,
} from "@/lib/intake/types";

type Step = IntakeState["step"];

// 画面のまとまり。パンくずと上の帯は、このまとまりごとに出す（こどもと保護者は3画面で1つ）
type StepGroup = "welcome" | "ability" | "patient" | "family" | "review" | "doctor";

// 画面の順番。fullName は「もどる」で読み上げ機能に伝える、戻り先の名前
const STEPS: { key: Step; group: StepGroup; fullName: string }[] = [
  { key: "welcome", group: "welcome", fullName: "はじめ" },
  { key: "ability", group: "ability", fullName: "答えられるかの確認" },
  { key: "patientBody", group: "patient", fullName: "どこが へん" },
  { key: "patientFeeling", group: "patient", fullName: "どんな かんじ" },
  { key: "patientDiscomfort", group: "patient", fullName: "どれくらい つらい" },
  { key: "familyConcern", group: "family", fullName: "心配なこと・いつから" },
  { key: "familyCondition", group: "family", fullName: "熱・食べる飲む" },
  { key: "familyHistory", group: "family", fullName: "薬・アレルギー・持病" },
  { key: "review", group: "review", fullName: "入力内容の見直し" },
  { key: "doctor", group: "doctor", fullName: "医師に見せる" },
];

// パンくずに出すまとまり（label は画面用の短い名前、fullName は読み上げ用の正式な名前）
const CRUMBS: { group: StepGroup; label: string; fullName: string }[] = [
  { group: "ability", label: "確認", fullName: "答えられるかの確認" },
  { group: "patient", label: "こども", fullName: "こども" },
  { group: "family", label: "保護者", fullName: "保護者" },
  { group: "review", label: "見直し", fullName: "入力内容の見直し" },
  { group: "doctor", label: "医師", fullName: "医師に見せる" },
];

// 上の帯に出す画面名と色。だれが答えている画面かを、色と文字の両方で示す。
// 最初の画面には、帯もパンくずも「もどる」も出さない
const SCREEN_BAND: Record<
  Exclude<StepGroup, "welcome">,
  { title: string; tone: TopBarTone }
> = {
  ability: { title: "はじめの確認", tone: "neutral" },
  patient: { title: "こどもが こたえる ばん", tone: "patient" },
  family: { title: "保護者が答えています", tone: "family" },
  review: { title: "入力内容の見直し", tone: "neutral" },
  doctor: { title: "医師に見せる画面", tone: "neutral" },
};

// こどもの画面と保護者の画面の、どの問いを出すか
const PATIENT_QUESTIONS: Partial<Record<Step, PatientQuestion>> = {
  patientBody: "body",
  patientFeeling: "feeling",
  patientDiscomfort: "discomfort",
};

const FAMILY_PAGES: Partial<Record<Step, FamilyPage>> = {
  familyConcern: "concern",
  familyCondition: "condition",
  familyHistory: "history",
};

// 見直しの「編集」で移る先。項目を入力した画面
const FIELD_STEPS: Record<string, Step> = {
  bodyParts: "patientBody",
  feelings: "patientFeeling",
  discomfort: "patientDiscomfort",
  chiefConcern: "familyConcern",
  onset: "familyConcern",
  temperature: "familyCondition",
  foodIntake: "familyCondition",
  medications: "familyHistory",
  allergies: "familyHistory",
  conditions: "familyHistory",
  age: "familyHistory",
  weight: "familyHistory",
};

function stepIndex(step: Step): number {
  return STEPS.findIndex((item) => item.key === step);
}

function groupOf(step: Step): StepGroup {
  return STEPS[stepIndex(step)].group;
}

// 最初の質問の答えを変えたときは、ここまで「通った」扱いに戻す
const ABILITY_INDEX = stepIndex("ability");

// 回答に加えて、画面の進み具合を持つ（保存はしない）
type FlowState = IntakeState & {
  reachedIndex: number; // どの画面まで通ったか（STEPS の番号）
  direction: "forward" | "back" | null; // 直前の切り替えの向き。動きの向きに使う
  isEditingFromReview: boolean; // 見直し画面の「編集」から来て、直している最中か
};

function createUnansweredPatientAnswers(): PatientAnswers {
  return {
    bodyParts: { respondent: "patient", status: "unanswered" },
    feelings: { respondent: "patient", status: "unanswered" },
    discomfort: { respondent: "patient", status: "unanswered" },
  };
}

function createDifficultPatientAnswers(): PatientAnswers {
  const unable = {
    respondent: "patient",
    status: "unable",
    reason: "difficult_at_start",
  } as const;
  return {
    bodyParts: unable,
    feelings: unable,
    discomfort: unable,
  };
}

function createUnansweredFamilyAnswers(): FamilyAnswers {
  return {
    chiefConcern: { respondent: "family", status: "unanswered" },
    onset: { respondent: "family", status: "unanswered" },
    temperature: { respondent: "family", status: "unanswered" },
    foodIntake: { respondent: "family", status: "unanswered" },
    medications: { respondent: "family", status: "unanswered" },
    allergies: { respondent: "family", status: "unanswered" },
    conditions: { respondent: "family", status: "unanswered" },
    age: { respondent: "family", status: "unanswered" },
    weight: { respondent: "family", status: "unanswered" },
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
    ? STEPS.filter((item) => item.group !== "patient")
    : STEPS;
}

// パンくずに出すのは、今いるまとまりと、それまでに通ったまとまりだけ。
// 押すと、そのまとまりの最初の画面に移る
function breadcrumbItems(state: FlowState): BreadcrumbItem<Step>[] {
  const steps = flowSteps(state);
  return CRUMBS.flatMap(({ group, label, fullName }) => {
    const first = steps.find((item) => item.group === group);
    if (!first || stepIndex(first.key) > state.reachedIndex) return [];
    return [
      {
        key: first.key,
        label,
        fullName,
        isCurrent: groupOf(state.step) === group,
      },
    ];
  });
}

// 「次へ」で進む先。この流れで通る画面の順番で、1つ先の画面
function nextStep(state: FlowState): Step {
  const steps = flowSteps(state);
  const index = steps.findIndex((item) => item.key === state.step);
  return steps[Math.min(index + 1, steps.length - 1)].key;
}

// 「もどる」で戻る先。この流れで通る画面の順番で、1つ前の画面。
// 本人の画面を飛ばす流れでは、飛ばした画面には戻らない。最初の画面では null
function previousStep(state: FlowState) {
  const steps = flowSteps(state);
  const index = steps.findIndex((item) => item.key === state.step);
  return index > 0 ? steps[index - 1] : null;
}

const DIRECTION_CLASS = {
  forward: "screen-enter-forward",
  back: "screen-enter-back",
};

export function IntakeFlow() {
  const [state, setState] = useState<FlowState>({
    step: "welcome",
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

  // 履歴が戻ったあとに「編集」の最中にするか。見直しの「編集」のときだけ true にする
  const editingAfterBack = useRef(false);

  const stepHistory = useStepHistory<Step>({
    firstStep: "welcome",
    // ブラウザの「進む」の先が、この流れにない画面や、通っていない画面なら移らない
    canArrive: (step) =>
      flowSteps(state).some((item) => item.key === step) &&
      stepIndex(step) <= state.reachedIndex,
    // 履歴を通って画面を移ったとき。ブラウザの「戻る」「進む」も、「もどる」も、ここを通る
    onArrive: (step) => {
      const isEditing = editingAfterBack.current;
      editingAfterBack.current = false;
      setState((prev) =>
        moveTo({ ...prev, isEditingFromReview: isEditing }, step),
      );
    },
    // 回答が入るのは、最初の質問に答えたあとだけ
    hasInput: state.canSelfReport !== null,
  });

  // 今の画面から何画面ぶん動くか（この流れで通る画面の順番で数える）
  const stepsTo = (step: Step) => {
    const keys = flowSteps(state).map((item) => item.key);
    return { keys, from: keys.indexOf(state.step), to: keys.indexOf(step) };
  };

  // ふつうの画面の切り替え（「次へ」「もどる」とパンくず）。「編集」の最中という印は消す。
  // 先へ進むときは履歴に積み、前へ戻るときは履歴を戻す（履歴が戻った結果として画面が変わる）
  const goToStep = (step: Step) => {
    const { keys, from, to } = stepsTo(step);
    if (to < from) {
      editingAfterBack.current = false;
      stepHistory.goBack(from - to);
      return;
    }
    stepHistory.pushSteps(keys.slice(from + 1, to + 1));
    setState((prev) => moveTo({ ...prev, isEditingFromReview: false }, step));
  };

  // 見直し画面の「編集」。その項目を入力した画面の、その位置に移る。
  // 「難しい」の流れでは本人の画面がないので、本人の項目は最初の質問に移る
  const editFromReview = (respondent: "patient" | "family", field: string) => {
    const target: Step =
      respondent === "patient" && state.canSelfReport !== "able"
        ? "ability"
        : FIELD_STEPS[field];
    fieldToShow.current = target === "ability" ? null : field;
    editingAfterBack.current = true;
    const { from, to } = stepsTo(target);
    stepHistory.goBack(from - to);
  };

  const { isEditingFromReview } = state;
  const previous = previousStep(state);
  const group = groupOf(state.step);
  const band = group === "welcome" ? null : SCREEN_BAND[group];
  const patientQuestion = PATIENT_QUESTIONS[state.step];
  const familyPage = FAMILY_PAGES[state.step];
  // 「編集」の最中は見直しに戻り、それ以外は順番どおりに次の画面へ進む
  const goNext = () =>
    goToStep(isEditingFromReview ? "review" : nextStep(state));

  return (
    <main
      ref={mainRef}
      className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-x-clip text-body"
    >
      {/* 上の部分（「もどる」と画面名の帯）。スクロールしても上に残る。
          最初の画面には、どちらも出さない */}
      {band && (
        <>
          <header className="sticky top-0 z-20 bg-surface-container-lowest shadow-card">
            {previous && (
              <div className="flex px-2">
                <BackButton
                  destination={previous.fullName}
                  onClick={() => goToStep(previous.key)}
                />
              </div>
            )}
            <TopBar tone={band.tone}>{band.title}</TopBar>
          </header>
          <Breadcrumb items={breadcrumbItems(state)} onSelect={goToStep} />
        </>
      )}
      <div
        key={state.step}
        className={`flex flex-1 flex-col ${
          state.direction ? DIRECTION_CLASS[state.direction] : ""
        }`}
      >
        {state.step === "welcome" && (
          <WelcomeScreen onStart={() => goToStep("ability")} />
        )}
        {state.step === "ability" && (
          <AbilityScreen
            canSelfReport={state.canSelfReport}
            hasPatientInput={hasPatientInput}
            onChooseAble={() => {
              stepHistory.pushSteps(["patientBody"]);
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
                      prev.canSelfReport === "able"
                        ? prev.reachedIndex
                        : ABILITY_INDEX,
                  },
                  "patientBody",
                ),
              );
            }}
            onChooseDifficult={() =>
              setState((prev) => ({
                ...prev,
                canSelfReport: "difficult",
                isEditingFromReview: false,
                patient: createDifficultPatientAnswers(),
                // 最初の質問の答えを変えたら、先の画面は「まだ通っていない」扱いに戻す
                reachedIndex:
                  prev.canSelfReport === "difficult"
                    ? prev.reachedIndex
                    : ABILITY_INDEX,
              }))
            }
            onNext={goNext}
          />
        )}
        {patientQuestion && (
          <PatientScreen
            question={patientQuestion}
            answers={state.patient}
            onChange={(update) =>
              setState((prev) => ({
                ...prev,
                patient: { ...prev.patient, ...update },
              }))
            }
            onNext={goNext}
            nextLabel={
              isEditingFromReview
                ? "見直しに戻る"
                : patientQuestion === "discomfort"
                  ? "つぎへ（おとなの ひとへ）"
                  : "つぎへ"
            }
          />
        )}
        {familyPage && (
          <FamilyScreen
            page={familyPage}
            answers={state.family}
            onChange={(update) =>
              setState((prev) => ({
                ...prev,
                family: { ...prev.family, ...update },
              }))
            }
            onNext={goNext}
            nextLabel={
              isEditingFromReview
                ? "見直しに戻る"
                : familyPage === "history"
                  ? "次へ（見直し）"
                  : "次へ"
            }
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
