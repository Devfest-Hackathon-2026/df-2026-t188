import { Chip, chipSpanClass } from "@/components/ui/Chip";

type SingleSelectProps<T extends string> = {
  legend: string;
  options: readonly T[];
  selected: T | null;
  onChange: (next: T | null) => void;
  compact?: boolean; // 小さい表示（保護者の1ページで使う）
};

// 保護者の画面で使う、1つだけ選ぶチップ。もう一度押すと選択を外す
export function SingleSelect<T extends string>({
  legend,
  options,
  selected,
  onChange,
  compact = false,
}: SingleSelectProps<T>) {
  return (
    <fieldset>
      <legend className={compact ? "mb-2 text-label font-bold" : "mb-3 text-title"}>
        {legend}
      </legend>
      <div className={`grid grid-cols-2 ${compact ? "gap-2" : "gap-3"}`}>
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Chip
              key={option}
              label={option}
              selected={isSelected}
              onClick={() => onChange(isSelected ? null : option)}
              className={chipSpanClass(option)}
              compact={compact}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
