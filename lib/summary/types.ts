import type {
  BodyPart,
  Course,
  Feeling,
  FoodIntake,
  Onset,
  Sensation,
} from "@/lib/intake/options";
import type { PainLevel } from "@/lib/intake/types";

// Gemini に送る文字入力の欄それぞれの上限（文字数）
export const SUMMARY_TEXT_LIMIT = 500;

export function countChars(text: string): number {
  return [...text].length;
}

// Gemini に送るデータ。回答ありの項目だけを入れる。
// 飲んでいる薬・持病・アレルギー・年齢・体重は入れない（型にも持たせない）
export type SummaryInput = {
  patient: {
    feelings?: Feeling[]; // 「そのほか・わからない」は入れない
    chiefComplaint?: string;
    painLocations?: BodyPart[];
    painLevel?: PainLevel;
    sensations?: Sensation[];
    sensationOther?: string; // 感覚のその他（本人が自分の言葉で書いた文章）
  };
  family: {
    chiefConcern?: string;
    onset?: Onset;
    onsetDetail?: string;
    course?: Course;
    temperature?: string; // 例："38.5 ℃"、"測っていない"
    foodIntake?: FoodIntake;
    differences?: string;
    consultation?: string;
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
