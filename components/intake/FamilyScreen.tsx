import { useState } from "react";
import { CharCount } from "@/components/intake/CharCount";
import { FieldCard } from "@/components/intake/FieldCard";
import { SingleSelect } from "@/components/intake/SingleSelect";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FOOD_INTAKE_OPTIONS, ONSET_OPTIONS } from "@/lib/intake/options";
import type {
  FamilyAnswer,
  FamilyAnswers,
  Presence,
} from "@/lib/intake/types";

// 保護者の画面は3つに分ける
export type FamilyPage = "concern" | "condition" | "history";

// 整数か小数1桁。値の大きさでは正しいかどうかを判断しない
const TEMPERATURE_PATTERN = /^[0-9０-９]+([.．][0-9０-９])?$/;
// 年齢は整数、体重は整数か小数1桁。値の大きさでは判断しない
const AGE_PATTERN = /^[0-9０-９]+$/;
const WEIGHT_PATTERN = TEMPERATURE_PATTERN;

const TEXT_INPUT_CLASS =
  "w-full rounded-field border border-outline bg-surface-container-lowest p-4 text-body text-on-surface placeholder:text-on-surface-variant focus:outline-2 focus:-outline-offset-1 focus:outline-primary";

const FIELD_LABEL_CLASS = "mb-4 block text-title";

type FamilyScreenProps = {
  page: FamilyPage;
  answers: FamilyAnswers;
  onChange: (update: Partial<FamilyAnswers>) => void;
  onNext: () => void;
  nextLabel: string;
};

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
};

// 最初に「ある／ない／わからない」を選び、「ある」のときだけ入力欄を出す。
// ほかに変えると、書いた内容は消える（回答を選び直すと、値ごと入れ替わる）
function PresenceField({ id, label, answer, onChange }: PresenceFieldProps) {
  const value = answer.status === "answered" ? answer.value : null;

  return (
    <div>
      <SingleSelect
        legend={label}
        options={PRESENCE_OPTIONS}
        selected={value ? PRESENCE_OPTION[value.kind] : null}
        onChange={(next) =>
          onChange(toChoiceAnswer(next ? OPTION_TO_PRESENCE[next] : null))
        }
      />
      {value?.kind === "yes" && (
        <div className="mt-4">
          <label htmlFor={id} className="mb-2 block text-body">
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
            className={TEXT_INPUT_CLASS}
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
            setText(next);
            onChange(toChoiceAnswer(pattern.test(next.trim()) ? next.trim() : null));
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
}: {
  answer: FamilyAnswers["temperature"];
  onChange: (next: FamilyAnswers["temperature"]) => void;
}) {
  const temperature = choiceOf(answer);
  const [text, setText] = useState(
    temperature?.kind === "measured" ? temperature.celsius : "",
  );
  const isNotMeasured = temperature?.kind === "not_measured";
  const isInvalid = text.trim() !== "" && !TEMPERATURE_PATTERN.test(text.trim());

  return (
    <>
      <label htmlFor="temperature" className={FIELD_LABEL_CLASS}>
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
            setText(next);
            onChange(
              toChoiceAnswer(
                TEMPERATURE_PATTERN.test(trimmed)
                  ? { kind: "measured", celsius: trimmed }
                  : null,
              ),
            );
          }}
          className={`${TEXT_INPUT_CLASS} max-w-40 ${
            isInvalid ? "border-caution" : ""
          }`}
        />
        <span className="text-title">℃</span>
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
        }}
        className="mt-3 w-full"
      />
    </>
  );
}

export function FamilyScreen({
  page,
  answers,
  onChange,
  onNext,
  nextLabel,
}: FamilyScreenProps) {
  const chiefConcernText = choiceOf(answers.chiefConcern) ?? "";

  return (
    <>
      <div className="stagger flex flex-1 flex-col gap-4 px-4 py-4">
        {page === "concern" && (
          <>
            <FieldCard field="chiefConcern">
              <label htmlFor="chief-concern" className={FIELD_LABEL_CLASS}>
                一番心配なこと（任意）
              </label>
              <textarea
                id="chief-concern"
                rows={3}
                autoComplete="off"
                value={chiefConcernText}
                onChange={(event) =>
                  onChange({
                    chiefConcern: toChoiceAnswer(
                      event.target.value.trim() === ""
                        ? null
                        : event.target.value,
                    ),
                  })
                }
                className={TEXT_INPUT_CLASS}
              />
              <CharCount text={chiefConcernText} />
            </FieldCard>
            <FieldCard field="onset">
              <SingleSelect
                legend="いつからですか？"
                options={ONSET_OPTIONS}
                selected={choiceOf(answers.onset)}
                onChange={(next) => onChange({ onset: toChoiceAnswer(next) })}
              />
            </FieldCard>
          </>
        )}

        {page === "condition" && (
          <>
            <FieldCard field="temperature">
              <TemperatureField
                answer={answers.temperature}
                onChange={(next) => onChange({ temperature: next })}
              />
            </FieldCard>
            <FieldCard field="foodIntake">
              <SingleSelect
                legend="食べる・飲む"
                options={FOOD_INTAKE_OPTIONS}
                selected={choiceOf(answers.foodIntake)}
                onChange={(next) =>
                  onChange({ foodIntake: toChoiceAnswer(next) })
                }
              />
            </FieldCard>
          </>
        )}

        {page === "history" && (
          <>
            <FieldCard field="medications">
              <PresenceField
                id="medications"
                label="飲んでいる薬"
                answer={answers.medications}
                onChange={(next) => onChange({ medications: next })}
              />
            </FieldCard>
            <FieldCard field="allergies">
              <PresenceField
                id="allergies"
                label="アレルギー"
                answer={answers.allergies}
                onChange={(next) => onChange({ allergies: next })}
              />
            </FieldCard>
            <FieldCard field="conditions">
              <PresenceField
                id="conditions"
                label="持病"
                answer={answers.conditions}
                onChange={(next) => onChange({ conditions: next })}
              />
            </FieldCard>
            <div className="grid grid-cols-2 gap-3">
              <FieldCard field="age">
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
                />
              </FieldCard>
              <FieldCard field="weight">
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
                />
              </FieldCard>
            </div>
          </>
        )}
      </div>
      <BottomBar>
        <Button onClick={onNext}>{nextLabel}</Button>
      </BottomBar>
    </>
  );
}
