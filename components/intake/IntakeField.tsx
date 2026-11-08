// 入力の1項目を出す部品。元の画面と、見直しのシートの両方で使う。
// 見た目も、入力のチェックも、同じものになる
import { useState, type ReactNode } from "react";
import { CharCount } from "@/components/intake/CharCount";
import { FaceSelect } from "@/components/intake/FaceSelect";
import {
  PictureSelect,
  type PictureOption,
} from "@/components/intake/PictureSelect";
import { SingleSelect } from "@/components/intake/SingleSelect";
import { Chip } from "@/components/ui/Chip";
import { BodyFigure } from "@/components/ui/icons";
import {
  BODY_PART_DISPLAY,
  BODY_PARTS,
  FOOD_INTAKE_OPTIONS,
  ONSET_OPTIONS,
  SEX_OPTIONS,
  type BodyPart,
  type ChoiceDisplay,
  type ChoicePicture,
} from "@/lib/intake/options";
import type {
  Answer,
  FamilyAnswer,
  FamilyAnswers,
  PatientAnswers,
  Presence,
} from "@/lib/intake/types";

// 「どんな かんじ」は、症状をえらぶ画面（SymptomScreens.tsx）で聞くので、ここには入れない
export type PatientFieldKey = Exclude<keyof PatientAnswers, "feelings">;
export type FamilyFieldKey = keyof FamilyAnswers;

// ---------- こどもの項目 ----------

// 絵は lib/intake/options.ts の表で決める（絵文字か体の図）。絵は飾りで、意味は言葉で伝える
function renderPicture(picture: ChoicePicture): ReactNode {
  return "emoji" in picture ? (
    <span aria-hidden="true" className="text-[2.25rem] leading-none">
      {picture.emoji}
    </span>
  ) : (
    <BodyFigure part={picture.figure} />
  );
}

function toPictureOption<T extends string>(
  value: T,
  display: ChoiceDisplay,
): PictureOption<T> {
  return {
    value,
    label: display.label,
    picture: renderPicture(display.picture),
    bare: "figure" in display.picture,
    color: display.color,
  };
}

const BODY_PART_OPTIONS: PictureOption<BodyPart>[] = BODY_PARTS.map((value) =>
  toPictureOption(value, BODY_PART_DISPLAY[value]),
);

function selectedValues<T>(answer: Answer<T[], "patient">): T[] {
  return answer.status === "answered" ? answer.value : [];
}

// 選択が0件なら未回答に戻す
export function toSelectionAnswer<T>(values: T[]): Answer<T[], "patient"> {
  return values.length > 0
    ? { respondent: "patient", status: "answered", value: values }
    : { respondent: "patient", status: "unanswered" };
}

export function PatientField({
  field,
  answers,
  onChange,
  labelledBy,
}: {
  field: PatientFieldKey;
  answers: PatientAnswers;
  onChange: (update: Partial<PatientAnswers>) => void;
  labelledBy: string; // 質問の見出しの id。選ぶカードのまとまりの名前にする
}) {
  if (field === "bodyParts") {
    return (
      <PictureSelect
        labelledBy={labelledBy}
        options={BODY_PART_OPTIONS}
        selected={selectedValues(answers.bodyParts)}
        onToggle={(value) => {
          const selected = selectedValues(answers.bodyParts);
          onChange({
            bodyParts: toSelectionAnswer(
              selected.includes(value)
                ? selected.filter((item) => item !== value)
                : [...selected, value],
            ),
          });
        }}
      />
    );
  }
  return (
    <FaceSelect
      labelledBy={labelledBy}
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
  );
}

// ---------- 保護者の項目 ----------

// 整数か小数1桁。値の大きさでは正しいかどうかを判断しない
const TEMPERATURE_PATTERN = /^[0-9０-９]+([.．][0-9０-９])?$/;
// 年齢は整数、体重は整数か小数1桁。値の大きさでは判断しない
const AGE_PATTERN = /^[0-9０-９]+$/;
const WEIGHT_PATTERN = TEMPERATURE_PATTERN;
const HEIGHT_PATTERN = TEMPERATURE_PATTERN; // 身長も整数か小数1桁

const TEXT_INPUT_CLASS =
  "w-full rounded-field border border-outline bg-surface-container-lowest p-4 text-body text-on-surface placeholder:text-on-surface-variant focus:outline-2 focus:-outline-offset-1 focus:outline-primary";

// 小さい入力欄（保護者の1ページで使う）
const COMPACT_TEXT_INPUT_CLASS =
  "w-full rounded-field border border-outline bg-surface-container-lowest px-3 py-2 text-support text-on-surface placeholder:text-on-surface-variant focus:outline-2 focus:-outline-offset-1 focus:outline-primary";

const FIELD_LABEL_CLASS = "mb-4 block text-title";
const COMPACT_FIELD_LABEL_CLASS = "mb-2 block text-label font-bold";

const textInputClass = (compact: boolean) =>
  compact ? COMPACT_TEXT_INPUT_CLASS : TEXT_INPUT_CLASS;
const fieldLabelClass = (compact: boolean) =>
  compact ? COMPACT_FIELD_LABEL_CLASS : FIELD_LABEL_CLASS;

function toChoiceAnswer<T>(value: T | null): FamilyAnswer<T> {
  return value === null
    ? { respondent: "family", status: "unanswered" }
    : { respondent: "family", status: "answered", value };
}

function choiceOf<T>(answer: FamilyAnswer<T>): T | null {
  return answer.status === "answered" ? answer.value : null;
}

const PRESENCE_OPTIONS = ["ある", "ない", "わからない"] as const;
type PresenceOption = (typeof PRESENCE_OPTIONS)[number];

const PRESENCE_OPTION: Record<Presence["kind"], PresenceOption> = {
  yes: "ある",
  no: "ない",
  dont_know: "わからない",
};

const OPTION_TO_PRESENCE: Record<PresenceOption, Presence> = {
  ある: { kind: "yes", text: "" },
  ない: { kind: "no" },
  わからない: { kind: "dont_know" },
};

type PresenceFieldProps = {
  id: string;
  label: string;
  answer: FamilyAnswer<Presence>;
  onChange: (next: FamilyAnswer<Presence>) => void;
  compact: boolean;
};

// 最初に「ある／ない／わからない」を選び、「ある」のときだけ入力欄を出す。
// ほかに変えると、書いた内容は消える（回答を選び直すと、値ごと入れ替わる）
function PresenceField({ id, label, answer, onChange, compact }: PresenceFieldProps) {
  const value = choiceOf(answer);

  return (
    <div>
      <SingleSelect
        legend={label}
        options={PRESENCE_OPTIONS}
        selected={value ? PRESENCE_OPTION[value.kind] : null}
        onChange={(next) =>
          onChange(toChoiceAnswer(next ? OPTION_TO_PRESENCE[next] : null))
        }
        compact={compact}
      />
      {value?.kind === "yes" && (
        <div className={compact ? "mt-3" : "mt-4"}>
          <label
            htmlFor={id}
            className={`mb-2 block ${compact ? "text-support" : "text-body"}`}
          >
            内容（書かなくても大丈夫です）
          </label>
          <textarea
            id={id}
            rows={2}
            autoComplete="off"
            value={value.text}
            onChange={(event) =>
              onChange(
                toChoiceAnswer<Presence>({
                  kind: "yes",
                  text: event.target.value,
                }),
              )
            }
            className={textInputClass(compact)}
          />
        </div>
      )}
    </div>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  unit: string;
  inputMode: "numeric" | "decimal";
  pattern: RegExp;
  placeholder: string;
  errorText: string;
  answer: FamilyAnswer<string>;
  onChange: (next: FamilyAnswer<string>) => void;
  onInvalidChange?: (isInvalid: boolean) => void;
};

// 数字を入れる項目（年齢・体重）。形が違うあいだは記録せず、知らせる
function NumberField({
  id,
  label,
  unit,
  inputMode,
  pattern,
  placeholder,
  errorText,
  answer,
  onChange,
  onInvalidChange,
}: NumberFieldProps) {
  const [text, setText] = useState(choiceOf(answer) ?? "");
  const trimmed = text.trim();
  const isInvalid = trimmed !== "" && !pattern.test(trimmed);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-label font-bold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          placeholder={placeholder}
          aria-describedby={isInvalid ? `${id}-error` : undefined}
          aria-invalid={isInvalid}
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            const nextTrimmed = next.trim();
            const isValid = pattern.test(nextTrimmed);
            setText(next);
            onChange(toChoiceAnswer(isValid ? nextTrimmed : null));
            onInvalidChange?.(nextTrimmed !== "" && !isValid);
          }}
          className={`${TEXT_INPUT_CLASS} min-w-0 flex-1 ${
            isInvalid ? "border-caution" : ""
          }`}
        />
        <span className="text-body">{unit}</span>
      </div>
      {isInvalid && (
        <p id={`${id}-error`} className="mt-2 text-support font-bold text-caution">
          {errorText}
        </p>
      )}
    </div>
  );
}

function TemperatureField({
  answer,
  onChange,
  onInvalidChange,
  compact,
}: {
  answer: FamilyAnswers["temperature"];
  onChange: (next: FamilyAnswers["temperature"]) => void;
  onInvalidChange?: (isInvalid: boolean) => void;
  compact: boolean;
}) {
  const temperature = choiceOf(answer);
  const [text, setText] = useState(
    temperature?.kind === "measured" ? temperature.celsius : "",
  );
  const isNotMeasured = temperature?.kind === "not_measured";
  const isInvalid = text.trim() !== "" && !TEMPERATURE_PATTERN.test(text.trim());

  return (
    <>
      <label htmlFor="temperature" className={fieldLabelClass(compact)}>
        熱
      </label>
      <div className="flex items-center gap-2">
        <input
          id="temperature"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-describedby="temperature-hint"
          aria-invalid={isInvalid}
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            const trimmed = next.trim();
            const isValid = TEMPERATURE_PATTERN.test(trimmed);
            setText(next);
            onChange(
              toChoiceAnswer(
                isValid ? { kind: "measured", celsius: trimmed } : null,
              ),
            );
            onInvalidChange?.(trimmed !== "" && !isValid);
          }}
          className={`${textInputClass(compact)} ${compact ? "max-w-32" : "max-w-40"} ${
            isInvalid ? "border-caution" : ""
          }`}
        />
        <span className={compact ? "text-label" : "text-title"}>℃</span>
      </div>
      <p
        id="temperature-hint"
        className={`mt-2 text-support ${
          isInvalid ? "font-bold text-caution" : "text-on-surface-variant"
        }`}
      >
        {isInvalid
          ? "数字で入れてください（例：37.5）。このままでは記録されません。"
          : "例：37.5 または 38"}
      </p>
      <Chip
        label="測っていない"
        selected={isNotMeasured}
        onClick={() => {
          setText("");
          onChange(toChoiceAnswer(isNotMeasured ? null : { kind: "not_measured" }));
          onInvalidChange?.(false);
        }}
        className={compact ? "mt-2 w-full" : "mt-3 w-full"}
        compact={compact}
      />
    </>
  );
}

export function FamilyField({
  field,
  answers,
  onChange,
  onInvalidChange,
  compact = false,
}: {
  field: FamilyFieldKey;
  answers: FamilyAnswers;
  onChange: (update: Partial<FamilyAnswers>) => void;
  // 形の違う入力があるかを知らせる。シートで、前の正しい値を消さないために使う
  onInvalidChange?: (isInvalid: boolean) => void;
  // 小さい表示。保護者の1ページ（家族からの記録）で使う。見直しのシートでは使わない
  compact?: boolean;
}) {
  switch (field) {
    case "chiefConcern": {
      const text = choiceOf(answers.chiefConcern) ?? "";
      return (
        <>
          <label htmlFor="chief-concern" className={fieldLabelClass(compact)}>
            一番心配なこと（任意）
          </label>
          <textarea
            id="chief-concern"
            rows={compact ? 2 : 3}
            autoComplete="off"
            value={text}
            onChange={(event) =>
              onChange({
                chiefConcern: toChoiceAnswer(
                  event.target.value.trim() === "" ? null : event.target.value,
                ),
              })
            }
            className={textInputClass(compact)}
          />
          <CharCount text={text} />
        </>
      );
    }
    case "onset":
      return (
        <SingleSelect
          legend="いつからですか？"
          options={ONSET_OPTIONS}
          selected={choiceOf(answers.onset)}
          onChange={(next) => onChange({ onset: toChoiceAnswer(next) })}
          compact={compact}
        />
      );
    case "temperature":
      return (
        <TemperatureField
          answer={answers.temperature}
          onChange={(next) => onChange({ temperature: next })}
          onInvalidChange={onInvalidChange}
          compact={compact}
        />
      );
    case "foodIntake":
      return (
        <SingleSelect
          legend="食べる・飲む"
          options={FOOD_INTAKE_OPTIONS}
          selected={choiceOf(answers.foodIntake)}
          onChange={(next) => onChange({ foodIntake: toChoiceAnswer(next) })}
          compact={compact}
        />
      );
    case "medications":
      return (
        <PresenceField
          id="medications"
          label="飲んでいる薬"
          answer={answers.medications}
          onChange={(next) => onChange({ medications: next })}
          compact={compact}
        />
      );
    case "allergies":
      return (
        <PresenceField
          id="allergies"
          label="アレルギー"
          answer={answers.allergies}
          onChange={(next) => onChange({ allergies: next })}
          compact={compact}
        />
      );
    case "conditions":
      return (
        <PresenceField
          id="conditions"
          label="持病"
          answer={answers.conditions}
          onChange={(next) => onChange({ conditions: next })}
          compact={compact}
        />
      );
    case "age":
      return (
        <NumberField
          id="age"
          label="年齢（任意）"
          unit="歳"
          inputMode="numeric"
          pattern={AGE_PATTERN}
          placeholder="例：8"
          errorText="整数で入れてください。"
          answer={answers.age}
          onChange={(next) => onChange({ age: next })}
          onInvalidChange={onInvalidChange}
        />
      );
    case "sex":
      return (
        <SingleSelect
          legend="性別（任意）"
          options={SEX_OPTIONS}
          selected={choiceOf(answers.sex)}
          onChange={(next) => onChange({ sex: toChoiceAnswer(next) })}
        />
      );
    case "height":
      return (
        <NumberField
          id="height"
          label="身長（任意）"
          unit="cm"
          inputMode="decimal"
          pattern={HEIGHT_PATTERN}
          placeholder="例：120"
          errorText="数字で入れてください（例：120.5）。"
          answer={answers.height}
          onChange={(next) => onChange({ height: next })}
          onInvalidChange={onInvalidChange}
        />
      );
    case "weight":
      return (
        <NumberField
          id="weight"
          label="体重（任意）"
          unit="kg"
          inputMode="decimal"
          pattern={WEIGHT_PATTERN}
          placeholder="例：25"
          errorText="数字で入れてください（例：25.5）。"
          answer={answers.weight}
          onChange={(next) => onChange({ weight: next })}
          onInvalidChange={onInvalidChange}
        />
      );
  }
}
