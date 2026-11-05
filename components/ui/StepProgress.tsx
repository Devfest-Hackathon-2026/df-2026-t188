// 今が全体の何番目かを示す。「STEP 2/5」と、区切りのある高さ 6px のプログレスバー。
// 進んだ分だけ、区切りが緑に変わる
type StepProgressProps = {
  current: number;
  total: number;
};

export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 pt-2 pb-3">
      <span
        aria-hidden="true"
        className="rounded-full bg-primary-container px-3 text-support font-bold tracking-wider text-on-primary-container"
      >
        STEP {current}/{total}
      </span>
      <div
        role="progressbar"
        aria-label="進み具合"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`全${total}画面中${current}画面目`}
        className="flex w-full gap-1.5"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-outline-variant"
          >
            <span
              data-active={index < current}
              className="progress-fill absolute inset-0 rounded-full bg-primary"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
