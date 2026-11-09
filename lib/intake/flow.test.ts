// 画面の順番と、進み具合のバーの区切りのテスト
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { flowSteps, progressOf } from "@/lib/intake/flow";

// 「いたい」を選んだとき（「どこが へん？」を出す）と、選ばなかったとき
const withPain = (detailCount: number) => ({ detailCount, asksBody: true });
const withoutPain = (detailCount: number) => ({ detailCount, asksBody: false });

describe("画面の順番", () => {
  test("保護者は「お子さんのこと」と「家族からの記録」の2画面で、そのあと見直し", () => {
    const keys = flowSteps("able", withPain(1)).map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("familyProfile"), keys.indexOf("review") + 1), [
      "familyProfile",
      "familyRecord",
      "review",
    ]);
  });

  test("「できる」：症状をえらぶ → 詳細の画面（選んだ数だけ）→ どこが へん → つらさ → 区切り", () => {
    const keys = flowSteps("able", withPain(3)).map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("ability"), keys.indexOf("familyProfile") + 1), [
      "ability",
      "patientFeeling",
      "patientDetail1",
      "patientDetail2",
      "patientDetail3",
      "patientBody",
      "patientDiscomfort",
      "patientBreak",
      "familyProfile",
    ]);
  });

  test("詳細の画面は、数を超える枠を通らない（主症状を選ばなくても「そのほか」の1つは通る）", () => {
    const keys = flowSteps("able", withPain(1)).map((item) => item.key);
    assert.equal(keys.includes("patientDetail1"), true);
    assert.equal(keys.includes("patientDetail2"), false);
  });

  test("「難しい」：こどもの画面（詳細の画面と区切りも）を飛ばす", () => {
    const keys = flowSteps("difficult", withPain(3)).map((item) => item.key);
    for (const skipped of [
      "patientFeeling",
      "patientDetail1",
      "patientBody",
      "patientDiscomfort",
      "patientBreak",
    ]) {
      assert.equal(keys.includes(skipped as never), false, skipped);
    }
    assert.equal(keys[keys.indexOf("ability") + 1], "familyProfile");
  });
});

describe("「どこが へん？」は「いたい」を選んだときだけ", () => {
  test("「いたい」を選ばなかったら、詳細の画面のあとは「どれくらい つらい」", () => {
    const keys = flowSteps("able", withoutPain(2)).map((item) => item.key);
    assert.equal(keys.includes("patientBody"), false);
    assert.equal(keys[keys.indexOf("patientDetail2") + 1], "patientDiscomfort");
  });

  test("「症状を詳しく」の区切りの中の数も変わる（詳細2つだけ）", () => {
    assert.deepEqual(progressOf("patientDetail2", "able", withoutPain(2))?.inSegment, { index: 2, count: 2 });
    assert.deepEqual(progressOf("patientDetail2", "able", withPain(2))?.inSegment, { index: 2, count: 3 });
  });

  test("「いたい」を選ばず、詳細が「そのほか」の1つだけなら、区切りの中の位置は数えない", () => {
    assert.equal(progressOf("patientDetail1", "able", withoutPain(1))?.inSegment, null);
    assert.equal(progressOf("patientDetail1", "able", withoutPain(1))?.current, 3);
  });
});

describe("進み具合のバー", () => {
  test("「できる」は7区切り（誰が答えるか／症状を選ぶ／症状を詳しく／つらさ／基本情報／家族からの記録／確認）", () => {
    assert.deepEqual(progressOf("ability", "able", withPain(2))?.total, 7);
    assert.deepEqual(progressOf("ability", "able", withPain(2))?.current, 1);
    assert.deepEqual(progressOf("patientFeeling", "able", withPain(2))?.current, 2);
    assert.deepEqual(progressOf("patientDetail1", "able", withPain(2))?.current, 3);
    assert.deepEqual(progressOf("patientBody", "able", withPain(2))?.current, 3);
    assert.deepEqual(progressOf("patientDiscomfort", "able", withPain(2))?.current, 4);
    assert.deepEqual(progressOf("familyProfile", "able", withPain(2))?.current, 5);
    assert.deepEqual(progressOf("familyRecord", "able", withPain(2))?.current, 6);
    assert.deepEqual(progressOf("review", "able", withPain(2))?.current, 7);
  });

  test("「症状を詳しく」には詳細の画面と「どこが へん？」が入り、中の位置を数える", () => {
    // 詳細の画面が2つなら、区切りの中は3画面（詳細2つ＋どこが へん）
    assert.deepEqual(progressOf("patientDetail1", "able", withPain(2))?.inSegment, { index: 1, count: 3 });
    assert.deepEqual(progressOf("patientDetail2", "able", withPain(2))?.inSegment, { index: 2, count: 3 });
    assert.deepEqual(progressOf("patientBody", "able", withPain(2))?.inSegment, { index: 3, count: 3 });
  });

  test("画面が1つだけの区切りでは、中の位置を数えない", () => {
    assert.equal(progressOf("patientFeeling", "able", withPain(2))?.inSegment, null);
    assert.equal(progressOf("familyRecord", "able", withPain(2))?.inSegment, null);
  });

  test("「難しい」はこどもの3区切りを飛ばして4区切り。基本情報が2、家族からの記録が3、確認が4", () => {
    assert.deepEqual(progressOf("ability", "difficult", withPain(1)), { total: 4, current: 1, inSegment: null });
    assert.deepEqual(progressOf("familyProfile", "difficult", withPain(1)), { total: 4, current: 2, inSegment: null });
    assert.deepEqual(progressOf("familyRecord", "difficult", withPain(1)), { total: 4, current: 3, inSegment: null });
    assert.deepEqual(progressOf("review", "difficult", withPain(1)), { total: 4, current: 4, inSegment: null });
  });

  test("まだ選んでいないときの確認の画面は、「できる」と同じ7区切りで数える", () => {
    assert.deepEqual(progressOf("ability", null, withPain(1)), { total: 7, current: 1, inSegment: null });
  });

  test("ようこそ、区切り、医師、終了の画面にはバーを出さない", () => {
    for (const step of ["welcome", "patientBreak", "doctor", "end"] as const) {
      assert.equal(progressOf(step, "able", withPain(1)), null, step);
    }
  });
});
