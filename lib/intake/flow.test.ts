// 画面の順番と、進み具合のバーの区切りのテスト
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { flowSteps, progressOf } from "@/lib/intake/flow";

describe("画面の順番", () => {
  test("保護者は「お子さんのこと」と「家族からの記録」の2画面で、そのあと見直し", () => {
    const keys = flowSteps("able").map((item) => item.key);
    assert.deepEqual(keys.slice(keys.indexOf("familyProfile"), keys.indexOf("review") + 1), [
      "familyProfile",
      "familyRecord",
      "review",
    ]);
  });

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
  test("「できる」は7区切り（誰が答えるか／症状を選ぶ／症状を詳しく／つらさ／基本情報／家族からの記録／確認）", () => {
    assert.deepEqual(progressOf("ability", "able"), { total: 7, current: 1 });
    assert.deepEqual(progressOf("patientFeeling", "able"), { total: 7, current: 2 });
    assert.deepEqual(progressOf("patientBody", "able"), { total: 7, current: 3 });
    assert.deepEqual(progressOf("patientDiscomfort", "able"), { total: 7, current: 4 });
    assert.deepEqual(progressOf("familyProfile", "able"), { total: 7, current: 5 });
    assert.deepEqual(progressOf("familyRecord", "able"), { total: 7, current: 6 });
    assert.deepEqual(progressOf("review", "able"), { total: 7, current: 7 });
  });

  test("「難しい」はこどもの3区切りを飛ばして4区切り。基本情報が2、家族からの記録が3、確認が4", () => {
    assert.deepEqual(progressOf("ability", "difficult"), { total: 4, current: 1 });
    assert.deepEqual(progressOf("familyProfile", "difficult"), { total: 4, current: 2 });
    assert.deepEqual(progressOf("familyRecord", "difficult"), { total: 4, current: 3 });
    assert.deepEqual(progressOf("review", "difficult"), { total: 4, current: 4 });
  });

  test("まだ選んでいないときの確認の画面は、「できる」と同じ7区切りで数える", () => {
    assert.deepEqual(progressOf("ability", null), { total: 7, current: 1 });
  });

  test("ようこそ、区切り、医師、終了の画面にはバーを出さない", () => {
    for (const step of ["welcome", "patientBreak", "doctor", "end"] as const) {
      assert.equal(progressOf(step, "able"), null, step);
    }
  });
});
