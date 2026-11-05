type SingleSelectProps<T extends string> = {
  legend: string;
  options: readonly T[];
  selected: T | null;
  onChange: (next: T | null) => void;
};

// 家族・介護者の画面で使う、1つだけ選ぶボタン。もう一度押すと選択を外す
export function SingleSelect<T extends string>({
  legend,
  options,
  selected,
  onChange,
}: SingleSelectProps<T>) {
  return (
    <fieldset>
      <legend className="mb-3 text-xl font-bold">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : option)}
              className={`min-h-14 rounded-xl border-2 px-3 py-2 text-lg font-medium ${
                isSelected
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-zinc-400 bg-background text-foreground"
              }`}
            >
              {isSelected ? `✓ ${option}` : option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
