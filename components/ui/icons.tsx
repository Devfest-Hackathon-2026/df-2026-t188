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

// ここから下は、「どんなかんじが する？」のカードのイラスト。
// 形は子ども向けのデモ（.claude/design-ref/kids。チームメンバーが ChatGPT で作成）のもの

export function FeelingPainIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 2l-1 7-4-2 2 5-6 1 6 2-2 5 5-3 3 5 1-6 5-2-4-3 2-5-5 2z" />
    </Icon>
  );
}

export function FeelingSickIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9h.01M16 9h.01M8 16c2-3 6-3 8 0" />
    </Icon>
  );
}

export function FeelingTiredIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7.5 10h3M13.5 10h3M9 16h6" />
    </Icon>
  );
}

export function FeelingBreathIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 4v8M12 9c-2-3-4-4-5-2-1 2-2 6-2 9s3 4 5 2c1-1 2-3 2-6M12 9c2-3 4-4 5-2 1 2 2 6 2 9s-3 4-5 2c-1-1-2-3-2-6" />
    </Icon>
  );
}

export function FeelingCoughIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="10" cy="12" r="8" />
      <path d="M7 10h.01M13 10h.01M8 16h4M18 10h4M18 14h3" />
    </Icon>
  );
}

export function FeelingFeverIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M10 5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0zM12 9v7" />
    </Icon>
  );
}

export function FeelingOtherIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-1 .4-1 1.2-1 2M12 17h.01" />
    </Icon>
  );
}

// 最初の画面の絵のハート
export function HeartIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2.5}>
      <path d="M12 20s-7.5-4.6-9.3-9.3A5.2 5.2 0 0 1 12 6.6a5.2 5.2 0 0 1 9.3 4.1C19.5 15.4 12 20 12 20z" />
    </Icon>
  );
}

// ここから下は、感覚のカードに使うアイコン。感じ方を、形で表している

// ズキズキ：脈のような波
export function PulseIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </Icon>
  );
}

// チクチク：とげのように広がる短い線
export function PrickIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    </Icon>
  );
}

// しめつけられる：左右から内側に向かう矢印
export function SqueezeIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 12h6M6.5 9.5L9 12l-2.5 2.5M21 12h-6M17.5 9.5L15 12l2.5 2.5M12 6v12" />
    </Icon>
  );
}

// 気持ち悪い：うねる線
export function WaveIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </Icon>
  );
}

// めまい：うずまき
export function SpiralIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 12a1.5 1.5 0 0 1 3 0 3 3 0 0 1-6 0 4.5 4.5 0 0 1 9 0 6 6 0 0 1-12 0" />
    </Icon>
  );
}

// だるい：下向きの矢印
export function DownIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2.5}>
      <path d="M12 4v15M6 13l6 6 6-6" />
    </Icon>
  );
}

// わからない：はてな
export function QuestionIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2.5}>
      <path d="M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01" />
    </Icon>
  );
}

// ここから下は、痛みの強さのカードに使う顔のアイコン。
// 見た目の反応だけで、記録も送信もしない。0〜10 の値を5段階に分けて、表情を変える
export type FaceLevel = 0 | 1 | 2 | 3 | 4;

export function faceLevel(painLevel: number): FaceLevel {
  if (painLevel === 0) return 0;
  if (painLevel <= 3) return 1;
  if (painLevel <= 6) return 2;
  if (painLevel <= 8) return 3;
  return 4;
}

const FACE_PARTS: Record<FaceLevel, ReactNode> = {
  // にっこり
  0: (
    <>
      <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={3} />
      <path d="M8 14c1 1.5 2.4 2.2 4 2.2s3-.7 4-2.2" />
    </>
  ),
  // ふつう
  1: (
    <>
      <path d="M9 9.5h.01M15 9.5h.01" strokeWidth={3} />
      <path d="M8.5 15h7" />
    </>
  ),
  // すこし つらい
  2: (
    <>
      <path d="M8 9.5h2M14 9.5h2" />
      <path d="M8.5 16c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" />
    </>
  ),
  // つらい
  3: (
    <>
      <path d="M7.5 10l3-1.5M16.5 10l-3-1.5" />
      <path d="M8 16.5c1-1.6 2.4-2.4 4-2.4s3 .8 4 2.4" />
    </>
  ),
  // とても つらい
  4: (
    <>
      <path d="M7.5 8l2.5 2-2.5 2M16.5 8L14 10l2.5 2" />
      <path d="M8 17c1-1.8 2.4-2.7 4-2.7s3 .9 4 2.7" />
    </>
  ),
};

export function FaceIcon({
  level,
  className,
}: IconProps & { level: FaceLevel }) {
  return (
    <Icon className={className} strokeWidth={2.2}>
      <circle cx="12" cy="12" r="10" />
      {FACE_PARTS[level]}
    </Icon>
  );
}

// 体の部位のアイコンは作っていない。
// 小さな絵では「のど」と「胸」などの場所を描き分けられなかったので、
// 痛い場所のカードは名前と説明だけにそろえている
