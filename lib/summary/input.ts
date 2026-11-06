// 回答から「Gemini に送るデータ」を作る。ブラウザ側で使う。
// 未回答・回答困難・「わからない」の項目と、薬・持病・アレルギー・年齢・体重は入れない。
import {
  discomfortText,
  FEELING_NOT_SENT,
  type Feeling,
} from "@/lib/intake/options";
import type {
  Answer,
  FamilyAnswer,
  FamilyAnswers,
  PatientAnswers,
  Respondent,
} from "@/lib/intake/types";
import { countChars, SUMMARY_TEXT_LIMIT, type SummaryInput } from "./types";

const DONT_KNOW = "わからない";

function answeredValue<T>(
  answer: Answer<T, "patient"> | FamilyAnswer<T>,
): T | undefined {
  return answer.status === "answered" ? answer.value : undefined;
}

function withoutDontKnow<T extends string>(value: T | undefined): T | undefined {
  return value === DONT_KNOW ? undefined : value;
}

// 「そのほか・わからない」だけを取り除く。ほかに選んだものは送る
function sendableFeelings(values: Feeling[] | undefined): Feeling[] | undefined {
  const sendable = values?.filter((value) => value !== FEELING_NOT_SENT);
  return sendable && sendable.length > 0 ? sendable : undefined;
}

// undefined の項目を取り除く
function compact<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

export function buildSummaryInput(
  patient: PatientAnswers,
  family: FamilyAnswers,
): SummaryInput {
  const temperature = answeredValue(family.temperature);
  const discomfort = answeredValue(patient.discomfort);

  return {
    patient: compact({
      bodyParts: answeredValue(patient.bodyParts),
      feelings: sendableFeelings(answeredValue(patient.feelings)),
      discomfort:
        discomfort === undefined ? undefined : discomfortText(discomfort),
    }),
    family: compact({
      chiefConcern: answeredValue(family.chiefConcern),
      onset: withoutDontKnow(answeredValue(family.onset)),
      temperature:
        temperature === undefined
          ? undefined
          : temperature.kind === "measured"
            ? `${temperature.celsius} ℃`
            : "測っていない",
      foodIntake: answeredValue(family.foodIntake),
    }),
  };
}

export function isEmptySummaryInput(input: SummaryInput): boolean {
  return (
    Object.keys(input.patient).length === 0 &&
    Object.keys(input.family).length === 0
  );
}

export type OverLimitField = { respondent: Respondent; label: string };

// 文字数の上限を超えている欄を集める。1つでもあれば Gemini には送らない
export function findOverLimitFields(input: SummaryInput): OverLimitField[] {
  const { chiefConcern } = input.family;
  return chiefConcern !== undefined &&
    countChars(chiefConcern) > SUMMARY_TEXT_LIMIT
    ? [{ respondent: "family", label: "一番心配なこと" }]
    : [];
}
