// 要約の作成中に出すスケルトン。医師に見せる画面と同じ並びの、灰色の骨組み。
// 進み具合を表す数字やバーは出さない。
// 読み上げ機能への知らせは、DoctorScreen 側の role="status" で行う
export function DoctorSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <p aria-hidden="true" className="text-title">
        AI が要約しています…
      </p>

      <div aria-hidden="true" className="flex flex-col gap-4">
        {/* AI の要約 */}
        <div className="flex flex-col gap-2 rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-4">
          <div className="skeleton h-7 w-40 rounded-sm" />
          <div className="skeleton h-16 rounded-sm" />
          <div className="skeleton h-24 rounded-sm" />
          <div className="skeleton h-24 rounded-sm" />
        </div>

        {/* 詳しく見る */}
        <div className="skeleton h-14 rounded-lg" />
      </div>
    </div>
  );
}
