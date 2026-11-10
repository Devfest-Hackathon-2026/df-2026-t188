// 「症状をえらぶ」「症状をくわしく」「ほかにも きになることは ある？」の表と決まり。
// かずまさんの v3 の症状画面.html（.claude/design-ref/v3/症状画面_HTML移行用/）の
// symptomCategories、answerAliases、relatedSuggestions、symptomEmoji、symptomCues、
// symptomMotionType、chooseCategory、chooseSymptomDetail、selectOtherAnswer、
// alreadyAnsweredBefore、orderedOtherChoices、updateOtherChoiceVisibility を写している。
//
// こどもの画面は「主訴 → 部位・状態の詳しい質問 → ほかにも → つらさ」の順（2026-11-10 にチームで決めた）。
// 「いたい」の詳しい質問は、部位（どこが へん？）だけにする（「どんなふうに いたい？」は出さない）。
// ほかの主症状の詳しい質問は、2026-11-09 にいったんなくした画面を、消す前のとおりに戻したもの。
// ただし「きもちわるい」と「かぜっぽい」の「はきけがある」は、こどもには「きもちわるい」と区別しにくいため外した。
//
// 詳しい答えと「ほかに きになること」の答えは、Gemini に送らない（見直しと医師の画面に言葉で出すだけ）。
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

// 詳しい質問の画面がある主症状（「いたい」は部位の画面で聞くので入れない）
export type DetailCategoryKey = Exclude<RelatedCategoryKey, "pain">;

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

// 主症状ごとの詳しい質問と選択肢（HTML の symptomCategories の question と choices。消す前のとおり）。
// 「きもちわるい」と「かぜっぽい」の「はきけがある」は、2026-11-10 にチームで決めて外した
export const SYMPTOM_DETAILS: Record<DetailCategoryKey, { question: string; choices: readonly string[] }> = {
  sick: { question: "どんなふうに きもちわるい？", choices: ["おなかがむかむか", "あたまがくらくら", "まわりがぐるぐる", "からだがふわふわ", "あたまがぼーっとする", "わからない"] },
  breath: { question: "どんなふうに くるしい？", choices: ["いきがしにくい", "むねがくるしい", "わからない"] },
  cough: { question: "どんな せきがでる？", choices: ["こんこん（かわいたせき）", "たんがからむ", "ぜえぜえする", "わからない"] },
  fever: { question: "どんなかんじがする？", choices: ["からだがあつい", "さむけがする", "あせがでる", "あたまがおもい", "からだがだるい", "のどがかわく", "うんちがゆるい", "はなみずがでる", "せきがでる", "のどがいたい", "わからない"] },
};

// 詳しい質問の画面の順（HTML の symptomCategories のキーの順。消す前と同じ）
export const DETAIL_PHASE_ORDER: readonly DetailCategoryKey[] = ["sick", "breath", "cough", "fever"];

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

// 絵文字は補助表現として用い、選択肢の文字と一緒に表示する（HTML の symptomEmoji。ないものは 💬）
export const SYMPTOM_EMOJI: Record<string, string> = {
  はなみずがでる: "🤧", "はだがあかい・ぶつぶつ": "🖐️", みみがきになる: "👂", あたまがくらくら: "😵‍💫", まわりがぐるぐる: "😵‍💫", からだがふわふわ: "☁️", あたまがぼーっとする: "😶‍🌫️", あせがでる: "💦", あたまがおもい: "😓", からだがだるい: "😮‍💨", のどがかわく: "🥤",
  しょくよくがない: "🍽️", ない: "🙆", のどがいたい: "😣", ぜえぜえする: "💨", うんちがゆるい: "🚽", おなかがむかむか: "🤢", めまいがする: "😵‍💫",
  ねつっぽい: "🤒",
  いきがしにくい: "💨", せきがでる: "😷", むねがくるしい: "🫁",
  "こんこん（かわいたせき）": "😷", たんがからむ: "💧",
  からだがあつい: "🥵", さむけがする: "🥶", かゆい: "✋", しびれる: "⚡", わからない: "❓",
};

export function symptomEmoji(choice: string): string {
  return SYMPTOM_EMOJI[choice] ?? "💬";
}

// 選択肢の下の短い言葉（HTML の symptomMotionType と symptomCues。消す前のとおり）
function symptomMotionType(choice: string): string {
  if (choice === "おなかがむかむか") return "upset";
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
  upset: "むかむか", breathing: "いきがしにくい",
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
  if (key in SYMPTOM_DETAILS) delete details[key as DetailCategoryKey];
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
    ...selected.filter((item) => item !== "わからない" && !(isOther && item === "ない")),
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

// ---------- 詳しい質問の画面と「ほかに きになること」で出す選択肢 ----------

// 詳しい質問の画面を出す主症状（選んだもののうち、消す前と同じ順）
export function detailPhases(state: PatientSymptoms): DetailCategoryKey[] {
  return DETAIL_PHASE_ORDER.filter((key) => state.categories.includes(key));
}

// この画面より前に答えたもの（HTML の alreadyAnsweredBefore。言いかえの表で同じ意味にそろえる）。
// 選んだ主症状と、前の詳しい質問の答えを数える。phase を省くと「ほかに きになること」の画面（詳しい答えを全部数える）
export function answeredBefore(state: PatientSymptoms, phase?: DetailCategoryKey): Set<string> {
  const seen = new Set(
    state.categories
      .filter((key) => key !== "other" && key !== "unknown")
      .map((key) => answerKey(SYMPTOM_CATEGORIES[key].label)),
  );
  const order = detailPhases(state);
  const previous = phase === undefined ? order : order.slice(0, order.indexOf(phase));
  previous.forEach((key) => {
    (state.details[key] ?? []).forEach((value) => {
      if (!isNoneOrDontKnow(value)) seen.add(answerKey(value));
    });
  });
  return seen;
}

// 詳しい質問の画面で出す選択肢。前に答えたものと同じ意味のものは隠す（選んでいたら残す）
export function visibleDetailChoices(state: PatientSymptoms, key: DetailCategoryKey): string[] {
  const seen = answeredBefore(state, key);
  const selected = state.details[key] ?? [];
  return SYMPTOM_DETAILS[key].choices.filter(
    (value) => isNoneOrDontKnow(value) || selected.includes(value) || !seen.has(answerKey(value)),
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
// 選んだ主症状や詳しい答えと同じ意味のものは隠す（選んでいたら残す）
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
