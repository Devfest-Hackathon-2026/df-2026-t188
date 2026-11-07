// 入力チェックのテスト。データはすべて架空。Gemini は呼ばない
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseSummary, parseSummaryInput } from "@/lib/summary/validate";

const patient = {
  bodyParts: ["お腹"],
  feelings: ["いたい"],
  discomfort: "つらい（5段階の3）",
};
const family = {
  chiefConcern: "頭をおさえている",
  onset: "今日",
  temperature: "測っていない",
  foodIntake: "少ない",
};

const withPatient = (extra: object) => ({
  patient: { ...patient, ...extra },
  family,
});
const withFamily = (extra: object) => ({
  patient,
  family: { ...family, ...extra },
});

function assertRejected(value: unknown) {
  assert.equal(parseSummaryInput(value), null);
}

function assertAccepted(value: unknown) {
  assert.deepEqual(parseSummaryInput(value), value);
}

describe("送ってはいけない項目", () => {
  const forbidden = {
    medications: "架空の薬",
    allergies: "架空のアレルギー",
    conditions: "架空の持病",
    age: 8,
    weight: 25,
    height: 120,
    gender: "架空",
    name: "架空の名前",
  };

  for (const [key, value] of Object.entries(forbidden)) {
    test(`family に ${key} があると拒否する`, () => {
      assertRejected(withFamily({ [key]: value }));
    });
    test(`patient に ${key} があると拒否する`, () => {
      assertRejected(withPatient({ [key]: value }));
    });
  }

  test("一番外に余分な項目があると拒否する", () => {
    assertRejected({ patient, family, name: "架空の名前" });
  });
});

describe("正しいデータ", () => {
  test("全部の項目があるデータを通す", () => {
    assertAccepted({ patient, family });
  });

  test("片方が空でも通す", () => {
    assertAccepted({ patient: {}, family });
  });
});

describe("送れない選択肢", () => {
  test("どんなかんじの「そのほか・わからない」を拒否する", () => {
    assertRejected(withPatient({ feelings: ["いたい", "そのほか・わからない"] }));
  });

  test("いつからの「わからない」を拒否する", () => {
    assertRejected(withFamily({ onset: "わからない" }));
  });
});

describe("文字数の上限", () => {
  test("500文字は通す", () => {
    assertAccepted(withFamily({ chiefConcern: "あ".repeat(500) }));
  });

  test("501文字は拒否する", () => {
    assertRejected(withFamily({ chiefConcern: "あ".repeat(501) }));
  });

  test("空白だけは拒否する", () => {
    assertRejected(withFamily({ chiefConcern: "   " }));
  });

  test("絵文字も1文字と数え、500文字は通す", () => {
    assertAccepted(withFamily({ chiefConcern: "😀".repeat(500) }));
  });
});

describe("体温の形", () => {
  for (const temperature of ["38.5 ℃", "38 ℃", "３８．５ ℃", "測っていない"]) {
    test(`「${temperature}」を通す`, () => {
      assertAccepted(withFamily({ temperature }));
    });
  }

  for (const temperature of [38.5, "38.5", "38.5℃", "38.55 ℃"]) {
    test(`「${temperature}」（${typeof temperature}）を拒否する`, () => {
      assertRejected(withFamily({ temperature }));
    });
  }
});

describe("値の形", () => {
  test("へんなところのひらがなを拒否する", () => {
    assertRejected(withPatient({ bodyParts: ["おなか"] }));
  });

  test("空の配列を拒否する", () => {
    assertRejected(withPatient({ bodyParts: [] }));
  });

  test("重複を拒否する", () => {
    assertRejected(withPatient({ bodyParts: ["お腹", "お腹"] }));
  });

  test("つらさの数字を拒否する", () => {
    assertRejected(withPatient({ discomfort: 3 }));
  });

  test("null を拒否する", () => {
    assertRejected(withFamily({ onset: null }));
  });
});

describe("Gemini の出力の形", () => {
  const discrepancy = { topic: "症状の部位", patient: "お腹", family: "頭" };

  test("決まった形を通す", () => {
    const summary = {
      patientSummary: "本人の要約",
      familySummary: "保護者の要約",
      discrepancies: [discrepancy],
    };
    assert.deepEqual(parseSummary(summary), summary);
  });

  test("項目が欠けた形を拒否する", () => {
    assert.equal(
      parseSummary({ patientSummary: "本人の要約", familySummary: "保護者の要約" }),
      null,
    );
  });
});
