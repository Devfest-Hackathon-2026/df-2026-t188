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

// ここから下は、「どこが へん？」のカードの人型の図。その部位だけ色を変える。
// 形は子ども向けのデモ（.claude/design-ref/kids）の人型の図のもの。耳だけ描き足している
export type BodyFigurePart =
  | "head"
  | "ears"
  | "throat"
  | "chest"
  | "belly"
  | "limbs";

export function BodyFigure({ part }: { part: BodyFigurePart }) {
  const region = (target: BodyFigurePart) => ({
    fill:
      part === target
        ? "var(--color-primary)"
        : "var(--color-surface-container-lowest)",
    stroke:
      part === target ? "var(--color-primary-shade)" : "var(--color-outline)",
    strokeWidth: 3,
    strokeLinejoin: "round" as const,
  });

  return (
    <svg
      aria-hidden="true"
      viewBox="18 6 124 218"
      className="h-[4.5rem] w-auto shrink-0"
    >
      <ellipse cx="58" cy="31" rx="7" ry="11" {...region("ears")} />
      <ellipse cx="102" cy="31" rx="7" ry="11" {...region("ears")} />
      <circle cx="80" cy="31" r="20" {...region("head")} />
      <path d="M59 70 Q48 69 44 78 L30 113 Q28 120 34 123 Q39 125 42 118 L56 91Z" {...region("limbs")} />
      <path d="M101 70 Q112 69 116 78 L130 113 Q132 120 126 123 Q121 125 118 118 L104 91Z" {...region("limbs")} />
      <path d="M61 121 L79 121 L77 157 L70 211 Q69 218 62 217 Q56 216 57 209 L57 158Z" {...region("limbs")} />
      <path d="M81 121 L99 121 L103 158 L103 209 Q104 216 98 217 Q91 218 90 211 L83 157Z" {...region("limbs")} />
      <path d="M71 49 Q80 52 89 49 L90 69 Q80 72 70 69Z" {...region("throat")} />
      <path d="M60 69 Q80 65 100 69 L105 93 Q80 89 55 93Z" {...region("chest")} />
      <path d="M55 93 Q80 89 105 93 L106 100 Q104 111 100 123 L60 123 Q56 111 54 100Z" {...region("belly")} />
    </svg>
  );
}

// ここから下は、「どれくらい つらい？」のカードに使う顔のアイコン。5段階で表情を変える
export type FaceLevel = 0 | 1 | 2 | 3 | 4;

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
