import { countChars, SUMMARY_TEXT_LIMIT } from "@/lib/summary/types";

// AI の要約に送る欄の文字数を表示する。上限を超えたら知らせる（入力は切り捨てない）
export function CharCount({ text }: { text: string }) {
  const count = countChars(text);
  const isOver = count > SUMMARY_TEXT_LIMIT;

  return (
    <p
      aria-live="polite"
      className={`mt-2 text-support ${
        isOver ? "font-bold text-error" : "text-on-surface-variant"
      }`}
    >
      {count}／{SUMMARY_TEXT_LIMIT}文字
      {isOver &&
        `　${SUMMARY_TEXT_LIMIT}文字をこえています。このままでは、AIの要約に使われません。`}
    </p>
  );
}
