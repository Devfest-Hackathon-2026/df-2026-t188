type MultiSelectProps<T extends string> = {
  legend: string;
  options: readonly T[];
  exclusiveOptions: readonly T[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
};

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
      <legend className="mb-3 text-xl font-bold">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(option)}
              className={`min-h-14 rounded-xl border-2 px-3 py-2 text-lg font-medium ${
                isSelected
                  ? "border-blue-700 bg-blue-700 text-white"
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
