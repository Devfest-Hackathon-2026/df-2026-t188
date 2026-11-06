import type {
  BodyPart,
  Feeling,
  FoodIntake,
  Onset,
} from "@/lib/intake/options";

// Gemini に送る文字入力の欄の上限（文字数）
export const SUMMARY_TEXT_LIMIT = 500;

export function countChars(text: string): number {
  return [...text].length;
}

// Gemini に送るデータ。回答ありの項目だけを入れる。
// 飲んでいる薬・持病・アレルギー・年齢・体重は入れない（型にも持たせない）
export type SummaryInput = {
  patient: {
    bodyParts?: BodyPart[];
    feelings?: Feeling[]; // 「そのほか・わからない」は入れない
    discomfort?: string; // 例：「とても つらい（5段階の4）」。数字に換算しない
  };
  family: {
    chiefConcern?: string;
    onset?: Onset;
    temperature?: string; // 例："38.5 ℃"、"測っていない"
    foodIntake?: FoodIntake;
  };
};

export type Discrepancy = {
  topic: string;
  patient: string;
  family: string;
};

export type Summary = {
  patientSummary: string;
  familySummary: string;
  discrepancies: Discrepancy[];
};

export type SummaryApiResponse = { ok: true; summary: Summary } | { ok: false };
