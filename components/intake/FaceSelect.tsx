import Image from "next/image";
import { CheckDot, SelectedLayer } from "@/components/ui/Chip";
import {
  DISCOMFORT_FACE_SRC,
  DISCOMFORT_LABELS,
  DISCOMFORT_LEVELS,
  type DiscomfortLevel,
} from "@/lib/intake/options";

type FaceSelectProps = {
  labelledBy: string; // 質問の見出しの id（見出しは上の案内ボックスにある）
  selected: DiscomfortLevel | null;
  onChange: (next: DiscomfortLevel | null) => void;
};

// 「どれくらい つらい？」。キャラクターの顔と言葉のカードを2列に5つ並べ、1つ選ぶ。
// もう一度押すと選択を外す。最後の1つは真ん中に置く（参照の現行画面.html と同じ並び）。
// 顔は飾りで、意味は言葉で伝える。記録するのは段階（1〜5）だけ
export function FaceSelect({ labelledBy, selected, onChange }: FaceSelectProps) {
  return (
    <fieldset aria-labelledby={labelledBy}>
      <div className="grid grid-cols-2 gap-3">
        {DISCOMFORT_LEVELS.map((level, index) => {
          const isSelected = selected === level;
          const isLast = index === DISCOMFORT_LEVELS.length - 1;
          return (
            <button
              key={level}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : level)}
              className={`press-feedback chunky relative flex min-h-36 flex-col items-center justify-center gap-1 rounded-lg border-2 border-card-line bg-surface-container-lowest px-2 pt-3 pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              } ${isLast ? "col-span-2 mx-auto w-[calc(50%-0.375rem)]" : ""}`}
            >
              <SelectedLayer rounded="rounded-lg" />
              <Image
                src={DISCOMFORT_FACE_SRC[level]}
                alt=""
                width={300}
                height={290}
                unoptimized
                className="relative h-auto w-24"
              />
              <span className="relative text-center text-label font-bold">
                {DISCOMFORT_LABELS[level - 1]}
              </span>
              <span className="absolute top-2 right-2">
                <CheckDot />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
