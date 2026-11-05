import { CharCount } from "@/components/intake/CharCount";
import { MultiSelect } from "@/components/intake/MultiSelect";
import { PainSlider } from "@/components/intake/PainSlider";
import {
  BODY_PARTS,
  EXCLUSIVE_BODY_PARTS,
  EXCLUSIVE_SENSATIONS,
  SENSATIONS,
} from "@/lib/intake/options";
import type { Answer, PatientAnswers } from "@/lib/intake/types";

type PatientScreenProps = {
  answers: PatientAnswers;
  onChange: (update: Partial<PatientAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
};

function selectedValues<T>(answer: Answer<T[], "patient">): T[] {
  return answer.status === "answered" ? answer.value : [];
}

// 選択が0件なら未回答に戻す
function toSelectionAnswer<T>(values: T[]): Answer<T[], "patient"> {
  return values.length > 0
    ? { respondent: "patient", status: "answered", value: values }
    : { respondent: "patient", status: "unanswered" };
}

export function PatientScreen({
  answers,
  onChange,
  onNext,
  onBack,
}: PatientScreenProps) {
  const chiefComplaintText =
    answers.chiefComplaint.status === "answered"
      ? answers.chiefComplaint.value
      : "";

  return (
    <>
      <p className="sticky top-0 z-10 bg-blue-700 px-4 py-3 text-center text-xl font-bold text-white">
        本人が答えています
      </p>
      <div className="flex flex-col gap-10 px-4 py-6">
        <MultiSelect
          legend="どこが痛いですか？（いくつでも選べます）"
          options={BODY_PARTS}
          exclusiveOptions={EXCLUSIVE_BODY_PARTS}
          selected={selectedValues(answers.painLocations)}
          onChange={(next) =>
            onChange({ painLocations: toSelectionAnswer(next) })
          }
        />

        <PainSlider
          answer={answers.painLevel}
          onChange={(next) => onChange({ painLevel: next })}
        />

        <MultiSelect
          legend="どんな感じがしますか？（いくつでも選べます）"
          options={SENSATIONS}
          exclusiveOptions={EXCLUSIVE_SENSATIONS}
          selected={selectedValues(answers.sensations)}
          onChange={(next) => onChange({ sensations: toSelectionAnswer(next) })}
        />

        <div>
          <label
            htmlFor="chief-complaint"
            className="mb-3 block text-xl font-bold"
          >
            今いちばん困っていること（書かなくても大丈夫です）
          </label>
          <textarea
            id="chief-complaint"
            rows={4}
            autoComplete="off"
            value={chiefComplaintText}
            onChange={(event) => {
              const text = event.target.value;
              onChange({
                chiefComplaint:
                  text.trim() === ""
                    ? { respondent: "patient", status: "unanswered" }
                    : { respondent: "patient", status: "answered", value: text },
              });
            }}
            className="w-full rounded-xl border-2 border-zinc-400 bg-background p-3 text-lg"
          />
          <CharCount text={chiefComplaintText} />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onNext}
            className="min-h-14 rounded-xl bg-blue-700 px-3 py-2 text-lg font-bold text-white"
          >
            次へ（家族・介護者の入力）
          </button>
          <button
            type="button"
            onClick={onBack}
            className="min-h-14 rounded-xl border-2 border-zinc-400 bg-background px-3 py-2 text-lg font-medium"
          >
            最初の質問にもどる
          </button>
        </div>
      </div>
    </>
  );
}
