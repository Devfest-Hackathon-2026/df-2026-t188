import { CharCount } from "@/components/intake/CharCount";
import { MultiSelect } from "@/components/intake/MultiSelect";
import { PainSlider } from "@/components/intake/PainSlider";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
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
      <TopBar tone="primary">本人が答えています</TopBar>
      <div className="stagger flex flex-col gap-10 px-4 py-6">
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
          <label htmlFor="chief-complaint" className="mb-4 block text-title">
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
            className="w-full rounded-xs border border-outline bg-surface-container-lowest p-4 text-body text-on-surface focus:outline-2 focus:-outline-offset-1 focus:outline-primary"
          />
          <CharCount text={chiefComplaintText} />
        </div>

        <div className="flex flex-col gap-4">
          <Button onClick={onNext}>次へ（家族・介護者の入力）</Button>
          <Button variant="outlined" onClick={onBack}>
            最初の質問にもどる
          </Button>
        </div>
      </div>
    </>
  );
}
