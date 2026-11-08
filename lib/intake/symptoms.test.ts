// 「症状をえらぶ」「症状をくわしく」の表と決まりのテスト。
// 期待する値は、かずまさんの v3 の症状画面.html の動きから作っている。データはすべて架空
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { FEELINGS } from "@/lib/intake/options";
import {
  CATEGORY_TO_FEELING,
  EMPTY_SYMPTOMS,
  SYMPTOM_CATEGORIES,
  answeredBefore,
  categoryFeelings,
  orderedOtherChoices,
  selectOtherGate,
  symptomCue,
  symptomEmoji,
  symptomPhases,
  toggleCategory,
  toggleDetail,
  toggleOther,
  visibleDetailChoices,
  visibleOtherChoices,
  type PatientSymptoms,
} from "@/lib/intake/symptoms";
import { parseSummaryInput } from "@/lib/summary/validate";

const withCategories = (...categories: PatientSymptoms["categories"]): PatientSymptoms => ({
  ...EMPTY_SYMPTOMS,
  categories,
});

describe("表（症状画面.html のとおり）", () => {
  test("主症状は7つで、言葉と絵文字が HTML のとおり", () => {
    assert.deepEqual(
      Object.values(SYMPTOM_CATEGORIES).map((item) => `${item.emoji}${item.label}`),
      ["⚡️いたい", "🤢きもちわるい", "🫁いきがくるしい", "😷せきがでる", "🤒かぜっぽい", "❓わからない", "💬そのほか"],
    );
  });

  test("詳細の質問と選択肢の例（いたい、せきがでる）", () => {
    assert.equal(SYMPTOM_CATEGORIES.pain.question, "どんなふうに いたい？");
    assert.deepEqual(SYMPTOM_CATEGORIES.pain.choices, ["ズキズキ", "チクチク", "ぎゅーっと", "重たい", "わからない"]);
    assert.equal(SYMPTOM_CATEGORIES.cough.question, "どんな せきがでる？");
  });

  test("絵文字と短い言葉。表にない絵文字は 💬、短い言葉がないものは空", () => {
    assert.equal(symptomEmoji("ズキズキ"), "💥");
    assert.equal(symptomCue("ズキズキ"), "トクン、トクン");
    assert.equal(symptomCue("こんこん（かわいたせき）"), "こんこん");
    assert.equal(symptomEmoji("あせがでる"), "💦");
    assert.equal(symptomEmoji("むねがくるしい"), "🫁");
    assert.equal(symptomCue("重たい"), "");
    assert.equal(symptomEmoji("存在しない選択肢"), "💬");
  });
});

describe("詳細の画面の順番", () => {
  test("選んだ順ではなく、いたい→きもちわるい→いきがくるしい→せき→かぜっぽい の順で、最後に必ず「そのほか」", () => {
    assert.deepEqual(symptomPhases(withCategories("fever", "pain", "cough")), ["pain", "cough", "fever", "other"]);
  });

  test("そのほか・わからない だけ、または何も選ばないときは「そのほか」の1画面だけ", () => {
    assert.deepEqual(symptomPhases(withCategories("other", "unknown")), ["other"]);
    assert.deepEqual(symptomPhases(EMPTY_SYMPTOMS), ["other"]);
  });
});

describe("選び方の決まり", () => {
  test("主症状を外すと、その主症状の詳しい答えと、ほかに きになることの答えが消える", () => {
    let state = toggleDetail(withCategories("pain", "cough"), "pain", "ズキズキ");
    state = toggleDetail(state, "cough", "たんがからむ");
    state = toggleOther(selectOtherGate(state, "ある"), "かゆい");
    const removed = toggleCategory(state, "pain");
    assert.deepEqual(removed.categories, ["cough"]);
    assert.equal(removed.details.pain, undefined);
    assert.deepEqual(removed.details.cough, ["たんがからむ"]);
    assert.equal(removed.otherGate, null);
    assert.deepEqual(removed.other, []);
  });

  test("「わからない」を選ぶとほかを外し、ほかを選ぶと「わからない」を外す", () => {
    let state = toggleDetail(withCategories("pain"), "pain", "ズキズキ");
    state = toggleDetail(state, "pain", "わからない");
    assert.deepEqual(state.details.pain, ["わからない"]);
    state = toggleDetail(state, "pain", "チクチク");
    assert.deepEqual(state.details.pain, ["チクチク"]);
    state = toggleDetail(state, "pain", "チクチク");
    assert.deepEqual(state.details.pain, []);
  });

  test("ある／ない／わからない は、もう一度押すと外れ、変えると選んだものが消える", () => {
    let state = toggleOther(selectOtherGate(EMPTY_SYMPTOMS, "ある"), "かゆい");
    assert.deepEqual(state.other, ["かゆい"]);
    state = selectOtherGate(state, "ない");
    assert.equal(state.otherGate, "ない");
    assert.deepEqual(state.other, []);
    assert.equal(selectOtherGate(state, "ない").otherGate, null);
  });
});

describe("同じ意味の選択肢を隠す（answerAliases）", () => {
  test("前に選んだ主症状と同じ意味の選択肢は、あとの画面で隠す（せきがでる を選んだら、かぜっぽい の「せきがでる」を隠す）", () => {
    const state = withCategories("cough", "fever");
    assert.equal(visibleDetailChoices(state, "fever").includes("せきがでる"), false);
    assert.equal(visibleDetailChoices(state, "fever").includes("のどがいたい"), true);
  });

  test("前の画面で選んだ答えと同じ意味のものも隠す（きもちわるい の「はきけがある」→ かぜっぽい の「はきけがある」）", () => {
    const state = toggleDetail(withCategories("sick", "fever"), "sick", "はきけがある");
    assert.equal(visibleDetailChoices(state, "fever").includes("はきけがある"), false);
  });

  test("前の画面の「わからない」は、前に答えたものに数えない", () => {
    const state = toggleDetail(withCategories("sick", "fever"), "sick", "わからない");
    assert.equal(answeredBefore(state, "fever").has("わからない"), false);
    assert.equal(visibleDetailChoices(state, "fever").includes("わからない"), true);
  });

  test("いきがくるしい を選んだら、そのほか の「いきがしにくい」を隠す", () => {
    const state = selectOtherGate(withCategories("breath"), "ある");
    assert.equal(visibleOtherChoices(state, true).choices.includes("いきがしにくい"), false);
  });
});

describe("「そのほか」の並びと「ほかの こうほを みる」", () => {
  test("選んだ主症状に関係しやすいもの（relatedSuggestions）を先に出す。ない・わからない は入れない", () => {
    const order = orderedOtherChoices(withCategories("pain"));
    assert.deepEqual(order.slice(0, 3), ["はきけがある", "めまいがする", "ねつっぽい"]);
    assert.equal(order.includes("ない"), false);
    assert.equal(order.includes("わからない"), false);
    assert.equal(order.length, 16);
  });

  test("はじめは6つだけ出し、「ほかの こうほを みる」で全部出す", () => {
    const state = selectOtherGate(withCategories("pain"), "ある");
    const first = visibleOtherChoices(state, false);
    assert.equal(first.choices.length, 6);
    assert.equal(first.hasMore, true);
    assert.equal(visibleOtherChoices(state, true).choices.length, 16);
  });

  test("選んだものは、6つの外でも出したままにする", () => {
    let state = selectOtherGate(withCategories("pain"), "ある");
    state = toggleOther(state, "みみがきになる");
    assert.equal(visibleOtherChoices(state, false).choices.includes("みみがきになる"), true);
  });
});

describe("Gemini に送る主症状（lib/summary は変えない）", () => {
  test("今のサーバーの選択肢に一致するものだけを、選んだ順に送る。かぜっぽい・そのほか・わからない は送らない", () => {
    assert.deepEqual(
      categoryFeelings(["fever", "cough", "pain", "other", "unknown", "breath", "sick"]),
      ["せきが でる", "いたい", "いきが くるしい", "きもちわるい"],
    );
  });

  test("置きかえた値は、すべてサーバーの選択肢にあり、入力チェックを通る", () => {
    const values = Object.values(CATEGORY_TO_FEELING);
    for (const value of values) assert.equal(FEELINGS.includes(value!), true, value);
    const input = parseSummaryInput({ patient: { feelings: values }, family: {} });
    assert.deepEqual(input?.patient.feelings, values);
  });
});
