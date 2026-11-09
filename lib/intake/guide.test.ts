// 案内ボックスの決まった文と表情のテスト。データはすべて架空
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { guideFor, type GuideContext } from "@/lib/intake/guide";
import { EMPTY_SYMPTOMS, type PatientSymptoms } from "@/lib/intake/symptoms";
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
  weight: unansweredFamily,
};

const context = (change: Partial<GuideContext> = {}): GuideContext => ({
  patient,
  family,
  symptoms: EMPTY_SYMPTOMS,
  otherReaction: null,
  ...change,
});

const withCategories = (categories: PatientSymptoms["categories"]) =>
  context({ symptoms: { ...EMPTY_SYMPTOMS, categories } });

describe("症状をえらぶ画面の案内（症状画面.html のとおり）", () => {
  test("何も選んでいないときは hello で、返事はない", () => {
    const guide = guideFor("patientFeeling", context());
    assert.equal(guide?.pose, "hello");
    assert.equal(guide?.title, "どんなかんじがする？");
    assert.equal(guide?.description, "あてはまるものを えらんでね。いくつでも えらべるよ。");
    assert.equal(guide?.reaction, "");
  });

  test("1つ選んだら listen と「『〇〇』を えらんだね。」", () => {
    const guide = guideFor("patientFeeling", withCategories(["fever"]));
    assert.equal(guide?.pose, "listen");
    assert.equal(guide?.reaction, "「かぜっぽい」を えらんだね。");
  });

  test("2つ以上なら listen と「いくつでも えらべるよ。」", () => {
    assert.equal(
      guideFor("patientFeeling", withCategories(["pain", "cough"]))?.reaction,
      "いくつでも えらべるよ。",
    );
  });

  test("「わからない」を選んでいたら think と「わからなくても だいじょうぶだよ。」", () => {
    const guide = guideFor("patientFeeling", withCategories(["pain", "unknown"]));
    assert.equal(guide?.pose, "think");
    assert.equal(guide?.reaction, "わからなくても だいじょうぶだよ。");
  });
});

describe("「ほかにも きになることは ある？」の案内（症状画面.html のとおり）", () => {
  test("見出しは「ほかにも きになることは ある？」で、think と「ほかにも あれば おしえてね。」", () => {
    const guide = guideFor("patientOther", withCategories(["cough", "pain"]));
    assert.equal(guide?.title, "ほかにも きになることは ある？");
    assert.equal(guide?.pose, "think");
    assert.equal(guide?.reaction, "ほかにも あれば おしえてね。");
  });

  test("押したあとは、わからない なら think、ほかは listen と「えらびなおすことも できるよ。」", () => {
    assert.equal(
      guideFor("patientOther", context({ otherReaction: "dontKnow" }))?.reaction,
      "わからなくても だいじょうぶだよ。",
    );
    const picked = guideFor("patientOther", context({ otherReaction: "pick" }));
    assert.equal(picked?.pose, "listen");
    assert.equal(picked?.reaction, "えらびなおすことも できるよ。");
  });
});

describe("どこが へん・つらさの案内", () => {
  test("選んだら listen で、最後に選んだものを、画面の言葉で返す", () => {
    const guide = guideFor(
      "patientBody",
      context({
        patient: { ...patient, bodyParts: { respondent: "patient", status: "answered", value: ["お腹", "頭"] } },
      }),
    );
    assert.equal(guide?.pose, "listen");
    assert.equal(guide?.reaction, "「あたま」を えらんだね");
  });

  test("つらさは empathy で、選んだ段階の言葉を返す（数字にしない）", () => {
    const guide = guideFor(
      "patientDiscomfort",
      context({ patient: { ...patient, discomfort: { respondent: "patient", status: "answered", value: 4 } } }),
    );
    assert.equal(guide?.pose, "empathy");
    assert.equal(guide?.reaction, "「とても つらい」だね。おしえてくれて ありがとう");
  });
});

describe("保護者の画面と見直しの案内", () => {
  test("入力する前は calm、その画面の項目に1つ答えたら listen。説明を残すため返事は出さない", () => {
    assert.equal(guideFor("familyRecord", context())?.pose, "calm");
    const answered = guideFor(
      "familyRecord",
      context({ family: { ...family, foodIntake: { respondent: "family", status: "answered", value: "少ない" } } }),
    );
    assert.equal(answered?.pose, "listen");
    assert.equal(answered?.reaction, "");
    assert.equal(answered?.title, "家族からの記録");
    assert.equal(answered?.description, "保護者の方から見たようすを、わかる範囲で教えてください。");
  });

  test("ほかの画面の項目に答えても、この画面の表情は変わらない", () => {
    const guide = guideFor(
      "familyProfile",
      context({ family: { ...family, foodIntake: { respondent: "family", status: "answered", value: "少ない" } } }),
    );
    assert.equal(guide?.pose, "calm");
  });

  test("見直しは checklist", () => {
    assert.equal(guideFor("review", context())?.pose, "checklist");
  });

  test("ようこそ、区切り、医師、終了の画面には案内ボックスを置かない", () => {
    for (const step of ["welcome", "patientBreak", "doctor", "end"] as const) {
      assert.equal(guideFor(step, context()), null, step);
    }
  });
});
