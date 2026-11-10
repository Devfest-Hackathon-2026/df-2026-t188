// 画面の順番と、進み具合のバーの区切りのテスト
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { detailCategoryOf, flowSteps, progressOf } from "@/lib/intake/flow";

// 「いたい」だけを選んだとき（「どこが へん？」を出す）と、「きもちわるい」と「かぜっぽい」を選んだとき
const withPain = { asksBody: true, details: [] };
const sickAndFever = { asksBody: false, details: ["sick", "fever"] as const };
const allSymptoms = { asksBody: true, details: ["sick", "breath", "cough", "fever"] as const };

describe("画面の順番", () => {
  test("保護者は「お子さんのこと」と「家族からの記録」の2画面で、そのあと見直し", () => {
    const keys = flowSteps("able", withPain).map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("familyProfile"), keys.indexOf("review") + 1), [
      "familyProfile",
      "familyRecord",
      "review",
    ]);
  });

  test("「できる」：主訴 → 部位・状態の詳しい質問 → ほかにも → つらさ → 区切り", () => {
    const keys = flowSteps("able", allSymptoms).map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("ability"), keys.indexOf("familyProfile") + 1), [
      "ability",
      "patientFeeling",
      "patientBody",
      "patientDetailSick",
      "patientDetailBreath",
      "patientDetailCough",
      "patientDetailFever",
      "patientOther",
      "patientDiscomfort",
      "patientBreak",
      "familyProfile",
    ]);
  });

  test("詳しい質問は、選んだ主症状の分だけ出す。「いたい」を選ばなければ「どこが へん？」は出さない", () => {
    const keys = flowSteps("able", sickAndFever).map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("patientFeeling"), keys.indexOf("patientBreak") + 1), [
      "patientFeeling",
      "patientDetailSick",
      "patientDetailFever",
      "patientOther",
      "patientDiscomfort",
      "patientBreak",
    ]);
  });

  test("詳しい質問の画面から主症状がわかる", () => {
    assert.equal(detailCategoryOf("patientDetailCough"), "cough");
    assert.equal(detailCategoryOf("patientBody"), null);
  });

  test("「難しい」：こどもの画面（区切りも）を飛ばす", () => {
    const keys = flowSteps("difficult", allSymptoms).map((item) => item.key);
    for (const skipped of [
      "patientFeeling",
      "patientBody",
      "patientDetailSick",
      "patientOther",
      "patientDiscomfort",
      "patientBreak",
    ]) {
      assert.equal(keys.includes(skipped as never), false, skipped);
    }
    assert.equal(keys[keys.indexOf("ability") + 1], "familyProfile");
  });
});

describe("進み具合のバー", () => {
  test("「できる」は7区切り（誰が答えるか／症状を選ぶ／症状を くわしく／つらさ／基本情報／家族からの記録／確認）", () => {
    const current = (step: Parameters<typeof progressOf>[0]) =>
      progressOf(step, "able", allSymptoms)?.current;
    assert.equal(progressOf("ability", "able", allSymptoms)?.total, 7);
    assert.equal(current("ability"), 1);
    assert.equal(current("patientFeeling"), 2);
    assert.equal(current("patientBody"), 3);
    assert.equal(current("patientDetailFever"), 3);
    assert.equal(current("patientOther"), 3);
    assert.equal(current("patientDiscomfort"), 4);
    assert.equal(current("familyProfile"), 5);
    assert.equal(current("familyRecord"), 6);
    assert.equal(current("review"), 7);
  });

  test("「症状を くわしく」には部位・詳しい質問・ほかにも が入り、中の位置を数える", () => {
    assert.deepEqual(progressOf("patientBody", "able", allSymptoms)?.inSegment, { index: 1, count: 6 });
    assert.deepEqual(progressOf("patientDetailCough", "able", allSymptoms)?.inSegment, { index: 4, count: 6 });
    assert.deepEqual(progressOf("patientOther", "able", allSymptoms)?.inSegment, { index: 6, count: 6 });
    assert.deepEqual(progressOf("patientDetailFever", "able", sickAndFever)?.inSegment, { index: 2, count: 3 });
  });

  test("詳しい質問がなければ、「症状を くわしく」は「ほかにも」の1画面だけで、中の位置は数えない", () => {
    assert.deepEqual(progressOf("patientOther", "able", { asksBody: false, details: [] }), { total: 7, current: 3, inSegment: null });
  });

  test("画面が1つだけの区切りでは、中の位置を数えない", () => {
    assert.equal(progressOf("patientFeeling", "able", withPain)?.inSegment, null);
    assert.equal(progressOf("patientDiscomfort", "able", withPain)?.inSegment, null);
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
