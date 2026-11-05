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
  onBack,
}: PatientScreenProps) {
  const concernsText =
    answers.concerns.status === "answered" ? answers.concerns.value : "";

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
          <label htmlFor="concerns" className="mb-3 block text-xl font-bold">
            困っていることがあれば書いてください（書かなくても大丈夫です）
          </label>
          <textarea
            id="concerns"
            rows={4}
            autoComplete="off"
            value={concernsText}
            onChange={(event) => {
              const text = event.target.value;
              onChange({
                concerns:
                  text.trim() === ""
                    ? { respondent: "patient", status: "unanswered" }
                    : { respondent: "patient", status: "answered", value: text },
              });
            }}
            className="w-full rounded-xl border-2 border-zinc-400 bg-background p-3 text-lg"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled
            className="min-h-14 rounded-xl bg-zinc-300 px-3 py-2 text-lg font-bold text-zinc-700"
          >
            次へ（家族の入力：準備中）
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
