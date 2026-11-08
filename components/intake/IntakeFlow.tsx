"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AbilityScreen } from "@/components/intake/AbilityScreen";
import { BreakScreen } from "@/components/intake/BreakScreen";
import { DoctorScreen } from "@/components/intake/DoctorScreen";
import { EditSheet, type EditTarget } from "@/components/intake/EditSheet";
import { EndScreen } from "@/components/intake/EndScreen";
import { FamilyScreen, type FamilyPage } from "@/components/intake/FamilyScreen";
import {
  toSelectionAnswer,
  type PatientFieldKey,
} from "@/components/intake/IntakeField";
import { MascotGuide } from "@/components/intake/MascotGuide";
import {
  ChooseSymptomsScreen,
  SymptomDetailScreen,
} from "@/components/intake/SymptomScreens";
import { PatientScreen } from "@/components/intake/PatientScreen";
import { ReviewScreen } from "@/components/intake/ReviewScreen";
import { SplashScreen } from "@/components/intake/SplashScreen";
import type { SummaryCache } from "@/components/intake/SummarySection";
import { useStepHistory } from "@/components/intake/useStepHistory";
import { WelcomeScreen } from "@/components/intake/WelcomeScreen";
import { BackButton } from "@/components/ui/BackButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  detailNumber,
  flowSteps,
  progressOf,
  stepIndex,
  stepInfo,
  type Step,
  type StepGroup,
} from "@/lib/intake/flow";
import { guideFor, type DetailReaction } from "@/lib/intake/guide";
import {
  categoryFeelings,
  EMPTY_SYMPTOMS,
  symptomPhases,
  type PatientSymptoms,
} from "@/lib/intake/symptoms";
import type {
  FamilyAnswers,
  IntakeState,
  PatientAnswers,
} from "@/lib/intake/types";

// 上の部分に出す、だれに向けた画面か。本人と保護者の画面を、文字で見分けられるようにする
const AUDIENCE: Partial<Record<StepGroup, string>> = {
  ability: "保護者の方へ",
  patient: "こどもの ばん",
  family: "保護者の方へ",
  review: "保護者の方へ",
  doctor: "医師に見せる画面",
};

// こどもの画面と保護者の画面の、どの問いを出すか
const PATIENT_FIELDS: Partial<Record<Step, PatientFieldKey>> = {
  patientBody: "bodyParts",
  patientDiscomfort: "discomfort",
};

const FAMILY_PAGES: Partial<Record<Step, FamilyPage>> = {
  familyProfile: "profile",
  familyRecord: "record",
};

// 全面が青い画面（上の部分を出さない）
const FULL_SCREEN_STEPS: readonly Step[] = ["welcome", "patientBreak", "end"];

// 最初の質問の答えを変えたときは、ここまで「通った」扱いに戻す
const ABILITY_INDEX = stepIndex("ability");
// 主症状の選び方を変えたときは、詳細の画面の数が変わるので、ここまで「通った」扱いに戻す
const CHOOSE_SYMPTOMS_INDEX = stepIndex("patientFeeling");

// 回答に加えて、画面の進み具合を持つ（保存はしない）
type FlowState = IntakeState & {
  reachedIndex: number; // どの画面まで通ったか（STEPS の番号）
  direction: "forward" | "back" | null; // 直前の切り替えの向き。動きの向きに使う
  detailReaction: DetailReaction; // 詳細の画面で最後に押したもの（キャラクターの返事に使う）
};

// 詳細の画面の数（選んだ主症状の画面と「そのほか」）
function detailCount(state: FlowState): number {
  return symptomPhases(state.symptoms).length;
}

function stepsOf(state: FlowState) {
  return flowSteps(state.canSelfReport, detailCount(state));
}

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
    sex: { respondent: "family", status: "unanswered" },
    height: { respondent: "family", status: "unanswered" },
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
    detailReaction: to === from ? state.detailReaction : null,
  };
}

// 「次へ」で進む先。この流れで通る画面の順番で、1つ先の画面
function nextStep(state: FlowState): Step {
  const steps = stepsOf(state);
  const index = steps.findIndex((item) => item.key === state.step);
  return steps[Math.min(index + 1, steps.length - 1)].key;
}

// 「もどる」で戻る先。この流れで通る画面の順番で、1つ前の画面。
// 本人の画面を飛ばす流れでは、飛ばした画面には戻らない。最初の画面では null
function previousStep(state: FlowState) {
  const steps = stepsOf(state);
  const index = steps.findIndex((item) => item.key === state.step);
  return index > 0 ? steps[index - 1] : null;
}

const DIRECTION_CLASS = {
  forward: "screen-enter-forward",
  back: "screen-enter-back",
};

function createInitialState(): FlowState {
  return {
    step: "welcome",
    canSelfReport: null,
    patient: createUnansweredPatientAnswers(),
    symptoms: EMPTY_SYMPTOMS,
    family: createUnansweredFamilyAnswers(),
    reachedIndex: 0,
    direction: null,
    detailReaction: null,
  };
}

export function IntakeFlow() {
  const [state, setState] = useState<FlowState>(createInitialState);
  // 終了の画面の「はじめから」。履歴を最初の画面まで戻し、着いたら回答をすべて消す
  const isRestarting = useRef(false);
  // 要約も画面の中（Reactの状態）だけで持つ。閉じたら消える
  const [summaryCache, setSummaryCache] = useState<SummaryCache | null>(null);
  // 起動の画面。開いたときに一度だけ出す。画面の順番（履歴）には入れない
  const [isSplashShown, setIsSplashShown] = useState(true);
  const hideSplash = useCallback(() => setIsSplashShown(false), []);

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
    (Object.values(state.patient).some(
      (answer) => answer.status !== "unanswered",
    ) ||
      state.symptoms.categories.length > 0 ||
      state.symptoms.otherGate !== null);

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
      stepsOf(state).some((item) => item.key === step) &&
      stepIndex(step) <= state.reachedIndex,
    // 履歴を通って画面を移ったとき。ブラウザの「戻る」「進む」も、「もどる」も、ここを通る
    onArrive: (step) => {
      isSheetCloseRequested.current = true;
      setSheet((prev) => prev && { ...prev, isClosing: true });
      if (isRestarting.current && step === "welcome") {
        // 回答も要約も消し、どこまで通ったかも最初に戻す（ブラウザの「進む」でも先へ行けない）
        isRestarting.current = false;
        setSummaryCache(null);
        setState({ ...createInitialState(), direction: "back" });
        return;
      }
      setState((prev) => moveTo(prev, step));
    },
    // 回答が入るのは、最初の質問に答えたあとだけ
    hasInput: state.canSelfReport !== null,
  });

  // 今の画面から何画面ぶん動くか（この流れで通る画面の順番で数える）
  const stepsTo = (step: Step) => {
    const keys = stepsOf(state).map((item) => item.key);
    return { keys, from: keys.indexOf(state.step), to: keys.indexOf(step) };
  };

  // 画面の切り替え（「次へ」「もどる」）。
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
  const group = stepInfo(state.step).group;
  const audience = AUDIENCE[group];
  const progress = progressOf(state.step, state.canSelfReport, detailCount(state));
  const guide = guideFor(state.step, {
    patient: state.patient,
    family: state.family,
    symptoms: state.symptoms,
    detailReaction: state.detailReaction,
  });
  const detail = detailNumber(state.step);
  const phases = symptomPhases(state.symptoms);
  const hasHeader = !FULL_SCREEN_STEPS.includes(state.step);
  const patientField = PATIENT_FIELDS[state.step];
  const familyPage = FAMILY_PAGES[state.step];
  const goNext = () => goToStep(nextStep(state));

  // 主症状と詳しい答えを変える。
  // Gemini に送る主症状（patient.feelings）は、ここで今のサーバーの選択肢に置きかえて入れる。
  // 主症状の選び方が変わったら、詳細の画面の数が変わるので、先の画面は「まだ通っていない」扱いに戻す
  const setSymptoms = (symptoms: PatientSymptoms) =>
    setState((prev) => ({
      ...prev,
      symptoms,
      patient: {
        ...prev.patient,
        feelings: toSelectionAnswer(categoryFeelings(symptoms.categories)),
      },
      reachedIndex:
        symptoms.categories.join() === prev.symptoms.categories.join()
          ? prev.reachedIndex
          : Math.min(prev.reachedIndex, CHOOSE_SYMPTOMS_INDEX),
    }));

  return (
    <>
      {isSplashShown && <SplashScreen onDone={hideSplash} />}
      <main
        ref={mainRef}
        // 起動の画面が出ている間は、後ろの画面を押せず、読み上げ機能でも移れないようにする
        inert={isSplashShown}
        className="mx-auto flex w-full max-w-110 flex-1 flex-col overflow-x-clip text-body"
      >
        {/* 上の部分（「もどる」、だれに向けた画面か、進み具合のバー）。スクロールしても上に残る */}
        {hasHeader && (
          <header className="sticky top-0 z-20 flex flex-col gap-3 border-b-2 border-line bg-surface-container-lowest px-4 pt-3 pb-3">
            <div className="flex min-h-12 items-center gap-2">
              <div className="w-24 shrink-0">
                {previous && (
                  <BackButton
                    destination={previous.fullName}
                    onClick={() => goToStep(previous.key)}
                  />
                )}
              </div>
              <div className="flex-1 text-center">
                {audience &&
                  (group === "doctor" ? (
                    // 医師の画面には案内ボックスがないので、ここを画面の見出しにする
                    <h1
                      tabIndex={-1}
                      data-screen-heading
                      className="inline-block rounded-full bg-primary-container px-3 py-0.5 text-support font-bold text-on-primary-container outline-none"
                    >
                      {audience}
                    </h1>
                  ) : (
                    <span
                      className={`inline-block rounded-full px-3 py-0.5 text-support font-bold ${
                        group === "patient"
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-family-container text-family"
                      }`}
                    >
                      {audience}
                    </span>
                  ))}
              </div>
              <div aria-hidden="true" className="w-24 shrink-0" />
            </div>
            {progress && (
              <ProgressBar
                total={progress.total}
                current={progress.current}
                inSegment={progress.inSegment}
              />
            )}
          </header>
        )}
        <div
          key={state.step}
          className={`flex flex-1 flex-col ${
            state.direction ? DIRECTION_CLASS[state.direction] : ""
          }`}
        >
          {guide && (
            <div className="px-4 pt-4">
              <MascotGuide guide={guide} kana={group === "patient"} />
            </div>
          )}
          {state.step === "welcome" && (
            <WelcomeScreen onStart={() => goToStep("ability")} />
          )}
          {state.step === "ability" && (
            <AbilityScreen
              canSelfReport={state.canSelfReport}
              hasPatientInput={hasPatientInput}
              onChooseAble={() => {
                stepHistory.pushSteps(["patientFeeling"]);
                setState((prev) =>
                  moveTo(
                    {
                      ...prev,
                      canSelfReport: "able",
                      patient:
                        prev.canSelfReport === "difficult"
                          ? createUnansweredPatientAnswers()
                          : prev.patient,
                      symptoms:
                        prev.canSelfReport === "difficult"
                          ? EMPTY_SYMPTOMS
                          : prev.symptoms,
                      // 最初の質問の答えを変えたら、先の画面は「まだ通っていない」扱いに戻す
                      reachedIndex:
                        prev.canSelfReport === "able"
                          ? prev.reachedIndex
                          : ABILITY_INDEX,
                    },
                    "patientFeeling",
                  ),
                );
              }}
              onChooseDifficult={() =>
                setState((prev) => ({
                  ...prev,
                  canSelfReport: "difficult",
                  patient: createDifficultPatientAnswers(),
                  symptoms: EMPTY_SYMPTOMS,
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
          {state.step === "patientFeeling" && (
            <ChooseSymptomsScreen
              symptoms={state.symptoms}
              onChange={(symptoms) => setSymptoms(symptoms)}
              onNext={goNext}
            />
          )}
          {detail > 0 && phases[detail - 1] && (
            <SymptomDetailScreen
              phase={phases[detail - 1]}
              number={detail}
              count={phases.length}
              symptoms={state.symptoms}
              onChange={(symptoms) => setSymptoms(symptoms)}
              onReaction={(detailReaction) =>
                setState((prev) => ({ ...prev, detailReaction }))
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
            />
          )}
          {state.step === "patientBreak" && previous && (
            <BreakScreen
              backDestination={previous.fullName}
              onBack={() => goToStep(previous.key)}
              onNext={goNext}
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
              nextLabel={familyPage === "record" ? "次へ（見直し）" : "次へ"}
            />
          )}
          {state.step === "review" && (
            <ReviewScreen
              canSelfReport={state.canSelfReport}
              patient={state.patient}
              symptoms={state.symptoms}
              family={state.family}
              onEdit={openSheet}
              onRedoPatient={() =>
                goToStep(
                  state.canSelfReport === "difficult" ? "ability" : "patientFeeling",
                )
              }
              onNext={() => goToStep("doctor")}
            />
          )}
          {state.step === "doctor" && (
            <DoctorScreen
              canSelfReport={state.canSelfReport}
              patient={state.patient}
              symptoms={state.symptoms}
              family={state.family}
              summaryCache={summaryCache}
              onSummaryReady={setSummaryCache}
              onFinish={goNext}
            />
          )}
          {state.step === "end" && (
            <EndScreen
              onBackToDoctor={() => goToStep("doctor")}
              onRestart={() => {
                isRestarting.current = true;
                goToStep("welcome");
              }}
            />
          )}
        </div>
        {sheet && (
          <EditSheet
            target={sheet.target}
            isClosing={sheet.isClosing}
            family={state.family}
            onSave={(update) =>
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
    </>
  );
}
