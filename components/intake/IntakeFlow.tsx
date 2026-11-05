"use client";

import { useState } from "react";
import { AbilityScreen } from "@/components/intake/AbilityScreen";
import { PatientScreen } from "@/components/intake/PatientScreen";
import type { IntakeState, PatientAnswers } from "@/lib/intake/types";

function createUnansweredPatientAnswers(): PatientAnswers {
  return {
    painLocations: { respondent: "patient", status: "unanswered" },
    painLevel: { respondent: "patient", status: "unanswered" },
    sensations: { respondent: "patient", status: "unanswered" },
    concerns: { respondent: "patient", status: "unanswered" },
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
    concerns: {
      respondent: "patient",
      status: "unable",
      reason: "difficult_at_start",
    },
  };
}

export function IntakeFlow() {
  const [state, setState] = useState<IntakeState>({
    step: "ability",
    canSelfReport: null,
    patient: createUnansweredPatientAnswers(),
  });

  const hasPatientInput =
    state.canSelfReport === "able" &&
    Object.values(state.patient).some(
      (answer) => answer.status !== "unanswered",
    );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col text-lg">
      {state.step === "ability" ? (
        <AbilityScreen
          canSelfReport={state.canSelfReport}
          hasPatientInput={hasPatientInput}
          onChooseAble={() =>
            setState((prev) => ({
              step: "patient",
              canSelfReport: "able",
              patient:
                prev.canSelfReport === "difficult"
                  ? createUnansweredPatientAnswers()
                  : prev.patient,
            }))
          }
          onChooseDifficult={() =>
            setState({
              step: "ability",
              canSelfReport: "difficult",
              patient: createDifficultPatientAnswers(),
            })
          }
        />
      ) : (
        <PatientScreen
          answers={state.patient}
          onChange={(update) =>
            setState((prev) => ({
              ...prev,
              patient: { ...prev.patient, ...update },
            }))
          }
          onBack={() => setState((prev) => ({ ...prev, step: "ability" }))}
        />
      )}
    </main>
  );
}
