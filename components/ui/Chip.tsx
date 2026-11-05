type Tone = "primary" | "secondary";

type ChipProps = {
  label: string;
  selected: boolean;
  tone: Tone;
  onClick: () => void;
  className?: string;
};

// 選択済みの色の層。色を直接変えず、この層の透明度を変える（globals.css の .chip-layer）
const LAYER_CLASS: Record<Tone, string> = {
  primary: "bg-primary-container",
  secondary: "bg-secondary-container",
};

const SELECTED_TEXT_CLASS: Record<Tone, string> = {
  primary: "text-on-primary-container",
  secondary: "text-on-secondary-container",
};

// チェックの印。ライブラリを使わず、線で描いている
export function CheckIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// 2列に並べるとき、この文字数以上の選択肢は横いっぱいの幅にする。
// チェックの印と文字が重ならないようにするため
const WIDE_LABEL_LENGTH = 7;

export function chipSpanClass(label: string): string {
  return label.length >= WIDE_LABEL_LENGTH ? "col-span-2" : "";
}

// M3 のチップ。選ぶと色が変わり、チェックの印が付く。
// チェックの印は左端に固定し、文字は中央のまま動かさない（選んだ瞬間に文字がずれないように）
export function Chip({
  label,
  selected,
  tone,
  onClick,
  className = "",
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`press-feedback relative inline-flex min-h-14 items-center justify-center rounded-sm border border-outline bg-surface-container-lowest px-3 py-2 text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
        selected ? SELECTED_TEXT_CLASS[tone] : "text-on-surface"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`chip-layer absolute -inset-px rounded-sm ${LAYER_CLASS[tone]}`}
      />
      <span
        aria-hidden="true"
        className="chip-check absolute inset-y-0 left-1.5 flex items-center"
      >
        <CheckIcon className="h-5 w-5" />
      </span>
      <span className="relative">{label}</span>
    </button>
  );
}
