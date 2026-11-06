// 「どこが へん？」の選択肢。記録する値はこの言葉で、Gemini と医師の画面にもこのまま出す。
// こどもの画面だけ、ひらがなの言葉を出す（PatientScreen の BODY_PART_LABELS）
export const BODY_PARTS = [
  "頭",
  "耳",
  "のど",
  "胸",
  "お腹",
  "手・足",
  "その他",
] as const;

// 「どんな かんじ？」の選択肢。選んだ言葉のまま記録する
export const FEELINGS = [
  "いたい",
  "きもちわるい",
  "だるい",
  "いきが くるしい",
  "せきが でる",
  "ねつっぽい",
  "そのほか・わからない",
] as const;

// Gemini に送らない選択肢（「そのほか」と「わからない」が混ざっていて、症状として読めないため）
export const FEELING_NOT_SENT = "そのほか・わからない";

// 「どれくらい つらい？」の5段階。選んだ段階（1〜5）を記録する。数字に換算しない
export const DISCOMFORT_LABELS = [
  "へいき",
  "すこし つらい",
  "つらい",
  "とても つらい",
  "すごく つらい",
] as const;

export type DiscomfortLevel = 1 | 2 | 3 | 4 | 5;

export const DISCOMFORT_LEVELS: readonly DiscomfortLevel[] = [1, 2, 3, 4, 5];

// 医師の画面と Gemini に出す形。例：「とても つらい（5段階の4）」
export function discomfortText(level: DiscomfortLevel): string {
  return `${DISCOMFORT_LABELS[level - 1]}（5段階の${level}）`;
}

export const DISCOMFORT_TEXTS: readonly string[] =
  DISCOMFORT_LEVELS.map(discomfortText);

export const ONSET_OPTIONS = [
  "今日",
  "昨日",
  "2〜3日前",
  "1週間くらい前",
  "それより前",
  "わからない",
] as const;

export const FOOD_INTAKE_OPTIONS = [
  "いつもどおり",
  "少ない",
  "ほとんどない",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];
export type Feeling = (typeof FEELINGS)[number];
export type Onset = (typeof ONSET_OPTIONS)[number];
export type FoodIntake = (typeof FOOD_INTAKE_OPTIONS)[number];
