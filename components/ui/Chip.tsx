import { CheckIcon } from "@/components/ui/icons";

type Tone = "primary" | "secondary";

type ChipProps = {
  label: string;
  selected: boolean;
  tone: Tone;
  onClick: () => void;
  className?: string;
};

// 選択済みの色の層。色を直接変えず、この層の透明度を変える（globals.css の .chip-layer）
export const SELECTED_LAYER_CLASS: Record<Tone, string> = {
  primary: "bg-primary-container",
  secondary: "bg-secondary-container",
};

export const SELECTED_TEXT_CLASS: Record<Tone, string> = {
  primary: "text-on-primary-container",
  secondary: "text-on-secondary-container",
};

// 2列に並べるとき、この文字数以上の選択肢は横いっぱいの幅にする。
// チェックの印と文字が重ならないようにするため
const WIDE_LABEL_LENGTH = 7;

export function chipSpanClass(label: string): string {
  return label.length >= WIDE_LABEL_LENGTH ? "col-span-2" : "";
}

// チップ。選ぶと色が変わり、チェックの印が付く。
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
        className={`chip-layer absolute -inset-px rounded-sm ${SELECTED_LAYER_CLASS[tone]}`}
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
