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

// 性別（保護者が任意で選ぶ。Gemini には送らない）
export const SEX_OPTIONS = ["男の子", "女の子"] as const;

export type Sex = (typeof SEX_OPTIONS)[number];
export type BodyPart = (typeof BODY_PARTS)[number];
export type Feeling = (typeof FEELINGS)[number];
export type Onset = (typeof ONSET_OPTIONS)[number];
export type FoodIntake = (typeof FOOD_INTAKE_OPTIONS)[number];

// ---------- こどもの画面に出す言葉と絵（ここを直せば、画面の言葉と絵だけが変わる） ----------
// 上の値（記録する値）は、/api/summary の入力チェック（lib/summary/validate.ts）が使うので変えない。
// 画面に出す言葉と絵は、この下の表だけで決める。絵は必ず言葉と一緒に出す。
// 医師の画面と Gemini には、絵文字を使わず、記録する値（言葉）だけを出す

// 体の図（components/ui/icons.tsx の BodyFigure）で色を付けられる部位
export type BodyFigurePart =
  | "head"
  | "ears"
  | "throat"
  | "chest"
  | "belly"
  | "limbs";

// 絵は、絵文字か体の図のどちらか。差し替えるときは、この形のまま書き換える
export type ChoicePicture = { emoji: string } | { figure: BodyFigurePart };

export type ChoiceDisplay = {
  label: string; // こどもの画面に出す言葉
  picture: ChoicePicture;
  // カードの背景の色（淡い色）。色だけで見分けさせず、絵と言葉と一緒に出す。
  // カードの文字（#0F172A と、選んだときの #0369A1）との比は 4.5:1 以上にする（options.test.ts で確かめる）
  color?: string;
};

// 「どんな かんじ？」の画面の言葉と絵は、lib/intake/symptoms.ts（かずまさんの v3 の症状画面.html のとおり）にある

// 「どこが へん？」。絵文字は参照の現行画面.html（bodyPartEmoji）と同じもの。
// 参照では「むね」と「おなか」がどちらも 🧍 なので、見分けは言葉でつける。
// 体の図にするときは { figure: "chest" } のように書き換える。
// 部位ごとの色はかずまさんの案。選んだときは、色の上に淡い青と青い枠とチェックが重なる
export const BODY_PART_DISPLAY: Record<BodyPart, ChoiceDisplay> = {
  頭: { label: "あたま", picture: { emoji: "👤" }, color: "#fde2e4" }, // ピンク
  耳: { label: "みみ", picture: { emoji: "👂" }, color: "#fef3c7" }, // 黄色
  のど: { label: "のど", picture: { emoji: "🗣️" }, color: "#dcfce7" }, // 緑
  胸: { label: "むね", picture: { emoji: "🧍" }, color: "#e0e7ff" }, // 青むらさき
  お腹: { label: "おなか", picture: { emoji: "🧍" }, color: "#ffedd5" }, // オレンジ
  "手・足": { label: "て あし", picture: { emoji: "🖐️" }, color: "#cffafe" }, // 水色
  その他: { label: "そのほか", picture: { emoji: "💬" }, color: "#f1f5f9" }, // 灰色
};

// 「どれくらい つらい？」の顔の画像（public の下）。言葉は DISCOMFORT_LABELS。
// 素材の表情は4段階と「わからない」なので、5段階目は線が2本の「><」を仮に使う。
// かずまさんから5段階目の顔が届いたら、5 の画像だけを差し替える
export const DISCOMFORT_FACE_SRC: Record<DiscomfortLevel, string> = {
  1: "/mascot/severity/1.webp",
  2: "/mascot/severity/2.webp",
  3: "/mascot/severity/3.webp",
  4: "/mascot/severity/4.webp",
  5: "/mascot/severity/5.webp",
};
