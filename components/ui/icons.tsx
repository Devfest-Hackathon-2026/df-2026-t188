// アイコン。ライブラリや外部のアイコンフォントを使わず、線で描いている。
// どれも飾りなので、読み上げ機能には伝えない（aria-hidden）
import type { ReactNode } from "react";
import type { BodyFigurePart } from "@/lib/intake/options";

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

// 最初の画面の絵のハート
export function HeartIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2.5}>
      <path d="M12 20s-7.5-4.6-9.3-9.3A5.2 5.2 0 0 1 12 6.6a5.2 5.2 0 0 1 9.3 4.1C19.5 15.4 12 20 12 20z" />
    </Icon>
  );
}

// ここから下は、「どこが へん？」のカードの人型の図。その部位だけ色を変える。
// 形は子ども向けのデモ（.claude/design-ref/kids）の人型の図のもの。耳だけ描き足している。
// 今は絵文字を使っているが、lib/intake/options.ts の表で { figure: ... } にすると、この図に替わる
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
