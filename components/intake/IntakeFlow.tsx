"use client";

import { useEffect, useRef, useState } from "react";
import { AbilityScreen } from "@/components/intake/AbilityScreen";
import { DoctorScreen } from "@/components/intake/DoctorScreen";
import { EditSheet, type EditTarget } from "@/components/intake/EditSheet";
import { FamilyScreen, type FamilyPage } from "@/components/intake/FamilyScreen";
import type { PatientFieldKey } from "@/components/intake/IntakeField";
import { PatientScreen } from "@/components/intake/PatientScreen";
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
const PATIENT_FIELDS: Partial<Record<Step, PatientFieldKey>> = {
  patientBody: "bodyParts",
  patientFeeling: "feelings",
  patientDiscomfort: "discomfort",
};

const FAMILY_PAGES: Partial<Record<Step, FamilyPage>> = {
  familyConcern: "concern",
  familyCondition: "condition",
  familyHistory: "history",
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

  // 見直しのシート。開くと履歴を1つ積み、閉じるときは履歴を戻す。
  // 「なおす」「やめる」「Esc」「ブラウザの戻る」は、どれも履歴が戻った結果として閉じる
  const [sheet, setSheet] = useState<{
    target: EditTarget;
    isClosing: boolean;
  } | null>(null);
  const isSheetCloseRequested = useRef(false);
  const editedField = useRef<string | null>(null);

  // シートが消えたら、押した「編集」のボタンにフォーカスを戻す
  useEffect(() => {
    if (sheet || !editedField.current) return;
    document
      .querySelector<HTMLElement>(`[data-edit-field="${editedField.current}"]`)
      ?.focus({ preventScroll: true });
    editedField.current = null;
  }, [sheet]);

  const stepHistory = useStepHistory<Step>({
    firstStep: "welcome",
    // ブラウザの「進む」の先が、この流れにない画面や、通っていない画面なら移らない
    canArrive: (step) =>
      flowSteps(state).some((item) => item.key === step) &&
      stepIndex(step) <= state.reachedIndex,
    // 履歴を通って画面を移ったとき。ブラウザの「戻る」「進む」も、「もどる」も、ここを通る
    onArrive: (step) => {
      isSheetCloseRequested.current = true;
      setSheet((prev) => prev && { ...prev, isClosing: true });
      setState((prev) => moveTo(prev, step));
    },
    // 回答が入るのは、最初の質問に答えたあとだけ
    hasInput: state.canSelfReport !== null,
  });

  // 今の画面から何画面ぶん動くか（この流れで通る画面の順番で数える）
  const stepsTo = (step: Step) => {
    const keys = flowSteps(state).map((item) => item.key);
    return { keys, from: keys.indexOf(state.step), to: keys.indexOf(step) };
  };

  // 画面の切り替え（「次へ」「もどる」とパンくず）。
  // 先へ進むときは履歴に積み、前へ戻るときは履歴を戻す（履歴が戻った結果として画面が変わる）
  const goToStep = (step: Step) => {
    const { keys, from, to } = stepsTo(step);
    if (to < from) {
      stepHistory.goBack(from - to);
      return;
    }
    stepHistory.pushSteps(keys.slice(from + 1, to + 1));
    setState((prev) => moveTo(prev, step));
  };

  // 見直しの「編集」。その場でシートを開く
  const openSheet = (target: EditTarget) => {
    stepHistory.pushSheet(state.step);
    isSheetCloseRequested.current = false;
    editedField.current = target.field;
    setSheet({ target, isClosing: false });
  };

  // シートを閉じる。2回押されても、履歴は1つだけ戻す
  const requestSheetClose = () => {
    if (isSheetCloseRequested.current) return;
    isSheetCloseRequested.current = true;
    stepHistory.goBack(1);
  };

  const previous = previousStep(state);
  const group = groupOf(state.step);
  const band = group === "welcome" ? null : SCREEN_BAND[group];
  const patientField = PATIENT_FIELDS[state.step];
  const familyPage = FAMILY_PAGES[state.step];
  const goNext = () => goToStep(nextStep(state));

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
        {patientField && (
          <PatientScreen
            field={patientField}
            answers={state.patient}
            onChange={(update) =>
              setState((prev) => ({
                ...prev,
                patient: { ...prev.patient, ...update },
              }))
            }
            onNext={goNext}
            nextLabel={
              patientField === "discomfort"
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
            nextLabel={familyPage === "history" ? "次へ（見直し）" : "次へ"}
          />
        )}
        {state.step === "review" && (
          <ReviewScreen
            canSelfReport={state.canSelfReport}
            patient={state.patient}
            family={state.family}
            onEdit={openSheet}
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
      {sheet && (
        <EditSheet
          target={sheet.target}
          isClosing={sheet.isClosing}
          patient={state.patient}
          family={state.family}
          onSavePatient={(update) =>
            setState((prev) => ({
              ...prev,
              patient: { ...prev.patient, ...update },
            }))
          }
          onSaveFamily={(update) =>
            setState((prev) => ({
              ...prev,
              family: { ...prev.family, ...update },
            }))
          }
          onRequestClose={requestSheetClose}
          onClosed={() => setSheet(null)}
        />
      )}
    </main>
  );
}
