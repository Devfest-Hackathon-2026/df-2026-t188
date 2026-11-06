// 回答から「Gemini に送るデータ」を作る。ブラウザ側で使う。
// 未回答・回答困難・「わからない」の項目と、薬・持病・アレルギー・年齢・体重は入れない。
import { FEELING_NOT_SENT, type Feeling } from "@/lib/intake/options";
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

function withoutDontKnowList<T extends string>(
  values: T[] | undefined,
): T[] | undefined {
  if (!values || values.some((value) => value === DONT_KNOW)) return undefined;
  return values;
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

  return {
    patient: compact({
      feelings: sendableFeelings(answeredValue(patient.feelings)),
      chiefComplaint: answeredValue(patient.chiefComplaint),
      painLocations: withoutDontKnowList(answeredValue(patient.painLocations)),
      painLevel: answeredValue(patient.painLevel),
      sensations: withoutDontKnowList(answeredValue(patient.sensations)),
      sensationOther: answeredValue(patient.sensationOther),
    }),
    family: compact({
      chiefConcern: answeredValue(family.chiefConcern),
      onset: withoutDontKnow(answeredValue(family.onset)),
      onsetDetail: answeredValue(family.onsetDetail),
      course: withoutDontKnow(answeredValue(family.course)),
      temperature:
        temperature === undefined
          ? undefined
          : temperature.kind === "measured"
            ? `${temperature.celsius} ℃`
            : "測っていない",
      foodIntake: withoutDontKnow(answeredValue(family.foodIntake)),
      differences: answeredValue(family.differences),
      consultation: answeredValue(family.consultation),
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
  const fields: (OverLimitField & { text: string | undefined })[] = [
    {
      respondent: "patient",
      label: "今いちばん困っていること",
      text: input.patient.chiefComplaint,
    },
    {
      respondent: "patient",
      label: "感覚（その他）",
      text: input.patient.sensationOther,
    },
    {
      respondent: "family",
      label: "保護者から見て、今いちばん心配な症状",
      text: input.family.chiefConcern,
    },
    {
      respondent: "family",
      label: "いつから（くわしい時刻など）",
      text: input.family.onsetDetail,
    },
    {
      respondent: "family",
      label: "普段とちがうところ",
      text: input.family.differences,
    },
    {
      respondent: "family",
      label: "今日相談したいこと",
      text: input.family.consultation,
    },
  ];

  return fields
    .filter(
      ({ text }) =>
        text !== undefined && countChars(text) > SUMMARY_TEXT_LIMIT,
    )
    .map(({ respondent, label }) => ({ respondent, label }));
}
