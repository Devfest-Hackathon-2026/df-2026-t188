// 画面の順番と、進み具合のバーの区切りのテスト
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { flowSteps, progressOf } from "@/lib/intake/flow";

describe("画面の順番", () => {
  test("「できる」：こどもは どんな かんじ → どこが へん → つらさ → 区切り の順", () => {
    const keys = flowSteps("able").map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("ability"), keys.indexOf("familyProfile") + 1), [
      "ability",
      "patientFeeling",
      "patientBody",
      "patientDiscomfort",
      "patientBreak",
      "familyProfile",
    ]);
  });

  test("「難しい」：こどもの画面と区切りを飛ばす", () => {
    const keys = flowSteps("difficult").map((item) => item.key);
    for (const skipped of ["patientFeeling", "patientBody", "patientDiscomfort", "patientBreak"]) {
      assert.equal(keys.includes(skipped as never), false, skipped);
    }
    assert.equal(keys[keys.indexOf("ability") + 1], "familyProfile");
  });
});

describe("進み具合のバー", () => {
  test("「できる」は9区切り。確認が1、見直しが9", () => {
    assert.deepEqual(progressOf("ability", "able"), { total: 9, current: 1 });
    assert.deepEqual(progressOf("patientFeeling", "able"), { total: 9, current: 2 });
    assert.deepEqual(progressOf("familyProfile", "able"), { total: 9, current: 5 });
    assert.deepEqual(progressOf("review", "able"), { total: 9, current: 9 });
  });

  test("「難しい」は6区切り。保護者の最初が2、見直しが6", () => {
    assert.deepEqual(progressOf("ability", "difficult"), { total: 6, current: 1 });
    assert.deepEqual(progressOf("familyProfile", "difficult"), { total: 6, current: 2 });
    assert.deepEqual(progressOf("review", "difficult"), { total: 6, current: 6 });
  });

  test("まだ選んでいないときの確認の画面は、「できる」と同じ9区切りで数える", () => {
    assert.deepEqual(progressOf("ability", null), { total: 9, current: 1 });
  });

  test("ようこそ、区切り、医師、終了の画面にはバーを出さない", () => {
    for (const step of ["welcome", "patientBreak", "doctor", "end"] as const) {
      assert.equal(progressOf(step, "able"), null, step);
    }
  });
});
