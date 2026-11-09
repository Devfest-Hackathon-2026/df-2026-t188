import { Chip } from "@/components/ui/Chip";

type SingleSelectProps<T extends string> = {
  legend: string;
  options: readonly T[];
  selected: T | null;
  onChange: (next: T | null) => void;
  compact?: boolean; // 小さい表示（保護者の1ページで使う）
  // 並べ方。column は縦一列、row は横一列（2つまで）。
  // 幅375px では、3つ以上の選択肢は横一列に入らないので、縦一列にする（性別の2つだけ横一列）
  layout?: "column" | "row";
};

// 保護者の画面で使う、1つだけ選ぶチップ。もう一度押すと選択を外す
export function SingleSelect<T extends string>({
  legend,
  options,
  selected,
  onChange,
  compact = false,
  layout = "column",
}: SingleSelectProps<T>) {
  return (
    <fieldset>
      <legend className={compact ? "mb-2 text-label font-bold" : "mb-3 text-title"}>
        {legend}
      </legend>
      <div
        className={`${layout === "row" ? "grid grid-cols-2" : "flex flex-col"} ${
          compact ? "gap-2" : "gap-3"
        }`}
      >
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Chip
              key={option}
              label={option}
              selected={isSelected}
              onClick={() => onChange(isSelected ? null : option)}
              compact={compact}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
