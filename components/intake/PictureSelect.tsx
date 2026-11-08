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
  onToggle: (value: T) => void; // 押したカード。選ぶか外すかは呼び出し側で決める
  // 数が奇数のときの最後の1つ。wide は横いっぱい、center は半分の幅で真ん中（症状をえらぶ画面）
  oddLast?: "wide" | "center";
};

// こどもの画面の、絵と言葉のカード（2列）。いくつでも選べる。もう一度押すと外れる
export function PictureSelect<T extends string>({
  labelledBy,
  options,
  selected,
  onToggle,
  oddLast = "wide",
}: PictureSelectProps<T>) {

  return (
    <fieldset aria-labelledby={labelledBy}>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ value, label, picture, bare = false, color }, index) => {
          const isSelected = selected.includes(value);
          const isOddLast = index === options.length - 1 && options.length % 2 === 1;
          const isWide = isOddLast && oddLast === "wide";
          const isCentered = isOddLast && oddLast === "center";
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(value)}
              style={color ? { backgroundColor: color } : undefined}
              className={`press-feedback chunky relative flex items-center justify-center rounded-lg border-2 border-card-line bg-surface-container-lowest p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              } ${
                isWide
                  ? "col-span-2 min-h-20 flex-row gap-3"
                  : isCentered
                    ? "col-span-2 mx-auto min-h-30 w-[calc(50%-0.375rem)] flex-col gap-2"
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
