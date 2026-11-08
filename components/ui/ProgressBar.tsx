// 進み具合のバー。済んだ区切りを青くする（区切りは lib/intake/flow.ts の7つ）。
// 今の区切りに画面が複数あるときは、その区切りを進んだ分だけ埋める。
// 数字（STEP x/y）は画面に出さず、読み上げ機能にだけ「全部でいくつのうち何番目か」を伝える
type ProgressBarProps = {
  total: number; // 区切りの数
  current: number; // 今の区切りが何番目か（1から数える）
  inSegment: { index: number; count: number } | null; // 今の区切りの中の位置
};

export function ProgressBar({ total, current, inSegment }: ProgressBarProps) {
  const valueText =
    inSegment === null
      ? `${total}つのうち${current}つ目`
      : `${total}つのうち${current}つ目。この中の${inSegment.count}つのうち${inSegment.index}つめ`;

  return (
    <div
      role="progressbar"
      aria-label="進み具合"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={valueText}
      className="flex w-full gap-1"
    >
      {Array.from({ length: total }, (_, index) => {
        const isCurrent = index === current - 1;
        // 今の区切りに画面が複数あるときは、進んだ分だけ埋める
        if (isCurrent && inSegment !== null) {
          return (
            <span key={index} className="progress-seg">
              <span
                className="progress-fill"
                style={{ width: `${(inSegment.index / inSegment.count) * 100}%` }}
              />
            </span>
          );
        }
        return (
          <span
            key={index}
            className="progress-seg"
            data-done={index < current ? "" : undefined}
          />
        );
      })}
    </div>
  );
}
