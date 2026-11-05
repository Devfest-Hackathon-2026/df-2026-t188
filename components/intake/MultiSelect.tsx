import { Chip, chipSpanClass } from "@/components/ui/Chip";

type MultiSelectProps<T extends string> = {
  legend: string;
  options: readonly T[];
  exclusiveOptions: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
};

// 本人の画面で使う、いくつでも選べるチップ
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
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            tone="primary"
            selected={selected.includes(option)}
            onClick={() => toggle(option)}
            className={chipSpanClass(option)}
          />
        ))}
      </div>
    </fieldset>
  );
}
