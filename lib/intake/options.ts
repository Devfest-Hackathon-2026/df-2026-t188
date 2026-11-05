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

export type BodyPart = (typeof BODY_PARTS)[number];
export type Sensation = (typeof SENSATIONS)[number];

// ほかの選択肢と同時に選べない選択肢
export const EXCLUSIVE_BODY_PARTS: readonly BodyPart[] = [
  "痛いところはない",
  "わからない",
];
export const EXCLUSIVE_SENSATIONS: readonly Sensation[] = ["わからない"];
