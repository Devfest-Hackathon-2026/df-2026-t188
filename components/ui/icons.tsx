// アイコン。ライブラリや外部のアイコンフォントを使わず、線で描いている。
// どれも飾りなので、読み上げ機能には伝えない（aria-hidden）
import type { ReactNode } from "react";

type IconProps = { className?: string };

function Icon({
  className = "h-6 w-6",
  strokeWidth = 2,
  children,
}: IconProps & { strokeWidth?: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2.5}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2.5}>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13 7l4 4" />
    </Icon>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function SpeechIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 5h16v11H10l-5 4v-4H4z" />
    </Icon>
  );
}

// ここから下は、痛い場所のカードに使う体の部位のアイコン。
// 頭、のど、お腹、背中・腰、足のアイコンは、形が伝わりにくかったので作っていない
// （それらのカードは文字だけにしている）

// 顔・口：顔の輪郭に、目と口
export function FaceIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01" strokeWidth={3} />
      <path d="M9 15.5h6" />
    </Icon>
  );
}

// 胸：ハートの形
export function ChestIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
    </Icon>
  );
}

// 手・腕：ひらいた手
export function HandIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7-2.6 0-4-1.2-5.2-3.2L4.3 15a1.4 1.4 0 0 1 2.4-1.5L8 15" />
    </Icon>
  );
}

// その他：点3つ
export function DotsIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={3.5}>
      <path d="M6 12h.01M12 12h.01M18 12h.01" />
    </Icon>
  );
}
