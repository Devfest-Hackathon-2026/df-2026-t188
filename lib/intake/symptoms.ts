// 「症状をえらぶ」と「症状をくわしく」の表と決まり。
// かずまさんの v3 の症状画面.html（.claude/design-ref/v3/症状画面_HTML移行用/）の
// symptomCategories、answerAliases、relatedSuggestions、symptomEmoji、symptomCues、
// symptomMotionType、chooseCategory、chooseSymptomDetail、selectOtherAnswer、
// alreadyAnsweredBefore、orderedOtherChoices、updateOtherChoiceVisibility を、文言も動きもそのまま写している。
// 文言を変えたり、決まりを足したりしない。
//
// ここで選んだ詳しい答えは、Gemini に送らない（見直しと医師の画面に言葉で出すだけ）。
// Gemini に送るのは、主症状のうち、今のサーバーの選択肢に一致するものだけ（categoryFeelings）
import type { Feeling } from "./options";

// ---------- HTML の表（symptomCategories） ----------

export type SymptomCategoryKey =
  | "pain"
  | "sick"
  | "breath"
  | "cough"
  | "fever"
  | "other"
  | "unknown";

// 詳細の質問がある主症状（HTML の symptomPhases で、other と unknown 以外）
export type DetailCategoryKey = Exclude<SymptomCategoryKey, "other" | "unknown">;

type CategoryDefinition = {
  label: string;
  emoji: string; // 「症状をえらぶ」のカードの絵文字（HTML の category-emoji）
  question?: string;
  choices: readonly string[];
};

export const SYMPTOM_CATEGORIES: Record<SymptomCategoryKey, CategoryDefinition> = {
  pain: { label: "いたい", emoji: "⚡️", question: "どんなふうに いたい？", choices: ["ズキズキ", "チクチク", "ぎゅーっと", "重たい", "わからない"] },
  sick: { label: "きもちわるい", emoji: "🤢", question: "どんなふうに きもちわるい？", choices: ["はきけがある", "おなかがむかむか", "あたまがくらくら", "まわりがぐるぐる", "からだがふわふわ", "あたまがぼーっとする", "わからない"] },
  breath: { label: "いきがくるしい", emoji: "🫁", question: "どんなふうに くるしい？", choices: ["いきがしにくい", "むねがくるしい", "わからない"] },
  cough: { label: "せきがでる", emoji: "😷", question: "どんな せきがでる？", choices: ["こんこん（かわいたせき）", "たんがからむ", "ぜえぜえする", "わからない"] },
  fever: { label: "かぜっぽい", emoji: "🤒", question: "どんなかんじがする？", choices: ["からだがあつい", "さむけがする", "あせがでる", "あたまがおもい", "からだがだるい", "のどがかわく", "はきけがある", "うんちがゆるい", "はなみずがでる", "せきがでる", "のどがいたい", "わからない"] },
  unknown: { label: "わからない", emoji: "❓", choices: [] },
  other: { label: "そのほか", emoji: "💬", question: "ほかに きになることは ある？", choices: ["はなみずがでる", "せきがでる", "のどがいたい", "はきけがある", "うんちがゆるい", "しょくよくがない", "いきがしにくい", "あたまがおもい", "からだがだるい", "ねつっぽい", "のどがかわく", "めまいがする", "かゆい", "しびれる", "はだがあかい・ぶつぶつ", "みみがきになる", "ない", "わからない"] },
};

// 「症状をえらぶ」のカードの並び（HTML の画面1のボタンの順）
export const CATEGORY_CARD_ORDER: readonly SymptomCategoryKey[] = [
  "pain",
  "sick",
  "breath",
  "cough",
  "fever",
  "other",
  "unknown",
];

// 詳細の画面の順（HTML の symptomCategories のキーの順。other と unknown は除く）
export const DETAIL_PHASE_ORDER: readonly DetailCategoryKey[] = [
  "pain",
  "sick",
  "breath",
  "cough",
  "fever",
];

// 「ほかに きになることは ある？」の最初の答え
export const OTHER_GATE_OPTIONS = ["ある", "ない", "わからない"] as const;
export type OtherGate = (typeof OTHER_GATE_OPTIONS)[number];

// 「ない」「わからない」（決まりの中で特別に扱う答え）
const NONE_OR_DONT_KNOW = ["ない", "わからない"];
const isNoneOrDontKnow = (value: string) => NONE_OR_DONT_KNOW.includes(value);

// 選択済みと同じ意味の候補だけ除外し、詳細が異なる候補は残す（HTML の answerAliases）
export const ANSWER_ALIASES: Record<string, string> = {
  せき: "せき", せきがでる: "せき", だるい: "だるい", からだがだるい: "だるい",
  ねつっぽい: "ねつ", からだがあつい: "あつい", はなみず: "はなみず", はなみずがでる: "はなみず",
  はきけ: "はきけ", はきけがある: "はきけ", かゆい: "かゆい", しびれる: "しびれる",
  きこえにくい: "きこえにくい", おとがする: "みみのおと", みみにおとがする: "みみのおと",
  みみがつまる: "みみがつまる", いきがくるしい: "いきがくるしい", いきぎれがする: "いきぎれ",
  いきがしにくい: "いきがくるしい", のどがいたい: "のどのいたみ",
};

export function answerKey(text: string): string {
  return ANSWER_ALIASES[text] ?? text;
}

// 関連しやすい候補を先に見せる（HTML の relatedSuggestions）
export const RELATED_SUGGESTIONS: Record<DetailCategoryKey, readonly string[]> = {
  pain: ["はきけがある", "めまいがする", "ねつっぽい", "あたまがおもい", "からだがだるい", "しょくよくがない", "かゆい", "しびれる"],
  sick: ["はきけがある", "うんちがゆるい", "しょくよくがない", "めまいがする", "あたまがおもい", "からだがだるい", "ねつっぽい", "のどがかわく"],
  breath: ["せきがでる", "ねつっぽい", "はなみずがでる", "のどがいたい", "からだがだるい", "いきがしにくい", "しょくよくがない", "あたまがおもい"],
  cough: ["はなみずがでる", "のどがいたい", "ねつっぽい", "いきがしにくい", "からだがだるい", "あたまがおもい", "しょくよくがない", "のどがかわく"],
  fever: ["せきがでる", "はなみずがでる", "のどがいたい", "はきけがある", "うんちがゆるい", "あたまがおもい", "からだがだるい", "のどがかわく", "しょくよくがない"],
};

// 「ほかの こうほを みる」を押すまでに出す数（HTML の candidates.slice(0,6)）
export const OTHER_PRIMARY_COUNT = 6;

// 絵文字は補助表現として用い、選択肢の文字と一緒に表示する（HTML の symptomEmoji。ないものは 💬）
export const SYMPTOM_EMOJI: Record<string, string> = {
  ズキズキ: "💥", チクチク: "🪡", ぎゅーっと: "✊", 重たい: "🪨",
  はなみずがでる: "🤧", "はだがあかい・ぶつぶつ": "🖐️", みみがきになる: "👂", あたまがくらくら: "😵‍💫", まわりがぐるぐる: "😵‍💫", からだがふわふわ: "☁️", あたまがぼーっとする: "😶‍🌫️", あせがでる: "💦", あたまがおもい: "😓", からだがだるい: "😮‍💨", のどがかわく: "🥤",
  しょくよくがない: "🍽️", いきぎれがする: "💨", ない: "🙆", のどがいたい: "😣", ぜえぜえする: "💨", うんちがゆるい: "🚽", はきけがある: "🤢", おなかがむかむか: "🤢", めまいがする: "😵‍💫",
  ちからがでない: "💪", ねむい: "🥱", からだがおもい: "🪨", ねつっぽい: "🤒",
  いきがしにくい: "💨", せきがでる: "😷", むねがくるしい: "🫁",
  "こんこん（かわいたせき）": "😷", たんがからむ: "💧",
  からだがあつい: "🥵", さむけがする: "🥶", かゆい: "✋", しびれる: "⚡", わからない: "❓",
};

export function symptomEmoji(choice: string): string {
  return SYMPTOM_EMOJI[choice] ?? "💬";
}

// 選択肢の下の短い言葉（HTML の symptomMotionType と symptomCues）
function symptomMotionType(choice: string): string {
  if (choice === "ズキズキ") return "pulse";
  if (choice === "おなかがむかむか") return "upset";
  if (choice === "はきけがある") return "nausea";
  if (choice === "チクチク") return "prick";
  if (choice === "ぎゅーっと") return "tight";
  if (["重たい", "からだがおもい"].includes(choice)) return "heavy";
  if (choice === "ちからがでない") return "weak";
  if (choice === "ねむい") return "sleepy";
  if (choice === "いきがしにくい") return "breathing";
  if (choice === "むねがくるしい") return "chest";
  if (choice === "たんがからむ") return "phlegm";
  if (choice === "さむけがする") return "chills";
  if (choice === "かゆい") return "itch";
  if (choice === "しびれる") return "tingle";
  if (choice === "めまいがする") return "dizzy";
  if (["せきがでる", "こんこん（かわいたせき）"].includes(choice)) return "cough";
  if (["ねつっぽい", "からだがあつい"].includes(choice)) return "heat";
  if (choice === "わからない") return "unknown";
  return "generic";
}

const SYMPTOM_CUES: Record<string, string> = {
  pulse: "トクン、トクン", prick: "ちくっ、ちくっ", tight: "ぎゅーっと しめつける", upset: "むかむか",
  nausea: "はきそう", weak: "ちからがでない", sleepy: "ねむい", breathing: "いきがしにくい",
  chest: "むねがくるしい", phlegm: "たんがからむ", chills: "ぞくぞく", itch: "むずむず",
  tingle: "ぴりぴり", dizzy: "くらくら", cough: "こんこん", heat: "ぽかぽか",
};

// 短い言葉がない選択肢は空文字
export function symptomCue(choice: string): string {
  return SYMPTOM_CUES[symptomMotionType(choice)] ?? "";
}

// ---------- 選んだ内容（画面の中だけで持つ。保存しない） ----------

export type PatientSymptoms = {
  categories: SymptomCategoryKey[]; // 選んだ順
  details: Partial<Record<DetailCategoryKey, string[]>>; // 主症状ごとの詳しい答え（選んだ順）
  otherGate: OtherGate | null; // 「ほかに きになることは ある？」の最初の答え
  other: string[]; // otherGate が「ある」のときに選んだもの（選んだ順）
};

export const EMPTY_SYMPTOMS: PatientSymptoms = {
  categories: [],
  details: {},
  otherGate: null,
  other: [],
};

// 主症状を選ぶ・外す（HTML の chooseCategory）。
// 外すときは、ほかに きになることの答えと、その主症状の詳しい答えを消す
export function toggleCategory(
  state: PatientSymptoms,
  key: SymptomCategoryKey,
): PatientSymptoms {
  if (!state.categories.includes(key)) {
    return { ...state, categories: [...state.categories, key] };
  }
  const details = { ...state.details };
  if (key !== "other" && key !== "unknown") delete details[key];
  return {
    categories: state.categories.filter((item) => item !== key),
    details,
    otherGate: null,
    other: [],
  };
}

// 選んだもの（または、すでに選んでいたもの）を切り替える。
// 「わからない」（そのほかでは「ない」も）を選ぶとほかを外し、ほかを選ぶと「わからない」「ない」を外す
// （HTML の chooseSymptomDetail）
function toggleChoice(selected: readonly string[], choice: string, isOther: boolean): string[] {
  if (selected.includes(choice)) return selected.filter((item) => item !== choice);
  if (choice === "わからない" || (isOther && choice === "ない")) return [choice];
  return [
    ...selected.filter(
      (item) => item !== "わからない" && !(isOther && item === "ない"),
    ),
    choice,
  ];
}

export function toggleDetail(
  state: PatientSymptoms,
  key: DetailCategoryKey,
  choice: string,
): PatientSymptoms {
  return {
    ...state,
    details: { ...state.details, [key]: toggleChoice(state.details[key] ?? [], choice, false) },
  };
}

// 「ある／ない／わからない」（HTML の selectOtherAnswer）。もう一度押すと外れる。
// 「ある」以外に変えると、選んでいたものは消える
export function selectOtherGate(state: PatientSymptoms, value: OtherGate): PatientSymptoms {
  const next = state.otherGate === value ? null : value;
  return { ...state, otherGate: next, other: [] };
}

export function toggleOther(state: PatientSymptoms, choice: string): PatientSymptoms {
  return { ...state, other: toggleChoice(state.other, choice, true) };
}

// ---------- 詳細の画面の順番と、出す選択肢 ----------

export type SymptomPhase = DetailCategoryKey | "other";

// 詳細の画面の順番（HTML の symptomPhases）。選んだ主症状の画面のあと、必ず「そのほか」を出す
export function symptomPhases(state: PatientSymptoms): SymptomPhase[] {
  return [
    ...DETAIL_PHASE_ORDER.filter((key) => state.categories.includes(key)),
    "other",
  ];
}

// この画面より前に答えたもの（HTML の alreadyAnsweredBefore。言いかえの表で同じ意味にそろえる）。
// 痛みの部位の関連症状（B2 で作る）は、まだ入れていない
export function answeredBefore(state: PatientSymptoms, phase: SymptomPhase): Set<string> {
  const seen = new Set(
    state.categories
      .filter((key) => key !== "other")
      .map((key) => answerKey(SYMPTOM_CATEGORIES[key].label)),
  );
  const order = symptomPhases(state);
  order.slice(0, order.indexOf(phase)).forEach((previous) => {
    if (previous === "other") return;
    (state.details[previous] ?? []).forEach((value) => {
      if (!isNoneOrDontKnow(value)) seen.add(answerKey(value));
    });
  });
  return seen;
}

// 主症状の詳細の画面で出す選択肢。前に答えたものと同じ意味のものは隠す（選んでいたら残す）
export function visibleDetailChoices(state: PatientSymptoms, key: DetailCategoryKey): string[] {
  const seen = answeredBefore(state, key);
  const selected = state.details[key] ?? [];
  return SYMPTOM_CATEGORIES[key].choices.filter(
    (value) => isNoneOrDontKnow(value) || selected.includes(value) || !seen.has(answerKey(value)),
  );
}

// 「そのほか」の選択肢の並び（HTML の orderedOtherChoices）。選んだ主症状に関係しやすいものを先に出す。
// 「ない」「わからない」は最初の答え（ある／ない／わからない）で聞くので、ここには入れない
export function orderedOtherChoices(state: PatientSymptoms): string[] {
  const choices = SYMPTOM_CATEGORIES.other.choices;
  const recommended = [
    ...new Set(
      state.categories.flatMap((key) =>
        key === "other" || key === "unknown" ? [] : RELATED_SUGGESTIONS[key],
      ),
    ),
  ].filter((choice) => choices.includes(choice));
  return [...recommended, ...choices.filter((choice) => !recommended.includes(choice))].filter(
    (choice) => !isNoneOrDontKnow(choice),
  );
}

// 「そのほか」で出す選択肢と、「ほかの こうほを みる」を出すか（HTML の updateOtherChoiceVisibility）
export function visibleOtherChoices(
  state: PatientSymptoms,
  showMore: boolean,
): { choices: string[]; hasMore: boolean } {
  const seen = answeredBefore(state, "other");
  const ordered = orderedOtherChoices(state);
  const candidates = ordered.filter(
    (value) => !seen.has(answerKey(value)) || state.other.includes(value),
  );
  const primary = new Set(candidates.slice(0, OTHER_PRIMARY_COUNT));
  return {
    choices: ordered.filter((value) => {
      if (seen.has(answerKey(value)) && !state.other.includes(value)) return false;
      return showMore || primary.has(value) || state.other.includes(value);
    }),
    hasMore: candidates.length > OTHER_PRIMARY_COUNT || showMore,
  };
}

// ---------- Gemini に送る値 ----------

// 主症状のうち、今のサーバーの選択肢（lib/intake/options.ts の FEELINGS）に一致するものだけ。
// かぜっぽい、そのほか、わからない は送らない（こどもが言っていないことを送らないため）
export const CATEGORY_TO_FEELING: Partial<Record<SymptomCategoryKey, Feeling>> = {
  pain: "いたい",
  sick: "きもちわるい",
  breath: "いきが くるしい",
  cough: "せきが でる",
};

// 選んだ順のまま、送る値に置きかえる
export function categoryFeelings(categories: readonly SymptomCategoryKey[]): Feeling[] {
  return categories.flatMap((key) => {
    const feeling = CATEGORY_TO_FEELING[key];
    return feeling ? [feeling] : [];
  });
}
