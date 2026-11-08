// 案内ボックスの決まった文と表情のテスト。データはすべて架空
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { guideFor } from "@/lib/intake/guide";
import type { FamilyAnswers, PatientAnswers } from "@/lib/intake/types";

const unansweredPatient = { respondent: "patient", status: "unanswered" } as const;
const unansweredFamily = { respondent: "family", status: "unanswered" } as const;

const patient: PatientAnswers = {
  bodyParts: unansweredPatient,
  feelings: unansweredPatient,
  discomfort: unansweredPatient,
};

const family: FamilyAnswers = {
  chiefConcern: unansweredFamily,
  onset: unansweredFamily,
  temperature: unansweredFamily,
  foodIntake: unansweredFamily,
  medications: unansweredFamily,
  allergies: unansweredFamily,
  conditions: unansweredFamily,
  age: unansweredFamily,
  sex: unansweredFamily,
  height: unansweredFamily,
  weight: unansweredFamily,
};

describe("こどもの画面の案内", () => {
  test("何も選んでいないときは hello で、返事はない", () => {
    const guide = guideFor("patientFeeling", patient, family);
    assert.equal(guide?.pose, "hello");
    assert.equal(guide?.title, "どんな かんじ？");
    assert.equal(guide?.reaction, "");
  });

  test("選んだら listen で、最後に選んだものを、画面の言葉で返す", () => {
    const guide = guideFor(
      "patientBody",
      { ...patient, bodyParts: { respondent: "patient", status: "answered", value: ["お腹", "頭"] } },
      family,
    );
    assert.equal(guide?.pose, "listen");
    assert.equal(guide?.reaction, "「あたま」を えらんだね");
  });

  test("「そのほか・わからない」を選んだら think で、「わからなくても だいじょうぶだよ」", () => {
    const guide = guideFor(
      "patientFeeling",
      {
        ...patient,
        feelings: { respondent: "patient", status: "answered", value: ["いたい", "そのほか・わからない"] },
      },
      family,
    );
    assert.equal(guide?.pose, "think");
    assert.equal(guide?.reaction, "わからなくても だいじょうぶだよ");
  });

  test("つらさは empathy で、選んだ段階の言葉を返す（数字にしない）", () => {
    const guide = guideFor(
      "patientDiscomfort",
      { ...patient, discomfort: { respondent: "patient", status: "answered", value: 4 } },
      family,
    );
    assert.equal(guide?.pose, "empathy");
    assert.equal(guide?.reaction, "「とても つらい」だね。おしえてくれて ありがとう");
  });
});

describe("保護者の画面と見直しの案内", () => {
  test("入力する前は calm、その画面の項目に1つ答えたら listen。説明を残すため返事は出さない", () => {
    assert.equal(guideFor("familyCondition", patient, family)?.pose, "calm");
    const answered = guideFor(
      "familyCondition",
      patient,
      { ...family, foodIntake: { respondent: "family", status: "answered", value: "少ない" } },
    );
    assert.equal(answered?.pose, "listen");
    assert.equal(answered?.reaction, "");
    assert.equal(answered?.description, "わかる範囲で教えてください。");
  });

  test("ほかの画面の項目に答えても、この画面の表情は変わらない", () => {
    const guide = guideFor(
      "familyProfile",
      patient,
      { ...family, foodIntake: { respondent: "family", status: "answered", value: "少ない" } },
    );
    assert.equal(guide?.pose, "calm");
  });

  test("見直しは checklist", () => {
    assert.equal(guideFor("review", patient, family)?.pose, "checklist");
  });

  test("ようこそ、区切り、医師、終了の画面には案内ボックスを置かない", () => {
    for (const step of ["welcome", "patientBreak", "doctor", "end"] as const) {
      assert.equal(guideFor(step, patient, family), null, step);
    }
  });
});
