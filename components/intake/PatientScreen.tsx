import { useState } from "react";
import { CharCount } from "@/components/intake/CharCount";
import { FieldCard } from "@/components/intake/FieldCard";
import { MultiSelect } from "@/components/intake/MultiSelect";
import { PainSlider } from "@/components/intake/PainSlider";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { TopBar } from "@/components/ui/TopBar";
import {
  BODY_PARTS,
  EXCLUSIVE_BODY_PARTS,
  EXCLUSIVE_SENSATIONS,
  SENSATIONS,
  type Sensation,
} from "@/lib/intake/options";
import type { Answer, PatientAnswers } from "@/lib/intake/types";

type PatientScreenProps = {
  answers: PatientAnswers;
  onChange: (update: Partial<PatientAnswers>) => void;
  onNext: () => void;
  nextLabel: string;
};


// 感覚のカードに付ける短い説明。選ぶときの手がかりで、記録も送信もしない
const SENSATION_DESCRIPTIONS: Record<Sensation, string> = {
  ズキズキ: "脈をうつように いたい",
  チクチク: "はりで さされるように いたい",
  しめつけられる: "ぎゅっと おされる かんじ",
  気持ち悪い: "むかむか・いやな かんじ",
  めまい: "ぐるぐる・ふらふら する",
  だるい: "からだが おもい",
  わからない: "うまく いえない",
};

// 痛い場所のカードは、文字だけにそろえている（アイコンは形が伝わりにくかったので付けない）
const BODY_PART_OPTIONS = BODY_PARTS.map((value) => ({ value }));

const SENSATION_OPTIONS = SENSATIONS.map((value) => ({
  value,
  description: SENSATION_DESCRIPTIONS[value],
}));

const TEXT_INPUT_CLASS =
  "w-full rounded-field border border-outline bg-surface-container-lowest p-4 text-body text-on-surface focus:outline-2 focus:-outline-offset-1 focus:outline-primary";

function selectedValues<T>(answer: Answer<T[], "patient">): T[] {
  return answer.status === "answered" ? answer.value : [];
}

// 選択が0件なら未回答に戻す
function toSelectionAnswer<T>(values: T[]): Answer<T[], "patient"> {
  return values.length > 0
    ? { respondent: "patient", status: "answered", value: values }
    : { respondent: "patient", status: "unanswered" };
}

function textOf(answer: Answer<string, "patient">): string {
  return answer.status === "answered" ? answer.value : "";
}

// 空や空白だけなら未回答に戻す。書かれた文字はそのまま持つ
function toTextAnswer(text: string): Answer<string, "patient"> {
  return text.trim() === ""
    ? { respondent: "patient", status: "unanswered" }
    : { respondent: "patient", status: "answered", value: text };
}

export function PatientScreen({
  answers,
  onChange,
  onNext,
  nextLabel,
}: PatientScreenProps) {
  const chiefComplaintText = textOf(answers.chiefComplaint);
  const sensationOtherText = textOf(answers.sensationOther);

  // 感覚の「その他」。押すと入力欄が出る。書いた文章があるときは開いたままにする
  const [isOtherOpenedByUser, setIsOtherOpenedByUser] = useState(false);
  const isOtherOpen = isOtherOpenedByUser || sensationOtherText !== "";

  return (
    <>
      <TopBar tone="primary">本人が答えています</TopBar>
      <div className="stagger flex flex-1 flex-col gap-4 px-4 py-4">
        <FieldCard field="painLocations">
          <MultiSelect
            legend="どこが痛いですか？（いくつでも選べます）"
            options={BODY_PART_OPTIONS}
            exclusiveOptions={EXCLUSIVE_BODY_PARTS}
            selected={selectedValues(answers.painLocations)}
            onChange={(next) =>
              onChange({ painLocations: toSelectionAnswer(next) })
            }
          />
        </FieldCard>

        <FieldCard field="painLevel">
          <PainSlider
            answer={answers.painLevel}
            onChange={(next) => onChange({ painLevel: next })}
          />
        </FieldCard>

        <FieldCard field="sensations">
          <MultiSelect
            legend="どんな感じがしますか？（いくつでも選べます）"
            options={SENSATION_OPTIONS}
            exclusiveOptions={EXCLUSIVE_SENSATIONS}
            selected={selectedValues(answers.sensations)}
            onChange={(next) => onChange({ sensations: toSelectionAnswer(next) })}
          />
          <button
            type="button"
            aria-expanded={isOtherOpen}
            aria-controls="sensation-other-area"
            onClick={() => setIsOtherOpenedByUser((isOpen) => !isOpen)}
            className={`press-feedback mt-2 flex min-h-18 w-full items-center gap-2 rounded-lg border border-outline p-3 text-left text-label font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
              sensationOtherText !== ""
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-lowest text-on-surface"
            }`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface">
              <PlusIcon />
            </span>
            その他（自分の言葉で書く）
          </button>
          {isOtherOpen && (
            <div id="sensation-other-area" className="mt-2">
              <label htmlFor="sensation-other" className="mb-2 block text-body">
                どんな感じか、自分の言葉で書いてください
              </label>
              <textarea
                id="sensation-other"
                rows={3}
                autoComplete="off"
                value={sensationOtherText}
                onChange={(event) =>
                  onChange({ sensationOther: toTextAnswer(event.target.value) })
                }
                className={TEXT_INPUT_CLASS}
              />
              <CharCount text={sensationOtherText} />
            </div>
          )}
        </FieldCard>

        <FieldCard field="chiefComplaint">
          <label htmlFor="chief-complaint" className="mb-4 block text-title">
            今いちばん困っていること（書かなくても大丈夫です）
          </label>
          <textarea
            id="chief-complaint"
            rows={4}
            autoComplete="off"
            value={chiefComplaintText}
            onChange={(event) =>
              onChange({ chiefComplaint: toTextAnswer(event.target.value) })
            }
            className={TEXT_INPUT_CLASS}
          />
          <CharCount text={chiefComplaintText} />
        </FieldCard>
      </div>
      <BottomBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </BottomBar>
    </>
  );
}
