// 「不明」の判定と、医師に見せる画面の行づくり。すべてルールで行い、AIは使わない。
// 回答の内容を解釈したり、ある回答から別の回答を推測したりしない。
import type {
  Answer,
  FamilyAnswer,
  FamilyAnswers,
  PatientAnswers,
  Respondent,
  Temperature,
  TextOrNone,
} from "./types";

export type AnswerState = "answered" | "dont_know" | "unanswered" | "unable";
export type MissingState = Exclude<AnswerState, "answered">;

export type AnswerRow = {
  key: string;
  respondent: Respondent;
  label: string;
  required: boolean;
  state: AnswerState;
  text: string; // 回答ありのときに、入力どおりに表示する文字
};

const DONT_KNOW = "わからない";

type AnyAnswer<T> = Answer<T, "patient"> | FamilyAnswer<T>;

function describe<T>(
  answer: AnyAnswer<T>,
  isDontKnow: (value: T) => boolean,
  format: (value: T) => string,
): Pick<AnswerRow, "state" | "text"> {
  if (answer.status === "unanswered") return { state: "unanswered", text: "" };
  if (answer.status === "unable") return { state: "unable", text: "" };
  if (isDontKnow(answer.value)) return { state: "dont_know", text: "" };
  return { state: "answered", text: format(answer.value) };
}

const neverDontKnow = () => false;
const asWritten = (value: string) => value;
const isDontKnowChoice = (value: string) => value === DONT_KNOW;
const isDontKnowList = (values: readonly string[]) =>
  values.includes(DONT_KNOW);
const joinList = (values: readonly string[]) => values.join("、");

const isDontKnowTextOrNone = (value: TextOrNone) => value.kind === "dont_know";
const formatTextOrNone = (value: TextOrNone) => {
  if (value.kind === "text") return value.text;
  if (value.kind === "none") return "ない（と回答）";
  return "";
};

const formatTemperature = (value: Temperature) =>
  value.kind === "measured" ? `${value.celsius} ℃` : "測っていない";

export function patientChiefRow(patient: PatientAnswers): AnswerRow {
  return {
    key: "chiefComplaint",
    respondent: "patient",
    label: "本人の言葉（今いちばん困っていること）",
    required: false,
    ...describe(patient.chiefComplaint, neverDontKnow, asWritten),
  };
}

export function familyChiefRow(family: FamilyAnswers): AnswerRow {
  return {
    key: "chiefConcern",
    respondent: "family",
    label: "家族から見た症状（今いちばん心配な症状）",
    required: true,
    ...describe(family.chiefConcern, neverDontKnow, asWritten),
  };
}

export function buildPatientRows(patient: PatientAnswers): AnswerRow[] {
  return [
    {
      key: "painLocations",
      respondent: "patient",
      label: "痛い場所",
      required: true,
      ...describe(patient.painLocations, isDontKnowList, joinList),
    },
    {
      key: "painLevel",
      respondent: "patient",
      label: "痛みの程度",
      required: true,
      ...describe(
        patient.painLevel,
        neverDontKnow,
        (value) => `${value}（0〜10のうち）`,
      ),
    },
    {
      key: "sensations",
      respondent: "patient",
      label: "感覚",
      required: false,
      ...describe(patient.sensations, isDontKnowList, joinList),
    },
    {
      key: "sensationOther",
      respondent: "patient",
      label: "感覚（その他・本人の言葉）",
      required: false,
      ...describe(patient.sensationOther, neverDontKnow, asWritten),
    },
  ];
}

export function buildFamilyRows(family: FamilyAnswers): AnswerRow[] {
  return [
    {
      key: "onset",
      respondent: "family",
      label: "いつから",
      required: true,
      ...describe(family.onset, isDontKnowChoice, asWritten),
    },
    {
      key: "onsetDetail",
      respondent: "family",
      label: "いつから（くわしい時刻など）",
      required: false,
      ...describe(family.onsetDetail, neverDontKnow, asWritten),
    },
    {
      key: "course",
      respondent: "family",
      label: "経過",
      required: true,
      ...describe(family.course, isDontKnowChoice, asWritten),
    },
    {
      key: "temperature",
      respondent: "family",
      label: "体温",
      required: false,
      ...describe(family.temperature, neverDontKnow, formatTemperature),
    },
    {
      key: "foodIntake",
      respondent: "family",
      label: "食事・水分",
      required: false,
      ...describe(family.foodIntake, isDontKnowChoice, asWritten),
    },
    {
      key: "differences",
      respondent: "family",
      label: "普段との違い",
      required: false,
      ...describe(family.differences, neverDontKnow, asWritten),
    },
    {
      key: "conditions",
      respondent: "family",
      label: "持病・これまでの病気",
      required: false,
      ...describe(family.conditions, neverDontKnow, asWritten),
    },
    {
      key: "medications",
      respondent: "family",
      label: "飲んでいる薬",
      required: true,
      ...describe(family.medications, isDontKnowTextOrNone, formatTextOrNone),
    },
    {
      key: "allergies",
      respondent: "family",
      label: "アレルギー",
      required: true,
      ...describe(family.allergies, isDontKnowTextOrNone, formatTextOrNone),
    },
    {
      key: "consultation",
      respondent: "family",
      label: "今日相談したいこと",
      required: false,
      ...describe(family.consultation, neverDontKnow, asWritten),
    },
  ];
}

// 必須項目のうち、未回答・回答困難・わからない（と回答）のものを集める
export function getUnknownRows(
  patient: PatientAnswers,
  family: FamilyAnswers,
): AnswerRow[] {
  return [
    ...buildPatientRows(patient),
    familyChiefRow(family),
    ...buildFamilyRows(family),
  ].filter((row) => row.required && row.state !== "answered");
}

export function missingStateLabel(
  state: MissingState,
  asUnknown: boolean,
): string {
  if (state === "unanswered") return asUnknown ? "不明（未回答）" : "未回答";
  if (state === "unable") return asUnknown ? "不明（回答困難）" : "回答困難";
  return asUnknown ? "不明（わからないと回答）" : "わからない（と回答）";
}
