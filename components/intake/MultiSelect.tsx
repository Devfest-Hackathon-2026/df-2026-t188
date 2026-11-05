import type { ReactNode } from "react";
import { chipSpanClass } from "@/components/ui/Chip";
import { CheckIcon } from "@/components/ui/icons";

export type CardOption<T extends string> = {
  value: T; // 記録する選択肢（画面にもこの文字を出す）
  description?: string; // 選ぶときの手がかりになる短い説明（記録しない）
  icon?: ReactNode;
};

type MultiSelectProps<T extends string> = {
  legend: string;
  options: CardOption<T>[];
  exclusiveOptions: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
};

// 本人の画面で使う、いくつでも選べる大きめのカード（2列）
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
      <legend className="mb-4 text-title">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ value, description, icon }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(value)}
              className={`press-feedback relative flex min-h-18 items-center gap-2 rounded-lg border border-outline bg-surface-container-lowest p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                isSelected ? "text-on-primary-container" : "text-on-surface"
              } ${chipSpanClass(value)}`}
            >
              <span
                aria-hidden="true"
                className="chip-layer absolute -inset-px rounded-lg bg-primary-container"
              />
              {icon && (
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface">
                  {icon}
                </span>
              )}
              <span className="relative flex min-w-0 flex-col">
                <span className="text-label font-bold">{value}</span>
                {description && (
                  <span
                    className={`text-support ${
                      isSelected ? "" : "text-on-surface-variant"
                    }`}
                  >
                    {description}
                  </span>
                )}
              </span>
              <span aria-hidden="true" className="chip-check absolute top-2 right-2">
                <CheckIcon className="h-5 w-5" />
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
