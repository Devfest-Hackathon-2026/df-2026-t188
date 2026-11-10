// 「不明」の判定と、薬・アレルギーの ⚠ の行のテスト。データはすべて架空
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { FamilyAnswers, PatientAnswers, Presence } from "@/lib/intake/types";
import {
  buildFamilyRows,
  buildPatientRows,
  getUnknownRows,
  safetyNotice,
} from "@/lib/intake/unknowns";
import { EMPTY_SYMPTOMS } from "@/lib/intake/symptoms";

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
const dontKnow = answeredFamily<Presence>({ kind: "dont_know" });

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
  medications: answeredFamily({ kind: "no" }),
  allergies: answeredFamily({ kind: "no" }),
  conditions: answeredFamily({ kind: "no" }),
  age: answeredFamily("8"),
  sex: answeredFamily("女の子"),
  weight: answeredFamily("25"),
};

const unknownKeys = (p: PatientAnswers, f: FamilyAnswers) =>
  getUnknownRows(p, f).map((row) => row.key);

describe("「不明」の数え方", () => {
  test("全部答えると0件", () => {
    assert.deepEqual(unknownKeys(patient, family), []);
  });

  test("何も答えないと、必須の4件が不明になる（へんなところは「いたい」のときだけ聞くので任意）", () => {
    assert.deepEqual(
      unknownKeys(
        {
          bodyParts: unansweredPatient,
          feelings: unansweredPatient,
          discomfort: unansweredPatient,
        },
        {
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
        },
      ),
      ["discomfort", "onset", "medications", "allergies"],
    );
  });

  test("「難しい」は本人のつらさ1件が不明になる（へんなところは任意）", () => {
    assert.deepEqual(
      unknownKeys({ bodyParts: unable, feelings: unable, discomfort: unable }, family),
      ["discomfort"],
    );
  });

  test("「わからない」は、いつから・薬・アレルギーが不明になる", () => {
    assert.deepEqual(
      unknownKeys(patient, {
        ...family,
        onset: answeredFamily("わからない"),
        medications: dontKnow,
        allergies: dontKnow,
      }),
      ["onset", "medications", "allergies"],
    );
  });

  test("任意の項目は、未回答でも数えない", () => {
    assert.deepEqual(
      unknownKeys(
        { ...patient, feelings: unansweredPatient },
        {
          ...family,
          chiefConcern: unansweredFamily,
          temperature: unansweredFamily,
          foodIntake: unansweredFamily,
          conditions: unansweredFamily,
          age: unansweredFamily,
          sex: unansweredFamily,
          weight: unansweredFamily,
        },
      ),
      [],
    );
  });

  test("持病の「わからない」は数えない", () => {
    assert.deepEqual(unknownKeys(patient, { ...family, conditions: dontKnow }), []);
  });

  test("「ある」で内容が空でも、不明にしない", () => {
    assert.deepEqual(
      unknownKeys(patient, {
        ...family,
        medications: answeredFamily({ kind: "yes", text: "" }),
      }),
      [],
    );
  });
});

describe("薬・アレルギーの ⚠ の行", () => {
  test("「ある」で内容ありなら、⚠ の行に内容を入力どおりに出す", () => {
    assert.deepEqual(
      safetyNotice("アレルギー", answeredFamily({ kind: "yes", text: "架空のアレルギー" })),
      { kind: "present", text: "⚠ アレルギーあり：架空のアレルギー" },
    );
  });

  test("「ある」で内容なしなら、⚠ の行に記入なしと出す", () => {
    assert.deepEqual(
      safetyNotice("飲んでいる薬", answeredFamily({ kind: "yes", text: "" })),
      { kind: "present", text: "⚠ 飲んでいる薬あり：（内容の記入なし）" },
    );
  });

  test("「わからない」は未確認にする", () => {
    assert.deepEqual(safetyNotice("アレルギー", dontKnow), {
      kind: "unconfirmed",
      text: "アレルギー：未確認",
    });
  });

  test("未回答は未確認にする", () => {
    assert.deepEqual(safetyNotice("飲んでいる薬", unansweredFamily), {
      kind: "unconfirmed",
      text: "飲んでいる薬：未確認",
    });
  });

  test("「ない」は何も出さない", () => {
    assert.equal(safetyNotice("アレルギー", answeredFamily({ kind: "no" })), null);
  });
});

describe("見直しと医師の画面の行", () => {
  test("こどもの行は、入力の順（どんなかんじ → へんなところ → 詳しい答え → ほかに きになること → つらさ）", () => {
    assert.deepEqual(
      buildPatientRows(patient, {
        ...EMPTY_SYMPTOMS,
        categories: ["pain", "sick"],
        details: { sick: ["おなかがむかむか"] },
        otherGate: "ない",
      }).map((row) => row.key),
      ["feelings", "bodyParts", "detail-sick", "otherSymptoms", "discomfort"],
    );
  });

  test("保護者の行は、入力の順（お子さんのこと → 心配なこと → … → 持病）", () => {
    assert.deepEqual(
      buildFamilyRows(family).map((row) => row.key),
      [
        "age",
        "sex",
        "weight",
        "chiefConcern",
        "onset",
        "temperature",
        "foodIntake",
        "medications",
        "allergies",
        "conditions",
      ],
    );
  });

  test("性別は選んだまま出す。任意。身長の行はない", () => {
    const rows = buildFamilyRows(family);
    const sex = rows.find((row) => row.key === "sex");
    assert.deepEqual([sex?.text, sex?.required], ["女の子", false]);
    assert.equal(rows.some((row) => row.key === "height"), false);
  });
});

describe("こどもの主症状と「ほかに きになること」の行（Gemini には送らず、言葉で出すだけ）", () => {
  test("主症状は、送らないもの（かぜっぽい、そのほか、わからない）も画面の言葉で出す", () => {
    const rows = buildPatientRows(patient, {
      ...EMPTY_SYMPTOMS,
      categories: ["fever", "pain", "other"],
    });
    assert.equal(rows[0].text, "かぜっぽい、いたい、そのほか");
  });

  test("詳しい答えと「ほかに きになること」は、答えていなければ行にしない", () => {
    const rows = buildPatientRows(patient, { ...EMPTY_SYMPTOMS, categories: ["pain", "cough"] });
    assert.deepEqual(rows.map((row) => row.key), ["feelings", "bodyParts", "discomfort"]);
  });

  test("詳しい答えは、主症状ごとに言葉で出す。「わからない」だけなら わからない（と回答）にする", () => {
    const rows = buildPatientRows(patient, {
      ...EMPTY_SYMPTOMS,
      categories: ["cough", "fever"],
      details: { cough: ["たんがからむ", "ぜえぜえする"], fever: ["わからない"] },
    });
    const cough = rows.find((row) => row.key === "detail-cough");
    assert.deepEqual([cough?.label, cough?.text], ["「せきがでる」について（本人が選んだもの）", "たんがからむ、ぜえぜえする"]);
    assert.equal(rows.find((row) => row.key === "detail-fever")?.state, "dont_know");
  });

  test("ほかに きになること：ある＋選んだもの、ない、わからない を分けて出す", () => {
    const row = (otherGate: "ある" | "ない" | "わからない", other: string[] = []) =>
      buildPatientRows(patient, { ...EMPTY_SYMPTOMS, otherGate, other }).find(
        (item) => item.key === "otherSymptoms",
      );
    assert.equal(row("ある", ["かゆい", "しびれる"])?.text, "かゆい、しびれる");
    assert.equal(row("ない")?.text, "ない（と回答）");
    assert.equal(row("わからない")?.state, "dont_know");
  });

  test("「ほかに きになること」の行は任意なので、不明に数えない", () => {
    const rows = buildPatientRows(patient, {
      categories: ["pain"],
      details: {},
      otherGate: "わからない",
      other: [],
    });
    assert.equal(rows.filter((item) => item.required && item.state !== "answered").length, 0);
  });
});
