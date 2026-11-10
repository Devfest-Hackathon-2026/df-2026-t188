// 画面の順番と、進み具合のバーの区切りのテスト
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { flowSteps, progressOf } from "@/lib/intake/flow";

// 「いたい」を選んだとき（「どこが へん？」を出す）と、選ばなかったとき
const withPain = { asksBody: true };
const withoutPain = { asksBody: false };

describe("画面の順番", () => {
  test("保護者は「お子さんのこと」と「家族からの記録」の2画面で、そのあと見直し", () => {
    const keys = flowSteps("able", withPain).map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("familyProfile"), keys.indexOf("review") + 1), [
      "familyProfile",
      "familyRecord",
      "review",
    ]);
  });

  test("「できる」：主訴 → 場所 → 程度 → そのほか → 区切り", () => {
    const keys = flowSteps("able", withPain).map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("ability"), keys.indexOf("familyProfile") + 1), [
      "ability",
      "patientFeeling",
      "patientBody",
      "patientDiscomfort",
      "patientOther",
      "patientBreak",
      "familyProfile",
    ]);
  });

  test("「いたい」を選ばなかったら、「どんなかんじ」→「どれくらい つらい」→「ほかにも きになることは ある？」", () => {
    const keys = flowSteps("able", withoutPain).map((item) => item.key);
    assert.equal(keys.includes("patientBody"), false);
    assert.equal(keys[keys.indexOf("patientFeeling") + 1], "patientDiscomfort");
    assert.equal(keys[keys.indexOf("patientDiscomfort") + 1], "patientOther");
  });

  test("「難しい」：こどもの画面（区切りも）を飛ばす", () => {
    const keys = flowSteps("difficult", withPain).map((item) => item.key);
    for (const skipped of [
      "patientFeeling",
      "patientBody",
      "patientDiscomfort",
      "patientOther",
      "patientBreak",
    ]) {
      assert.equal(keys.includes(skipped as never), false, skipped);
    }
    assert.equal(keys[keys.indexOf("ability") + 1], "familyProfile");
  });
});

describe("進み具合のバー", () => {
  test("「できる」は7区切り（誰が答えるか／症状を選ぶ／場所とつらさ／ほかにも／基本情報／家族からの記録／確認）", () => {
    const current = (step: Parameters<typeof progressOf>[0]) =>
      progressOf(step, "able", withPain)?.current;
    assert.equal(progressOf("ability", "able", withPain)?.total, 7);
    assert.equal(current("ability"), 1);
    assert.equal(current("patientFeeling"), 2);
    assert.equal(current("patientBody"), 3);
    assert.equal(current("patientDiscomfort"), 3);
    assert.equal(current("patientOther"), 4);
    assert.equal(current("familyProfile"), 5);
    assert.equal(current("familyRecord"), 6);
    assert.equal(current("review"), 7);
  });

  test("「場所とつらさ」には「どこが へん？」と「どれくらい つらい？」が入り、中の位置を数える", () => {
    assert.deepEqual(progressOf("patientBody", "able", withPain)?.inSegment, { index: 1, count: 2 });
    assert.deepEqual(progressOf("patientDiscomfort", "able", withPain)?.inSegment, { index: 2, count: 2 });
  });

  test("「いたい」を選ばなければ、「場所とつらさ」は「どれくらい つらい？」の1画面だけで、中の位置は数えない", () => {
    assert.deepEqual(progressOf("patientDiscomfort", "able", withoutPain), { total: 7, current: 3, inSegment: null });
    assert.deepEqual(progressOf("patientOther", "able", withoutPain), { total: 7, current: 4, inSegment: null });
  });

  test("画面が1つだけの区切りでは、中の位置を数えない", () => {
    assert.equal(progressOf("patientFeeling", "able", withPain)?.inSegment, null);
    assert.equal(progressOf("patientOther", "able", withPain)?.inSegment, null);
    assert.equal(progressOf("familyRecord", "able", withPain)?.inSegment, null);
  });

  test("「難しい」はこどもの3区切りを飛ばして4区切り。基本情報が2、家族からの記録が3、確認が4", () => {
    assert.deepEqual(progressOf("ability", "difficult", withPain), { total: 4, current: 1, inSegment: null });
    assert.deepEqual(progressOf("familyProfile", "difficult", withPain), { total: 4, current: 2, inSegment: null });
    assert.deepEqual(progressOf("familyRecord", "difficult", withPain), { total: 4, current: 3, inSegment: null });
    assert.deepEqual(progressOf("review", "difficult", withPain), { total: 4, current: 4, inSegment: null });
  });

  test("まだ選んでいないときの確認の画面は、「できる」と同じ7区切りで数える", () => {
    assert.deepEqual(progressOf("ability", null, withPain), { total: 7, current: 1, inSegment: null });
  });

  test("ようこそ、区切り、医師、終了の画面にはバーを出さない", () => {
    for (const step of ["welcome", "patientBreak", "doctor", "end"] as const) {
      assert.equal(progressOf(step, "able", withPain), null, step);
    }
  });
});
