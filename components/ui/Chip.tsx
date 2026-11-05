type Tone = "primary" | "secondary";

type ChipProps = {
  label: string;
  selected: boolean;
  tone: Tone;
  onClick: () => void;
  className?: string;
};

const SELECTED_CLASS: Record<Tone, string> = {
  primary: "border-transparent bg-primary-container text-on-primary-container",
  secondary:
    "border-transparent bg-secondary-container text-on-secondary-container",
};

// チェックの印。ライブラリを使わず、線で描いている
export function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0"
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
// チェックの印が付いても、途中で折り返さないようにするため
const WIDE_LABEL_LENGTH = 7;

export function chipSpanClass(label: string): string {
  return label.length >= WIDE_LABEL_LENGTH ? "col-span-2" : "";
}

// M3 のチップ。選ぶと色が変わり、チェックの印が付く
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
      className={`press-feedback inline-flex min-h-14 items-center justify-center gap-2 rounded-sm border px-3 py-2 text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
        selected
          ? SELECTED_CLASS[tone]
          : "border-outline bg-surface-container-lowest text-on-surface"
      } ${className}`}
    >
      {selected && <CheckIcon />}
      {label}
    </button>
  );
}
