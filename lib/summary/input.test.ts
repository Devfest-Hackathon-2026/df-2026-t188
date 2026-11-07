// Gemini に送るデータの組み立てのテスト。データはすべて架空。Gemini は呼ばない
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { FamilyAnswers, PatientAnswers } from "@/lib/intake/types";
import {
  buildSummaryInput,
  findOverLimitFields,
  isEmptySummaryInput,
} from "@/lib/summary/input";
import { parseSummaryInput } from "@/lib/summary/validate";

const answeredPatient = <T>(value: T) =>
  ({ respondent: "patient", status: "answered", value }) as const;
const answeredFamily = <T>(value: T) =>
  ({ respondent: "family", status: "answered", value }) as const;
const unansweredPatient = { respondent: "patient", status: "unanswered" } as const;
const unansweredFamily = { respondent: "family", status: "unanswered" } as const;
const unable = {
  respondent: "patient",
  status: "unable",
  reason: "difficult_at_start",
} as const;

const patient: PatientAnswers = {
  bodyParts: answeredPatient(["お腹"]),
  feelings: answeredPatient(["いたい"]),
  discomfort: answeredPatient(3),
};

const family: FamilyAnswers = {
  chiefConcern: answeredFamily("頭をおさえている"),
  onset: answeredFamily("今日"),
  temperature: answeredFamily({ kind: "not_measured" }),
  foodIntake: answeredFamily("少ない"),
  medications: answeredFamily({ kind: "yes", text: "架空の薬" }),
  allergies: answeredFamily({ kind: "yes", text: "架空のアレルギー" }),
  conditions: answeredFamily({ kind: "yes", text: "架空の持病" }),
  age: answeredFamily("8"),
  weight: answeredFamily("25"),
};

describe("送らない項目", () => {
  test("薬・アレルギー・持病・年齢・体重に答えていても、送るデータに入らない", () => {
    const input = buildSummaryInput(patient, family);
    assert.deepEqual(Object.keys(input.family).sort(), [
      "chiefConcern",
      "foodIntake",
      "onset",
      "temperature",
    ]);
    assert.doesNotMatch(JSON.stringify(input), /架空の薬|架空のアレルギー|架空の持病/);
  });
});

describe("送れない選択肢", () => {
  test("「そのほか・わからない」だけが外れ、ほかの選択肢は残る", () => {
    const input = buildSummaryInput(
      { ...patient, feelings: answeredPatient(["いたい", "そのほか・わからない"]) },
      family,
    );
    assert.deepEqual(input.patient.feelings, ["いたい"]);
  });

  test("「そのほか・わからない」しか選んでいなければ、項目ごと外れる", () => {
    const input = buildSummaryInput(
      { ...patient, feelings: answeredPatient(["そのほか・わからない"]) },
      family,
    );
    assert.equal("feelings" in input.patient, false);
  });

  test("いつからの「わからない」が外れる", () => {
    const input = buildSummaryInput(patient, {
      ...family,
      onset: answeredFamily("わからない"),
    });
    assert.equal("onset" in input.family, false);
  });

  test("「難しい」を選ぶと、本人の項目が空になる", () => {
    const input = buildSummaryInput(
      { bodyParts: unable, feelings: unable, discomfort: unable },
      family,
    );
    assert.deepEqual(input.patient, {});
  });
});

describe("文字の形", () => {
  test("測った体温は「数字 ℃」にする", () => {
    const input = buildSummaryInput(patient, {
      ...family,
      temperature: answeredFamily({ kind: "measured", celsius: "38.5" }),
    });
    assert.equal(input.family.temperature, "38.5 ℃");
  });

  test("測っていないときは「測っていない」にする", () => {
    assert.equal(buildSummaryInput(patient, family).family.temperature, "測っていない");
  });

  test("つらさは「言葉（5段階の数字）」にする", () => {
    assert.equal(
      buildSummaryInput(patient, family).patient.discomfort,
      "つらい（5段階の3）",
    );
  });
});

describe("両方とも空かの判定", () => {
  const nothingFamily: FamilyAnswers = {
    chiefConcern: unansweredFamily,
    onset: unansweredFamily,
    temperature: unansweredFamily,
    foodIntake: unansweredFamily,
    medications: unansweredFamily,
    allergies: unansweredFamily,
    conditions: unansweredFamily,
    age: unansweredFamily,
    weight: unansweredFamily,
  };

  test("何も答えていなければ空とする", () => {
    const input = buildSummaryInput(
      {
        bodyParts: unansweredPatient,
        feelings: unansweredPatient,
        discomfort: unansweredPatient,
      },
      nothingFamily,
    );
    assert.equal(isEmptySummaryInput(input), true);
  });

  test("薬などに答えていても、送る項目がなければ空とする", () => {
    const input = buildSummaryInput(
      {
        bodyParts: unansweredPatient,
        feelings: unansweredPatient,
        discomfort: unansweredPatient,
      },
      { ...nothingFamily, medications: answeredFamily({ kind: "no" }) },
    );
    assert.equal(isEmptySummaryInput(input), true);
  });
});

describe("文字数の上限", () => {
  const withConcern = (length: number) =>
    buildSummaryInput(patient, {
      ...family,
      chiefConcern: answeredFamily("あ".repeat(length)),
    });

  test("500文字なら上限を超えていない", () => {
    assert.deepEqual(findOverLimitFields(withConcern(500)), []);
  });

  test("501文字なら一番心配なことが上限を超えている", () => {
    assert.deepEqual(findOverLimitFields(withConcern(501)), [
      { respondent: "family", label: "一番心配なこと" },
    ]);
  });
});

describe("入力チェックとのつながり", () => {
  test("組み立てたデータが、入力チェックを通る", () => {
    const input = buildSummaryInput(patient, family);
    assert.deepEqual(parseSummaryInput(input), input);
  });
});
