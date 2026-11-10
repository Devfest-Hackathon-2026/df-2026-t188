// 「症状をえらぶ」「ほかにも きになることは ある？」の表と決まりのテスト。
// 期待する値は、かずまさんの v3 の症状画面.html の動きから作っている。データはすべて架空
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { FEELINGS } from "@/lib/intake/options";
import {
  CATEGORY_TO_FEELING,
  EMPTY_SYMPTOMS,
  OTHER_CHOICES,
  SYMPTOM_CATEGORIES,
  SYMPTOM_DETAILS,
  answeredBefore,
  categoryFeelings,
  detailPhases,
  orderedOtherChoices,
  selectOtherGate,
  symptomCue,
  symptomEmoji,
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

  test("ほかに きになることの選択肢は17（ない・わからない を含む）で、どれにも絵文字がある", () => {
    assert.equal(OTHER_CHOICES.length, 17);
    for (const choice of OTHER_CHOICES) assert.notEqual(symptomEmoji(choice), "💬", choice);
    assert.equal(symptomEmoji("はなみずがでる"), "🤧");
    assert.equal(symptomEmoji("存在しない選択肢"), "💬");
  });

  test("「はきけがある」は出さない（こどもには「きもちわるい」と区別しにくいため、2026-11-10 に外した）", () => {
    assert.equal(OTHER_CHOICES.includes("はきけがある"), false);
    for (const category of ["pain", "sick", "fever"] as const) {
      const state = selectOtherGate(withCategories(category), "ある");
      assert.equal(visibleOtherChoices(state, true).choices.includes("はきけがある"), false, category);
    }
  });
});

describe("主症状ごとの詳しい質問（2026-11-10 に戻した）", () => {
  test("詳しい質問は きもちわるい → いきがくるしい → せき → かぜっぽい の順で、選んだものだけ。いたい は部位の画面で聞く", () => {
    assert.deepEqual(detailPhases(withCategories("fever", "pain", "sick")), ["sick", "fever"]);
  });

  test("質問と選択肢は消す前のとおり。ただし「きもちわるい」と「かぜっぽい」の「はきけがある」は外した", () => {
    assert.equal(SYMPTOM_DETAILS.sick.question, "どんなふうに きもちわるい？");
    assert.deepEqual(SYMPTOM_DETAILS.sick.choices, ["おなかがむかむか", "あたまがくらくら", "まわりがぐるぐる", "からだがふわふわ", "あたまがぼーっとする", "わからない"]);
    assert.deepEqual(SYMPTOM_DETAILS.breath.choices, ["いきがしにくい", "むねがくるしい", "わからない"]);
    assert.deepEqual(SYMPTOM_DETAILS.cough.choices, ["こんこん（かわいたせき）", "たんがからむ", "ぜえぜえする", "わからない"]);
    assert.equal(SYMPTOM_DETAILS.fever.choices.length, 11);
    for (const key of ["sick", "breath", "cough", "fever"] as const) {
      assert.equal(SYMPTOM_DETAILS[key].choices.includes("はきけがある"), false, key);
      assert.equal(visibleDetailChoices(withCategories(key), key).includes("はきけがある"), false, key);
    }
    assert.equal(symptomEmoji("はきけがある"), "💬");
    assert.equal(symptomCue("はきけがある"), "");
    assert.equal(symptomCue("たんがからむ"), "たんがからむ");
    assert.equal(symptomCue("さむけがする"), "ぞくぞく");
  });

  test("主症状を外すと、その詳しい答えも消える", () => {
    let state = toggleDetail(withCategories("sick", "cough"), "sick", "おなかがむかむか");
    state = toggleDetail(state, "cough", "たんがからむ");
    const removed = toggleCategory(state, "sick");
    assert.deepEqual(removed.details, { cough: ["たんがからむ"] });
  });

  test("「わからない」を選ぶとほかを外し、ほかを選ぶと「わからない」を外す", () => {
    let state = toggleDetail(withCategories("cough"), "cough", "たんがからむ");
    state = toggleDetail(state, "cough", "わからない");
    assert.deepEqual(state.details.cough, ["わからない"]);
    assert.deepEqual(toggleDetail(state, "cough", "ぜえぜえする").details.cough, ["ぜえぜえする"]);
  });

  test("前の詳しい答えや主症状と同じ意味の選択肢は隠す（せきがでる → かぜっぽいの「せきがでる」、かぜっぽいの「からだがだるい」→ ほかにもの「からだがだるい」）", () => {
    const state = withCategories("cough", "fever");
    assert.equal(visibleDetailChoices(state, "fever").includes("せきがでる"), false);
    const withDetail = selectOtherGate(toggleDetail(withCategories("fever"), "fever", "からだがだるい"), "ある");
    assert.equal(visibleOtherChoices(withDetail, true).choices.includes("からだがだるい"), false);
  });
});

describe("選び方の決まり", () => {
  test("主症状を外すと、ほかに きになることの答えが消える", () => {
    const state = toggleOther(selectOtherGate(withCategories("pain", "cough"), "ある"), "かゆい");
    const removed = toggleCategory(state, "pain");
    assert.deepEqual(removed.categories, ["cough"]);
    assert.equal(removed.otherGate, null);
    assert.deepEqual(removed.other, []);
  });

  test("主症状を足しても、ほかに きになることの答えは消えない", () => {
    const state = toggleOther(selectOtherGate(withCategories("pain"), "ある"), "かゆい");
    assert.deepEqual(toggleCategory(state, "cough").other, ["かゆい"]);
  });

  test("ある／ない／わからない は、もう一度押すと外れ、変えると選んだものが消える", () => {
    let state = toggleOther(selectOtherGate(EMPTY_SYMPTOMS, "ある"), "かゆい");
    assert.deepEqual(state.other, ["かゆい"]);
    state = selectOtherGate(state, "ない");
    assert.equal(state.otherGate, "ない");
    assert.deepEqual(state.other, []);
    assert.equal(selectOtherGate(state, "ない").otherGate, null);
  });

  test("選んだものは、もう一度押すと外れる", () => {
    let state = toggleOther(selectOtherGate(EMPTY_SYMPTOMS, "ある"), "かゆい");
    state = toggleOther(state, "しびれる");
    assert.deepEqual(state.other, ["かゆい", "しびれる"]);
    assert.deepEqual(toggleOther(state, "かゆい").other, ["しびれる"]);
  });
});

describe("同じ意味の選択肢を隠す（answerAliases）", () => {
  test("選んだ主症状と同じ意味のものを隠す（いきがくるしい →「いきがしにくい」、せきがでる →「せきがでる」）", () => {
    const breath = selectOtherGate(withCategories("breath"), "ある");
    assert.equal(visibleOtherChoices(breath, true).choices.includes("いきがしにくい"), false);
    const cough = selectOtherGate(withCategories("cough"), "ある");
    assert.equal(visibleOtherChoices(cough, true).choices.includes("せきがでる"), false);
    assert.equal(visibleOtherChoices(cough, true).choices.includes("のどがいたい"), true);
  });

  test("前に答えたものに数えるのは、選んだ主症状だけ（そのほか・わからない は数えない）", () => {
    assert.deepEqual([...answeredBefore(withCategories("pain", "other", "unknown"))], ["いたい"]);
  });

  test("主症状を選ばなければ、何も隠さない", () => {
    const state = selectOtherGate(EMPTY_SYMPTOMS, "ある");
    assert.equal(visibleOtherChoices(state, true).choices.length, 15);
  });
});

describe("並びと「ほかの こうほを みる」", () => {
  test("選んだ主症状に関係しやすいもの（relatedSuggestions）を先に出す。ない・わからない は入れない", () => {
    const order = orderedOtherChoices(withCategories("pain"));
    assert.deepEqual(order.slice(0, 3), ["めまいがする", "ねつっぽい", "あたまがおもい"]);
    assert.equal(order.includes("ない"), false);
    assert.equal(order.includes("わからない"), false);
    assert.equal(order.length, 15);
  });

  test("はじめは6つだけ出し、「ほかの こうほを みる」で全部出す", () => {
    const state = selectOtherGate(withCategories("pain"), "ある");
    const first = visibleOtherChoices(state, false);
    assert.deepEqual(first.choices, ["めまいがする", "ねつっぽい", "あたまがおもい", "からだがだるい", "しょくよくがない", "かゆい"]);
    assert.equal(first.hasMore, true);
    assert.equal(visibleOtherChoices(state, true).choices.length, 15);
  });

  test("隠したものは6つに数えない（いきがくるしい を選んだら、「いきがしにくい」を除いて6つ）", () => {
    const state = selectOtherGate(withCategories("breath"), "ある");
    const first = visibleOtherChoices(state, false).choices;
    assert.equal(first.length, 6);
    assert.equal(first.includes("いきがしにくい"), false);
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
