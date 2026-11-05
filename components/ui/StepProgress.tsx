// 今が全体の何番目かを示す。「ステップ 2/5」と、区切りのある高さ 6px のプログレスバー
type StepProgressProps = {
  current: number;
  total: number;
};

export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="flex items-center gap-3 px-4 pt-3">
      <span
        aria-hidden="true"
        className="shrink-0 rounded-full bg-primary-container px-3 py-1 text-support font-bold text-on-primary-container"
      >
        ステップ {current}/{total}
      </span>
      <div
        role="progressbar"
        aria-label="進み具合"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`全${total}画面中${current}画面目`}
        className="flex flex-1 gap-1.5"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < current ? "bg-primary" : "bg-outline-variant"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
