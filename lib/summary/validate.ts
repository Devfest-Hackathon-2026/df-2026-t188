// 受け取ったデータと Gemini の出力の形を確かめる。形が違えば null を返す。
import {
  BODY_PARTS,
  COURSE_OPTIONS,
  FOOD_INTAKE_OPTIONS,
  ONSET_OPTIONS,
  SENSATIONS,
} from "@/lib/intake/options";
import {
  countChars,
  SUMMARY_TEXT_LIMIT,
  type Discrepancy,
  type Summary,
  type SummaryInput,
} from "./types";

const DONT_KNOW = "わからない";
const TEMPERATURE_PATTERN = /^[0-9０-９]{1,5}([.．][0-9０-９])? ℃$/;
const NOT_MEASURED = "測っていない";
const MAX_SUMMARY_CHARS = 4000;
const MAX_DISCREPANCIES = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  record: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(record).every((key) => keys.includes(key));
}

function isLimitedText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    countChars(value) <= SUMMARY_TEXT_LIMIT
  );
}

function isChoice<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return (
    typeof value === "string" &&
    value !== DONT_KNOW &&
    (options as readonly string[]).includes(value)
  );
}

function isChoiceList<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every((item) => isChoice(item, options))
  );
}

function isPainLevel(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 10
  );
}

function isTemperature(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === NOT_MEASURED || TEMPERATURE_PATTERN.test(value))
  );
}

const PATIENT_CHECKS: Record<string, (value: unknown) => boolean> = {
  chiefComplaint: isLimitedText,
  painLocations: (value) => isChoiceList(value, BODY_PARTS),
  painLevel: isPainLevel,
  sensations: (value) => isChoiceList(value, SENSATIONS),
};

const FAMILY_CHECKS: Record<string, (value: unknown) => boolean> = {
  chiefConcern: isLimitedText,
  onset: (value) => isChoice(value, ONSET_OPTIONS),
  onsetDetail: isLimitedText,
  course: (value) => isChoice(value, COURSE_OPTIONS),
  temperature: isTemperature,
  foodIntake: (value) => isChoice(value, FOOD_INTAKE_OPTIONS),
  differences: isLimitedText,
  consultation: isLimitedText,
};

function passesChecks(
  value: unknown,
  checks: Record<string, (value: unknown) => boolean>,
): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, Object.keys(checks)) &&
    Object.entries(value).every(([key, item]) => checks[key](item))
  );
}

// ブラウザから受け取ったデータを確かめる。決まった項目・選択肢・文字数だけを通す
export function parseSummaryInput(value: unknown): SummaryInput | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["patient", "family"])) {
    return null;
  }
  if (
    !passesChecks(value.patient, PATIENT_CHECKS) ||
    !passesChecks(value.family, FAMILY_CHECKS)
  ) {
    return null;
  }
  return {
    patient: value.patient,
    family: value.family,
  } as SummaryInput;
}

function isSummaryText(value: unknown): value is string {
  return typeof value === "string" && countChars(value) <= MAX_SUMMARY_CHARS;
}

function isDiscrepancy(value: unknown): value is Discrepancy {
  return (
    isRecord(value) &&
    isSummaryText(value.topic) &&
    isSummaryText(value.patient) &&
    isSummaryText(value.family)
  );
}

// Gemini の出力（またはサーバーの応答）が決まった形かを確かめる
export function parseSummary(value: unknown): Summary | null {
  if (
    !isRecord(value) ||
    !isSummaryText(value.patientSummary) ||
    !isSummaryText(value.familySummary) ||
    !Array.isArray(value.discrepancies) ||
    value.discrepancies.length > MAX_DISCREPANCIES ||
    !value.discrepancies.every(isDiscrepancy)
  ) {
    return null;
  }
  return {
    patientSummary: value.patientSummary,
    familySummary: value.familySummary,
    discrepancies: value.discrepancies.map(({ topic, patient, family }) => ({
      topic,
      patient,
      family,
    })),
  };
}
