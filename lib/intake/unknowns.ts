// 「不明」の判定と、医師に見せる画面の行づくり。すべてルールで行い、AIは使わない。
// 回答の内容を解釈したり、ある回答から別の回答を推測したりしない。
import { discomfortText } from "./options";
import type {
  Answer,
  FamilyAnswer,
  FamilyAnswers,
  PatientAnswers,
  Presence,
  Respondent,
  Temperature,
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
const joinList = (values: readonly string[]) => values.join("、");

const isDontKnowPresence = (value: Presence) => value.kind === "dont_know";

const NO_DETAIL = "内容の記入なし";

const formatPresence = (value: Presence) => {
  if (value.kind === "no") return "ない（と回答）";
  if (value.kind === "dont_know") return "";
  return value.text.trim() === "" ? `あり（${NO_DETAIL}）` : value.text;
};

const formatTemperature = (value: Temperature) =>
  value.kind === "measured" ? `${value.celsius} ℃` : "測っていない";

export function buildPatientRows(patient: PatientAnswers): AnswerRow[] {
  return [
    {
      key: "feelings",
      respondent: "patient",
      label: "どんなかんじ（本人が選んだもの）",
      required: false,
      ...describe(patient.feelings, neverDontKnow, joinList),
    },
    {
      key: "bodyParts",
      respondent: "patient",
      label: "へんなところ（本人が選んだもの）",
      required: true,
      ...describe(patient.bodyParts, neverDontKnow, joinList),
    },
    {
      key: "discomfort",
      respondent: "patient",
      label: "つらさ（本人が選んだもの）",
      required: true,
      ...describe(patient.discomfort, neverDontKnow, discomfortText),
    },
  ];
}

export function buildFamilyRows(family: FamilyAnswers): AnswerRow[] {
  return [
    {
      key: "age",
      respondent: "family",
      label: "年齢",
      required: false,
      ...describe(family.age, neverDontKnow, (value) => `${value} 歳`),
    },
    {
      key: "sex",
      respondent: "family",
      label: "性別",
      required: false,
      ...describe(family.sex, neverDontKnow, asWritten),
    },
    {
      key: "height",
      respondent: "family",
      label: "身長",
      required: false,
      ...describe(family.height, neverDontKnow, (value) => `${value} cm`),
    },
    {
      key: "weight",
      respondent: "family",
      label: "体重",
      required: false,
      ...describe(family.weight, neverDontKnow, (value) => `${value} kg`),
    },
    {
      key: "chiefConcern",
      respondent: "family",
      label: "一番心配なこと",
      required: false,
      ...describe(family.chiefConcern, neverDontKnow, asWritten),
    },
    {
      key: "onset",
      respondent: "family",
      label: "いつから",
      required: true,
      ...describe(family.onset, isDontKnowChoice, asWritten),
    },
    {
      key: "temperature",
      respondent: "family",
      label: "熱",
      required: false,
      ...describe(family.temperature, neverDontKnow, formatTemperature),
    },
    {
      key: "foodIntake",
      respondent: "family",
      label: "食べる・飲む",
      required: false,
      ...describe(family.foodIntake, neverDontKnow, asWritten),
    },
    {
      key: "medications",
      respondent: "family",
      label: "飲んでいる薬",
      required: true,
      ...describe(family.medications, isDontKnowPresence, formatPresence),
    },
    {
      key: "allergies",
      respondent: "family",
      label: "アレルギー",
      required: true,
      ...describe(family.allergies, isDontKnowPresence, formatPresence),
    },
    {
      key: "conditions",
      respondent: "family",
      label: "持病",
      required: false,
      ...describe(family.conditions, isDontKnowPresence, formatPresence),
    },
  ];
}

// 必須項目のうち、未回答・回答困難・わからない（と回答）のものを集める
export function getUnknownRows(
  patient: PatientAnswers,
  family: FamilyAnswers,
): AnswerRow[] {
  return [...buildPatientRows(patient), ...buildFamilyRows(family)].filter(
    (row) => row.required && row.state !== "answered",
  );
}

export type SafetyNotice = { kind: "present" | "unconfirmed"; text: string };

// 医師の画面の閉じた状態に出す、薬・アレルギーの1行。
// 「ある」は目立つ行、「わからない」「未回答」は小さめの「未確認」、「ない」は何も出さない
export function safetyNotice(
  label: string,
  answer: FamilyAnswer<Presence>,
): SafetyNotice | null {
  if (answer.status === "unanswered" || answer.value.kind === "dont_know") {
    return { kind: "unconfirmed", text: `${label}：未確認` };
  }
  if (answer.value.kind === "no") return null;
  const detail = answer.value.text.trim();
  return {
    kind: "present",
    text: `⚠ ${label}あり：${detail === "" ? `（${NO_DETAIL}）` : answer.value.text}`,
  };
}

export function missingStateLabel(
  state: MissingState,
  asUnknown: boolean,
): string {
  if (state === "unanswered") return asUnknown ? "不明（未回答）" : "未回答";
  if (state === "unable") return asUnknown ? "不明（回答困難）" : "回答困難";
  return asUnknown ? "不明（わからないと回答）" : "わからない（と回答）";
}
