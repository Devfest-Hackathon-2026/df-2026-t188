import { CheckDot, SelectedLayer } from "@/components/ui/Chip";
import { FaceIcon, type FaceLevel } from "@/components/ui/icons";
import {
  DISCOMFORT_LABELS,
  DISCOMFORT_LEVELS,
  type DiscomfortLevel,
} from "@/lib/intake/options";

// 顔の色。つらくないと緑、つらいとオレンジ〜赤。色は見た目の反応だけで、記録しない
const FACE_COLOR_CLASS: Record<DiscomfortLevel, string> = {
  1: "text-face-low",
  2: "text-face-low",
  3: "text-face-low",
  4: "text-face-mid",
  5: "text-face-high",
};

type FaceSelectProps = {
  selected: DiscomfortLevel | null;
  onChange: (next: DiscomfortLevel | null) => void;
};

// 「どれくらい つらい？」。顔の絵と短い言葉を1列に5つ並べ、1つ選ぶ。もう一度押すと選択を外す
export function FaceSelect({ selected, onChange }: FaceSelectProps) {
  return (
    <fieldset>
      <legend className="mb-4 text-headline">どれくらい つらい？</legend>
      <div className="flex flex-col gap-3">
        {DISCOMFORT_LEVELS.map((level) => {
          const isSelected = selected === level;
          return (
            <button
              key={level}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : level)}
              className={`press-feedback chunky relative flex min-h-16 items-center gap-3 rounded-lg border-2 border-card-line bg-surface-container-lowest px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              }`}
            >
              <SelectedLayer rounded="rounded-lg" />
              <span
                aria-hidden="true"
                className={`relative flex shrink-0 ${FACE_COLOR_CLASS[level]}`}
              >
                <FaceIcon level={(level - 1) as FaceLevel} className="h-11 w-11" />
              </span>
              <span className="relative flex-1 text-title">
                {DISCOMFORT_LABELS[level - 1]}
              </span>
              <CheckDot />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
