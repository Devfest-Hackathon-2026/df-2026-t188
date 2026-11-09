// 「保護者から見た気になる症状」の選択肢と、1つの文へのまとめ方のテスト。データはすべて架空
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  composeConcern,
  CONCERN_CHOICES,
  isConcernOverLimit,
  type ConcernChoice,
  LONGEST_CHOICES_TEXT_LENGTH,
  withComposedConcern,
} from "@/lib/intake/concern";
import type { FamilyAnswers } from "@/lib/intake/types";
import { buildFamilyRows } from "@/lib/intake/unknowns";
import { buildSummaryInput } from "@/lib/summary/input";
import { countChars, SUMMARY_TEXT_LIMIT } from "@/lib/summary/types";
import { parseSummaryInput } from "@/lib/summary/validate";

const unanswered = { respondent: "family", status: "unanswered" } as const;
const answered = <T>(value: T) => ({ respondent: "family", status: "answered", value }) as const;

const family: FamilyAnswers = {
  chiefConcern: unanswered,
  concernChoices: unanswered,
  onset: unanswered,
  temperature: unanswered,
  foodIntake: unanswered,
  medications: unanswered,
  allergies: unanswered,
  conditions: unanswered,
  age: unanswered,
  sex: unanswered,
  weight: unanswered,
};

describe("まとめ方", () => {
  test("選択肢とその他：「気になる症状：〇〇、〇〇。その他：〇〇」", () => {
    assert.equal(
      composeConcern(["せきが出る", "痛がっている"], "昨日の夜から熱があります。"),
      "気になる症状：痛がっている、せきが出る。その他：昨日の夜から熱があります。",
    );
  });

  test("選んだ順ではなく、表の順に並べる", () => {
    assert.equal(composeConcern(["熱がある", "痛がっている"], ""), "気になる症状：痛がっている、熱がある。");
  });

  test("自由記載だけなら、書いた文のまま（前と同じ形）", () => {
    assert.equal(composeConcern([], "お腹は痛がっていません。"), "お腹は痛がっていません。");
  });

  test("どちらもない、空白だけのときは null", () => {
    assert.equal(composeConcern([], ""), null);
    assert.equal(composeConcern([], "   "), null);
  });
});

describe("500文字の上限", () => {
  test("選択肢を全部選んでも、その他に400文字以上書ける", () => {
    assert.ok(SUMMARY_TEXT_LIMIT - LONGEST_CHOICES_TEXT_LENGTH >= 400, String(LONGEST_CHOICES_TEXT_LENGTH));
  });

  test("まとめた文で上限を数える（全部選んで、残りいっぱいなら上限ちょうど、1文字多いと超える）", () => {
    const room = SUMMARY_TEXT_LIMIT - LONGEST_CHOICES_TEXT_LENGTH;
    const all = answered([...CONCERN_CHOICES]);
    const fits = { ...family, concernChoices: all, chiefConcern: answered("あ".repeat(room)) };
    assert.equal(isConcernOverLimit(fits), false);
    const sent = withComposedConcern(fits).chiefConcern;
    assert.equal(sent.status === "answered" ? countChars(sent.value) : 0, SUMMARY_TEXT_LIMIT);
    const over = { ...family, concernChoices: all, chiefConcern: answered("あ".repeat(room + 1)) };
    assert.equal(isConcernOverLimit(over), true);
  });
});

describe("送るデータ（lib/summary は変えない）", () => {
  test("まとめた文を chiefConcern として送り、サーバーの入力チェックを通る", () => {
    const choices: ConcernChoice[] = ["痛がっている", "熱がある"];
    const answers: FamilyAnswers = {
      ...family,
      concernChoices: answered(choices),
      chiefConcern: answered("元気はあります。"),
    };
    const unansweredPatient = { respondent: "patient", status: "unanswered" } as const;
    const input = buildSummaryInput(
      { bodyParts: unansweredPatient, feelings: unansweredPatient, discomfort: unansweredPatient },
      withComposedConcern(answers),
    );
    assert.equal(input.family.chiefConcern, "気になる症状：痛がっている、熱がある。その他：元気はあります。");
    assert.deepEqual(parseSummaryInput(input), input);
  });

  test("選択肢を選ばなければ、前と同じく自由記載だけを送る", () => {
    const answers = { ...family, chiefConcern: answered("お腹は痛がっていません。") };
    const composed = withComposedConcern(answers);
    assert.deepEqual(composed.chiefConcern, answered("お腹は痛がっていません。"));
  });
});

describe("見直しと医師の画面の行", () => {
  test("行の名前は「保護者から見た気になる症状」で、中身は送る文と同じ", () => {
    const row = buildFamilyRows({
      ...family,
      concernChoices: answered<ConcernChoice[]>(["吐いた・吐き気がある"]),
    }).find((item) => item.key === "chiefConcern");
    assert.equal(row?.label, "保護者から見た気になる症状");
    assert.equal(row?.text, "気になる症状：吐いた・吐き気がある。");
  });
});
