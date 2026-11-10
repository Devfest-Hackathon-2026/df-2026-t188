// 「症状をえらぶ」と「ほかにも きになることは ある？」の表と決まり。
// かずまさんの v3 の症状画面.html（.claude/design-ref/v3/症状画面_HTML移行用/）の
// symptomCategories、answerAliases、relatedSuggestions、symptomEmoji、chooseCategory、
// selectOtherAnswer、alreadyAnsweredBefore、orderedOtherChoices、updateOtherChoiceVisibility を写している。
// 主症状ごとの詳しい質問の画面は、2026-11-09 にチームで決めてなくした（こどもの画面は
// 主訴 → 程度 → 場所 → そのほか）。そのため、詳しい質問の表と、その答えを使う決まりは入れていない。
//
// 「ほかに きになること」の答えは、Gemini に送らない（見直しと医師の画面に言葉で出すだけ）。
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

// 関係しやすい候補を持つ主症状（そのほか と わからない 以外）
type RelatedCategoryKey = Exclude<SymptomCategoryKey, "other" | "unknown">;

type CategoryDefinition = {
  label: string;
  emoji: string; // 「症状をえらぶ」のカードの絵文字（HTML の category-emoji）
};

export const SYMPTOM_CATEGORIES: Record<SymptomCategoryKey, CategoryDefinition> = {
  pain: { label: "いたい", emoji: "⚡️" },
  sick: { label: "きもちわるい", emoji: "🤢" },
  breath: { label: "いきがくるしい", emoji: "🫁" },
  cough: { label: "せきがでる", emoji: "😷" },
  fever: { label: "かぜっぽい", emoji: "🤒" },
  unknown: { label: "わからない", emoji: "❓" },
  other: { label: "そのほか", emoji: "💬" },
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

// 「ほかにも きになることは ある？」の質問と選択肢（HTML の symptomCategories.other）。
// 「はきけがある」は、こどもには「きもちわるい」と区別しにくいため、2026-11-10 にチームで決めて外した
export const OTHER_QUESTION = "ほかにも きになることは ある？";

export const OTHER_CHOICES: readonly string[] = [
  "はなみずがでる", "せきがでる", "のどがいたい", "うんちがゆるい", "しょくよくがない",
  "いきがしにくい", "あたまがおもい", "からだがだるい", "ねつっぽい", "のどがかわく", "めまいがする",
  "かゆい", "しびれる", "はだがあかい・ぶつぶつ", "みみがきになる", "ない", "わからない",
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
  かゆい: "かゆい", しびれる: "しびれる",
  きこえにくい: "きこえにくい", おとがする: "みみのおと", みみにおとがする: "みみのおと",
  みみがつまる: "みみがつまる", いきがくるしい: "いきがくるしい", いきぎれがする: "いきぎれ",
  いきがしにくい: "いきがくるしい", のどがいたい: "のどのいたみ",
};

export function answerKey(text: string): string {
  return ANSWER_ALIASES[text] ?? text;
}

// 関連しやすい候補を先に見せる（HTML の relatedSuggestions）
export const RELATED_SUGGESTIONS: Record<RelatedCategoryKey, readonly string[]> = {
  pain: ["めまいがする", "ねつっぽい", "あたまがおもい", "からだがだるい", "しょくよくがない", "かゆい", "しびれる"],
  sick: ["うんちがゆるい", "しょくよくがない", "めまいがする", "あたまがおもい", "からだがだるい", "ねつっぽい", "のどがかわく"],
  breath: ["せきがでる", "ねつっぽい", "はなみずがでる", "のどがいたい", "からだがだるい", "いきがしにくい", "しょくよくがない", "あたまがおもい"],
  cough: ["はなみずがでる", "のどがいたい", "ねつっぽい", "いきがしにくい", "からだがだるい", "あたまがおもい", "しょくよくがない", "のどがかわく"],
  fever: ["せきがでる", "はなみずがでる", "のどがいたい", "うんちがゆるい", "あたまがおもい", "からだがだるい", "のどがかわく", "しょくよくがない"],
};

// 「ほかの こうほを みる」を押すまでに出す数（HTML の candidates.slice(0,6)）
export const OTHER_PRIMARY_COUNT = 6;

// 絵文字は補助表現として用い、選択肢の文字と一緒に表示する（HTML の symptomEmoji のうち、
// 「ほかに きになること」の選択肢の分。ないものは 💬）
export const SYMPTOM_EMOJI: Record<string, string> = {
  はなみずがでる: "🤧", せきがでる: "😷", のどがいたい: "😣", うんちがゆるい: "🚽",
  しょくよくがない: "🍽️", いきがしにくい: "💨", あたまがおもい: "😓", からだがだるい: "😮‍💨",
  ねつっぽい: "🤒", のどがかわく: "🥤", めまいがする: "😵‍💫", かゆい: "✋", しびれる: "⚡",
  "はだがあかい・ぶつぶつ": "🖐️", みみがきになる: "👂", ない: "🙆", わからない: "❓",
};

export function symptomEmoji(choice: string): string {
  return SYMPTOM_EMOJI[choice] ?? "💬";
}

// ---------- 選んだ内容（画面の中だけで持つ。保存しない） ----------

export type PatientSymptoms = {
  categories: SymptomCategoryKey[]; // 選んだ順
  otherGate: OtherGate | null; // 「ほかに きになることは ある？」の最初の答え
  other: string[]; // otherGate が「ある」のときに選んだもの（選んだ順）
  // otherGate の「ある」が、主訴の「そのほか」から最初に選ばれたもの（こどもが押したものではない）か
  otherGateAuto?: boolean;
};

export const EMPTY_SYMPTOMS: PatientSymptoms = {
  categories: [],
  otherGate: null,
  other: [],
};

// 主症状を選ぶ・外す（HTML の chooseCategory）。
// 外すときは、ほかに きになることの答えを消す（隠す候補と並びが変わるため）
export function toggleCategory(
  state: PatientSymptoms,
  key: SymptomCategoryKey,
): PatientSymptoms {
  if (!state.categories.includes(key)) {
    return { ...state, categories: [...state.categories, key] };
  }
  // 「そのほか」を外したときは、最初に選んだ「ある」だけを外す。こどもが自分で選んだ答えは消さない
  // （「そのほか」は隠す候補と並びに関わらないので、答えを残しても食い違わない）
  if (key === "other") {
    const categories = state.categories.filter((item) => item !== key);
    return state.otherGateAuto
      ? { ...state, categories, otherGate: null, other: [], otherGateAuto: false }
      : { ...state, categories };
  }
  return {
    categories: state.categories.filter((item) => item !== key),
    otherGate: null,
    other: [],
  };
}

// 「ある／ない／わからない」（HTML の selectOtherAnswer）。もう一度押すと外れる。
// 「ある」以外に変えると、選んでいたものは消える
export function selectOtherGate(state: PatientSymptoms, value: OtherGate): PatientSymptoms {
  const next = state.otherGate === value ? null : value;
  return { ...state, otherGate: next, other: [], otherGateAuto: false };
}

// 「ほかにも きになることは ある？」の画面を開いたとき。
// 主訴で「そのほか」を選んでいて、まだ何も答えていなければ、最初から「ある」を選んで候補を見せる
// （「そのほか」を選んだ子は、ほかの症状を伝えたい可能性が高いため。2026-11-10 にチームで決めた）
export function openOtherScreen(state: PatientSymptoms): PatientSymptoms {
  if (!state.categories.includes("other") || state.otherGate !== null) return state;
  return { ...state, otherGate: "ある", other: [], otherGateAuto: true };
}

// 選んだもの（または、すでに選んでいたもの）を切り替える。
// 「ない」「わからない」を選ぶとほかを外し、ほかを選ぶと「ない」「わからない」を外す
export function toggleOther(state: PatientSymptoms, choice: string): PatientSymptoms {
  const selected = state.other;
  if (selected.includes(choice)) {
    return { ...state, other: selected.filter((item) => item !== choice) };
  }
  // 候補を選んだら、「ある」もこどもが選んだ答えとして扱う
  if (isNoneOrDontKnow(choice)) return { ...state, other: [choice], otherGateAuto: false };
  return {
    ...state,
    other: [...selected.filter((item) => !isNoneOrDontKnow(item)), choice],
    otherGateAuto: false,
  };
}

// ---------- 「ほかに きになること」で出す選択肢 ----------

// 前に答えたもの（HTML の alreadyAnsweredBefore。言いかえの表で同じ意味にそろえる）。
// 詳しい質問の画面がなくなったので、選んだ主症状だけを数える
export function answeredBefore(state: PatientSymptoms): Set<string> {
  return new Set(
    state.categories
      .filter((key) => key !== "other" && key !== "unknown")
      .map((key) => answerKey(SYMPTOM_CATEGORIES[key].label)),
  );
}

// 選択肢の並び（HTML の orderedOtherChoices）。選んだ主症状に関係しやすいものを先に出す。
// 「ない」「わからない」は最初の答え（ある／ない／わからない）で聞くので、ここには入れない
export function orderedOtherChoices(state: PatientSymptoms): string[] {
  const recommended = [
    ...new Set(
      state.categories.flatMap((key) =>
        key === "other" || key === "unknown" ? [] : RELATED_SUGGESTIONS[key],
      ),
    ),
  ].filter((choice) => OTHER_CHOICES.includes(choice));
  return [...recommended, ...OTHER_CHOICES.filter((choice) => !recommended.includes(choice))].filter(
    (choice) => !isNoneOrDontKnow(choice),
  );
}

// 出す選択肢と、「ほかの こうほを みる」を出すか（HTML の updateOtherChoiceVisibility）。
// 選んだ主症状と同じ意味のものは隠す（選んでいたら残す）
export function visibleOtherChoices(
  state: PatientSymptoms,
  showMore: boolean,
): { choices: string[]; hasMore: boolean } {
  const seen = answeredBefore(state);
  const isHidden = (value: string) => seen.has(answerKey(value)) && !state.other.includes(value);
  const candidates = orderedOtherChoices(state).filter((value) => !isHidden(value));
  const primary = new Set(candidates.slice(0, OTHER_PRIMARY_COUNT));
  return {
    choices: candidates.filter(
      (value) => showMore || primary.has(value) || state.other.includes(value),
    ),
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
