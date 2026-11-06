import type { ReactNode } from "react";
import { FaceSelect } from "@/components/intake/FaceSelect";
import { FieldCard } from "@/components/intake/FieldCard";
import {
  PictureSelect,
  type PictureOption,
} from "@/components/intake/PictureSelect";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import {
  BodyFigure,
  FeelingBreathIcon,
  FeelingCoughIcon,
  FeelingFeverIcon,
  FeelingOtherIcon,
  FeelingPainIcon,
  FeelingSickIcon,
  FeelingTiredIcon,
} from "@/components/ui/icons";
import { BODY_PARTS, FEELINGS, type BodyPart, type Feeling } from "@/lib/intake/options";
import type { Answer, PatientAnswers } from "@/lib/intake/types";

// こどもの画面。1画面に1問で、説明文も文字を書く欄もない
export type PatientQuestion = "body" | "feeling" | "discomfort";

type PatientScreenProps = {
  question: PatientQuestion;
  answers: PatientAnswers;
  onChange: (update: Partial<PatientAnswers>) => void;
  onNext: () => void;
  nextLabel: string;
};

const PICTURE_CLASS = "h-9 w-9";

// カードに出す、ひらがなの言葉。記録する値は「頭」などのまま
const BODY_PART_LABELS: Record<BodyPart, string> = {
  頭: "あたま",
  耳: "みみ",
  のど: "のど",
  胸: "むね",
  お腹: "おなか",
  "手・足": "て あし",
  その他: "そのほか",
};

const BODY_PART_PICTURES: Record<BodyPart, ReactNode> = {
  頭: <BodyFigure part="head" />,
  耳: <BodyFigure part="ears" />,
  のど: <BodyFigure part="throat" />,
  胸: <BodyFigure part="chest" />,
  お腹: <BodyFigure part="belly" />,
  "手・足": <BodyFigure part="limbs" />,
  その他: <FeelingOtherIcon className={PICTURE_CLASS} />,
};

const FEELING_PICTURES: Record<Feeling, ReactNode> = {
  いたい: <FeelingPainIcon className={PICTURE_CLASS} />,
  きもちわるい: <FeelingSickIcon className={PICTURE_CLASS} />,
  だるい: <FeelingTiredIcon className={PICTURE_CLASS} />,
  "いきが くるしい": <FeelingBreathIcon className={PICTURE_CLASS} />,
  "せきが でる": <FeelingCoughIcon className={PICTURE_CLASS} />,
  ねつっぽい: <FeelingFeverIcon className={PICTURE_CLASS} />,
  "そのほか・わからない": <FeelingOtherIcon className={PICTURE_CLASS} />,
};

const BODY_PART_OPTIONS: PictureOption<BodyPart>[] = BODY_PARTS.map((value) => ({
  value,
  label: BODY_PART_LABELS[value],
  picture: BODY_PART_PICTURES[value],
  bare: value !== "その他",
}));

const FEELING_OPTIONS: PictureOption<Feeling>[] = FEELINGS.map((value) => ({
  value,
  label: value,
  picture: FEELING_PICTURES[value],
}));

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
  question,
  answers,
  onChange,
  onNext,
  nextLabel,
}: PatientScreenProps) {
  return (
    <>
      <div className="kana-text stagger flex flex-1 flex-col gap-6 px-4 py-4">
        {question === "body" && (
          <FieldCard field="bodyParts" bare>
            <PictureSelect
              legend="どこが へん？"
              options={BODY_PART_OPTIONS}
              selected={selectedValues(answers.bodyParts)}
              onChange={(next) => onChange({ bodyParts: toSelectionAnswer(next) })}
            />
          </FieldCard>
        )}
        {question === "feeling" && (
          <FieldCard field="feelings" bare>
            <PictureSelect
              legend="どんな かんじ？"
              options={FEELING_OPTIONS}
              selected={selectedValues(answers.feelings)}
              onChange={(next) => onChange({ feelings: toSelectionAnswer(next) })}
            />
          </FieldCard>
        )}
        {question === "discomfort" && (
          <FieldCard field="discomfort" bare>
            <FaceSelect
              selected={
                answers.discomfort.status === "answered"
                  ? answers.discomfort.value
                  : null
              }
              onChange={(next) =>
                onChange({
                  discomfort:
                    next === null
                      ? { respondent: "patient", status: "unanswered" }
                      : { respondent: "patient", status: "answered", value: next },
                })
              }
            />
          </FieldCard>
        )}
      </div>
      <BottomBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </BottomBar>
    </>
  );
}
