import type { ReactNode } from "react";
import { CheckDot, SelectedLayer } from "@/components/ui/Chip";

export type PictureOption<T extends string> = {
  value: T; // 記録する値
  label: string; // この画面に出す言葉
  picture: ReactNode;
  bare?: boolean; // true のときは絵に丸い背景を付けない（人型の図）
};

type PictureSelectProps<T extends string> = {
  legend: string;
  options: PictureOption<T>[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
};

// こどもの画面の、絵と言葉のカード（2列）。いくつでも選べる。最後の1つは横いっぱいにする
export function PictureSelect<T extends string>({
  legend,
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
    <fieldset>
      <legend className="mb-4 text-headline">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ value, label, picture, bare = false }, index) => {
          const isSelected = selected.includes(value);
          const isLast = index === options.length - 1;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(value)}
              className={`press-feedback chunky relative flex items-center justify-center rounded-lg border-2 border-card-line bg-surface-container-lowest p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              } ${
                isLast
                  ? "col-span-2 min-h-20 flex-row gap-3"
                  : "min-h-30 flex-col gap-2"
              }`}
            >
              <SelectedLayer rounded="rounded-lg" />
              {bare ? (
                <span className="relative flex shrink-0">{picture}</span>
              ) : (
                <span
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-on-primary-container ${
                    isSelected
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
