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

// 体の部位のアイコンは作っていない。
// 手書きでは形が伝わりにくかったので、痛い場所のカードは文字だけにそろえている
