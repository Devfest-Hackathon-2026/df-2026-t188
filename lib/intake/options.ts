export const BODY_PARTS = [
  "頭",
  "顔・口",
  "のど",
  "胸",
  "お腹",
  "背中・腰",
  "手・腕",
  "足",
  "その他",
  "痛いところはない",
  "わからない",
] as const;

export const SENSATIONS = [
  "ズキズキ",
  "チクチク",
  "しめつけられる",
  "気持ち悪い",
  "めまい",
  "だるい",
  "わからない",
] as const;

export const ONSET_OPTIONS = [
  "今日",
  "昨日",
  "2〜3日前",
  "1週間くらい前",
  "それより前",
  "わからない",
] as const;

export const COURSE_OPTIONS = [
  "良くなっている",
  "変わらない",
  "悪くなっている",
  "波がある",
  "わからない",
] as const;

export const FOOD_INTAKE_OPTIONS = [
  "いつもどおり",
  "少ない",
  "ほとんど取れていない",
  "わからない",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];
export type Sensation = (typeof SENSATIONS)[number];
export type Onset = (typeof ONSET_OPTIONS)[number];
export type Course = (typeof COURSE_OPTIONS)[number];
export type FoodIntake = (typeof FOOD_INTAKE_OPTIONS)[number];

// ほかの選択肢と同時に選べない選択肢
export const EXCLUSIVE_BODY_PARTS: readonly BodyPart[] = [
  "痛いところはない",
  "わからない",
];
export const EXCLUSIVE_SENSATIONS: readonly Sensation[] = ["わからない"];
