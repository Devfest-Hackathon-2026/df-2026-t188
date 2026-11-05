"use client";

import { useState } from "react";
import { AbilityScreen } from "@/components/intake/AbilityScreen";
import { DoctorScreen } from "@/components/intake/DoctorScreen";
import { FamilyScreen } from "@/components/intake/FamilyScreen";
import { PatientScreen } from "@/components/intake/PatientScreen";
import type {
  FamilyAnswers,
  IntakeState,
  PatientAnswers,
} from "@/lib/intake/types";

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

export function IntakeFlow() {
  const [state, setState] = useState<IntakeState>({
    step: "ability",
    canSelfReport: null,
    patient: createUnansweredPatientAnswers(),
    family: createUnansweredFamilyAnswers(),
  });

  const hasPatientInput =
    state.canSelfReport === "able" &&
    Object.values(state.patient).some(
      (answer) => answer.status !== "unanswered",
    );

  const goToStep = (step: IntakeState["step"]) =>
    setState((prev) => ({ ...prev, step }));

  // 本人の回答を直す画面。「難しい」を選んでいるときは最初の質問に戻る
  const goToPatientSide = () =>
    setState((prev) => ({
      ...prev,
      step: prev.canSelfReport === "able" ? "patient" : "ability",
    }));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col text-lg">
      {state.step === "ability" && (
        <AbilityScreen
          canSelfReport={state.canSelfReport}
          hasPatientInput={hasPatientInput}
          onChooseAble={() =>
            setState((prev) => ({
              ...prev,
              step: "patient",
              canSelfReport: "able",
              patient:
                prev.canSelfReport === "difficult"
                  ? createUnansweredPatientAnswers()
                  : prev.patient,
            }))
          }
          onChooseDifficult={() =>
            setState((prev) => ({
              ...prev,
              step: "ability",
              canSelfReport: "difficult",
              patient: createDifficultPatientAnswers(),
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
          onEditPatient={goToPatientSide}
          onEditFamily={() => goToStep("family")}
        />
      )}
    </main>
  );
}
