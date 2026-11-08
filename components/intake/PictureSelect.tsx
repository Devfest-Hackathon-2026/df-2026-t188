import type { ReactNode } from "react";
import { CheckDot, SelectedLayer } from "@/components/ui/Chip";

export type PictureOption<T extends string> = {
  value: T; // 記録する値
  label: string; // この画面に出す言葉
  picture: ReactNode; // 飾りの絵。意味は必ず label で伝える
  bare?: boolean; // true のときは絵に丸い背景を付けない（体の図）
  color?: string; // カードの背景の色（部位ごとの色）。ないときは白
};

type PictureSelectProps<T extends string> = {
  labelledBy: string; // 質問の見出しの id（見出しは上の案内ボックスにある）
  options: PictureOption<T>[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
};

// こどもの画面の、絵と言葉のカード（2列）。いくつでも選べる。もう一度押すと外れる。
// 数が奇数のときは、最後の1つを横いっぱいにする
export function PictureSelect<T extends string>({
  labelledBy,
  options,
  selected,
  onChange,
}: PictureSelectProps<T>) {
  const toggle = (value: T) =>
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );

  return (
    <fieldset aria-labelledby={labelledBy}>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ value, label, picture, bare = false, color }, index) => {
          const isSelected = selected.includes(value);
          const isWide = index === options.length - 1 && options.length % 2 === 1;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(value)}
              style={color ? { backgroundColor: color } : undefined}
              className={`press-feedback chunky relative flex items-center justify-center rounded-lg border-2 border-card-line bg-surface-container-lowest p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              } ${
                isWide
                  ? "col-span-2 min-h-20 flex-row gap-3"
                  : "min-h-30 flex-col gap-2"
              }`}
            >
              <SelectedLayer rounded="rounded-lg" />
              {bare ? (
                <span className="relative flex shrink-0">{picture}</span>
              ) : (
                <span
                  className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
                    isSelected || color
                      ? "bg-surface-container-lowest"
                      : "bg-primary-container"
                  }`}
                >
                  {picture}
                </span>
              )}
              <span className="relative text-center text-label font-bold">
                {label}
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
