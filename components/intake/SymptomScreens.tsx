// 「症状をえらぶ」と「ほかにも きになることは ある？」の画面。
// 文言・選択肢・絵文字・決まりは、かずまさんの v3 の症状画面.html のとおり
// （表と決まりは lib/intake/symptoms.ts）。主症状ごとの詳しい質問の画面は、2026-11-09 になくした
import { useState } from "react";
import { PictureSelect, type PictureOption } from "@/components/intake/PictureSelect";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { CheckDot, Chip, SelectedLayer } from "@/components/ui/Chip";
import { OTHER_DESCRIPTION, type OtherReaction } from "@/lib/intake/guide";
import {
  CATEGORY_CARD_ORDER,
  OTHER_GATE_OPTIONS,
  OTHER_QUESTION,
  SYMPTOM_CATEGORIES,
  selectOtherGate,
  symptomEmoji,
  toggleCategory,
  toggleOther,
  visibleOtherChoices,
  type PatientSymptoms,
  type SymptomCategoryKey,
} from "@/lib/intake/symptoms";

const NOT_YET = "まだ えらんでいないよ。わからなくても すすんでいいよ。";

const CATEGORY_OPTIONS: PictureOption<SymptomCategoryKey>[] = CATEGORY_CARD_ORDER.map(
  (key) => ({
    value: key,
    label: SYMPTOM_CATEGORIES[key].label,
    picture: (
      <span aria-hidden="true" className="text-[2.25rem] leading-none">
        {SYMPTOM_CATEGORIES[key].emoji}
      </span>
    ),
  }),
);

// ---------- 症状をえらぶ ----------

export function ChooseSymptomsScreen({
  symptoms,
  onChange,
  onNext,
}: {
  symptoms: PatientSymptoms;
  onChange: (next: PatientSymptoms) => void;
  onNext: () => void;
}) {
  const picked = symptoms.categories;
  return (
    <>
      <div className="kana-text stagger flex flex-1 flex-col gap-4 px-4 py-4">
        <PictureSelect
          labelledBy="screen-heading"
          options={CATEGORY_OPTIONS}
          selected={picked}
          onToggle={(key) => onChange(toggleCategory(symptoms, key))}
          oddLast="center"
        />
        <p aria-live="polite" className="text-support text-on-surface-variant">
          {picked.length > 0
            ? `えらんだよ：${picked.map((key) => SYMPTOM_CATEGORIES[key].label).join("、")}。ほかも えらべるよ。`
            : NOT_YET}
        </p>
      </div>
      <BottomBar>
        <Button onClick={onNext}>つぎへ すすむ</Button>
      </BottomBar>
    </>
  );
}

// ---------- ほかにも きになることは ある？ ----------

// 選択肢のボタン。絵文字（飾り）と言葉
function SymptomChoice({
  choice,
  selected,
  onClick,
}: {
  choice: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`press-feedback chunky relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-card-line bg-surface-container-lowest px-2 py-3 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
        selected ? "text-on-primary-container" : "text-on-surface"
      }`}
    >
      <SelectedLayer rounded="rounded-lg" />
      <span aria-hidden="true" className="relative text-[1.75rem] leading-none">
        {symptomEmoji(choice)}
      </span>
      <span className="relative text-label font-bold">{choice}</span>
      <span className="absolute top-2 right-2">
        <CheckDot />
      </span>
    </button>
  );
}

function selectionStatus(values: readonly string[]): string {
  return values.length > 0
    ? `えらんだよ：${values.join("、")}。もういちど おすと けせるよ。`
    : NOT_YET;
}

// ある／ない／わからない を選び、「ある」なら選択肢を出す
export function OtherSymptomsScreen({
  symptoms,
  onChange,
  onReaction,
  onNext,
}: {
  symptoms: PatientSymptoms;
  onChange: (next: PatientSymptoms) => void;
  onReaction: (reaction: OtherReaction) => void;
  onNext: () => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const { choices, hasMore } = visibleOtherChoices(symptoms, showMore);
  // 押したボタンで、キャラクターの返事を変える（「わからない」かどうか）
  const react = (value: string) =>
    onReaction(value === "わからない" ? "dontKnow" : "pick");

  return (
    <>
      <div className="kana-text stagger flex flex-1 flex-col gap-4 px-4 py-4">
        {/* 案内ボックスでは、説明がキャラクターの返事と入れ替わるので、説明はここにも出す */}
        <p className="text-support text-on-surface-variant">{OTHER_DESCRIPTION}</p>
        <section aria-labelledby="question-other" className="flex flex-col gap-3">
          <h2 id="question-other" className="text-title">
            {OTHER_QUESTION}
          </h2>
          <div role="group" aria-label={OTHER_QUESTION} className="grid grid-cols-3 gap-2">
            {OTHER_GATE_OPTIONS.map((value) => (
              <Chip
                key={value}
                label={value}
                selected={symptoms.otherGate === value}
                onClick={() => {
                  react(value);
                  setShowMore(false);
                  onChange(selectOtherGate(symptoms, value));
                }}
                compact
              />
            ))}
          </div>
          {symptoms.otherGate === "ある" && (
            <div className="flex flex-col gap-3">
              <p className="text-support text-on-surface-variant">あてはまるものをえらんでね。</p>
              <div className="grid grid-cols-2 gap-3">
                {choices.map((choice) => (
                  <SymptomChoice
                    key={choice}
                    choice={choice}
                    selected={symptoms.other.includes(choice)}
                    onClick={() => {
                      react(choice);
                      onChange(toggleOther(symptoms, choice));
                    }}
                  />
                ))}
              </div>
              {hasMore && (
                <Button
                  variant="outlined"
                  aria-expanded={showMore}
                  onClick={() => {
                    react("");
                    setShowMore((value) => !value);
                  }}
                >
                  {showMore ? "こうほを すくなくする" : "ほかの こうほを みる"}
                </Button>
              )}
              <p aria-live="polite" className="text-support text-on-surface-variant">
                {selectionStatus(symptoms.other)}
              </p>
            </div>
          )}
        </section>
      </div>
      <BottomBar>
        <Button onClick={onNext}>これで すすむ</Button>
      </BottomBar>
    </>
  );
}
