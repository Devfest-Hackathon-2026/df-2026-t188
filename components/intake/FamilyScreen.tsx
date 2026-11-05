import { useState } from "react";
import { CharCount } from "@/components/intake/CharCount";
import { SingleSelect } from "@/components/intake/SingleSelect";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TopBar } from "@/components/ui/TopBar";
import {
  COURSE_OPTIONS,
  FOOD_INTAKE_OPTIONS,
  ONSET_OPTIONS,
} from "@/lib/intake/options";
import type {
  FamilyAnswer,
  FamilyAnswers,
  TextOrNone,
} from "@/lib/intake/types";

// 整数か小数1桁。値の大きさでは正しいかどうかを判断しない
const TEMPERATURE_PATTERN = /^[0-9０-９]+([.．][0-9０-９])?$/;

const TEXT_INPUT_CLASS =
  "w-full rounded-xs border border-outline bg-surface-container-lowest p-4 text-body text-on-surface focus:outline-2 focus:-outline-offset-1 focus:outline-secondary";

const FIELD_LABEL_CLASS = "mb-4 block text-title";

type FamilyScreenProps = {
  answers: FamilyAnswers;
  onChange: (update: Partial<FamilyAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
};

// 空や空白だけなら未回答に戻す。書かれた文字はそのまま持つ
function toTextAnswer(text: string): FamilyAnswer<string> {
  return text.trim() === ""
    ? { respondent: "family", status: "unanswered" }
    : { respondent: "family", status: "answered", value: text };
}

function toChoiceAnswer<T>(value: T | null): FamilyAnswer<T> {
  return value === null
    ? { respondent: "family", status: "unanswered" }
    : { respondent: "family", status: "answered", value };
}

function textOf(answer: FamilyAnswer<string>): string {
  return answer.status === "answered" ? answer.value : "";
}

function choiceOf<T>(answer: FamilyAnswer<T>): T | null {
  return answer.status === "answered" ? answer.value : null;
}

type TextFieldProps = {
  id: string;
  label: string;
  answer: FamilyAnswer<string>;
  onChange: (next: FamilyAnswer<string>) => void;
  showCharCount?: boolean; // AI の要約に送る欄だけ、文字数を表示する
};

function TextField({
  id,
  label,
  answer,
  onChange,
  showCharCount = false,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        autoComplete="off"
        value={textOf(answer)}
        onChange={(event) => onChange(toTextAnswer(event.target.value))}
        className={TEXT_INPUT_CLASS}
      />
      {showCharCount && <CharCount text={textOf(answer)} />}
    </div>
  );
}

type TextOrNoneFieldProps = {
  id: string;
  label: string;
  answer: FamilyAnswer<TextOrNone>;
  onChange: (next: FamilyAnswer<TextOrNone>) => void;
};

// 文字で書くか、「ない」「わからない」を選ぶ項目
function TextOrNoneField({ id, label, answer, onChange }: TextOrNoneFieldProps) {
  const value = answer.status === "answered" ? answer.value : null;
  const text = value?.kind === "text" ? value.text : "";

  const toggle = (kind: "none" | "dont_know") => {
    onChange(
      value?.kind === kind
        ? { respondent: "family", status: "unanswered" }
        : { respondent: "family", status: "answered", value: { kind } },
    );
  };

  return (
    <div>
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        autoComplete="off"
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          onChange(
            next.trim() === ""
              ? { respondent: "family", status: "unanswered" }
              : {
                  respondent: "family",
                  status: "answered",
                  value: { kind: "text", text: next },
                },
          );
        }}
        className={TEXT_INPUT_CLASS}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Chip
          label="ない"
          tone="secondary"
          selected={value?.kind === "none"}
          onClick={() => toggle("none")}
        />
        <Chip
          label="わからない"
          tone="secondary"
          selected={value?.kind === "dont_know"}
          onClick={() => toggle("dont_know")}
        />
      </div>
    </div>
  );
}

export function FamilyScreen({
  answers,
  onChange,
  onNext,
  onBack,
}: FamilyScreenProps) {
  const temperature =
    answers.temperature.status === "answered"
      ? answers.temperature.value
      : null;
  const [temperatureText, setTemperatureText] = useState(
    temperature?.kind === "measured" ? temperature.celsius : "",
  );
  const isNotMeasured = temperature?.kind === "not_measured";
  const isTemperatureInvalid =
    temperatureText.trim() !== "" &&
    !TEMPERATURE_PATTERN.test(temperatureText.trim());

  return (
    <>
      <TopBar tone="secondary">家族・介護者が答えています</TopBar>
      <div className="flex flex-col gap-10 px-4 py-6">
        <TextField
          id="chief-concern"
          label="家族から見て、今いちばん心配な症状"
          answer={answers.chiefConcern}
          onChange={(next) => onChange({ chiefConcern: next })}
          showCharCount
        />

        <div className="flex flex-col gap-4">
          <SingleSelect
            legend="いつからですか？"
            options={ONSET_OPTIONS}
            selected={choiceOf(answers.onset)}
            onChange={(next) => onChange({ onset: toChoiceAnswer(next) })}
          />
          <div>
            <label htmlFor="onset-detail" className="mb-2 block text-body">
              くわしい時刻など（書かなくても大丈夫です）
            </label>
            <input
              id="onset-detail"
              type="text"
              autoComplete="off"
              value={textOf(answers.onsetDetail)}
              onChange={(event) =>
                onChange({ onsetDetail: toTextAnswer(event.target.value) })
              }
              className={TEXT_INPUT_CLASS}
            />
            <CharCount text={textOf(answers.onsetDetail)} />
          </div>
        </div>

        <SingleSelect
          legend="ようすはどう変わってきましたか？"
          options={COURSE_OPTIONS}
          selected={choiceOf(answers.course)}
          onChange={(next) => onChange({ course: toChoiceAnswer(next) })}
        />

        <div>
          <label htmlFor="temperature" className={FIELD_LABEL_CLASS}>
            体温（測っていれば）
          </label>
          <div className="flex items-center gap-2">
            <input
              id="temperature"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              aria-describedby="temperature-hint"
              aria-invalid={isTemperatureInvalid}
              value={temperatureText}
              onChange={(event) => {
                const text = event.target.value;
                const trimmed = text.trim();
                setTemperatureText(text);
                onChange({
                  temperature: TEMPERATURE_PATTERN.test(trimmed)
                    ? {
                        respondent: "family",
                        status: "answered",
                        value: { kind: "measured", celsius: trimmed },
                      }
                    : { respondent: "family", status: "unanswered" },
                });
              }}
              className={`${TEXT_INPUT_CLASS} max-w-40 ${
                isTemperatureInvalid ? "border-caution" : ""
              }`}
            />
            <span className="text-title">℃</span>
          </div>
          <p
            id="temperature-hint"
            className={`mt-2 text-support ${
              isTemperatureInvalid
                ? "font-bold text-caution"
                : "text-on-surface-variant"
            }`}
          >
            {isTemperatureInvalid
              ? "数字で入れてください（例：37.5 または 38）。このままでは記録されません。"
              : "例：37.5 または 38"}
          </p>
          <Chip
            label="測っていない"
            tone="secondary"
            selected={isNotMeasured}
            onClick={() => {
              setTemperatureText("");
              onChange({
                temperature: isNotMeasured
                  ? { respondent: "family", status: "unanswered" }
                  : {
                      respondent: "family",
                      status: "answered",
                      value: { kind: "not_measured" },
                    },
              });
            }}
            className="mt-2 w-full"
          />
        </div>

        <SingleSelect
          legend="食事や水分はとれていますか？"
          options={FOOD_INTAKE_OPTIONS}
          selected={choiceOf(answers.foodIntake)}
          onChange={(next) => onChange({ foodIntake: toChoiceAnswer(next) })}
        />

        <TextField
          id="differences"
          label="普段とちがうところ（表情、行動、歩き方など）"
          answer={answers.differences}
          onChange={(next) => onChange({ differences: next })}
          showCharCount
        />

        <TextField
          id="conditions"
          label="持病・これまでの病気"
          answer={answers.conditions}
          onChange={(next) => onChange({ conditions: next })}
        />

        <TextOrNoneField
          id="medications"
          label="飲んでいる薬"
          answer={answers.medications}
          onChange={(next) => onChange({ medications: next })}
        />

        <TextOrNoneField
          id="allergies"
          label="アレルギー"
          answer={answers.allergies}
          onChange={(next) => onChange({ allergies: next })}
        />

        <TextField
          id="consultation"
          label="今日相談したいこと"
          answer={answers.consultation}
          onChange={(next) => onChange({ consultation: next })}
          showCharCount
        />

        <div className="flex flex-col gap-4">
          <Button tone="secondary" onClick={onNext}>
            次へ（医師に見せる画面）
          </Button>
          <Button variant="outlined" tone="secondary" onClick={onBack}>
            前の画面にもどる
          </Button>
        </div>
      </div>
    </>
  );
}
