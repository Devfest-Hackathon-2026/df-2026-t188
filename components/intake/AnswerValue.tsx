import {
  missingStateLabel,
  type AnswerRow,
} from "@/lib/intake/unknowns";

// 未回答・回答困難・わからない（と回答）の表示。
// 必須の項目は「不明」として、要確認の色のバッジにする
export function MissingLabel({
  row,
  asUnknown,
}: {
  row: AnswerRow;
  asUnknown: boolean;
}) {
  if (row.state === "answered") return null;
  return asUnknown ? (
    <span className="inline-block rounded-sm bg-caution-container px-2 py-0.5 text-label font-bold text-on-caution-container">
      {missingStateLabel(row.state, true)}
    </span>
  ) : (
    <span className="text-on-surface-variant">
      {missingStateLabel(row.state, false)}
    </span>
  );
}

// 回答の値。入力どおりに表示する。言い換えや要約はしない
export function AnswerValue({
  row,
  asUnknown = row.required,
}: {
  row: AnswerRow;
  asUnknown?: boolean;
}) {
  return row.state === "answered" ? (
    <span className="break-words whitespace-pre-wrap">{row.text}</span>
  ) : (
    <MissingLabel row={row} asUnknown={asUnknown} />
  );
}
