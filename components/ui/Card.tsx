import type { ReactNode } from "react";

// M3 のカード。tone で面の色を決める
type Tone =
  | "primary" // 本人の回答
  | "secondary" // 家族・介護者の回答
  | "caution" // 「不明」などの注意
  | "error" // 文字数の上限超えのお知らせ
  | "surface" // AI の要約など
  | "outlined"; // 枠線だけ

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary-container text-on-surface",
  secondary: "bg-secondary-container text-on-surface",
  caution: "bg-caution-container text-on-caution-container",
  error: "bg-error-container text-on-error-container",
  surface: "border border-outline bg-surface-container text-on-surface",
  outlined: "border border-outline-variant bg-surface text-on-surface",
};

type CardProps = {
  tone: Tone;
  as?: "section" | "div";
  role?: "alert";
  className?: string;
  children: ReactNode;
};

export function Card({
  tone,
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
