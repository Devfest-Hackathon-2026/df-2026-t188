// 要約の作成中に出すスケルトン。医師に見せる画面と同じ並びの、灰色の骨組み。
// 進み具合を表す数字やバーは出さない。
// 読み上げ機能への知らせは、DoctorScreen 側の role="status" で行う
export function DoctorSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <p aria-hidden="true" className="text-title">
        AI が要約しています…
      </p>

      <div aria-hidden="true" className="flex flex-col gap-6">
        {/* 主訴 */}
        <div className="flex flex-col gap-2">
          <div className="skeleton h-7 w-48 rounded-sm" />
          <div className="skeleton h-28 rounded-lg" />
          <div className="skeleton h-28 rounded-lg" />
        </div>

        {/* AI の要約 */}
        <div className="flex flex-col gap-2 rounded-lg border border-outline-variant p-4">
          <div className="skeleton h-7 w-40 rounded-sm" />
          <div className="skeleton h-16 rounded-sm" />
          <div className="skeleton h-24 rounded-md" />
          <div className="skeleton h-24 rounded-md" />
          <div className="skeleton h-16 rounded-md" />
        </div>

        {/* 不明の項目 */}
        <div className="skeleton h-32 rounded-lg" />

        {/* 薬・持病・アレルギー */}
        <div className="skeleton h-56 rounded-lg" />

        {/* 詳しく見る */}
        <div className="skeleton h-14 rounded-lg" />
      </div>
    </div>
  );
}
