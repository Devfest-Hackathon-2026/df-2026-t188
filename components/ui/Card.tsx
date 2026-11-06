import type { ReactNode } from "react";

// カード。白い面に、2px の枠と下だけ厚い縁。カードの中にカードは入れない（二重の枠を作らない）
type Tone =
  | "plain" // ふつうのカード
  | "highlight" // 一番目立たせるカード（AI の要約）
  | "caution" // 要確認・不明
  | "error"; // 文字数の上限超えのお知らせ

const TONE_CLASS: Record<Tone, string> = {
  plain: "card-frame bg-surface-container-lowest text-on-surface",
  highlight:
    "border-2 border-b-4 border-primary border-b-primary-shade bg-surface-container-lowest text-on-surface",
  caution: "bg-caution-container text-on-caution-container",
  error: "bg-error-container text-on-error-container",
};

type CardProps = {
  tone?: Tone;
  as?: "section" | "div";
  role?: "alert";
  className?: string;
  children: ReactNode;
};

export function Card({
  tone = "plain",
  as: Tag = "section",
  role,
  className = "",
  children,
}: CardProps) {
  return (
    <Tag role={role} className={`rounded-lg p-4 ${TONE_CLASS[tone]} ${className}`}>
      {children}
    </Tag>
  );
}
