import type { ReactNode } from "react";
import { CheckDot, SelectedLayer } from "@/components/ui/Chip";

export type CardOption<T extends string> = {
  value: T; // 記録する選択肢（画面にもこの文字を出す）
  description?: string; // 選ぶときの手がかりになる短い説明（記録も送信もしない）
  icon?: ReactNode;
};

type MultiSelectProps<T extends string> = {
  legend: string;
  options: CardOption<T>[];
  exclusiveOptions: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
};

// 2列に並べるとき、この文字数以上の選択肢は横いっぱいの幅にする
const WIDE_CARD_LABEL_LENGTH = 7;

// 本人の画面で使う、いくつでも選べるカード（2列）。
// アイコン、名前、短い説明、右上の丸いチェック。選ぶと背景が薄い緑、枠が緑になる
export function MultiSelect<T extends string>({
  legend,
  options,
  exclusiveOptions,
  selected,
  onChange,
}: MultiSelectProps<T>) {
  const toggle = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else if (exclusiveOptions.includes(option)) {
      onChange([option]);
    } else {
      onChange([
        ...selected.filter((item) => !exclusiveOptions.includes(item)),
        option,
      ]);
    }
  };

  return (
    <fieldset>
      <legend className="mb-3 text-title">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ value, description, icon }) => {
          const isSelected = selected.includes(value);
          const name = <span className="text-label font-bold">{value}</span>;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(value)}
              className={`press-feedback chunky relative flex min-h-18 flex-col gap-1 rounded-lg border border-outline bg-surface-container-lowest p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              } ${value.length >= WIDE_CARD_LABEL_LENGTH ? "col-span-2" : ""}`}
            >
              <SelectedLayer rounded="rounded-lg" />
              {/* アイコンがあるときは上の段にアイコン、ないときは上の段に名前を置く */}
              <span className="relative flex items-start justify-between gap-2">
                {icon ? (
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-primary ${
                      isSelected
                        ? "bg-surface-container-lowest"
                        : "bg-surface-container"
                    }`}
                  >
                    {icon}
                  </span>
                ) : (
                  name
                )}
                <CheckDot />
              </span>
              {icon && <span className="relative">{name}</span>}
              {description && (
                <span
                  className={`relative text-support ${
                    isSelected ? "" : "text-on-surface-variant"
                  }`}
                >
                  {description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
