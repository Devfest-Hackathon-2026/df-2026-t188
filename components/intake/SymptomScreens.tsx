// 「症状をえらぶ」と「症状をくわしく」の画面。
// 文言・選択肢・絵文字・短い言葉・決まりは、かずまさんの v3 の症状画面.html のとおり
// （表と決まりは lib/intake/symptoms.ts）。自由入力、痛みの部位、場所の画面、絵の動きは、まだ作っていない
import { useState } from "react";
import { PictureSelect, type PictureOption } from "@/components/intake/PictureSelect";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { CheckDot, Chip, SelectedLayer } from "@/components/ui/Chip";
import { SYMPTOM_DETAIL_DESCRIPTION, type DetailReaction } from "@/lib/intake/guide";
import {
  CATEGORY_CARD_ORDER,
  OTHER_GATE_OPTIONS,
  SYMPTOM_CATEGORIES,
  selectOtherGate,
  symptomCue,
  symptomEmoji,
  toggleCategory,
  toggleDetail,
  toggleOther,
  visibleDetailChoices,
  visibleOtherChoices,
  type PatientSymptoms,
  type SymptomCategoryKey,
  type SymptomPhase,
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
        <Button onClick={onNext}>次へ進む</Button>
      </BottomBar>
    </>
  );
}

// ---------- 症状をくわしく ----------

// 詳しい答えのボタン。絵文字（飾り）と言葉と、あれば短い言葉（HTML の symptomCues）
function SymptomChoice({
  choice,
  selected,
  onClick,
}: {
  choice: string;
  selected: boolean;
  onClick: () => void;
}) {
  const cue = symptomCue(choice);
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
      {cue && (
        <span aria-hidden="true" className="relative text-support text-on-surface-variant">
          {cue}
        </span>
      )}
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

type SymptomDetailScreenProps = {
  phase: SymptomPhase;
  number: number; // この画面が何番目か（1から）
  count: number; // 詳細の画面の数
  symptoms: PatientSymptoms;
  onChange: (next: PatientSymptoms) => void;
  onReaction: (reaction: DetailReaction) => void;
  onNext: () => void;
};

export function SymptomDetailScreen({
  phase,
  number,
  count,
  symptoms,
  onChange,
  onReaction,
  onNext,
}: SymptomDetailScreenProps) {
  const isLast = phase === "other";
  // 押したボタンで、キャラクターの返事を変える（「わからない」かどうか）
  const react = (value: string) =>
    onReaction(value === "わからない" ? "dontKnow" : "pick");

  return (
    <>
      <div className="kana-text stagger flex flex-1 flex-col gap-4 px-4 py-4">
        {/* 案内ボックスでは、説明がキャラクターの返事と入れ替わるので、説明はここにも出す */}
        <div>
          <p className="text-support text-on-surface-variant">{SYMPTOM_DETAIL_DESCRIPTION}</p>
          <p aria-live="polite" className="mt-1 text-support font-bold text-link">
            {number} / {count}
          </p>
        </div>
        {isLast ? (
          <OtherSymptoms symptoms={symptoms} onChange={onChange} react={react} />
        ) : (
          <section aria-labelledby={`question-${phase}`} className="flex flex-col gap-3">
            <h2 id={`question-${phase}`} className="text-title">
              {SYMPTOM_CATEGORIES[phase].question}
            </h2>
            <p className="text-support text-on-surface-variant">あてはまるものをえらんでね。</p>
            <div className="grid grid-cols-2 gap-3">
              {visibleDetailChoices(symptoms, phase).map((choice) => (
                <SymptomChoice
                  key={choice}
                  choice={choice}
                  selected={(symptoms.details[phase] ?? []).includes(choice)}
                  onClick={() => {
                    react(choice);
                    onChange(toggleDetail(symptoms, phase, choice));
                  }}
                />
              ))}
            </div>
            <p aria-live="polite" className="text-support text-on-surface-variant">
              {selectionStatus(symptoms.details[phase] ?? [])}
            </p>
          </section>
        )}
      </div>
      <BottomBar>
        <Button onClick={onNext}>{isLast ? "これで すすむ" : "つぎへ"}</Button>
      </BottomBar>
    </>
  );
}

// 「ほかに きになることは ある？」。ある／ない／わからない を選び、「ある」なら選択肢を出す
function OtherSymptoms({
  symptoms,
  onChange,
  react,
}: {
  symptoms: PatientSymptoms;
  onChange: (next: PatientSymptoms) => void;
  react: (value: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const question = SYMPTOM_CATEGORIES.other.question!;
  const { choices, hasMore } = visibleOtherChoices(symptoms, showMore);

  return (
    <section aria-labelledby="question-other" className="flex flex-col gap-3">
      <h2 id="question-other" className="text-title">
        {question}
      </h2>
      <div role="group" aria-label={question} className="grid grid-cols-3 gap-2">
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
              {showMore ? "候補を すくなくする" : "ほかの こうほを みる"}
            </Button>
          )}
          <p aria-live="polite" className="text-support text-on-surface-variant">
            {selectionStatus(symptoms.other)}
          </p>
        </div>
      )}
    </section>
  );
}
