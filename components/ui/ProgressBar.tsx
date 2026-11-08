// 進み具合のバー。1画面に1区切り。済んだ区切りと今の区切りを青くする。
// 数字（STEP x/y）は画面に出さず、読み上げ機能にだけ「全部で何画面のうち何画面目か」を伝える
type ProgressBarProps = {
  total: number; // 区切りの数
  current: number; // 今の画面が何番目か（1から数える）
};

export function ProgressBar({ total, current }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label="進み具合"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`${total}画面のうち${current}画面目`}
      className="flex w-full gap-1"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className="progress-seg"
          data-done={index < current ? "" : undefined}
        />
      ))}
    </div>
  );
}
