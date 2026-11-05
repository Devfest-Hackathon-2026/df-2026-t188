import { useState, type ReactNode } from "react";
import { CharCount } from "@/components/intake/CharCount";
import { FieldCard } from "@/components/intake/FieldCard";
import { MultiSelect } from "@/components/intake/MultiSelect";
import { PainSlider } from "@/components/intake/PainSlider";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import {
  DownIcon,
  PlusIcon,
  PrickIcon,
  PulseIcon,
  QuestionIcon,
  SpiralIcon,
  SqueezeIcon,
  WaveIcon,
} from "@/components/ui/icons";
import {
  BODY_PARTS,
  EXCLUSIVE_BODY_PARTS,
  EXCLUSIVE_SENSATIONS,
  SENSATIONS,
  type BodyPart,
  type Sensation,
} from "@/lib/intake/options";
import type { Answer, PatientAnswers } from "@/lib/intake/types";

type PatientScreenProps = {
  answers: PatientAnswers;
  onChange: (update: Partial<PatientAnswers>) => void;
  onNext: () => void;
  nextLabel: string;
};

// 痛い場所のカードに付ける短い説明。場所の手がかりだけで、症状は書かない。
// 記録も送信もせず、医師の画面にも出さない。
// アイコンは付けない（小さな絵では「のど」と「胸」などの場所を描き分けられなかったため。
// アイコンのあるカードとないカードを混ぜないよう、全部を名前と説明だけにそろえている）
const BODY_PART_DESCRIPTIONS: Partial<Record<BodyPart, string>> = {
  頭: "おでこ・てっぺん・うしろ",
  "顔・口": "目・鼻・耳・歯 など",
  のど: "くびの まえ・おく",
  胸: "むねの あたり",
  お腹: "おへその まわり・わきばら",
  "背中・腰": "からだの うしろがわ",
  "手・腕": "かた・ひじ・ゆび など",
  足: "もも・ひざ・あしくび など",
  その他: "うえに ない ばしょ",
};

// 感覚のカードに付けるアイコンと短い説明。選ぶときの手がかりで、記録も送信もしない
const SENSATION_ICONS: Record<Sensation, ReactNode> = {
  ズキズキ: <PulseIcon />,
  チクチク: <PrickIcon />,
  しめつけられる: <SqueezeIcon />,
  気持ち悪い: <WaveIcon />,
  めまい: <SpiralIcon />,
  だるい: <DownIcon />,
  わからない: <QuestionIcon />,
};

const SENSATION_DESCRIPTIONS: Record<Sensation, string> = {
  ズキズキ: "脈をうつように いたい",
  チクチク: "はりで さされるように いたい",
  しめつけられる: "ぎゅっと おされる かんじ",
  気持ち悪い: "むかむか・いやな かんじ",
  めまい: "ぐるぐる・ふらふら する",
  だるい: "からだが おもい",
  わからない: "うまく いえない",
};

const BODY_PART_OPTIONS = BODY_PARTS.map((value) => ({
  value,
  description: BODY_PART_DESCRIPTIONS[value],
}));

const SENSATION_OPTIONS = SENSATIONS.map((value) => ({
  value,
  icon: SENSATION_ICONS[value],
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
  const hasOtherText = sensationOtherText !== "";

  return (
    <>
      <div className="stagger flex flex-1 flex-col gap-6 px-4 py-4">
        <FieldCard field="painLocations" bare>
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

        <FieldCard field="sensations" bare>
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
            className={`press-feedback chunky mt-3 flex min-h-14 w-full items-center gap-2 rounded-lg border p-3 text-left text-label font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
              hasOtherText
                ? "border-primary bg-primary-container text-on-primary-container [--chunky-edge:var(--color-primary-shade)]"
                : "border-outline bg-surface-container-lowest text-on-surface"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-primary ${
                hasOtherText ? "bg-surface-container-lowest" : "bg-surface-container"
              }`}
            >
              <PlusIcon />
            </span>
            その他（自分の言葉で書く）
          </button>
          {isOtherOpen && (
            <div id="sensation-other-area" className="mt-3">
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
          <label htmlFor="chief-complaint" className="mb-3 block text-title">
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
