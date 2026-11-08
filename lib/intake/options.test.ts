// 選択肢の表のテスト。画面に出す言葉と絵がそろっているか、
// 画面で選べる値が /api/summary の入力チェックを通るかを確かめる。データはすべて架空
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  BODY_PART_DISPLAY,
  BODY_PARTS,
  DISCOMFORT_FACE_SRC,
  DISCOMFORT_LEVELS,
  DISCOMFORT_TEXTS,
  FEELING_DISPLAY,
  FEELING_NOT_SENT,
  FEELINGS,
  type ChoiceDisplay,
} from "@/lib/intake/options";
import { parseSummaryInput } from "@/lib/summary/validate";

// WCAG の計算どおりの、2つの色の明るさの比
function contrastRatio(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

function assertDisplay(display: ChoiceDisplay | undefined, value: string) {
  assert.ok(display, `${value} の表示がない`);
  assert.notEqual(display.label.trim(), "", `${value} の言葉が空`);
  if ("emoji" in display.picture) {
    assert.notEqual(display.picture.emoji.trim(), "", `${value} の絵文字が空`);
  } else {
    assert.ok(display.picture.figure, `${value} の体の図の部位がない`);
  }
}

describe("画面に出す言葉と絵", () => {
  test("どんな かんじ：すべての選択肢に、言葉と絵がある", () => {
    for (const value of FEELINGS) assertDisplay(FEELING_DISPLAY[value], value);
    assert.equal(Object.keys(FEELING_DISPLAY).length, FEELINGS.length);
  });

  test("どこが へん：すべての選択肢に、言葉と絵がある", () => {
    for (const value of BODY_PARTS) assertDisplay(BODY_PART_DISPLAY[value], value);
    assert.equal(Object.keys(BODY_PART_DISPLAY).length, BODY_PARTS.length);
  });

  test("どこが へん：部位ごとの色があり、カードの文字との比が 4.5:1 以上", () => {
    // カードの文字の色（globals.css の on-surface と、選んだときの on-primary-container）
    const textColors = ["#0f172a", "#0369a1"];
    for (const value of BODY_PARTS) {
      const color = BODY_PART_DISPLAY[value].color;
      assert.match(color ?? "", /^#[0-9a-f]{6}$/i, `${value} の色がない`);
      for (const text of textColors) {
        const ratio = contrastRatio(text, color!);
        assert.ok(ratio >= 4.5, `${value}：${text} と ${color} の比が ${ratio.toFixed(2)}`);
      }
    }
  });

  test("どこが へん：部位ごとの色は、すべて違う", () => {
    const colors = BODY_PARTS.map((value) => BODY_PART_DISPLAY[value].color);
    assert.equal(new Set(colors).size, colors.length);
  });

  test("どれくらい つらい：5段階すべてに、public の下の顔の画像がある", () => {
    for (const level of DISCOMFORT_LEVELS) {
      assert.match(DISCOMFORT_FACE_SRC[level], /^\/mascot\/severity\/.+\.webp$/);
    }
  });
});

describe("画面で選べる値が、/api/summary の入力チェックを通る", () => {
  test("どこが へん：すべての部位をまとめて送れる", () => {
    const input = parseSummaryInput({ patient: { bodyParts: [...BODY_PARTS] }, family: {} });
    assert.deepEqual(input?.patient.bodyParts, [...BODY_PARTS]);
  });

  test("どんな かんじ：「そのほか・わからない」以外は送れる", () => {
    const sendable = FEELINGS.filter((value) => value !== FEELING_NOT_SENT);
    const input = parseSummaryInput({ patient: { feelings: sendable }, family: {} });
    assert.deepEqual(input?.patient.feelings, sendable);
  });

  test("どんな かんじ：「そのほか・わからない」は入力チェックで断られる（送らない値）", () => {
    assert.equal(
      parseSummaryInput({ patient: { feelings: [FEELING_NOT_SENT] }, family: {} }),
      null,
    );
  });

  test("どれくらい つらい：5段階のどれも送れる", () => {
    for (const text of DISCOMFORT_TEXTS) {
      assert.equal(
        parseSummaryInput({ patient: { discomfort: text }, family: {} })?.patient.discomfort,
        text,
      );
    }
  });
});
