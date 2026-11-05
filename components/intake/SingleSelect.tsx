import { Chip, chipSpanClass } from "@/components/ui/Chip";

type SingleSelectProps<T extends string> = {
  legend: string;
  options: readonly T[];
  selected: T | null;
  onChange: (next: T | null) => void;
};

// 家族・介護者の画面で使う、1つだけ選ぶチップ。もう一度押すと選択を外す
export function SingleSelect<T extends string>({
  legend,
  options,
  selected,
  onChange,
}: SingleSelectProps<T>) {
  return (
    <fieldset>
      <legend className="mb-3 text-title">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Chip
              key={option}
              label={option}
              selected={isSelected}
              onClick={() => onChange(isSelected ? null : option)}
              className={chipSpanClass(option)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
