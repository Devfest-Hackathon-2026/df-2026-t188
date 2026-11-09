// 「保護者から見た気になる症状」の選択肢と、送るときの1つの文へのまとめ方。
// 選択肢の言葉は、こどもの主な症状・ほかに きになること の言葉と根元をそろえている
// （痛がっている＝いたい、気持ち悪そう＝きもちわるい、など。食い違いを比べやすくするため）。
//
// Gemini には、まとめた1つの文を、今までの自由記載の欄（chiefConcern）として送る。
// lib/summary と送る項目の形は変えない
import { countChars, SUMMARY_TEXT_LIMIT } from "@/lib/summary/types";
import type { FamilyAnswers } from "./types";

export const CONCERN_CHOICES = [
  "痛がっている",
  "気持ち悪そう",
  "息が苦しそう",
  "せきが出る",
  "かぜっぽい",
  "熱がある",
  "吐いた・吐き気がある",
  "下痢・便がゆるい",
  "発疹・肌が赤い",
] as const;

export type ConcernChoice = (typeof CONCERN_CHOICES)[number];

// まとめた文の書き方
const CHOICES_PREFIX = "気になる症状：";
const NOTE_PREFIX = "その他：";

// 選んだもの（表の順に並べる）と、その他の自由記載を、1つの文にまとめる。
// - 両方：「気になる症状：痛がっている、せきが出る。その他：〇〇」
// - 選択肢だけ：「気になる症状：痛がっている、せきが出る。」
// - 自由記載だけ：書いた文のまま（前と同じ形）
// - どちらもない：null
export function composeConcern(
  choices: readonly ConcernChoice[],
  note: string,
): string | null {
  const picked = CONCERN_CHOICES.filter((choice) => choices.includes(choice));
  const hasNote = note.trim() !== "";
  if (picked.length === 0) return hasNote ? note : null;
  const head = `${CHOICES_PREFIX}${picked.join("、")}。`;
  return hasNote ? `${head}${NOTE_PREFIX}${note}` : head;
}

// 保護者の答えから、まとめた文を作る
export function concernText(family: FamilyAnswers): string | null {
  const choices =
    family.concernChoices?.status === "answered" ? family.concernChoices.value : [];
  const note = family.chiefConcern.status === "answered" ? family.chiefConcern.value : "";
  return composeConcern(choices, note);
}

// Gemini に送る直前に使う。まとめた文を chiefConcern に入れた保護者の答え
export function withComposedConcern(family: FamilyAnswers): FamilyAnswers {
  const text = concernText(family);
  return {
    ...family,
    chiefConcern:
      text === null
        ? { respondent: "family", status: "unanswered" }
        : { respondent: "family", status: "answered", value: text },
  };
}

// 選択肢を全部選んだときの前置きの長さ。その他の自由記載に書ける文字数の目安を出すのに使う
export const LONGEST_CHOICES_TEXT_LENGTH = countChars(
  `${CHOICES_PREFIX}${CONCERN_CHOICES.join("、")}。${NOTE_PREFIX}`,
);

// まとめた文が、送れる上限（500文字）を超えていないか
export function isConcernOverLimit(family: FamilyAnswers): boolean {
  const text = concernText(family);
  return text !== null && countChars(text) > SUMMARY_TEXT_LIMIT;
}
