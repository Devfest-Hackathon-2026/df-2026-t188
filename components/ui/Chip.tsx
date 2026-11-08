import { CheckIcon } from "@/components/ui/icons";

type ChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
  compact?: boolean; // 小さい表示（保護者の1ページで使う）。押せる高さは 44px を保つ
};

// 2列に並べるとき、この文字数以上の選択肢は横いっぱいの幅にする。
// 右の丸いチェックと文字が重ならないようにするため
const WIDE_CHIP_LABEL_LENGTH = 6;

export function chipSpanClass(label: string): string {
  return label.length >= WIDE_CHIP_LABEL_LENGTH ? "col-span-2" : "";
}

// 選んだときの色の層。背景が淡い青、枠が青になる。
// 色を直接変えず、この層の透明度を変える（globals.css の .chip-layer）
export function SelectedLayer({ rounded }: { rounded: string }) {
  return (
    <span
      aria-hidden="true"
      className={`chip-layer absolute -inset-0.5 border-2 border-primary bg-primary-container ${rounded}`}
    />
  );
}

// 右の丸。選ぶと青になり、チェックが入る（globals.css の .chip-check）
export function CheckDot() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-6 w-6 shrink-0 rounded-full border-2 border-outline-variant bg-surface-container-lowest"
    >
      <span className="chip-check absolute -inset-0.5 flex items-center justify-center rounded-full bg-primary text-on-primary">
        <CheckIcon className="h-4 w-4" />
      </span>
    </span>
  );
}

// チップ。選ぶと背景が淡い青、枠が青になり、右の丸に青のチェックが入る。
// 文字の位置は、選ぶ前後で変わらない
export function Chip({
  label,
  selected,
  onClick,
  className = "",
  compact = false,
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`press-feedback chunky relative flex items-center justify-between gap-2 rounded-md border-2 border-card-line bg-surface-container-lowest px-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
        compact ? "min-h-11 py-1 text-support" : "min-h-14 py-2 text-label"
      } ${
        selected ? "text-on-primary-container" : "text-on-surface"
      } ${className}`}
    >
      <SelectedLayer rounded="rounded-md" />
      <span className="relative">{label}</span>
      <CheckDot />
    </button>
  );
}
