import { CheckIcon } from "@/components/ui/icons";

type ChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
};

// 2列に並べるとき、この文字数以上の選択肢は横いっぱいの幅にする。
// 右の丸いチェックと文字が重ならないようにするため
const WIDE_CHIP_LABEL_LENGTH = 6;

export function chipSpanClass(label: string): string {
  return label.length >= WIDE_CHIP_LABEL_LENGTH ? "col-span-2" : "";
}

// 選んだときの色の層。背景が薄い緑、枠が緑になる。
// 色を直接変えず、この層の透明度を変える（globals.css の .chip-layer）
export function SelectedLayer({ rounded }: { rounded: string }) {
  return (
    <span
      aria-hidden="true"
      className={`chip-layer absolute -inset-0.5 border-2 border-primary bg-primary-container ${rounded}`}
    />
  );
}

// 右の丸。選ぶと緑になり、チェックが入る（globals.css の .chip-check）
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

// チップ。選ぶと背景が薄い緑、枠が緑になり、右の丸に緑のチェックが入る。
// 文字の位置は、選ぶ前後で変わらない
export function Chip({ label, selected, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`press-feedback chunky relative flex min-h-14 items-center justify-between gap-2 rounded-md border-2 border-card-line bg-surface-container-lowest px-2.5 py-2 text-left text-label focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
        selected ? "text-on-primary-container" : "text-on-surface"
      } ${className}`}
    >
      <SelectedLayer rounded="rounded-md" />
      <span className="relative">{label}</span>
      <CheckDot />
    </button>
  );
}
